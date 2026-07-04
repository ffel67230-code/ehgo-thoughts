import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, ImagePlus, Send, X, Palette, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "EHGO.qzz.io" }],
  }),
  component: Index,
});

type Comment = {
  id: string;
  username: string;
  content: string;
  color: string;
  image_url: string | null;
  created_at: string;
};

const COLORS = [
  "#2563eb", // azul
  "#dc2626", // vermelho
  "#eab308", // amarelo
  "#ec4899", // rosa
  "#f97316", // laranja
  "#9333ea", // roxo
];

const MAX_IMG_BYTES = 600_000; // ~600 KB inline

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function Index() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [username, setUsername] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [imageData, setImageData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setComments(data as Comment[]);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("comments-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          setComments((prev) => [payload.new as Comment, ...prev]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  function handleFile(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Arquivo precisa ser uma imagem.");
      return;
    }
    if (f.size > MAX_IMG_BYTES) {
      setError("Imagem muito grande (máx 600KB).");
      return;
    }
    const r = new FileReader();
    r.onload = () => setImageData(r.result as string);
    r.readAsDataURL(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const u = username.trim();
    const c = content.trim();
    if (!u || !c) {
      setError("Preencha usuário e comentário.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.from("comments").insert({
      username: u.slice(0, 40),
      content: c.slice(0, 300),
      color,
      image_url: imageData,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setContent("");
    setImageData(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-12">
        {/* Header */}
        <header className="mb-10 flex items-baseline gap-2">
          <h1 className="text-5xl font-bold tracking-tight">EHGO</h1>
          <span className="text-lg font-medium text-muted-foreground">.qzz.io</span>
        </header>

        {/* Form */}
        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-elevated)]"
        >
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-[var(--shadow-inset)]">
            <UserIcon className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={40}
              placeholder="seu nome"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div
            className="rounded-xl border border-border p-3 shadow-[var(--shadow-inset)]"
            style={{ backgroundColor: color, color: "#fafafa" }}
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 300))}
              placeholder="escreva algo... (até 300 caracteres)"
              rows={3}
              className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/50"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-white/60">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                <span>comentário</span>
              </div>
              <span>{content.length}/300</span>
            </div>
          </div>

          {/* Color picker */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Palette className="h-4 w-4" strokeWidth={2} />
              cor
            </div>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Cor ${c}`}
                  className={`h-7 w-7 rounded-lg border transition ${
                    color === c
                      ? "border-foreground scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: c,
                    boxShadow: "var(--shadow-soft)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Image + submit */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="hidden"
                id="img"
              />
              <label
                htmlFor="img"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground shadow-[var(--shadow-soft)] transition hover:bg-accent"
              >
                <ImagePlus className="h-4 w-4" strokeWidth={2} />
                imagem
              </label>
              {imageData && (
                <div className="relative">
                  <img
                    src={imageData}
                    alt="preview"
                    className="h-10 w-10 rounded-lg border border-border object-cover shadow-[var(--shadow-soft)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageData(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="absolute -right-1.5 -top-1.5 rounded-full border border-border bg-card p-0.5 shadow-[var(--shadow-soft)]"
                    aria-label="Remover imagem"
                  >
                    <X className="h-3 w-3" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-elevated)] transition hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
              enviar
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </form>

        {/* Feed */}
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Comentários recentes
          </h2>
          <ul className="flex flex-col gap-3">
            {comments.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhum comentário ainda. Seja o primeiro.
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
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          EHGO.qzz.io
        </footer>
      </div>
    </main>
  );
}
