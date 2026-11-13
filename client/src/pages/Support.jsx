import { useCallback } from "react";
import { Headset } from "lucide-react";
import useFetch from "../hooks/useFetch";
import ChatThread from "../components/ChatThread";
import { PageHeader } from "../components/ui/misc";
import { useAuth } from "../context/AuthContext";

export default function Support() {
  const { user } = useAuth();
  const thread = useFetch("/chat/messages");
  const { setData } = thread;

  const append = useCallback((m) => setData((list) => (list?.some((x) => x._id === m._id) ? list : [...(list || []), m])), [setData]);

  return (
    <>
      <PageHeader title="Support chat" subtitle="Questions about the app? Chat live with our team." />
      <div className="flex h-[calc(100dvh-16.5rem)] min-h-[420px] flex-col overflow-hidden surface">
        <div className="flex items-center gap-3 border-b border-line/70 px-5 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10"><Headset className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-medium">FinanceFlow Support</p>
            <p className="text-xs text-muted">Usually replies within a few minutes</p>
          </div>
        </div>
        <ChatThread messages={thread.data || []} loading={thread.loading} conversationId={user._id} meId={user._id} typingLabel="Support" onMessage={append} />
      </div>
    </>
  );
}
