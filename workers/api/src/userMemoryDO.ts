export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  ts: number;
};

type MemoryState = {
  messages: ChatMessage[];
};

export class UserMemoryDO {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/get") {
      const data = (await this.state.storage.get<MemoryState>("mem")) ?? { messages: [] };
      return Response.json(data);
    }

    if (url.pathname === "/append" && request.method === "POST") {
      const body = (await request.json()) as { message: ChatMessage; max?: number };
      const max = body.max ?? 20;

      const data = (await this.state.storage.get<MemoryState>("mem")) ?? { messages: [] };
      data.messages.push(body.message);
      if (data.messages.length > max) data.messages = data.messages.slice(-max);

      await this.state.storage.put("mem", data);
      return Response.json({ ok: true, count: data.messages.length });
    }

    return new Response("Not found", { status: 404 });
  }
}
