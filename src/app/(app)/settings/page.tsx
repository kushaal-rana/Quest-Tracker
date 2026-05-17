import { LogOut, Mail, User } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/features/profiles/queries";
import { PreferencesForm } from "@/features/profiles/components/preferences-form";
import { SignOutButton } from "../sign-out-button";

export const metadata = { title: "Settings · Quest Tracker" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  const googleDisplayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    "Quest Tracker User";

  const displayName = profile?.displayNameOverride || googleDisplayName;
  const initial = (displayName.trim()[0] || "?").toUpperCase();
  const email = user.email ?? "";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-4xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Account details and preferences.
      </p>

      {/* Account card */}
      <div className="mt-8 rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </h2>
        </div>
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xl font-bold text-white shadow-sm">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2 text-[15px] font-medium text-foreground">
                <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                {displayName}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[14px] text-muted-foreground">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                {email}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">Sign-in method</div>
              <div className="text-[12px] text-muted-foreground">Google OAuth</div>
            </div>
            <div className="rounded-md border border-border bg-background px-2.5 py-1 text-[12px] font-medium text-foreground">
              Connected
            </div>
          </div>
        </div>
      </div>

      {/* Preferences card */}
      <div className="mt-5 rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Preferences
          </h2>
        </div>
        <PreferencesForm
          savedTimezone={profile?.timezone ?? null}
          savedDisplayName={profile?.displayNameOverride ?? null}
          googleDisplayName={googleDisplayName}
        />
      </div>

      {/* Session card */}
      <div className="mt-5 rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Session
          </h2>
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <div className="text-[14px] font-medium text-foreground">Sign out</div>
            <div className="text-[12px] text-muted-foreground">
              You&apos;ll be returned to the login page.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LogOut className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
