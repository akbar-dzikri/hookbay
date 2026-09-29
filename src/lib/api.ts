import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';

export interface FieldError {
  field: string;
  message: string;
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ status: 'success', data }, init);
}

export function fail(
  message: string,
  code: string,
  status: number,
  errors?: FieldError[],
): NextResponse {
  return NextResponse.json(
    { status: 'error', message, code, ...(errors ? { errors } : {}) },
    { status },
  );
}

function toFieldErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : '_',
    message: issue.message,
  }));
}

export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: fail('Request body must be valid JSON', 'ERR_INVALID_JSON', 400),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      response: fail('Validation failed', 'ERR_VALIDATION', 422, toFieldErrors(result.error)),
    };
  }
  return { ok: true, data: result.data };
}
