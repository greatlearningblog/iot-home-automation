const socket = io();

// Send control command to the server
function controlDevice(device, action) {
  const data = { device, action };
  console.log('Sending control command:', data);
  socket.emit('controlDevice', data);
}

// Listen for control response from the server
socket.on('controlResponse', (data) => {
  console.log('Control Response:', data);
  addLog(`Control command for ${data.device} ${data.action}: ${data.success ? 'Success' : 'Failed'}`);
});

// Listen for device status updates
socket.on('deviceStatus', (data) => {
  console.log('Device Status Update:', data);
  addLog(`Status update from ${data.topic}: ${data.message}`);
  // Update status on the UI; assuming topic format "home/{device}/status"
  const topicParts = data.topic.split('/');
  if (topicParts.length >= 3) {
    const device = topicParts[1];
    const statusElement = document.getElementById(`status-${device}`);
    if (statusElement) {
      statusElement.textContent = data.message;
    }
  }
});

// Function to add a log entry
function addLog(message) {
  const logList = document.getElementById('logList');
  const li = document.createElement('li');
  li.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logList.appendChild(li);
}
