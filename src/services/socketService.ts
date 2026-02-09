import { io, Socket } from 'socket.io-client';

type SocketEventHandler = (...args: any[]) => void;

const getSocketUrl = () => {
    const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
    if (explicitSocketUrl && explicitSocketUrl.startsWith('http')) {
        return explicitSocketUrl;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) return window.location.origin;

    // Relative API path means we should always use same-origin socket endpoint.
    if (apiUrl.startsWith('/')) {
        return window.location.origin;
    }

    if (apiUrl.startsWith('http')) {
        try {
            const parsed = new URL(apiUrl);
            const currentHost = window.location.hostname;
            const apiHost = parsed.hostname;

            // Keep same-host absolute API URLs.
            if (apiHost === currentHost) {
                return parsed.origin;
            }

            // If API points to localhost while app is opened via LAN IP, use same-origin.
            const apiIsLocalhost = apiHost === 'localhost' || apiHost === '127.0.0.1';
            const appIsLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
            if (apiIsLocalhost && !appIsLocalhost) {
                return window.location.origin;
            }

            return parsed.origin;
        } catch {
            return window.location.origin;
        }
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
