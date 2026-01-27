const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Mongoose configuration for version 6.x
mongoose.set('strictQuery', false);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection (optional - will work without if MongoDB is not running)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm-inventory';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.log('MongoDB connection error (app will continue without database):', err.message);
});

// Inventory Schema
const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  quantity: { type: Number, default: 0 },
  vehicles: [String],
  lowStockThreshold: { type: Number, default: 5 }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Farm Inventory App API',
    endpoints: {
      'GET /': 'This message',
      'GET /api/items': 'Get all inventory items',
      'POST /api/items': 'Create a new inventory item',
      'GET /api/items/:id': 'Get a specific item',
      'PUT /api/items/:id': 'Update an item',
      'DELETE /api/items/:id': 'Delete an item',
      'GET /api/items/low-stock': 'Get low stock items'
    }
  });
});

// Get all inventory items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
app.get('/api/items/low-stock', async (req, res) => {
  try {
    const items = await Inventory.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific item
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new item
app.post('/api/items', async (req, res) => {
  try {
    const item = new Inventory(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update an item
app.put('/api/items/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Farm Inventory API server running on port ${PORT}`);
});
