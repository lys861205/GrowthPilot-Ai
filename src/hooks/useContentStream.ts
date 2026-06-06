"use client";

import { useState, useRef, useCallback } from "react";
import { extractWordCount, scoreBlogPost } from "@/lib/qwen/content";

interface StreamContentParams {
  postId: string;
}

interface UseContentStreamReturn {
  content: string;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
  wordCount: number;
  seoScore: number;
  stream: (params: StreamContentParams) => Promise<void>;
  reset: () => void;
}

export function useContentStream(): UseContentStreamReturn {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setContent("");
    setIsStreaming(false);
    setIsDone(false);
    setError(null);
  }, []);

  const stream = useCallback(async (params: StreamContentParams) => {
    // Abort any in-flight request first
    abortRef.current?.abort();

    // Reset UI state without touching abortRef (avoid self-abort)
    setContent("");
    setIsStreaming(false);
    setIsDone(false);
    setError(null);

    // Create new controller AFTER resetting state
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    try {
      const response = await fetch("/api/content/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setContent(accumulated);
      }

      setIsDone(true);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Stream failed");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const wordCount = extractWordCount(content);
  const seoScore = scoreBlogPost(content, []);

  return { content, isStreaming, isDone, error, wordCount, seoScore, stream, reset };
}
