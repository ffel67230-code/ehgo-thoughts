import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Lock, LogOut } from "lucide-react";
import { adminListComments, adminDeleteComment } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — EHGO.qzz.io" }] }),
  component: Admin,
});

type Comment = {
  id: string;
  username: string;
  content: string;
  color: string;
  image_url: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await adminListComments({ data: { password } });
      if (!res.ok) {
        setError("Senha incorreta.");
      } else {
        setAuthed(true);
        setComments(res.comments as Comment[]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    const res = await adminListComments({ data: { password } });
    if (res.ok) setComments(res.comments as Comment[]);
  }

  async function del(id: string) {
    if (!confirm("Apagar este comentário?")) return;
    const res = await adminDeleteComment({ data: { password, id } });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  function logout() {
    setAuthed(false);
    setPassword("");
    setComments([]);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <header className="mb-10 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h1 className="text-5xl font-bold tracking-tight">Admin</h1>
            <span className="text-lg font-medium text-muted-foreground">.EHGO</span>
          </div>
          {authed && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium shadow-[var(--shadow-soft)] transition hover:bg-accent"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              sair
            </button>
          )}
        </header>

        {!authed ? (
          <form
            onSubmit={login}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-[var(--shadow-inset)]">
              <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="senha"
                autoFocus
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !password}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elevated)] transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "verificando..." : "entrar"}
            </button>
            {error && (
              <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
          </form>
        ) : (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {comments.length} comentários
              </h2>
              <button
                onClick={refresh}
                className="rounded-lg border border-border bg-secondary px-3 py-1 text-xs shadow-[var(--shadow-soft)] transition hover:bg-accent"
              >
                atualizar
              </button>
            </div>
            <ul className="flex flex-col gap-3">
              {comments.length === 0 && (
                <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhum comentário.
                </li>
              )}
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="flex items-stretch gap-3 rounded-2xl border border-border p-4 shadow-[var(--shadow-soft)]"
                  style={{ backgroundColor: c.color, color: "#fafafa" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-white/70">
                      <span className="font-medium text-white/90">@{c.username}</span>
                      <span>{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                  {c.image_url && (
                    <img
                      src={c.image_url}
                      alt={`imagem de ${c.username}`}
                      className="h-16 w-16 shrink-0 self-start rounded-xl border border-white/15 object-cover shadow-[var(--shadow-soft)]"
                    />
                  )}
                  <button
                    onClick={() => del(c.id)}
                    aria-label="Apagar"
                    className="self-start rounded-xl border border-white/20 bg-black/30 p-2 shadow-[var(--shadow-soft)] transition hover:bg-black/50"
                  >
                    <Trash2 className="h-4 w-4 text-white" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
