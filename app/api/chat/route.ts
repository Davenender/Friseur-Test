import Anthropic from "@anthropic-ai/sdk";
import { LIA_SYSTEM_PROMPT } from "@/lib/chatbot-knowledge";

export const runtime = "nodejs";

const MAX_MESSAGES = 20; // Rate-Limit pro Session
const MAX_MESSAGE_LENGTH = 1000;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  let payload: { messages: ChatMessage[] };
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Ungültige Anfrage" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = payload?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Keine Nachrichten" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (messages.length > MAX_MESSAGES) {
    return new Response(
      JSON.stringify({
        error:
          "Diese Unterhaltung ist sehr lang geworden. Bitte lade die Seite neu oder ruf uns an: 06108 / 79 98 65.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  // Sanitize: nur role+content, gekürzte Strings
  const safeMessages = messages
    .filter(
      (m): m is ChatMessage =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string" &&
        m.content.length > 0,
    )
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MESSAGE_LENGTH),
    }));

  if (safeMessages.length === 0 || safeMessages[safeMessages.length - 1].role !== "user") {
    return new Response(
      JSON.stringify({ error: "Letzte Nachricht muss vom User sein" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Chatbot ist gerade nicht verfügbar. Bitte ruf uns an: 06108 / 79 98 65.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const anthropic = new Anthropic({ apiKey });

  // Streaming Antwort als Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const apiStream = await anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 500,
          system: LIA_SYSTEM_PROMPT,
          messages: safeMessages,
        });

        for await (const event of apiStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (err) {
        console.error("[chat] Anthropic error:", err);
        const message =
          err instanceof Error ? err.message : "Unbekannter Fehler";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
