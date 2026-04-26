import { UAParser } from 'ua-parser-js';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';

export interface ParsedDevice {
  deviceName: string;
  deviceType: DeviceType;
}

export function parseUserAgent(ua: string | null): ParsedDevice {
  if (!ua) {
    return { deviceName: 'Unknown device', deviceType: 'unknown' };
  }

  const parser = new UAParser(ua);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const browserName = browser.name ?? 'Unknown browser';
  const osName = os.name ?? 'Unknown OS';

  let deviceType: DeviceType;
  if (device.type === 'mobile') deviceType = 'mobile';
  else if (device.type === 'tablet') deviceType = 'tablet';
  else if (browser.name?.toLowerCase().includes('bot')) deviceType = 'bot';
  else deviceType = 'desktop';

  return {
    deviceName: `${browserName} on ${osName}`,
    deviceType,
  };
}
