'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost, isApiError, type ApiError } from './api';
import type { Delivery, EndpointWithStats, EventRecord, SessionUser } from '@/lib/types';

export function useMe(): ReturnType<typeof useQuery<SessionUser | null, ApiError>> {
  return useQuery<SessionUser | null, ApiError>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await apiGet<SessionUser>('/auth/me');
      } catch (error) {
        if (isApiError(error) && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
  });
}

export function useEndpoints(
  enabled = true,
): ReturnType<typeof useQuery<{ endpoints: EndpointWithStats[] }, ApiError>> {
  return useQuery<{ endpoints: EndpointWithStats[] }, ApiError>({
    queryKey: ['endpoints'],
    queryFn: () => apiGet<{ endpoints: EndpointWithStats[] }>('/endpoints'),
    enabled,
  });
}

export function useEndpointEvents(
  endpointId: string | null,
): ReturnType<typeof useQuery<{ events: EventRecord[] }, ApiError>> {
  return useQuery<{ events: EventRecord[] }, ApiError>({
    queryKey: ['events', endpointId],
    queryFn: () =>
      apiGet<{ events: EventRecord[] }>(`/endpoints/${endpointId}/events`, { limit: 120 }),
    enabled: Boolean(endpointId),
  });
}

export function useEventDetail(
  eventId: string | null,
): ReturnType<
  typeof useQuery<
    { event: EventRecord; endpoint: EndpointWithStats | null; deliveries: Delivery[] },
    ApiError
  >
> {
  return useQuery<
    { event: EventRecord; endpoint: EndpointWithStats | null; deliveries: Delivery[] },
    ApiError
  >({
    queryKey: ['event', eventId],
    queryFn: () => apiGet(`/events/${eventId}`),
    enabled: Boolean(eventId),
  });
}

export function useCreateEndpoint(): ReturnType<
  typeof useMutation<
    { endpoint: EndpointWithStats },
    ApiError,
    { name: string; forwardUrl: string | null }
  >
> {
  const client = useQueryClient();
  return useMutation<
    { endpoint: EndpointWithStats },
    ApiError,
    { name: string; forwardUrl: string | null }
  >({
    mutationFn: (input) => apiPost('/endpoints', input),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['endpoints'] }),
  });
}

export function useUpdateEndpoint(): ReturnType<
  typeof useMutation<
    { endpoint: EndpointWithStats },
    ApiError,
    { id: string; patch: Record<string, unknown> }
  >
> {
  const client = useQueryClient();
  return useMutation<
    { endpoint: EndpointWithStats },
    ApiError,
    { id: string; patch: Record<string, unknown> }
  >({
    mutationFn: ({ id, patch }) => apiPatch(`/endpoints/${id}`, patch),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['endpoints'] }),
  });
}

export function useDeleteEndpoint(): ReturnType<typeof useMutation<unknown, ApiError, string>> {
  const client = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (id) => apiDelete(`/endpoints/${id}`),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['endpoints'] }),
  });
}

export function useClearEvents(): ReturnType<typeof useMutation<unknown, ApiError, string>> {
  const client = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: (endpointId) => apiDelete(`/endpoints/${endpointId}/events`),
    onSuccess: (_data, endpointId) =>
      void client.invalidateQueries({ queryKey: ['events', endpointId] }),
  });
}

export function useReplay(): ReturnType<
  typeof useMutation<
    { delivery: Delivery; deliveries: Delivery[] },
    ApiError,
    { eventId: string; targetUrl?: string }
  >
> {
  const client = useQueryClient();
  return useMutation<
    { delivery: Delivery; deliveries: Delivery[] },
    ApiError,
    { eventId: string; targetUrl?: string }
  >({
    mutationFn: ({ eventId, targetUrl }) =>
      apiPost(`/events/${eventId}/replay`, targetUrl ? { targetUrl } : {}),
    onSuccess: (_data, variables) =>
      void client.invalidateQueries({ queryKey: ['event', variables.eventId] }),
  });
}
