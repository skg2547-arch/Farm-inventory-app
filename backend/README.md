# Farm Inventory App - Backend

## Overview
Express.js backend server for the Farm Inventory Application with MongoDB integration, comprehensive error handling, and graceful fallback modes.

## Features
- ✅ Express.js REST API server
- ✅ MongoDB connection with automatic fallback
- ✅ Environment variable configuration
- ✅ Comprehensive error handling (uncaught exceptions, unhandled rejections)
- ✅ Graceful shutdown (SIGINT, SIGTERM)
- ✅ Health check endpoint
- ✅ Meaningful startup and runtime logs

## Prerequisites
- Node.js (v12 or higher recommended)
- npm (v6 or higher)
- MongoDB (optional - server runs in fallback mode without it)

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/farm-inventory
```

## Running the Application

### Option 1: Start with npm (recommended)
```bash
npm start
```

### Option 2: Start with node directly
```bash
node index.js
```

### Option 3: Run with custom environment variables
```bash
PORT=3000 MONGODB_URI=mongodb://localhost:27017/mydb node index.js
```

## Available Endpoints

### GET /
Returns API information and status
```bash
curl http://localhost:5000/
```

Response:
```json
{
  "message": "Farm Inventory App Backend is running!",
  "status": "ok",
  "timestamp": "2026-01-26T20:15:49.775Z"
}
```

### GET /health
Returns server health status including database connection state
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "uptime": 17.576102019,
  "message": "OK",
  "timestamp": 1769458552931,
  "database": "disconnected"
}
```

## MongoDB Configuration

### Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/farm-inventory
```

### MongoDB Atlas (Cloud)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farm-inventory?retryWrites=true&w=majority
```

### Docker MongoDB
```env
MONGODB_URI=mongodb://mongo:27017/farm-inventory
```

## Fallback Mode

The server is designed to start successfully even without MongoDB connection. When MongoDB is unavailable:
- ✅ Server starts normally on specified port
- ✅ Health endpoint shows database as "disconnected"
- ⚠️ Database-dependent features will not be available
- ℹ️ Helpful warning messages guide you to configure MONGODB_URI

## Error Handling

The application includes comprehensive error handling:
- **Uncaught Exceptions**: Logged with stack trace, server continues running
- **Unhandled Promise Rejections**: Logged with details, server continues running
- **MongoDB Connection Errors**: Gracefully handled with fallback mode
- **Request Errors**: Custom error middleware returns JSON responses
- **404 Errors**: Informative responses with available routes

## Graceful Shutdown

The server handles shutdown signals properly:
- `CTRL+C` (SIGINT) - Closes MongoDB connection and exits cleanly
- `SIGTERM` - Closes MongoDB connection and exits cleanly

## Logging

The application provides comprehensive logging:
- 🔄 Connection attempts
- ✅ Successful operations
- ⚠️ Warnings (e.g., MongoDB unavailable)
- ❌ Errors with details
- 🚀 Startup information
- 📡 Server configuration

## Troubleshooting

### Server won't start
1. Check if port is already in use:
   ```bash
   lsof -i :5000
   ```
2. Try a different port:
   ```bash
   PORT=3000 npm start
   ```

### MongoDB connection fails
1. Verify MongoDB is running:
   ```bash
   # For local MongoDB
   mongod --version
   ```
2. Check MONGODB_URI is correct in `.env`
3. Server will run in fallback mode - database features will be unavailable

### Dependencies not found
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development

### Project Structure
```
backend/
├── index.js           # Main entry point
├── package.json       # Dependencies and scripts
├── package-lock.json  # Locked dependency versions
├── .env.example       # Environment variable template
└── README.md          # This file
```

### Adding New Routes
Edit `index.js` and add routes before the 404 handler:
```javascript
app.get('/api/items', (req, res) => {
  // Your route logic
  res.json({ items: [] });
});
```

### Future Enhancements
- Add route modules for better organization
- Implement authentication/authorization
- Add API routes for farm inventory management
- Implement data models with Mongoose schemas
- Add request validation
- Add rate limiting
- Add CORS configuration
- Add unit and integration tests

## License
This project is part of the Farm Inventory App.
