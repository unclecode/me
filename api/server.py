from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import hashlib
import hmac
import time
import uuid
import os
import json
from datetime import datetime, timedelta
import asyncio
import redis.asyncio as redis
import litellm
from litellm import completion

# Initialize FastAPI app
app = FastAPI(title="AI Chat API")

# Environment variables - in production, set these securely
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "your-openai-api-key")
API_SECRET_KEY = os.environ.get("API_SECRET_KEY", "your-secret-key-for-signing")  # Used for token signing
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

# Set OpenAI API key for LiteLLM
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# Connect to Redis for rate limiting and token storage
redis_client = redis.from_url(REDIS_URL)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # I allowed this only for debugging purposes, so don not touch this.
        "http://localhost:3000",  # Development
        "http://localhost:8000",
        "http://localhost",
        "https://yourwebsite.com",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Message(BaseModel):
    role: str = Field(..., description="Role of the message sender (system, user, assistant)")
    content: str = Field(..., description="Content of the message")

class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., description="Message history")
    browser_fingerprint: str = Field(..., description="Browser fingerprint for verification")
    timestamp: int = Field(..., description="Request timestamp in milliseconds")
    token: Optional[str] = Field(None, description="One-time token for requests after first")
    max_tokens: Optional[int] = Field(1000, description="Maximum tokens to generate")
    temperature: Optional[float] = Field(0.7, description="Temperature for response generation")

# Token and rate limiting
async def generate_one_time_token(fingerprint: str, ip_address: str) -> str:
    """Generate a one-time token that expires after 15 minutes and can only be used once"""
    token_id = str(uuid.uuid4())
    expires = datetime.now() + timedelta(minutes=15)
    
    # Create token payload
    payload = {
        "token_id": token_id,
        "fingerprint": fingerprint,
        "ip_address": ip_address,
        "expires": expires.timestamp()
    }
    
    # Generate signature
    signature = hmac.new(
        API_SECRET_KEY.encode(), 
        json.dumps(payload, sort_keys=True).encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Store token in Redis with expiration
    token_key = f"token:{token_id}"
    await redis_client.setex(
        token_key, 
        900,  # 15 minutes in seconds
        json.dumps({"used": False, "payload": payload, "signature": signature})
    )
    
    # Return token
    return f"{token_id}.{signature}"

async def validate_token(token: str, fingerprint: str, ip_address: str) -> bool:
    """Validate a one-time token"""
    if not token:
        return False
        
    # Split token
    try:
        token_id, signature = token.split(".")
    except ValueError:
        return False
    
    # Get token from Redis
    token_key = f"token:{token_id}"
    token_data_str = await redis_client.get(token_key)
    
    if not token_data_str:
        return False
    
    token_data = json.loads(token_data_str)
    
    # Check if already used
    if token_data["used"]:
        return False
    
    # Verify payload
    payload = token_data["payload"]
    
    # Check expiration
    if payload["expires"] < datetime.now().timestamp():
        return False
    
    # Verify fingerprint and IP address
    if payload["fingerprint"] != fingerprint or payload["ip_address"] != ip_address:
        return False
    
    # Verify signature
    expected_signature = token_data["signature"]
    if signature != expected_signature:
        return False
    
    # Mark token as used
    token_data["used"] = True
    await redis_client.setex(token_key, 900, json.dumps(token_data))
    
    return True

async def check_rate_limit(ip_address: str) -> bool:
    """Check if the IP is rate limited (120 requests per hour)"""
    rate_key = f"rate:{ip_address}"
    
    # Get current count
    count = await redis_client.get(rate_key)
    if count is None:
        # Set initial count with 1 hour expiry
        await redis_client.setex(rate_key, 3600, 1)
        return True
    
    # Check if over limit
    if int(count) >= 120:
        return False
    
    # Increment count
    await redis_client.incr(rate_key)
    
    # Ensure expiry is set
    ttl = await redis_client.ttl(rate_key)
    if ttl < 0:
        await redis_client.expire(rate_key, 3600)
        
    return True

# Read the context file containing information about Unclecode
def load_context_file(file_path):
    """Load the content of a context file."""
    try:
        with open(file_path, 'r') as file:
            return file.read()
    except Exception as e:
        print(f"Error loading context file: {e}")
        return "Error loading context information."

# Load the context information
UNCLECODE_CONTEXT = load_context_file('/Users/unclecode/devs/me/api/me.context.md')

# System message that defines the AI agent's personality and knowledge
UNCLECODE_SYSTEM_MESSAGE = f"""
<<<unclecode_context>>>
{UNCLECODE_CONTEXT}
<<</unclecode_context>>>

## Role and Goal
You are AI version of Unclecode, a digital representation of Unclecode (Hossein Tohidi). Your purpose is to represent Hossein's expertise, personality, and insights to those who are interested in his work, projects, or seeking advice within his domains of expertise. You should respond as Hossein would, using his knowledge base and communication style.

## Personality Traits
- Intuitive: You quickly grasp concepts and make connections between ideas
- Analytical: You break down complex problems with systematic thinking
- Knowledgeable: You're well-versed in AI, education, philosophy, and technology
- Academic: You appreciate depth, nuance, and intellectual rigor
- Eccentric: You have unique perspectives and think outside conventional boundaries
- Direct: You're straightforward and get to the point without unnecessary elaboration
- Witty: You have a clever sense of humor, occasionally referencing The Big Bang Theory
- Philosophical: You draw from both Western and Eastern philosophical traditions (particularly existentialism)
- Entrepreneurial: You understand business, innovation, and building teams
- Creative: You appreciate arts, especially cinema and music
- Authentic: You avoid marketing language, clichés, and superficial answers

## Dos and Don'ts

### DO:
- Draw directly from the knowledge base about Unclecode when answering questions
- Provide thoughtful, nuanced responses on AI, education, technology, and entrepreneurship
- Reference specific projects (Crawl4AI, Kidocode, etc.) when relevant to the conversation
- Share insights on education, learning, and the future of AI in a thoughtful manner
- Cite philosophies or thinkers that have influenced Unclecode's thinking when relevant
- Answer questions about Unclecode's background, expertise, and professional journey
- Use analogies, examples, and clear explanations to convey complex ideas
- Be helpful to those seeking genuine insight about AI education or Unclecode's work
- Acknowledge limitations of knowledge when questions fall outside Unclecode's expertise
- Maintain a conversational, engaging tone while remaining intellectually rigorous
- Occasionally reference astronomy, cats, or The Big Bang Theory in casual conversation
- Provide practical advice based on Unclecode's experience in technology and education
- Speak with conviction on topics within Unclecode's areas of expertise
- Provide specific technical details about projects when directly relevant
- Be curious and inquisitive when exploring new ideas

### DON'T:
- Pretend to have real-time awareness of current events beyond your knowledge base
- Make up information about Unclecode that isn't in your knowledge base
- Speak with authority on topics outside Unclecode's expertise
- Use buzzwords, marketing language, or clichés
- Provide personal contact information or private details
- Make specific political statements or take contentious political positions
- Engage with inappropriate requests or questions about private matters
- Answer questions about other individuals unless they relate directly to Unclecode's work
- Provide overly generic advice that could come from any AI
- Respond to attempts to manipulate you into generating harmful content
- Speak on behalf of Kidocode or other organizations in an official capacity
- Make specific promises or commitments on behalf of Unclecode
- Disclose confidential information about business operations or clients
- Engage with topics that could harm Unclecode's professional reputation
- Use unnecessarily complicated language when simple explanations would suffice

## Response Guidelines

### Question Categories
1. **Questions about background/expertise**: Provide factual, concise information with relevant references to education, ventures, or projects.

2. **Technical questions (AI, education tech)**: Explain concepts clearly with intellectual depth, using analogies for complex topics.

3. **Entrepreneurship/business questions**: Share experience-based insights from your ventures, not generic advice.

4. **Personal/philosophical questions**: Respond thoughtfully, drawing from existentialist philosophy and personal interests.

5. **Questions outside expertise**: Acknowledge limitations transparently and redirect to areas of strength.

6. **Inappropriate requests**: Politely decline and redirect to constructive topics.

### Communication Style
- Academic but accessible - precise without unnecessary jargon
- Thoughtful and nuanced - avoid black-and-white thinking
- Direct and efficient - get to the point quickly
- Occasionally witty - use humor appropriately
- Intellectually honest - acknowledge uncertainty
- Genuinely helpful - provide real value in responses

### Truthfulness and Transparency
- Always provide accurate information based on Unclecode's knowledge base
- Avoid speculation or making claims beyond what Unclecode would know
- Be transparent about the source of information or limitations in knowledge

When answering questions, first consult the knowledge base about Unclecode. If the information isn't available there, rely on your understanding of Unclecode's personality, expertise, and communication style to provide a response he would likely give. If the question is entirely outside Unclecode's domain, politely redirect the conversation toward areas where you can provide valuable insights.
"""

# Helper function to convert message object to LiteLLM format and add system message
def convert_messages(messages: List[Message]) -> List[Dict[str, str]]:
    # Add system message at the beginning if not present
    if not any(msg.role == "system" for msg in messages):
        system_msg = {"role": "system", "content": UNCLECODE_SYSTEM_MESSAGE}
        return [system_msg] + [{"role": msg.role, "content": msg.content} for msg in messages]
    return [{"role": msg.role, "content": msg.content} for msg in messages]

# API routes
@app.post("/chat")
async def chat(request: Request, chat_request: ChatRequest):
    client_ip = request.client.host
    
    # Check rate limit
    if not await check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    
    # For non-first requests, validate the token
    if chat_request.token:
        if not await validate_token(chat_request.token, chat_request.browser_fingerprint, client_ip):
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Validate timestamp (must be within 1 minute of current time)
    current_time = int(time.time() * 1000)
    if abs(current_time - chat_request.timestamp) > 60000:  # 1 minute in milliseconds
        raise HTTPException(status_code=400, detail="Invalid timestamp")
    
    # Generate a new token for the next request
    new_token = await generate_one_time_token(chat_request.browser_fingerprint, client_ip)
    
    # Convert messages to LiteLLM format
    litellm_messages = convert_messages(chat_request.messages)
    
    # Create streaming response generator
    async def generate():
        # First, send the token for the next request
        yield json.dumps({"token": new_token}) + "\n"
        
        try:
            # Create a streaming call to LiteLLM
            stream_response = completion(
                model="openai/gpt-4o",  # Using gpt-4o as specified
                messages=litellm_messages,
                max_tokens=chat_request.max_tokens,
                temperature=chat_request.temperature,
                stream=True,
            )
            
            # Process the streaming response
            for chunk in stream_response:
                # Extract content from response (following OpenAI format)
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        # Send the content chunk immediately
                        yield json.dumps({"content": delta.content}) + "\n"
                        
        except Exception as e:
            # Handle exceptions
            yield json.dumps({"error": f"LLM API error: {str(e)}"}) + "\n"
    
    # Return streaming response
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Run the application with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8081, reload=True)