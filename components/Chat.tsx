"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { Loader2, MessageSquare, Send, Square } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useIdeStore } from "@/store/useIdeStore";

/** Idle time after the last streamed token before Sandpack sees an update. */
const PREVIEW_DEBOUNCE_MS = 1000;

/**
 * First opening fence for TSX only. Allows optional whitespace after backticks.
 * Captures nothing — we only need the match index and total length.
 * Examples matched: ```tsx\n  ```TSX\r\n  ``` tsx \n
 */
const TSX_FENCE_OPEN = /```\s*(?:tsx|typescript)\s*(?:\r?\n|$)/i;

/**
 * Find start index of the first closing ``` that is NOT opening another fence (```tsx).
 * Supports: newline before fence, or fence flush at end of buffer (same line as code).
 */
function findClosingFenceStart(s: string): number {
  const afterNewline = s.search(/\r?\n```(?![A-Za-z])/);
  const atEndOfBuffer = s.search(/```(?![A-Za-z])\s*$/);
  const candidates = [afterNewline, atEndOfBuffer].filter((i) => i !== -1);
  if (candidates.length === 0) return -1;
  return Math.min(...candidates);
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((p) => p.text)
    .join("");
}

/**
 * Strictly isolates the first ```tsx|typescript … ``` region.
 * - Ignores all conversational text before the opening fence (sync engine never sees it).
 * - If the closing ``` has not arrived yet, returns everything after the opening fence (streaming).
 * - Strips any trailing prose after the first well-formed closing fence.
 */
export function extractTsxBlock(raw: string): string | null {
  const openMatch = TSX_FENCE_OPEN.exec(raw);
  if (!openMatch) return null;

  const innerStart = openMatch.index + openMatch[0].length;
  const afterOpen = raw.slice(innerStart);

  const closeStart = findClosingFenceStart(afterOpen);
  if (closeStart !== -1) {
    return afterOpen.slice(0, closeStart);
  }

  return afterOpen;
}

function clearDebounceTimer(
  ref: MutableRefObject<ReturnType<typeof setTimeout> | null>,
) {
  if (ref.current) {
    clearTimeout(ref.current);
    ref.current = null;
  }
}

/**
 * Chat UI + sync engine:
 * - `extractTsxBlock` only ever surfaces fenced TSX; chit-chat before/after is dropped.
 * - `code` updates on every change to the extracted region; `previewCode` is debounced.
 */
export default function Chat() {
  const setCode = useIdeStore((s) => s.setCode);
  const setPreviewCode = useIdeStore((s) => s.setPreviewCode);
  const setIsGenerating = useIdeStore((s) => s.setIsGenerating);

  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatusRef = useRef<string | null>(null);

  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: () => {
      clearDebounceTimer(previewDebounceRef);
      setPreviewCode(useIdeStore.getState().code);
    },
  });

  useEffect(() => {
    setIsGenerating(status === "submitted" || status === "streaming");
  }, [status, setIsGenerating]);

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const assistantRaw = lastAssistant ? getMessageText(lastAssistant) : "";

  /** Re-parse on every assistant token update — extraction is pure + cheap. */
  const extracted = extractTsxBlock(assistantRaw);

  useEffect(() => {
    if (extracted === null) return;

    setCode(extracted);

    clearDebounceTimer(previewDebounceRef);
    previewDebounceRef.current = setTimeout(() => {
      setPreviewCode(extracted);
      previewDebounceRef.current = null;
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      clearDebounceTimer(previewDebounceRef);
    };
  }, [extracted, setCode, setPreviewCode]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (prev === "streaming" && status === "ready") {
      clearDebounceTimer(previewDebounceRef);
      setPreviewCode(useIdeStore.getState().code);
    }
  }, [status, setPreviewCode]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-950">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-zinc-800/80 px-3 py-2">
          <MessageSquare className="size-3.5 text-zinc-500" aria-hidden />
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Assistant
          </span>
          {busy && (
            <Loader2
              className="size-3.5 animate-spin text-amber-400/90"
              aria-label="Generating"
            />
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {messages.length === 0 && (
            <p className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2.5 text-xs leading-relaxed text-zinc-500">
              Describe a UI in plain English. The model streams TSX into the
              editor; the preview waits {PREVIEW_DEBOUNCE_MS / 1000}s after the
              last token (or updates immediately when generation finishes) so
              Sandpack is not fed invalid partial JSX.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-5 border border-zinc-800 bg-zinc-800/80 text-zinc-100"
                  : "mr-5 border border-zinc-800/80 bg-zinc-900/40 text-zinc-300"
              }`}
            >
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {m.role}
              </span>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-sans text-[13px] text-zinc-300">
                {getMessageText(m)}
              </pre>
            </div>
          ))}
          {error && (
            <p className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {error.message}
            </p>
          )}
        </div>
      </div>

      <form
        className="shrink-0 border-t border-zinc-800 bg-zinc-950 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const t = input.trim();
          if (!t || busy) return;
          void sendMessage({ text: t });
          setInput("");
        }}
      >
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. A centered hero with headline, subtext, and primary CTA…"
            rows={2}
            disabled={busy}
            className="min-h-[48px] flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
          />
          <div className="flex flex-col gap-1.5">
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-3.5" aria-hidden />
              Send
            </button>
            {busy && (
              <button
                type="button"
                onClick={() => void stop()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-600 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                <Square className="size-3.5" aria-hidden />
                Stop
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
