import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  // App Router: place the service worker source in src/app/sw.ts
  swSrc: 'src/app/sw.ts',
  // Emit the built service worker here
  swDest: 'public/sw.js',
  // Auto-register the service worker on entrypoints
  register: true,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
