import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { audits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { STREAM_KEY } from "@/lib/redis/queue";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auditId } = await params;

  // Auth check
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Verify the audit belongs to this user
  const audit = await db.query.audits.findFirst({
    where: eq(audits.id, auditId),
    with: { site: { columns: { userId: true } } },
  });

  if (!audit || audit.site.userId !== session.user.id) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        const line = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      // If audit is already done, stream stored events then close
      if (audit.status === "done" || audit.status === "failed") {
        const stored = await redis.lrange(STREAM_KEY(auditId), 0, -1);
        for (const raw of stored) {
          try {
            send(JSON.parse(raw));
          } catch {
            // skip malformed events
          }
        }
        controller.close();
        return;
      }

      // Poll Redis list for new events
      let cursor = 0;
      let idleCount = 0;
      const MAX_IDLE_POLLS = 180; // 3 minutes at 1s intervals

      const poll = async () => {
        try {
          const newEvents = await redis.lrange(STREAM_KEY(auditId), cursor, -1);

          if (newEvents.length > 0) {
            idleCount = 0;
            for (const raw of newEvents) {
              try {
                const event = JSON.parse(raw);
                send(event);
                cursor++;

                if (event.type === "complete" || event.type === "error") {
                  controller.close();
                  return;
                }
              } catch {
                cursor++;
              }
            }
          } else {
            idleCount++;
          }

          if (idleCount >= MAX_IDLE_POLLS) {
            send({ type: "error", message: "Audit timed out" });
            controller.close();
            return;
          }

          // Check if request was aborted
          if (request.signal.aborted) {
            controller.close();
            return;
          }

          setTimeout(poll, 1000);
        } catch (err) {
          controller.error(err);
        }
      };

      // Send a heartbeat immediately so the client knows the connection is live
      send({ type: "connected", message: "Stream connected", ts: Date.now() });
      await poll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
