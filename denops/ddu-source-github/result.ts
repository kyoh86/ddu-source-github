export type Result<T, E> = {
  ok: true;
  value: T;
} | {
  ok: false;
  error: E;
};

export function success<T>(value: T): Result<T, unknown> {
  return { ok: true, value };
}

export function failure<T, E>(error: E): Result<T, E> {
  return { ok: false, error };
}
