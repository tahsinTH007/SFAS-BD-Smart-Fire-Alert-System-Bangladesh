/**
 * Runs a station-scoped fetch and guarantees the result is for the station the
 * console is on *now*, not the one it was on when the request left.
 *
 * On first load the session slice starts with no station, so the earliest
 * requests go out unscoped; a few milliseconds later the saved station is
 * hydrated and everything is fetched again, scoped. Normally the scoped
 * response lands last and wins. When the API is slow to answer — a hosted
 * backend waking from sleep, with the client retrying — the two batches can
 * complete in either order, and an unscoped result overwriting a scoped one
 * shows the operator every station's devices instead of their own.
 *
 * If the station changed while the request was in flight the result is
 * discarded and the fetch repeated for the current station. This converges
 * immediately in practice; the cap only guards against a pathological flip.
 */
export async function fetchForCurrentStation<T>(
  currentStation: () => string | null,
  fetcher: (stationId: string | undefined) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const scope = currentStation() ?? undefined;
    const result = await fetcher(scope);
    if ((currentStation() ?? undefined) === scope || attempt >= 2) return result;
  }
}
