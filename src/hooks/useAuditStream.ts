"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AuditStreamEvent } from "@/types";

type StreamStatus = "idle" | "connecting" | "streaming" | "done" | "error";

interface UseAuditStreamReturn {
  events: AuditStreamEvent[];
  status: StreamStatus;
  lastEvent: AuditStreamEvent | null;
  progress: number;
  connect: (auditId: string) => void;
  disconnect: () => void;
}

export function useAuditStream(): UseAuditStreamReturn {
  const [events, setEvents] = useState<AuditStreamEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [progress, setProgress] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  const connect = useCallback(
    (auditId: string) => {
      disconnect();
      setEvents([]);
      setProgress(0);
      setStatus("connecting");

      const es = new EventSource(`/api/audits/${auditId}/stream`);
      esRef.current = es;

      es.onopen = () => setStatus("streaming");

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as AuditStreamEvent;
          setEvents((prev) => [...prev, event]);

          if (event.progress !== undefined) {
            setProgress(event.progress);
          } else {
            // Infer progress from event type
            const progressMap: Record<string, number> = {
              connected: 5,
              start: 10,
              crawling: 20,
              page_crawled: 0, // incremental — handled by event count
              analyzing: 65,
              suggestions: 80,
              growth: 90,
              complete: 100,
            };
            if (progressMap[event.type] !== undefined) {
              setProgress((prev) =>
                Math.max(prev, progressMap[event.type] as number)
              );
            } else if (event.type === "page_crawled") {
              setProgress((prev) => Math.min(60, prev + 4));
            }
          }

          if (event.type === "complete") {
            setStatus("done");
            setProgress(100);
            es.close();
          }

          if (event.type === "error") {
            setStatus("error");
            es.close();
          }
        } catch {
          // Ignore malformed events
        }
      };

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          setStatus((prev) => (prev === "streaming" ? "error" : prev));
        }
      };
    },
    [disconnect]
  );

  useEffect(() => () => disconnect(), [disconnect]);

  const lastEvent = events[events.length - 1] ?? null;

  return { events, status, lastEvent, progress, connect, disconnect };
}
