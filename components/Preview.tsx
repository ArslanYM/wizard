"use client";

import {
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { useIdeStore } from "@/store/useIdeStore";

/**
 * Sandpack preview driven by stable `previewCode`.
 *
 * Tailwind: `externalResources` injects the official CDN into the preview
 * document (equivalent to
 * `<script src="https://cdn.tailwindcss.com"></script>` in the iframe).
 */
export default function Preview() {
  const previewCode = useIdeStore((s) => s.previewCode);

  return (
    <div className="relative h-full min-h-[200px] w-full bg-zinc-950">
      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={{
          "/App.tsx": previewCode,
        }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          activeFile: "/App.tsx",
          autoReload: true,
          recompileMode: "delayed",
          recompileDelay: 300,
        }}
      >
        <SandpackPreview
          className="h-full min-h-[200px]"
          showNavigator={false}
          showOpenInCodeSandbox={false}
          showRefreshButton
        />
      </SandpackProvider>
    </div>
  );
}
