import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants";

/**
 * Get the current user from the session, or redirect to /login.
 *
 * Use in Server Components, Server Actions, and Route Handlers when you need
 * the user. The cookie is already set by middleware; this just reads it.
 *
 *   const user = await requireUser();
 *   await db.insert(quests).values({ userId: user.id, ... });
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);
  return user;
}

/**
 * Soft variant — returns null instead of redirecting.
 * Use when you want to render different UI for signed-in vs signed-out
 * (rare in our app since middleware already gates).
 */
export async function getUserOrNull() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
