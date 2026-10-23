/** Errors that routes can map to a safe HTTP response without string matching. */
export class ForbiddenError extends Error {
  readonly status = 403;

  constructor(message = "Không có quyền thực hiện thao tác này!") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function errorStatus(error: unknown, fallback = 400): number {
  return error instanceof ForbiddenError ? error.status : fallback;
}
