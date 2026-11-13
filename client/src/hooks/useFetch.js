import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

// Loads data from the API whenever `path` or `query` change.
// Returns { data, loading, error, refetch, setData }. Aborts stale requests on change/unmount.
export default function useFetch(path, query, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const queryKey = JSON.stringify(query || {});
  const hasData = useRef(false);

  useEffect(() => {
    if (!enabled || !path) return undefined;
    const ctrl = new AbortController();
    // Show the big spinner only on first load; refetches update in place.
    if (!hasData.current) setLoading(true);
    setError(null);
    api(path, { query: JSON.parse(queryKey), signal: ctrl.signal })
      .then((res) => { setData(res); hasData.current = true; })
      .catch((err) => { if (err.name !== "AbortError") setError(err); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [path, queryKey, enabled, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, refetch, setData };
}
