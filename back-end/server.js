const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const indexRoutes = require('./routes/index');

// Swagger setup
const { swaggerUi, specs } = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api', indexRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Express MySQL Backend API',
    documentation: `Visit http://localhost:${PORT}/api-docs to view the API documentation`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the API`);
  console.log(`Visit http://localhost:${PORT}/api-docs to view the API documentation`);
});

module.exports = app;
