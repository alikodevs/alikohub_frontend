import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Get or create the singleton Socket.IO connection for academy chat.
 * Connects to the `/academy-chat` namespace using the JWT from localStorage.
 */
export function getChatSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem("accessToken");

  socket = io(`${import.meta.env.VITE_API_URL || "https://api.consultancy.alikohub.com"}/academy-chat`, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {});

  socket.on("disconnect", () => {});

  socket.on("connect_error", (err) => {
    console.error("[ChatSocket] connection error:", err.message);
  });

  return socket;
}

/** Cleanly disconnect the socket (e.g. on logout). */
export function disconnectChatSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
