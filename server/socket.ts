import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { requireEnv } from './config/env';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';

let io: Server | null = null;
let redisPubClient: RedisClientType | null = null;
let redisSubClient: RedisClientType | null = null;

type SocketRuntimeStatus = {
    adapter: 'memory' | 'redis';
    redisEnabled: boolean;
    redisConnected: boolean;
    lastError?: string;
};

const runtimeStatus: SocketRuntimeStatus = {
    adapter: 'memory',
    redisEnabled: false,
    redisConnected: false,
};

type AuthPayload = {
    id: string;
    role: string;
    permissions?: string[];
    branchId?: string;
};

const JWT_SECRET = requireEnv('JWT_SECRET');

const enableRedisAdapterIfConfigured = async (server: Server) => {
    const redisEnabled = process.env.SOCKET_REDIS_ENABLED === 'true';
    const redisUrl = process.env.SOCKET_REDIS_URL;
    runtimeStatus.redisEnabled = redisEnabled;

    if (!redisEnabled || !redisUrl) {
        runtimeStatus.adapter = 'memory';
        runtimeStatus.redisConnected = false;
        return;
    }

    try {
        redisPubClient = createClient({ url: redisUrl });
        redisSubClient = redisPubClient.duplicate();
        await Promise.all([redisPubClient.connect(), redisSubClient.connect()]);
        server.adapter(createAdapter(redisPubClient, redisSubClient));
        runtimeStatus.adapter = 'redis';
        runtimeStatus.redisConnected = true;
        runtimeStatus.lastError = undefined;
    } catch (error: any) {
        runtimeStatus.adapter = 'memory';
        runtimeStatus.redisConnected = false;
        runtimeStatus.lastError = error?.message || 'Redis adapter initialization failed';
    }
};

export const initSocket = async (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:3000'],
            credentials: true,
        },
    });

    await enableRedisAdapterIfConfigured(io);

    io.use((socket, next) => {
        try {
            const token = (socket.handshake.auth?.token || socket.handshake.query?.token) as string | undefined;
            if (!token) return next(new Error('AUTH_REQUIRED'));
            const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
            (socket as Socket & { user?: AuthPayload }).user = payload;
            return next();
        } catch (error) {
            return next(new Error('INVALID_TOKEN'));
        }
    });

    io.on('connection', (socket) => {
        socket.on('join', (branchId: string) => {
            if (branchId) {
                socket.join(`branch:${branchId}`);
            }
        });

        socket.on('leave', (branchId: string) => {
            if (branchId) {
                socket.leave(`branch:${branchId}`);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};

export const getSocketRuntimeStatus = (): SocketRuntimeStatus => ({ ...runtimeStatus });

export const closeSocket = async () => {
    if (io) {
        await io.close();
        io = null;
    }
    if (redisPubClient) {
        await redisPubClient.quit();
        redisPubClient = null;
    }
    if (redisSubClient) {
        await redisSubClient.quit();
        redisSubClient = null;
    }
};
