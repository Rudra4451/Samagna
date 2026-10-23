import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    fieldErrors?: Record<string, string[]>;
  };
}

export function apiSuccess<T>(data: T, meta?: Record<string, any>, status = 200): NextResponse {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta,
  };
  return NextResponse.json(body, { status });
}

export function apiError(
  message: string,
  code = 'BAD_REQUEST',
  status = 400,
  details?: any,
  fieldErrors?: Record<string, string[]>
): NextResponse {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
      fieldErrors,
    },
  };
  return NextResponse.json(body, { status });
}
