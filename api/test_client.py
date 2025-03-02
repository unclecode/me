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
    """Process streaming response chunks"""
    token = None
    content = ""
    
    async for line in response.aiter_lines():
        if not line.strip():
            continue
            
        try:
            data = json.loads(line)
            
            # Extract token if present
            if "token" in data:
                token = data["token"]
                print(f"Received token: {token[:10]}...{token[-5:]}")
                
            # Extract content if present
            if "content" in data:
                content_chunk = data["content"]
                content += content_chunk
                print(content_chunk, end="", flush=True)
                
            # Handle error
            if "error" in data:
                print(f"\nError: {data['error']}")
                
        except json.JSONDecodeError:
            print(f"Failed to parse line: {line}")
    
    print("\n")  # End the line after all content
    return token, content

async def chat_session():
    """Simulate a chat session with multiple exchanges"""
    browser_fingerprint = generate_browser_fingerprint()
    messages = []
    token = None
    
    # First message
    messages.append({"role": "user", "content": "Hello! Can you tell me about yourself?"})
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            print("\n--- First request ---")
            timestamp = int(time.time() * 1000)
            
            response = await client.post(
                API_URL,
                json={
                    "messages": messages,
                    "browser_fingerprint": browser_fingerprint,
                    "timestamp": timestamp,
                    "token": token,  # None for first request
                },
                timeout=60.0,
            )
            
            if response.status_code != 200:
                print(f"Error: {response.status_code} - {response.text}")
                return
                
            token, content = await stream_response(response)
            
            # Add assistant response to messages
            messages.append({"role": "assistant", "content": content})
            
            # Second message - use the token we received
            print("\n--- Second request ---")
            messages.append({"role": "user", "content": "What's your favorite programming language and why?"})
            timestamp = int(time.time() * 1000)
            
            response = await client.post(
                API_URL,
                json={
                    "messages": messages,
                    "browser_fingerprint": browser_fingerprint,
                    "timestamp": timestamp,
                    "token": token,
                },
                timeout=60.0,
            )
            
            if response.status_code != 200:
                print(f"Error: {response.status_code} - {response.text}")
                return
                
            token, content = await stream_response(response)
            
            # Add assistant response to messages
            messages.append({"role": "assistant", "content": content})
            
            # Third message - test token reuse (should fail)
            print("\n--- Third request (token reuse, should fail) ---")
            messages.append({"role": "user", "content": "Can you explain how tokens work in this API?"})
            timestamp = int(time.time() * 1000)
            
            # Reuse the same token (should fail)
            response = await client.post(
                API_URL,
                json={
                    "messages": messages,
                    "browser_fingerprint": browser_fingerprint,
                    "timestamp": timestamp,
                    "token": token,  # Reusing token
                },
                timeout=60.0,
            )
            
            if response.status_code != 200:
                print(f"Token reuse test passed! Error: {response.status_code} - {response.text}")
            else:
                print("Token reuse test failed - server accepted reused token")
                await stream_response(response)
                
        except Exception as e:
            print(f"Error during chat session: {str(e)}")

if __name__ == "__main__":
    print("Starting API test client...")
    asyncio.run(chat_session())