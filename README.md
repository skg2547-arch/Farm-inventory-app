# Farm Inventory App

This application helps manage inventory items and their compatibility with vehicles/equipment on a farm.

## Features
- Track inventory quantities with details like names, categories, and applicable vehicles.
- Map items like tires or alternators to multiple vehicles, ensuring compatibility tracking.
- Maintain separate records per vehicle for oil changes, part replacements, and service history.
- Low-stock alerts for managing inventory effectively.

## Quick Start

### Backend Server

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The backend server will start on `http://localhost:5000` (or the port specified in your `.env` file).

### Configuration (Optional)

To customize the configuration:

1. Create a `.env` file in the `backend` directory:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` with your settings:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/farm-inventory
   ```

**Note:** The server will run successfully even without MongoDB. If MongoDB is not available, it operates in fallback mode with helpful warnings.

### Available Endpoints

- `GET /` - API information and status
- `GET /health` - Server health check with database status

### Testing the Server

```bash
# Test root endpoint
curl http://localhost:5000/

# Test health endpoint
curl http://localhost:5000/health
```

## Documentation

For detailed backend documentation, see [backend/README.md](backend/README.md).

## Technology Stack

- **Backend:** Node.js with Express.js (v4.17.1)
- **Database:** MongoDB with Mongoose (v5.10.9)
- **Environment Management:** dotenv (v8.2.0)

## Development Status

The backend infrastructure is complete with:
- ✅ Express server with MongoDB integration
- ✅ Environment variable configuration
- ✅ Comprehensive error handling
- ✅ Graceful shutdown mechanisms
- ✅ Health monitoring endpoints
- ✅ Fallback mode for MongoDB unavailability

Stay tuned for further updates as development progresses!