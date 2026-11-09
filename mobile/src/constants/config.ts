import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveHostUrl(envUrl: string | undefined, defaultPort: number, pathSuffix = ''): string {
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];

  if (envUrl && envUrl.trim() !== '') {
    if (Platform.OS !== 'web' && debuggerHost && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', debuggerHost);
    }
    return envUrl;
  }

  const targetHost = Platform.OS !== 'web' && debuggerHost ? debuggerHost : 'localhost';
  return `http://${targetHost}:${defaultPort}${pathSuffix}`;
}

export const AppConfig = {
  appName: 'KixCleen Monitor',
  apiUrl: resolveHostUrl(process.env.EXPO_PUBLIC_API_URL, 3000, '/api'),
  socketUrl: resolveHostUrl(process.env.EXPO_PUBLIC_SOCKET_URL, 3000, ''),
  defaultKioskId: 'KIOSK-01-MAIN',
  pollingIntervalMs: 5000,
  tokenStorageKey: 'kixcleen_monitor_jwt_token',
};
