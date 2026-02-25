import { Client } from '@stomp/stompjs';
import { WebSocket } from 'ws';

Object.assign(global, { WebSocket });

const client = new Client({
    brokerURL: 'ws://localhost:8080/ws',
    onConnect: () => {
        console.log('STOMP connected successfully!');
        client.subscribe('/topic/admin.notifications', (message) => {
            console.log('Received: ', message.body);
        });
        console.log('Subscribed to /topic/admin.notifications');
        setTimeout(() => {
            client.deactivate();
            process.exit(0);
        }, 1000);
    },
    onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
        process.exit(1);
    },
    onWebSocketClose: () => {
        console.log('WebSocket connection closed.');
    },
    onWebSocketError: (err) => {
        console.error('WebSocket error:', err);
    }
});

console.log('Attempting to connect...');
client.activate();

setTimeout(() => {
    console.log('Timeout. Exiting.');
    process.exit(1);
}, 5000);
