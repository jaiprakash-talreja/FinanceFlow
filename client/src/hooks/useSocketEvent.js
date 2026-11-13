import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

// Subscribes to a Socket.IO event and unsubscribes on unmount.
// The latest handler is kept in a ref so callers don't need useCallback.
export default function useSocketEvent(event, handler) {
  const { socket } = useSocket();
  const saved = useRef(handler);
  saved.current = handler;

  useEffect(() => {
    if (!socket) return undefined;
    const listener = (...args) => saved.current(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event]);
}
