// src/core/cli/tui/hooks/useStreaming.ts
// Hook for streaming text from LLM responses

import { useState, useCallback, useRef } from "react";

export function useStreaming() {
  const [streamedText, setStreamedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bufferRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startStream = useCallback(() => {
    bufferRef.current = "";
    setStreamedText("");
    setIsStreaming(true);
  }, []);

  const appendToStream = useCallback((chunk: string) => {
    bufferRef.current += chunk;
    setStreamedText(bufferRef.current);
  }, []);

  const endStream = useCallback(() => {
    setIsStreaming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const finalText = bufferRef.current;
    return finalText;
  }, []);

  const simulateStream = useCallback(
    (text: string, onChunk: (chunk: string) => void, onComplete: (fullText: string) => void, charsPerTick = 3, tickMs = 20) => {
      startStream();
      let index = 0;

      intervalRef.current = setInterval(() => {
        if (index >= text.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsStreaming(false);
          onComplete(text);
          return;
        }

        const chunk = text.slice(index, index + charsPerTick);
        index += charsPerTick;
        appendToStream(chunk);
        onChunk(chunk);
      }, tickMs);
    },
    [startStream, appendToStream]
  );

  return {
    streamedText,
    isStreaming,
    startStream,
    appendToStream,
    endStream,
    simulateStream,
  };
}
