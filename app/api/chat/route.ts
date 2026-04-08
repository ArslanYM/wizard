import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const maxDuration = 60;

/**
 * Maximal constraint: the client parser ONLY reads ```tsx … ```. Any other
 * characters break the live editor. Hammer this in for small / free models.
 */
const SYSTEM_PROMPT = `CRITICAL OUTPUT CONTRACT — READ FIRST:

Your entire reply MUST be EXACTLY one markdown code fence and NOTHING else.

FORBIDDEN (will break the app):
- Any greeting, explanation, apology, bullet list, or sentence outside the fence
- "Here is", "Sure", "Below", "Note:", markdown headings, or "---" outside the fence
- A second code fence or any text after the closing fence

REQUIRED SHAPE (copy this structure; replace only the code inside):

\`\`\`tsx
export default function App() {
  return (
    <div className="...tailwind...">
      ...
    </div>
  );
}
\`\`\`

Inside the fence ONLY:
- One default-exported React function component, TypeScript + TSX
- Tailwind CSS classes for all styling; no CSS files
- Self-contained: no imports from app paths; import from "react" only if hooks are needed
- Valid TSX for a react-ts sandbox

Start your response with the three backticks and "tsx" immediately. End with three backticks on their own. No characters before the opening backticks. No characters after the closing backticks.`;

/** Default: OpenRouter free tier coder (override with OPENROUTER_MODEL). */
const DEFAULT_OPENROUTER_MODEL = "qwen/qwen-2.5-coder-32b-instruct:free";

function resolveModelId(): string {
  const fromEnv = process.env.OPENROUTER_MODEL?.trim();
  return fromEnv || DEFAULT_OPENROUTER_MODEL;
}

function createOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Wizard",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: UIMessage[] };
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const openrouter = createOpenRouterClient();
    const modelMessages = await convertToModelMessages(messages);

    const modelId = resolveModelId();

    const result = streamText({
      model: openrouter(modelId),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to start chat stream";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
