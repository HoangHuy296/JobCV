const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class NotificationWebSocket {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/notifications'
    });
    
    // Store connected clients with their user IDs
    this.clients = new Map();
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
    
    console.log('WebSocket server initialized for notifications');
  }

  handleConnection(ws, req) {
    console.log('New WebSocket connection attempt');
    
    // Extract token from query string or headers
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      console.log('WebSocket connection rejected: No token provided');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      console.log(`WebSocket authenticated for user ${userId}`);
      
      // Store client with user ID
      this.clients.set(ws, userId);
      
      // Send connection success message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        userId: userId
      }));
      
      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, userId, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        console.log(`WebSocket disconnected for user ${userId}`);
        this.clients.delete(ws);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
      
    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      ws.close(1008, 'Invalid token');
    }
  }
  
  handleMessage(ws, userId, data) {
    // Handle ping/pong for keep-alive
    if (data.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      return;
    }
    
    console.log(`Message from user ${userId}:`, data);
  }
  
  // Send notification to specific user
  sendToUser(userId, notification) {
    // Ensure userId is a number for comparison
    const targetUserId = parseInt(userId);
    let sent = false;
    let sentCount = 0;
    
    console.log(`[WebSocket] Attempting to send notification to user ${targetUserId}`);
    console.log(`[WebSocket] Notification data:`, { 
      id: notification.id, 
      title: notification.title,
      user_id: notification.user_id 
    });
    
    // Verify notification is for the correct user
    if (notification.user_id && parseInt(notification.user_id) !== targetUserId) {
      console.error(`[WebSocket] ERROR: Notification user_id (${notification.user_id}) does not match target user (${targetUserId})`);
      return false;
    }
    
    this.clients.forEach((clientUserId, ws) => {
      console.log(`[WebSocket] Checking client: userId=${clientUserId}, target=${targetUserId}, match=${clientUserId === targetUserId}`);
      
      if (clientUserId === targetUserId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
        sent = true;
        sentCount++;
        console.log(`[WebSocket] ✓ Notification sent to user ${targetUserId} (connection ${sentCount})`);
      }
    });
    
    if (!sent) {
      console.log(`[WebSocket] ✗ User ${targetUserId} is not connected. Notification will be delivered on next login.`);
    } else {
      console.log(`[WebSocket] Successfully sent notification to ${sentCount} connection(s) for user ${targetUserId}`);
    }
    
    return sent;
  }
  
  // Send notification to multiple users
  sendToUsers(userIds, notification) {
    // Ensure all userIds are numbers
    const targetUserIds = userIds.map(id => parseInt(id));
    const sentTo = [];
    
    console.log(`[WebSocket] Attempting to send notification to ${targetUserIds.length} users:`, targetUserIds);
    
    this.clients.forEach((clientUserId, ws) => {
      if (targetUserIds.includes(clientUserId) && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
        sentTo.push(clientUserId);
        console.log(`[WebSocket] ✓ Notification sent to user ${clientUserId}`);
      }
    });
    
    const notSent = targetUserIds.filter(id => !sentTo.includes(id));
    if (notSent.length > 0) {
      console.log(`[WebSocket] ✗ Users not connected:`, notSent);
    }
    
    console.log(`[WebSocket] Successfully sent to ${sentTo.length}/${targetUserIds.length} users`);
    return sentTo;
  }
  
  // Broadcast to all connected clients
  broadcast(notification) {
    const sentTo = [];
    
    this.clients.forEach((userId, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
        sentTo.push(userId);
      }
    });
    
    return sentTo;
  }
  
  // Get connected user count
  getConnectedUserCount() {
    return this.clients.size;
  }
  
  // Check if user is connected
  isUserConnected(userId) {
    const targetUserId = parseInt(userId);
    for (const [ws, clientUserId] of this.clients.entries()) {
      if (clientUserId === targetUserId && ws.readyState === WebSocket.OPEN) {
        return true;
      }
    }
    return false;
  }
  
  // Get all connected user IDs
  getConnectedUserIds() {
    const userIds = [];
    this.clients.forEach((userId, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        userIds.push(userId);
      }
    });
    return [...new Set(userIds)]; // Remove duplicates
  }
  
  // Debug: Log all connected users
  logConnectedUsers() {
    const users = this.getConnectedUserIds();
    console.log(`[WebSocket] Connected users (${users.length}):`, users);
    return users;
  }
}

module.exports = NotificationWebSocket;
