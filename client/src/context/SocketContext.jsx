import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../lib/api";
import { useAuth } from "./AuthContext";

const SocketContext = createContext({ socket: null, connected: false });

// Opens one authenticated Socket.IO connection while the user is logged in.
export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) return undefined;
    const s = io(API_URL, { auth: { token }, transports: ["websocket", "polling"], reconnectionAttempts: 10 });
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onDisconnect);
    setSocket(s);

    // Cleanup: close the connection on logout / token change.
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onDisconnect);
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
