"use client";

import dynamic from "next/dynamic";
import type { BeforeMount } from "@monaco-editor/react";
import { useEffect } from "react";
import { useIdeStore } from "@/store/useIdeStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] items-center justify-center bg-zinc-900 text-xs text-zinc-500">
      Loading editor…
    </div>
  ),
});

/**
 * TSX in Monaco must use the `typescriptreact` worker + JSX compiler options.
 * Without this, `<div>` etc. are parsed as invalid TypeScript (red squiggles).
 *
 * We disable semantic validation for this buffer: there is no real node_modules
 * in the browser, so type-checking would always false-positive. Syntax
 * validation still catches many issues.
 */
const handleEditorWillMount: BeforeMount = (monaco) => {
  const ts = monaco.languages.typescript;
  // Monaco ≥0.52 only exposes `typescriptDefaults` (no `typescriptReactDefaults`).
  // TSX still uses this object; set `jsx` so `<div>` parses as JSX.
  ts.typescriptDefaults.setCompilerOptions({
    jsx: ts.JsxEmit.React,
    allowJs: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    isolatedModules: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    target: ts.ScriptTarget.ESNext,
    skipLibCheck: true,
    strict: false,
  });

  ts.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });
};

const MANUAL_PREVIEW_DEBOUNCE_MS = 1000;

export default function Editor() {
  const code = useIdeStore((s) => s.code);
  const setCode = useIdeStore((s) => s.setCode);
  const setPreviewCode = useIdeStore((s) => s.setPreviewCode);
  const isGenerating = useIdeStore((s) => s.isGenerating);

  useEffect(() => {
    if (isGenerating) return;
    const id = window.setTimeout(() => {
      setPreviewCode(code);
    }, MANUAL_PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [code, isGenerating, setPreviewCode]);

  return (
    <div className="h-full min-h-0 w-full bg-zinc-900">
      <MonacoEditor
        height="100%"
        className="min-h-[200px]"
        theme="vs-dark"
        path="App.tsx"
        defaultLanguage="typescriptreact"
        value={code}
        beforeMount={handleEditorWillMount}
        onChange={(value) => setCode(value ?? "")}
        options={{
          readOnly: isGenerating,
          minimap: { enabled: false },
          fontSize: 13,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          padding: { top: 8, bottom: 8 },
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}
