import { useCallback, useEffect, useState, type DependencyList } from "react";

/** Cleanup prevents responses belonging to an older dependency key from reaching the screen. */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, dependencies: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(v => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    load(controller.signal).then(result => {
      if (!controller.signal.aborted) setData(result);
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os dados.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [...dependencies, revision]);
  return { data, error, loading, reload };
}
