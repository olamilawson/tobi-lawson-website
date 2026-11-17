// One loading machine for every screen's data:
//
//   loading ──ok──> ready ──refresh ok──> ready
//      │              └──refresh fails──> ready + stale (the last good data stays, with the failure beside it)
//      └──fails──> error (the failure in words, and reload())
//
// A failed read never shows as empty: an empty list is only ever a list the
// agent returned.

import { useCallback, useEffect, useRef, useState } from "react";
import { type Failure, request } from "./api";

export type Resource<T> =
  | { status: "loading"; reload: () => Promise<void> }
  | { status: "error"; failure: Failure; reload: () => Promise<void> }
  | { status: "ready"; data: T; stale: Failure | null; reload: () => Promise<void> };

export function useResource<T>(path: string | null, everyMs?: number): Resource<T> {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; failure: Failure } | { status: "ready"; data: T; stale: Failure | null }
  >({ status: "loading" });
  const current = useRef(path);
  current.current = path;

  const reload = useCallback(async () => {
    if (!path) return;
    const r = await request<T>(path);
    if (current.current !== path) return; // a newer path took over
    setState((prev) => {
      if (r.ok) return { status: "ready", data: r.data, stale: null };
      if (prev.status === "ready") return { ...prev, stale: r };
      return { status: "error", failure: r };
    });
  }, [path]);

  useEffect(() => {
    setState({ status: "loading" });
    reload();
  }, [reload]);

  useEffect(() => {
    if (!everyMs || !path) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") reload();
    }, everyMs);
    return () => window.clearInterval(id);
  }, [everyMs, path, reload]);

  return { ...state, reload } as Resource<T>;
}
