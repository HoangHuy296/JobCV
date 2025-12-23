const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Import routes
const indexRoutes = require('./routes/index');

// Swagger setup
const { swaggerUi, specs } = require('./swagger');

// WebSocket
const NotificationWebSocket = require('./websocket/notificationSocket');
const { setNotificationWS } = require('./services/notificationEmitter');

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
const notificationWS = new NotificationWebSocket(server);
setNotificationWS(notificationWS);

// Make WebSocket instance available to routes
app.set('notificationWS', notificationWS);

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
    documentation: `Visit http://localhost:${PORT}/api-docs to view the API documentation`,
    websocket: `WebSocket available at ws://localhost:${PORT}/ws/notifications`
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the API`);
  console.log(`Visit http://localhost:${PORT}/api-docs to view the API documentation`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws/notifications`);
});

module.exports = { app, server, notificationWS };
