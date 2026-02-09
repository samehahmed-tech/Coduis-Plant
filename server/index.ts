import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import pg from 'pg';
import http from 'http';
import { initSocket, closeSocket } from './socket';

const { Pool } = pg;
const PORT = process.env.API_PORT || 3001;

// Global Pool setup for legacy components if needed,
// though modular controllers use server/db/index.ts
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
    console.error('Database pool error:', err);
});

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
    await pool.end();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
