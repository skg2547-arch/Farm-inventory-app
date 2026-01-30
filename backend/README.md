# Farm Inventory App - Backend

Express.js backend server for managing farm inventory with MongoDB integration, comprehensive error handling, and graceful fallback modes.

## Architecture Overview

### Key Components
- **Express Server**: RESTful API with JSON middleware
- **Mongoose ODM**: MongoDB object modeling with schema validation
- **Dotenv**: Environment configuration management
- **Error Handling**: Comprehensive exception and rejection handlers
- **Graceful Shutdown**: SIGINT/SIGTERM handlers with connection cleanup

### MongoDB Fallback Pattern

The server implements a graceful degradation pattern:
```javascript
// Connection attempt with timeout
await mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

If MongoDB is unavailable:
- ✅ Server starts successfully
- ✅ API endpoints remain accessible
- ✅ Health endpoint shows database status
- ⚠️  Database operations return empty results or errors

This ensures the application is always deployable, even without database infrastructure.

## Inventory Schema

```javascript
{
  name: String (required),        // Item name
  category: String,                // Item category
  quantity: Number (default: 0),   // Current stock level
  vehicles: [String],              // Compatible vehicle names
  lowStockThreshold: Number (default: 5),  // Alert threshold
  timestamps: true                 // Auto-managed createdAt/updatedAt
}
```

## API Reference

### GET /
Returns API information and available endpoints.

**Response:**
```json
{
  "message": "Farm Inventory App Backend is running!",
  "status": "ok",
  "timestamp": "2026-01-28T13:33:28.009Z",
  "endpoints": { ... }
}
```

### GET /health
Returns server health status.

**Response:**
```json
{
  "uptime": 123.45,
  "message": "OK",
  "timestamp": 1769607208009,
  "database": "connected"
}
```

### GET /api/items
Retrieves all inventory items.

**Response:** Array of inventory items

### POST /api/items
Creates a new inventory item.

**Request Body:**
```json
{
  "name": "Oil Filter",
  "category": "Parts",
  "quantity": 15,
  "vehicles": ["Tractor", "Truck"],
  "lowStockThreshold": 5
}
```

**Response:** Created item with ID

### GET /api/items/low-stock
Retrieves items where quantity ≤ lowStockThreshold.

**Response:** Array of low stock items

### GET /api/items/:id
Retrieves a specific item by MongoDB ObjectId.

**Response:** Item object or 404 error

### PUT /api/items/:id
Updates an existing item.

**Request Body:** Partial or complete item object

**Response:** Updated item or 404 error

### DELETE /api/items/:id
Deletes an item by ID.

**Response:**
```json
{
  "message": "Item deleted successfully"
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb://localhost:27017/farm-inventory` | MongoDB connection string |

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## Testing

### Manual Testing

```bash
# Test server health
curl http://localhost:5000/health

# Create a test item
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spark Plug",
    "category": "Engine Parts",
    "quantity": 20,
    "vehicles": ["Tractor"],
    "lowStockThreshold": 10
  }'

# Get all items
curl http://localhost:5000/api/items

# Test low stock (after creating items below threshold)
curl http://localhost:5000/api/items/low-stock
```

### Fallback Testing

1. Start server without MongoDB:
   ```bash
   MONGODB_URI=mongodb://invalid:27017/test npm start
   ```

2. Verify server starts successfully
3. Check health endpoint shows `"database": "disconnected"`
4. API calls will return empty arrays or connection errors

## Error Handling

### Global Handlers
- **Uncaught Exceptions**: Logged with stack trace, server continues
- **Unhandled Rejections**: Logged with details, server continues
- **404 Errors**: Returns list of available routes
- **API Errors**: Returns JSON with error message and status code

### Graceful Shutdown
- SIGINT (Ctrl+C): Closes MongoDB connection, exits cleanly
- SIGTERM: Closes MongoDB connection, exits cleanly

## Security

### Vulnerabilities Addressed
- Upgraded Mongoose from 5.10.9 to 6.13.8
- Patches search injection CVEs (< 6.13.5, < 6.13.6)
- npm audit: 0 vulnerabilities

### Best Practices
- Environment variables for sensitive data
- Credential masking in logs
- Input validation via Mongoose schemas
- Error messages don't leak system information

## Development Tips

### Adding New Routes
Add routes before the 404 handler:
```javascript
app.get('/api/custom', async (req, res) => {
  // Your logic
  res.json({ data: 'value' });
});
```

### Mongoose Schema Changes
Update the inventorySchema and restart:
```javascript
const inventorySchema = new mongoose.Schema({
  // Add new fields
  newField: { type: String, default: '' }
});
```

### Debugging
Enable detailed logs:
```javascript
mongoose.set('debug', true);
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 5000
lsof -i :5000

# Use different port
PORT=3000 npm start
```

### MongoDB connection fails
- Verify MongoDB is running: `mongod --version`
- Check MONGODB_URI in .env
- Server will run in fallback mode

### Dependencies not found
```bash
rm -rf node_modules package-lock.json
npm install
```

## Future Enhancements
- Authentication/authorization
- Request validation middleware
- Rate limiting
- CORS configuration
- Unit and integration tests
- API documentation (Swagger/OpenAPI)
- Logging framework (Winston/Morgan)

## License
Part of the Farm Inventory App project.
