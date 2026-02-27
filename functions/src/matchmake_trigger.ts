/**
 * OPTIONAL (better UX): Trigger-based matchmaking (near-instant).
 * Uncomment and export from index.ts if you prefer it.
 *
 * Note: To avoid race conditions, you'd lock using a transaction with a "matchLock" doc.
 * For simplicity, the repo uses scheduled batching in index.ts.
 */
