const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const clients = new Map();

server.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            broadcastMessage(ws, data);
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        for (const [key, client] of clients.entries()) {
            if (client === ws) {
                clients.delete(key);
                break;
            }
        }
    });
});

function broadcastMessage(sender, message) {
    server.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
} 