import { io, Socket } from 'socket.io-client';

type SocketEventHandler = (...args: any[]) => void;

const getSocketUrl = () => {
    const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
    if (explicitSocketUrl && explicitSocketUrl.startsWith('http')) {
        return explicitSocketUrl;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
        return apiUrl.replace(/\/api\/?$/, '');
    }
    return window.location.origin;
};

class SocketService {
    private socket: Socket | null = null;
    private currentBranchId: string | null = null;
    private currentToken: string | null = null;

    init(token: string) {
        if (this.socket && this.currentToken === token) return;
        if (this.socket && this.currentToken !== token) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.currentToken = token;
        this.socket = io(getSocketUrl(), {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
            if (this.currentBranchId) {
                this.socket?.emit('join', this.currentBranchId);
            }
        });
    }

    joinBranch(branchId?: string) {
        if (!this.socket || !branchId) return;
        if (this.currentBranchId && this.currentBranchId !== branchId) {
            this.socket.emit('leave', this.currentBranchId);
        }
        this.currentBranchId = branchId;
        this.socket.emit('join', branchId);
    }

    on(event: string, handler: SocketEventHandler) {
        this.socket?.on(event, handler);
    }

    off(event: string, handler: SocketEventHandler) {
        this.socket?.off(event, handler);
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this.currentBranchId = null;
        this.currentToken = null;
    }
}

export const socketService = new SocketService();
export default socketService;
