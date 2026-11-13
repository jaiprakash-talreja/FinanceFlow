import { useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import useDisclosure from "../../hooks/useDisclosure";
import useSocketEvent from "../../hooks/useSocketEvent";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Select } from "../../components/ui/Field";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Spinner from "../../components/ui/Spinner";
import { Badge, EmptyState, ErrorState, PageHeader, Pagination } from "../../components/ui/misc";
import { api } from "../../lib/api";
import { shortDate } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const users = useFetch("/admin/users", { search: debounced, role, page });
  const remover = useDisclosure();
  const [busyId, setBusyId] = useState(null);

  useEffect(() => setPage(1), [debounced, role]);

  // Live online/offline dots
  useSocketEvent("presence:update", (ids) => {
    const online = new Set(ids);
    users.setData((d) => (d ? { ...d, items: d.items.map((u) => ({ ...u, online: online.has(u._id) })) } : d));
  });

  const update = async (u, body, msg) => {
    setBusyId(u._id);
    try {
      const updated = await api(`/admin/users/${u._id}`, { method: "PATCH", body });
      users.setData((d) => ({ ...d, items: d.items.map((x) => (x._id === u._id ? { ...x, ...updated } : x)) }));
      toast.success(msg);
    } catch (err) {
      toast.error("Update failed", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    await api(`/admin/users/${remover.data._id}`, { method: "DELETE" });
    toast.success("User deleted", `${remover.data.email} and all their data were removed.`);
    users.refetch();
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Manage roles and access for everyone on the platform." />
      <Card bodyClass="p-0">
        <div className="flex flex-col gap-3 border-b border-line/70 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" aria-label="Search users" className="field pl-9" />
          </div>
          <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role" className="sm:w-40">
            <option value="">All roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </Select>
        </div>

        {users.loading && !users.data ? <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
          : users.error ? <ErrorState error={users.error} onRetry={users.refetch} />
          : users.data.items.length === 0 ? <EmptyState title="No users match" />
          : (
            <>
              <ul className="divide-y divide-line/70">
                {users.data.items.map((u) => {
                  const self = u._id === me._id;
                  return (
                    <li key={u._id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-200/70 font-serif-display text-lg text-ink dark:bg-slate-800">{u.name[0]?.toUpperCase()}</div>
                          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${u.online ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"}`} title={u.online ? "Online" : "Offline"} />
                        </div>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-medium">
                            {u.name}{self && <span className="text-xs text-slate-400">(you)</span>}
                            <Badge color={u.role === "admin" ? "violet" : "slate"}>{u.role}</Badge>
                            {!u.isActive && <Badge color="red">deactivated</Badge>}
                          </p>
                          <p className="truncate text-sm text-muted">{u.email} · joined {shortDate(u.createdAt)}</p>
                        </div>
                      </div>
                      {!self && (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" disabled={busyId === u._id}
                            onClick={() => update(u, { role: u.role === "admin" ? "user" : "admin" }, u.role === "admin" ? "Admin rights removed" : "Promoted to admin")}>
                            {u.role === "admin" ? "Make user" : "Make admin"}
                          </Button>
                          <Button size="sm" variant="secondary" disabled={busyId === u._id}
                            onClick={() => update(u, { isActive: !u.isActive }, u.isActive ? "User deactivated" : "User reactivated")}>
                            {u.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remover.open(u)} className="hover:!text-brand-600">Delete</Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-line/70 p-4">
                <Pagination page={users.data.page} pages={users.data.pages} onChange={setPage} />
                {users.data.pages <= 1 && <p className="text-sm text-muted">{users.data.total} user(s)</p>}
              </div>
            </>
          )}
      </Card>
      <ConfirmDialog open={remover.isOpen} onClose={remover.close} onConfirm={remove} title="Delete user?"
        message={`This permanently deletes ${remover.data?.email} and all of their transactions, budgets and messages. This cannot be undone.`} />
    </>
  );
}
