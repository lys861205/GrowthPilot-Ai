import { redis } from "./index";
import { STREAM_KEY, STREAM_TTL } from "./queue";

export async function publishStreamEvent(
  auditId: string,
  event: object
): Promise<void> {
  const key = STREAM_KEY(auditId);
  await redis.rpush(key, JSON.stringify(event));
  await redis.expire(key, STREAM_TTL);
}
