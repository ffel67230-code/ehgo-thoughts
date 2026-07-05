import { createServerFn } from "@tanstack/react-start";

const ADMIN_PASSWORD = "Gabs11_12";

export const adminListComments = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) {
      return { ok: false as const };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { ok: true as const, comments: rows ?? [] };
  });

export const adminDeleteComment = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string; id: string }) => data)
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) {
      return { ok: false as const };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("comments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
