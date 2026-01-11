import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // In a real scenario, this URL would be an environment variable
  const RUST_BACKEND_URL = process.env.RUST_BACKEND_URL || 'http://localhost:8080';

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log(`Connecting to Rust backend at ${RUST_BACKEND_URL}/api/stream...`);
        const response = await fetch(`${RUST_BACKEND_URL}/api/stream`, {
          cache: 'no-store',
          headers: {
            'Accept': 'text/event-stream',
          }
        });

        if (!response.ok) {
          throw new Error(`Backend connection failed: ${response.statusText}`);
        }

        if (!response.body) {
           throw new Error("No body in response");
        }

        const reader = response.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch (error) {
        console.error("SSE Stream Error:", error);
        // Send a specific error event to the client to handle reconnect
        const errorMsg = JSON.stringify({ type: 'connection_status', status: 'offline', error: String(error) });
        controller.enqueue(encoder.encode(`event: error\ndata: ${errorMsg}\n\n`));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
