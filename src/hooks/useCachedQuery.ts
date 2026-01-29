"use client";

import { useState, useEffect, useRef } from "react";
import { useConvex } from "convex/react";
const SIX_HOURS = 6 * 60 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCacheKey(query: any, args: Record<string, unknown>): string {
  // Convex function references have internal properties we can use as identifier
  const fnName = JSON.stringify(query);
  return `${fnName}:${JSON.stringify(args)}`;
}

/**
 * Like useQuery but does a one-time fetch and caches the result in memory.
 * No WebSocket subscription = no DB bandwidth on mutations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCachedQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  args: Record<string, unknown> | "skip",
  ttl: number = SIX_HOURS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = useConvex() as any;
  const [data, setData] = useState<unknown>(() => {
    if (args === "skip") return undefined;
    const key = getCacheKey(query, args);
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return entry.data;
    }
    return undefined;
  });

  const argsRef = useRef(args);
  argsRef.current = args;

  useEffect(() => {
    if (args === "skip") {
      setData(undefined);
      return;
    }

    const key = getCacheKey(query, args);
    const entry = cache.get(key);

    if (entry && Date.now() < entry.expiry) {
      setData(entry.data);
      return;
    }

    let cancelled = false;
    client.query(query, args).then((result: unknown) => {
      if (cancelled) return;
      if (argsRef.current === args) {
        cache.set(key, { data: result, expiry: Date.now() + ttl });
        setData(result);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, args === "skip" ? "skip" : JSON.stringify(args), client, ttl]);

  return data;
}
