"use client";

import { Code2, LayoutPanelLeft, Sparkles } from "lucide-react";
import Chat from "@/components/Chat";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import { useIdeStore } from "@/store/useIdeStore";

export default function Home() {
  const isGenerating = useIdeStore((s) => s.isGenerating);
  const code = useIdeStore((s) => s.code);
  const previewCode = useIdeStore((s) => s.previewCode);

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-amber-400/90">
            <Sparkles className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-zinc-100">
              Wizard
            </h1>
            <p className="truncate text-[11px] text-zinc-500">
              Stream TSX · debounced Sandpack · OpenRouter
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1 font-mono text-zinc-400">
            <Code2 className="size-3.5 shrink-0 text-zinc-600" aria-hidden />
            draft {code.length}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1 font-mono text-zinc-400">
            <LayoutPanelLeft
              className="size-3.5 shrink-0 text-zinc-600"
              aria-hidden
            />
            preview {previewCode.length}
          </span>
          <span
            className={
              isGenerating
                ? "font-medium text-amber-400/90"
                : "text-zinc-500"
            }
          >
            {isGenerating ? "Generating…" : "Ready"}
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left: editor (top) + chat (bottom) */}
        <div className="flex min-h-0 min-w-0 flex-col border-b border-zinc-800 lg:border-b-0 lg:border-r lg:border-zinc-800">
          <section className="flex min-h-0 flex-[3] flex-col border-b border-zinc-800">
            <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800/80 bg-zinc-900/40 px-3 py-2">
              <Code2 className="size-3.5 text-zinc-500" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Editor
              </span>
            </div>
            <div className="min-h-0 flex-1">
              <Editor />
            </div>
          </section>

          <section className="flex min-h-0 flex-[2] flex-col">
            <Chat />
          </section>
        </div>

        {/* Right: live preview */}
        <div className="flex min-h-0 min-w-0 flex-col bg-zinc-950">
          <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800/80 bg-zinc-900/40 px-3 py-2">
            <LayoutPanelLeft className="size-3.5 text-zinc-500" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Live preview
            </span>
          </div>
          <div className="min-h-0 flex-1 p-2">
            <Preview />
          </div>
        </div>
      </div>
    </div>
  );
}
