import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import useSocketEvent from "../hooks/useSocketEvent";
import Spinner from "./ui/Spinner";
import { timeAgo } from "../lib/format";

// Message list + composer. Used by the user's support page and the admin inbox.
// `conversationId` is the user whose thread this is; `toUserId` is set when an admin replies.
export default function ChatThread({ messages, loading, conversationId, toUserId, meId, typingLabel, onMessage }) {
  const { socket, connected } = useSocket();
  const toast = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottom = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, typing]);
  useEffect(() => () => clearTimeout(typingTimer.current), []);

  useSocketEvent("chat:typing", (e) => {
    if (toUserId ? e.userId !== String(conversationId) : false) return;
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 2500);
  });
  useSocketEvent("chat:message", (m) => {
    if (String(m.conversation) === String(conversationId)) {
      setTyping(false);
      onMessage(m);
    }
  });

  const onChange = (e) => {
    setText(e.target.value);
    if (socket && Date.now() - lastTypingSent.current > 1500) {
      lastTypingSent.current = Date.now();
      socket.emit("chat:typing", { toUserId });
    }
  };

  const send = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || !socket) return;
    setSending(true);
    socket.timeout(8000).emit("chat:send", { text: clean, toUserId }, (err, res) => {
      setSending(false);
      if (err || !res?.ok) return toast.error("Message not sent", res?.error || "Connection problem, try again.");
      setText("");
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
        {loading && <div className="flex justify-center py-10"><Spinner className="h-6 w-6 text-brand-600" /></div>}
        {!loading && messages.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No messages yet. Say hello 👋</p>}
        {messages.map((m) => {
          const mine = String(m.sender?._id) === String(meId);
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${mine
                ? "rounded-br-md bg-brand-600 text-white"
                : "rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}>
                {!mine && <p className="mb-0.5 text-xs font-semibold opacity-70">{m.fromAdmin ? "Support" : m.sender?.name}</p>}
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-brand-100" : "text-slate-400"}`}>{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        {typing && <p className="animate-pulse text-xs text-slate-500">{typingLabel} is typing…</p>}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
        <input value={text} onChange={onChange} maxLength={1000} placeholder={connected ? "Type a message…" : "Connecting…"} disabled={!connected}
          className="field flex-1" aria-label="Message" />
        <button type="submit" disabled={!text.trim() || sending || !connected} aria-label="Send"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50">
          {sending ? <Spinner className="h-4 w-4" /> : <SendHorizontal className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
