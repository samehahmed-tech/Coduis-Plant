import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import http from 'http';
import { initSocket, closeSocket } from './socket';
import { closeDatabase } from './db';

const PORT = process.env.API_PORT || 3001;

const server = http.createServer(app);

const start = async () => {
    await initSocket(server);
    server.listen(PORT, () => {
        console.log(`Restaurant ERP Backend - Production Modular Foundation - running on port ${PORT}`);
    });
};

start().catch((error) => {
    console.error('Server startup failed:', error);
    process.exit(1);
});

const shutdown = async () => {
    await closeSocket();
    await closeDatabase();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
