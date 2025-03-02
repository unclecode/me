# Secure AI Chat API

This API provides a secure proxy to OpenAI's Chat API with these security features:

- One-time use tokens
- IP-based rate limiting 
- Browser fingerprint validation
- Request timestamp validation
- Streaming responses

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up Redis:
   - Install Redis or use a cloud provider
   - For local development, you can use Docker:
     ```
     docker run -d -p 6379:6379 redis
     ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key
   - Generate a random API secret key
   - Update Redis URL if needed

## Running the API

Start the API server:

```
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

## API Documentation

Once running, API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing

Run the test client to verify the API functionality:

```
python test_client.py
```

This will perform multiple requests to test:
1. Initial request (no token)
2. Follow-up request (with token)
3. Token reuse (should fail)

## Deploying to Production

For production deployment, consider:

1. Using a proper production ASGI server like Gunicorn with Uvicorn workers
2. Setting up HTTPS with a valid SSL certificate
3. Using environment variables for configuration
4. Setting up proper monitoring and logging
5. Deploying on a platform like Vercel Serverless Functions, AWS Lambda, etc.

Example serverless deployment:

```
# vercel.json
{
  "builds": [
    {
      "src": "server.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.py"
    }
  ]
}
```

## Integration with Frontend

The frontend should:
1. Send the complete message history with each request
2. Store and send the one-time token received from the previous request
3. Generate a browser fingerprint for verification
4. Include the current timestamp
5. Handle the streaming response format