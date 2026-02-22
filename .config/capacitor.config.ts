import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lockpoint.app',
  appName: 'LockPoint',
  webDir: 'out',
  bundledWebRuntime: false,
  plugins: {
    Geolocation: {
      // Request precise location for geofencing
    },
  },
  server: {
    // In dev mode, use the Next.js dev server
    url: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
    cleartext: true,
  },
};

export default config;
