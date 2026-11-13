import { useCallback, useState } from "react";
import { ArrowLeft, MessagesSquare } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import useSocketEvent from "../../hooks/useSocketEvent";
import ChatThread from "../../components/ChatThread";
import Spinner from "../../components/ui/Spinner";
import { EmptyState, PageHeader } from "../../components/ui/misc";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "../../lib/format";

export default function AdminSupport() {
  const { user } = useAuth();
  const convs = useFetch("/chat/conversations");
  const [active, setActive] = useState(null);
  const [unread, setUnread] = useState({});
  const thread = useFetch(active ? "/chat/messages" : null, { userId: active?._id }, { enabled: Boolean(active) });
  const { setData: setThread } = thread;

  // New messages from any user bump that conversation to the top
  useSocketEvent("chat:message", (m) => {
    const exists = convs.data?.some((c) => c._id === m.conversation);
    if (!exists) return convs.refetch();
    convs.setData((list) => {
      const updated = list.map((c) => (c._id === m.conversation ? { ...c, lastMessage: m.text, lastAt: m.createdAt, fromAdmin: m.fromAdmin } : c));
      return updated.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    });
    if (m.conversation !== active?._id && !m.fromAdmin) setUnread((u) => ({ ...u, [m.conversation]: (u[m.conversation] || 0) + 1 }));
  });

  const append = useCallback((m) => setThread((list) => (list?.some((x) => x._id === m._id) ? list : [...(list || []), m])), [setThread]);

  const open = (c) => {
    setActive({ _id: c._id, name: c.user.name, email: c.user.email });
    setUnread((u) => ({ ...u, [c._id]: 0 }));
  };

  return (
    <>
      <PageHeader title="Support inbox" subtitle="Reply to users in real time." />
      <div className="grid h-[calc(100vh-15rem)] min-h-[460px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[300px_1fr]">
        <aside className={`min-h-0 overflow-y-auto border-slate-100 dark:border-slate-800 md:block md:border-r ${active ? "hidden" : "block"}`}>
          {convs.loading ? <div className="flex justify-center py-10"><Spinner className="h-6 w-6 text-brand-600" /></div>
            : !convs.data?.length ? <EmptyState icon={MessagesSquare} title="No conversations yet" message="Messages from users will appear here live." />
            : (
              <ul>
                {convs.data.map((c) => (
                  <li key={c._id}>
                    <button onClick={() => open(c)} className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 ${active?._id === c._id ? "bg-brand-50/70 dark:bg-brand-500/10" : ""}`}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-semibold dark:bg-slate-700">{c.user.name[0]}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{c.user.name}</span>
                          <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(c.lastAt)}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="truncate text-xs text-slate-500">{c.fromAdmin ? "You: " : ""}{c.lastMessage}</span>
                          {unread[c._id] > 0 && <span className="ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{unread[c._id]}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </aside>

        <section className={`min-h-0 flex-col ${active ? "flex" : "hidden md:flex"}`}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <button onClick={() => setActive(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
                <div>
                  <p className="text-sm font-semibold">{active.name}</p>
                  <p className="text-xs text-slate-500">{active.email}</p>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <ChatThread key={active._id} messages={thread.data || []} loading={thread.loading} conversationId={active._id} toUserId={active._id}
                  meId={user._id} typingLabel={active.name} onMessage={append} />
              </div>
            </>
          ) : (
            <EmptyState icon={MessagesSquare} title="Select a conversation" message="Pick a user on the left to read and reply." />
          )}
        </section>
      </div>
    </>
  );
}
