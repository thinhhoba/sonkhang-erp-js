/** PostgreSQL serialization failures must be retried by the caller's complete transaction. */
export const SERIALIZABLE_RETRY_LIMIT = 3;

export function isSerializationConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "P2034" || code === "40001";
}

export async function withSerializableRetry<T>(operation: () => Promise<T>, retryLimit = SERIALIZABLE_RETRY_LIMIT): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retryLimit; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isSerializationConflict(error) || attempt === retryLimit - 1) throw error;
    }
  }
  throw lastError;
}
