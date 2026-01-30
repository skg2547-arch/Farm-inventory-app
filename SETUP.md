# Setup and Deployment Guide

## Quick Start

### 1. Prerequisites
- Node.js v12+ and npm v6+
- (Optional) MongoDB v4.4+ for persistence

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/skg2547-arch/Farm-inventory-app.git
cd Farm-inventory-app/backend

# Install dependencies
npm install

# (Optional) Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI if needed

# Start the server
npm start
```

The server will start on http://localhost:5000 and run successfully even without MongoDB.

### 3. Verification

```bash
# Test the server
curl http://localhost:5000/health

# Run comprehensive tests
cd ..
./test.sh
```

## Environment Configuration

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/farm-inventory
```

### MongoDB Options

**Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/farm-inventory
```

**MongoDB Atlas (Cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farm-inventory?retryWrites=true&w=majority
```

**Docker MongoDB:**
```
MONGODB_URI=mongodb://mongo:27017/farm-inventory
```

## API Usage Examples

### Get Server Status
```bash
curl http://localhost:5000/health
```

### Create an Inventory Item
```bash
curl -X POST http://localhost:5000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Oil Filter",
    "category": "Parts",
    "quantity": 15,
    "vehicles": ["Tractor", "Truck"],
    "lowStockThreshold": 5
  }'
```

### Get All Items
```bash
curl http://localhost:5000/api/items
```

### Get Low Stock Items
```bash
curl http://localhost:5000/api/items/low-stock
```

### Update an Item
```bash
curl -X PUT http://localhost:5000/api/items/ITEM_ID \
  -H "Content-Type: application/json" \
  -d '{"quantity": 20}'
```

### Delete an Item
```bash
curl -X DELETE http://localhost:5000/api/items/ITEM_ID
```

## Deployment

### Production Checklist

1. **Set NODE_ENV to production:**
   ```env
   NODE_ENV=production
   ```

2. **Configure MongoDB:**
   - Use MongoDB Atlas or your own hosted instance
   - Set appropriate connection string in MONGODB_URI

3. **Security Enhancements (Recommended):**
   - Add rate limiting: `npm install express-rate-limit`
   - Add helmet for security headers: `npm install helmet`
   - Configure CORS: `npm install cors`
   - Use HTTPS (configure reverse proxy like nginx)

4. **Process Management:**
   - Use PM2: `npm install -g pm2 && pm2 start index.js`
   - Or use systemd service
   - Enable auto-restart on failure

5. **Monitoring:**
   - Set up logging (Winston)
   - Monitor with PM2 or similar
   - Configure health checks

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t farm-inventory .
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://mongo:27017/farm-inventory \
  farm-inventory
```

### Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create app
heroku create farm-inventory-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri

# Deploy
git push heroku main

# Open app
heroku open
```

## Troubleshooting

### Server Won't Start
- Check if port 5000 is available: `lsof -i :5000`
- Try different port: `PORT=3000 npm start`
- Check logs for errors

### MongoDB Connection Fails
- Verify MongoDB is running: `mongod --version`
- Check MONGODB_URI is correct
- Server will run in fallback mode (503 for database operations)

### Dependencies Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Tests Failing
```bash
cd backend
npm audit
node -c index.js  # Check syntax
npm start         # Verify server starts
```

## Maintenance

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update non-breaking
npm update

# Update package.json and install
npm install
npm audit
```

### Security Audits
```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for specific vulnerabilities
npm audit --production
```

### Backup MongoDB Data
```bash
# Export data
mongoexport --db farm-inventory --collection inventories --out backup.json

# Import data
mongoimport --db farm-inventory --collection inventories --file backup.json
```

## Support

- **Documentation**: See [README.md](README.md) and [backend/README.md](backend/README.md)
- **Security**: See [SECURITY.md](SECURITY.md)
- **Issues**: GitHub Issues
- **Tests**: Run `./test.sh` for comprehensive verification

## License

Part of the Farm Inventory App project.
