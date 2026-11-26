// The courier's public tracking page for an AWB. Change the base with NEXT_PUBLIC_TRACKING_URL_BASE (no code change if the courier changes).
const BASE = (process.env.NEXT_PUBLIC_TRACKING_URL_BASE || 'https://shiprocket.co/tracking').replace(/\/$/, '');

export const trackingUrl = (awb: string) => `${BASE}/${encodeURIComponent(awb)}`;
