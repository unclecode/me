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
import httpx
import redis.asyncio as redis

# Initialize FastAPI app
app = FastAPI(title="AI Chat API")

# Environment variables - in production, set these securely
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-api-key")
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "your-secret-key-for-signing")  # Used for token signing
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Connect to Redis for rate limiting and token storage
redis_client = redis.from_url(REDIS_URL)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
        # "http://localhost:3000",  # Development
        # "http://localhost:3010",  # Development
        # "http://localhost:3012",  # Development
        # "http://localhost:8000",
        # "http://localhost:8081",
        # # Any port from localhost
        # "http://127.0.0.1",
        # "http://localhost",
        # "https://yourwebsite.com",  # Production
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
    
    # Format messages for OpenAI
    openai_messages = [{"role": msg.role, "content": msg.content} for msg in chat_request.messages]
    
    # Create streaming response
    async def generate():
        # Start with the token
        yield json.dumps({"token": new_token}) + "\n"
        
        # Stream the actual content
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    # "model": "gpt-3.5-turbo",
                    "model": "gpt-4o-mini",
                    "messages": openai_messages,
                    "max_tokens": chat_request.max_tokens,
                    "temperature": chat_request.temperature,
                    "stream": True,
                },
                timeout=60.0,
            )
            
            if response.status_code != 200:
                error_msg = {"error": f"OpenAI API error: {response.text}"}
                yield json.dumps(error_msg) + "\n"
                return
                
            # Process streaming response
            async for line in response.aiter_lines():
                if line.startswith("data: ") and line.strip() != "data: [DONE]":
                    try:
                        chunk = json.loads(line[6:])
                        if chunk.get("choices") and len(chunk["choices"]) > 0:
                            delta = chunk["choices"][0].get("delta", {})
                            if "content" in delta and delta["content"]:
                                yield json.dumps({"content": delta["content"]}) + "\n"
                    except json.JSONDecodeError:
                        pass
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no"  # Important for Nginx
        }
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Run the application with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8081, reload=True)