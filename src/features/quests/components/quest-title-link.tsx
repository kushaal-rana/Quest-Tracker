"use client";

import { useCallback, useRef, useState } from "react";
import { ExternalLink, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { setQuestLinkAction } from "../actions";

/**
 * QuestTitleLink — wraps the quest title on the detail page.
 *
 * UX (Google Docs / Notion style):
 * 1. Title renders normally. A faint paste hint appears on hover.
 * 2. User pastes (⌘V) while the title area is focused/hovered.
 * 3. If clipboard contains a URL → attach it as a link (don't replace text).
 * 4. A link pill (🔗 domain.com ×) appears below the title.
 * 5. Click the external-link icon → opens URL in new tab.
 * 6. Click × → removes the link.
 */

type Props = {
  questId: string;
  questName: string;
  questColor: string;
  linkUrl: string | null;
};

/** Crude URL check — matches http(s):// at the start of a trimmed string. */
function isUrl(text: string): boolean {
  const trimmed = text.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function QuestTitleLink({ questId, questName, questColor, linkUrl }: Props) {
  const [currentLink, setCurrentLink] = useState(linkUrl);
  const titleRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text/plain");
      if (!isUrl(text)) return; // Not a URL — let the browser handle it normally

      // Prevent the URL from being typed into any editable field
      e.preventDefault();

      const url = text.trim();
      setCurrentLink(url);
      toast.success("Link attached to quest");

      // Fire-and-forget: save in background, revert on failure
      setQuestLinkAction(questId, url).then((result) => {
        if (!result.ok) {
          toast.error(result.message ?? "Failed to save link");
          setCurrentLink(linkUrl); // revert
        }
      });
    },
    [questId, linkUrl],
  );

  const handleRemoveLink = useCallback(() => {
    setCurrentLink(null);
    toast.success("Link removed");

    // Fire-and-forget: save in background, revert on failure
    setQuestLinkAction(questId, "").then((result) => {
      if (!result.ok) {
        toast.error(result.message ?? "Failed to remove link");
        setCurrentLink(linkUrl); // revert
      }
    });
  }, [questId, linkUrl]);

  return (
    <div
      ref={titleRef}
      onPaste={handlePaste}
      onMouseEnter={() => setShowHint(true)}
      onMouseLeave={() => setShowHint(false)}
      /* Make focusable so paste events fire, but not tabbable (not a form element) */
      tabIndex={-1}
      className="group/title relative outline-none"
    >
      {/* Title row */}
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ backgroundColor: questColor }}
          aria-hidden="true"
        />
        <h1 className="truncate text-4xl font-semibold tracking-tight md:text-[40px]">
          {questName}
        </h1>
        {currentLink && (
          <a
            href={currentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 shrink-0 text-muted-foreground transition-colors hover:text-primary"
            title={`Open ${extractDomain(currentLink)}`}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-5 w-5" strokeWidth={1.8} />
          </a>
        )}
      </div>

      {/* Link pill — shown when a URL is attached */}
      {currentLink && (
        <div className="mt-2 flex items-center gap-1.5">
          <a
            href={currentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >
            <Link2 className="h-3 w-3" strokeWidth={2} />
            {extractDomain(currentLink)}
          </a>
          <button
            type="button"
            onClick={handleRemoveLink}

            className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            title="Remove link"
          >
            <X className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Paste hint — subtle tooltip on hover, only when no link is attached */}
      {!currentLink && showHint && (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground/60">
          <Link2 className="h-3 w-3" strokeWidth={2} />
          Paste a URL to link this quest
        </div>
      )}
    </div>
  );
}
