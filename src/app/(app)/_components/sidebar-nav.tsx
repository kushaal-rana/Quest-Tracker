"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/lib/constants";

/**
 * Sidebar navigation — client component so it can read pathname for active
 * state and give immediate :active feedback on click.
 *
 * Imports NAV_SECTIONS directly (it's a constant) so no icons cross the
 * server→client boundary as props.
 */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-5 last:mb-0">
          <div className="px-2 pt-2 pb-2 text-[14px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {section.label}
          </div>
          {section.items.map(({ href, label, Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-md px-2 py-2 text-[18px] font-medium leading-6 transition-colors active:bg-foreground/[0.1]",
                  isActive
                    ? "bg-foreground/[0.07] text-foreground"
                    : "text-foreground/85 hover:bg-foreground/[0.07] hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-[22px] w-[22px] shrink-0 transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}
