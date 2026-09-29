import axios, { AxiosError } from 'axios';
import type { FieldError } from '@/lib/api';

export interface ApiError {
  message: string;
  code: string;
  status: number;
  fields: FieldError[];
}

interface JsendSuccess<T> {
  status: 'success';
  data: T;
}

interface JsendFailure {
  status: 'error';
  message: string;
  code: string;
  errors?: FieldError[];
}

export const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

function normalize(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const body = error.response?.data as JsendFailure | undefined;
    return {
      message: body?.message ?? error.message ?? 'Request failed',
      code: body?.code ?? 'ERR_NETWORK',
      status: error.response?.status ?? 0,
      fields: body?.errors ?? [],
    };
  }
  return { message: 'Unexpected error', code: 'ERR_UNKNOWN', status: 0, fields: [] };
}

async function request<T>(promise: Promise<{ data: JsendSuccess<T> }>): Promise<T> {
  try {
    const response = await promise;
    return response.data.data;
  } catch (error) {
    throw normalize(error);
  }
}

export function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>(http.get(url, { params }));
}

export function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(http.post(url, body));
}

export function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(http.patch(url, body));
}

export function apiDelete<T>(url: string): Promise<T> {
  return request<T>(http.delete(url));
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'code' in value && 'message' in value;
}
