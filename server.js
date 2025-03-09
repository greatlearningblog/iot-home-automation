require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mqtt = require('mqtt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static('public'));

// Connect to MQTT broker
const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
const mqttClient = mqtt.connect(mqttUrl);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker at', mqttUrl);
  // Subscribe to all device status topics (e.g., home/light/status, home/fan/status)
  mqttClient.subscribe('home/+/status', (err) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      console.log('Subscribed to device status topics');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  const msg = message.toString();
  console.log(`MQTT Message Received: ${topic} - ${msg}`);
  // Broadcast the status update to all connected clients
  io.emit('deviceStatus', { topic, message: msg });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // Listen for control commands from the client
  socket.on('controlDevice', (data) => {
    // data: { device: "light", action: "ON" }
    console.log('Control command received:', data);
    const controlTopic = `home/${data.device}/control`;
    mqttClient.publish(controlTopic, data.action, (err) => {
      if (err) {
        console.error('Publish error:', err);
        socket.emit('controlResponse', { success: false, error: err.toString() });
      } else {
        console.log(`Published ${data.action} to ${controlTopic}`);
        socket.emit('controlResponse', { success: true, device: data.device, action: data.action });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
