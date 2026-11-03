import { Socket } from "socket.io-client";

export interface SocketStore {
    socket: Socket | null;
    connected: boolean;
    getLatency: () => number;
    initializeSocket: () => void;
    disconnectSocket: () => void;
    forceLatencyUpdate: () => void;
    latency?: number;
}
