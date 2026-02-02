# Farm Inventory App

A comprehensive backend application for managing farm inventory items and their compatibility with vehicles/equipment.

## Features
- **Inventory Management**: Track items with names, categories, quantities, and compatible vehicles
- **Low-Stock Alerts**: Automatically identify items below their threshold
- **REST API**: Full CRUD operations for inventory management
- **MongoDB Integration**: Persistent storage with graceful fallback mode
- **Resilient Design**: Server runs successfully even without database connection

## Quick Start

### Prerequisites
- Node.js (v12 or higher)
- npm (v6 or higher)
- MongoDB (optional - server runs in fallback mode without it)

### Installation

1. **Clone and navigate to the backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **(Optional) Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

The server will start on `http://localhost:5000` (or your configured PORT).

### Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/farm-inventory
```

**Note:** The server operates in fallback mode if MongoDB is unavailable - all endpoints remain accessible but database operations return empty results.

## API Endpoints

### Information & Health
- `GET /` - API information and available endpoints
- `GET /health` - Server health check with database status

### Inventory Management
- `GET /api/items` - Get all inventory items
- `POST /api/items` - Create a new inventory item
- `GET /api/items/low-stock` - Get items below their low stock threshold
- `GET /api/items/:id` - Get a specific item by ID
- `PUT /api/items/:id` - Update an item by ID
- `DELETE /api/items/:id` - Delete an item by ID

### Example Usage

```bash
# Check server health
curl http://localhost:5000/health

# Create an inventory item
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Oil Filter","category":"Parts","quantity":10,"vehicles":["Tractor","Truck"],"lowStockThreshold":5}'

# Get all items
curl http://localhost:5000/api/items

# Get low stock items
curl http://localhost:5000/api/items/low-stock
```

## Technology Stack

- **Backend:** Node.js with Express.js (v4.17.1)
- **Database:** MongoDB with Mongoose (v6.13.8 - security patched)
- **Environment:** dotenv (v8.2.0)

## Security

- ✅ Mongoose upgraded to v6.13.8 to patch search injection vulnerabilities
- ✅ No security vulnerabilities (`npm audit` clean)
- ✅ Environment variables for sensitive configuration
- ✅ Comprehensive error handling to prevent information leakage

## Development

See [backend/README.md](backend/README.md) for detailed backend documentation.

## License

This project is part of the Farm Inventory App.