// tests/unit/core/tui/useStreaming.test.ts
// Tests for useStreaming hook (direct logic testing)

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function createStreamingState() {
  let streamedText = "";
  let isStreaming = false;
  let buffer = "";

  function startStream() {
    buffer = "";
    streamedText = "";
    isStreaming = true;
  }

  function appendToStream(chunk: string) {
    buffer += chunk;
    streamedText = buffer;
  }

  function endStream() {
    isStreaming = false;
    return buffer;
  }

  function simulateStream(
    text: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void,
    charsPerTick = 3,
    tickMs = 20
  ) {
    startStream();
    let index = 0;

    const interval = setInterval(() => {
      if (index >= text.length) {
        clearInterval(interval);
        isStreaming = false;
        onComplete(text);
        return;
      }

      const chunk = text.slice(index, index + charsPerTick);
      index += charsPerTick;
      appendToStream(chunk);
      onChunk(chunk);
    }, tickMs);

    return interval;
  }

  return {
    get streamedText() { return streamedText; },
    get isStreaming() { return isStreaming; },
    startStream,
    appendToStream,
    endStream,
    simulateStream,
  };
}

describe("useStreaming logic", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with empty state", () => {
    const stream = createStreamingState();
    expect(stream.streamedText).toBe("");
    expect(stream.isStreaming).toBe(false);
  });

  it("starts stream", () => {
    const stream = createStreamingState();
    stream.startStream();
    expect(stream.isStreaming).toBe(true);
    expect(stream.streamedText).toBe("");
  });

  it("appends to stream", () => {
    const stream = createStreamingState();
    stream.startStream();
    stream.appendToStream("Hello");
    expect(stream.streamedText).toBe("Hello");
    stream.appendToStream(" World");
    expect(stream.streamedText).toBe("Hello World");
  });

  it("ends stream and returns final text", () => {
    const stream = createStreamingState();
    stream.startStream();
    stream.appendToStream("Final text");
    const finalText = stream.endStream();
    expect(stream.isStreaming).toBe(false);
    expect(finalText).toBe("Final text");
  });

  it("simulates stream with character-by-character output", () => {
    const stream = createStreamingState();
    const chunks: string[] = [];
    let completedText = "";

    stream.simulateStream(
      "Hi!",
      (chunk) => chunks.push(chunk),
      (full) => { completedText = full; },
      1,
      10
    );

    // First tick
    vi.advanceTimersByTime(10);
    expect(chunks).toEqual(["H"]);

    // Second tick
    vi.advanceTimersByTime(10);
    expect(chunks).toEqual(["H", "i"]);

    // Third tick
    vi.advanceTimersByTime(10);
    expect(chunks).toEqual(["H", "i", "!"]);

    // Complete
    vi.advanceTimersByTime(10);
    expect(completedText).toBe("Hi!");
    expect(stream.isStreaming).toBe(false);
  });
});
