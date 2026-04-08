import { create } from "zustand";

/** Initial sandbox component — default export, Tailwind-friendly. */
export const defaultCode = `export default function App() {
  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-950 p-8 text-zinc-100">
      <p className="text-lg font-medium tracking-tight">Hello World</p>
    </div>
  );
}
`;

type IdeState = {
  /** Live buffer: streams from the assistant + user edits in Monaco. */
  code: string;
  /** Debounced / stable snapshot fed to Sandpack (avoids broken partial JSX). */
  previewCode: string;
  /** True while a chat request is in flight (submit → stream → ready). */
  isGenerating: boolean;

  setCode: (code: string) => void;
  setPreviewCode: (previewCode: string) => void;
  setIsGenerating: (value: boolean) => void;
};

export const useIdeStore = create<IdeState>((set) => ({
  code: defaultCode,
  previewCode: defaultCode,
  isGenerating: false,

  setCode: (code) => set({ code }),

  setPreviewCode: (previewCode) => set({ previewCode }),

  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));
