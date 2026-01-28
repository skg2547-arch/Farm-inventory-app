require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// Set strictQuery to suppress Mongoose 7 deprecation warning
mongoose.set('strictQuery', false);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm-inventory';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inventory Schema
// Defines the structure for farm inventory items with name, category, quantity, compatible vehicles, and low stock threshold
const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  quantity: { type: Number, default: 0 },
  vehicles: [String],  // Array of vehicle names this item is compatible with
  lowStockThreshold: { type: Number, default: 5 }
}, { timestamps: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

// Basic route for API information
app.get('/', (req, res) => {
  res.json({
    message: 'Farm Inventory App Backend is running!',
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /': 'API information',
      'GET /health': 'Health check',
      'GET /api/items': 'Get all inventory items',
      'POST /api/items': 'Create a new inventory item',
      'GET /api/items/low-stock': 'Get low stock items',
      'GET /api/items/:id': 'Get a specific item',
      'PUT /api/items/:id': 'Update an item',
      'DELETE /api/items/:id': 'Delete an item'
    }
  });
});

app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.status(200).json(health);
});

// MongoDB Connection with proper error handling
// Implements graceful fallback pattern - server starts successfully even without database
const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log(`📍 MongoDB URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed:', error.message);
    console.warn('ℹ️  The server will start without database connection.');
    console.warn('ℹ️  Database-dependent features will not be available.');
    console.warn('ℹ️  Please check your MONGODB_URI environment variable.');
  }
};

// MongoDB event handlers
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Middleware to check database connection for API routes
// Implements graceful degradation by returning informative errors when database is unavailable
const checkDatabaseConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'MongoDB is not currently connected. Database features are unavailable in fallback mode.',
      database: 'disconnected'
    });
  }
  next();
};

// Inventory API Routes

// Get low stock items (must be before /:id to avoid matching 'low-stock' as an ID)
app.get('/api/items/low-stock', checkDatabaseConnection, async (req, res) => {
  try {
    const items = await Inventory.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all inventory items
app.get('/api/items', checkDatabaseConnection, async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific item
app.get('/api/items/:id', checkDatabaseConnection, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    // Handle invalid MongoDB ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid item ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Create a new item
app.post('/api/items', checkDatabaseConnection, async (req, res) => {
  try {
    // Basic validation - Mongoose schema handles detailed validation
    if (!req.body.name) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// Update an item
app.put('/api/items/:id', checkDatabaseConnection, async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { 
      new: true,
      runValidators: true  // Ensure schema validation runs on updates
    });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    // Handle invalid MongoDB ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid item ID format' });
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// Delete an item
app.delete('/api/items/:id', checkDatabaseConnection, async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    // Handle invalid MongoDB ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid item ID format' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  console.error('⚠️  Please fix this error to ensure application stability');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  console.error('⚠️  Please handle this promise rejection properly');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/items',
      'POST /api/items',
      'GET /api/items/low-stock',
      'GET /api/items/:id',
      'PUT /api/items/:id',
      'DELETE /api/items/:id'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    // Attempt to connect to MongoDB (with fallback)
    await connectDB();
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(60));
      console.log('🚀 Farm Inventory App Backend Server Started');
      console.log('='.repeat(60));
      console.log(`📡 Server listening on port ${PORT}`);
      console.log(`🌐 Local URL: http://localhost:${PORT}`);
      console.log(`🗄️  Database Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected (running in fallback mode)'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
      console.log('');
      console.log('Available endpoints:');
      console.log('  GET  /              - API information');
      console.log('  GET  /health        - Health check');
      console.log('  GET  /api/items     - Get all inventory items');
      console.log('  POST /api/items     - Create a new inventory item');
      console.log('  GET  /api/items/low-stock - Get low stock items');
      console.log('  GET  /api/items/:id - Get a specific item');
      console.log('  PUT  /api/items/:id - Update an item');
      console.log('  DELETE /api/items/:id - Delete an item');
      console.log('');
      if (mongoose.connection.readyState !== 1) {
        console.log('⚠️  TIP: Set MONGODB_URI environment variable to enable database features');
        console.log('');
      }
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize the server
startServer();

module.exports = app;
