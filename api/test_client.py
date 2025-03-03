import asyncio
import httpx
import json
import time
import hashlib
import platform
import random
import string
from typing import List, Dict, Any

# Test configuration
API_URL = "http://localhost:8081/chat"

def generate_browser_fingerprint():
    """Generate a simple mock browser fingerprint for testing"""
    # In a real client, you would use a library like FingerprintJS
    system_info = platform.system() + platform.version() + platform.machine()
    random_id = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    fingerprint = hashlib.sha256(f"{system_info}:{random_id}".encode()).hexdigest()
    return fingerprint

async def stream_response(response):
    """Process streaming response showing each token as it arrives"""
    token = None
    content = ""
    
    # Process the streaming response chunk by chunk
    async for line in response.aiter_lines():
        if not line.strip():
            continue
            
        try:
            data = json.loads(line)
            
            # Extract token if present (should be first item)
            if "token" in data:
                token = data["token"]
                print(f"[TOKEN] {token[:10]}...{token[-5:]}")
            
            # Extract content tokens as they arrive
            if "content" in data:
                content_chunk = data["content"]
                content += content_chunk
                # Print each token as it arrives to demonstrate streaming
                print(f"'{content_chunk}'", end="", flush=True)
            
            # Handle error
            if "error" in data:
                print(f"\n[ERROR] {data['error']}")
                
        except json.JSONDecodeError:
            if line.strip():
                print(f"\n[PARSE ERROR] {line[:50]}...")
    
    print("\n[COMPLETE]")
    return token, content

async def chat_session():
    """Simulate a chat session with the LiteLLM-powered API"""
    browser_fingerprint = generate_browser_fingerprint()
    messages = []
    token = None
    
    # First message
    messages.append({"role": "user", "content": "Hello! Can you tell me about yourself in one short paragraph?"})
    
    try:
        print("\n--- First request ---")
        async with httpx.AsyncClient(timeout=60.0) as client:
            # First request has no token
            response = await client.post(
                API_URL,
                json={
                    "messages": messages,
                    "browser_fingerprint": browser_fingerprint,
                    "timestamp": int(time.time() * 1000),
                    "token": None,
                    "max_tokens": 200,
                    "temperature": 0.7
                },
                timeout=60.0,
            )
            
            if response.status_code != 200:
                print(f"Error: {response.status_code} - {await response.aread()}")
                return
                
            # Process streaming response - this should show tokens as they arrive
            token, content = await stream_response(response)
            
            # Add assistant response to message history
            messages.append({"role": "assistant", "content": content})
        
        # Wait a moment before second request
        await asyncio.sleep(1)
        
        print("\n\n--- Second request ---")
        # Ask a follow-up question
        messages.append({"role": "user", "content": "What's your favorite programming language and why?"})
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Use the token from first response
            response = await client.post(
                API_URL,
                json={
                    "messages": messages,
                    "browser_fingerprint": browser_fingerprint,
                    "timestamp": int(time.time() * 1000),
                    "token": token,
                    "max_tokens": 300,
                    "temperature": 0.7
                },
                timeout=60.0,
            )
            
            if response.status_code != 200:
                print(f"Error: {response.status_code} - {await response.aread()}")
                return
                
            # Process streaming response
            token2, content2 = await stream_response(response)
            
            # Add to message history
            messages.append({"role": "assistant", "content": content2})
        
        # Wait a moment before third request
        await asyncio.sleep(1)
        
        print("\n\n--- Third request (reusing token, should fail) ---")
        messages.append({"role": "user", "content": "Can you explain how tokens work in this API?"})
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Try to reuse the token (should fail)
            response = await client.post(
                API_URL,
                json={
                    "messages": messages,
                    "browser_fingerprint": browser_fingerprint,
                    "timestamp": int(time.time() * 1000),
                    "token": token,  # Reusing first token, should fail
                    "max_tokens": 300,
                    "temperature": 0.7
                },
                timeout=60.0,
            )
            
            if response.status_code != 200:
                print(f"Token reuse test passed! Server rejected with: {response.status_code} - {await response.aread()}")
            else:
                print("Token reuse test failed - server accepted the reused token")
                await stream_response(response)
                
    except Exception as e:
        print(f"Error during chat session: {str(e)}")

if __name__ == "__main__":
    print("Starting API test client to test LiteLLM stream integration...")
    asyncio.run(chat_session())