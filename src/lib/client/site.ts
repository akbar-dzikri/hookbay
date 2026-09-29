'use client';

import { useEffect, useState } from 'react';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

export function useOrigin(): string {
  const [origin, setOrigin] = useState(SITE_URL);
  useEffect(() => {
    if (!origin) setOrigin(window.location.origin);
  }, [origin]);
  return origin;
}
