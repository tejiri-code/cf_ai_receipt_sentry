import { UserMemoryDO, type ChatMessage } from "./userMemoryDO";

export { UserMemoryDO };

type Env = {
  AI: any;
  USER_MEMORY: DurableObjectNamespace;
};

function cors(origin: string | null) {
  const allow = origin && (origin.includes("localhost:3000") || origin.includes(".pages.dev"));
  return {
    "Access-Control-Allow-Origin": allow ? origin! : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });

    // quick health check
    if (url.pathname === "/") return new Response("ok");

    if (url.pathname === "/api/chat" && request.method === "POST") {
      const body = (await request.json()) as { userId?: string; message?: string };
      const userId = body.userId?.trim() || "anon";
      const message = body.message?.trim();

      if (!message) {
        return new Response("Missing message", { status: 400, headers: cors(origin) });
      }

      const id = env.USER_MEMORY.idFromName(userId);
      const stub = env.USER_MEMORY.get(id);

      // load history
      const memRes = await stub.fetch("https://do/get");
      const mem = (await memRes.json()) as { messages: ChatMessage[] };
      const history = mem.messages ?? [];

      // save user msg
      await stub.fetch("https://do/append", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: { role: "user", content: message, ts: Date.now() } satisfies ChatMessage,
          max: 20,
        }),
      });

      // call Workers AI (simple first)
      const completion = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: message },
        ],
      });

      const reply =
        completion?.response || completion?.result || completion?.output || JSON.stringify(completion);

      // save assistant msg
      await stub.fetch("https://do/append", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: { role: "assistant", content: reply, ts: Date.now() } satisfies ChatMessage,
          max: 20,
        }),
      });

      return new Response(JSON.stringify({ reply }), {
        headers: { "Content-Type": "application/json", ...cors(origin) },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
