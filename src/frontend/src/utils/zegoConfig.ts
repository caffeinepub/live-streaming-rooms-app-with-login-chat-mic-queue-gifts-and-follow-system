// ZEGO configuration sourced from environment or defaults
export const ZEGO_CONFIG = {
  appId: 769939428,
  // Server URL for ZEGOCLOUD - use the production server
  server: 'wss://webliveroom769939428-api.coolzcloud.com/ws',
} as const;

export function validateZegoConfig(): void {
  if (!ZEGO_CONFIG.appId) {
    throw new Error('ZEGO AppID is not configured');
  }
  if (!ZEGO_CONFIG.server) {
    throw new Error('ZEGO Server URL is not configured');
  }
}
