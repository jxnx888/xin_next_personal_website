'use client';

import { useState, useEffect } from 'react';

export type DeviceType = 'phone' | 'pad-v' | 'pad' | 'pc';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('pc');

  useEffect(() => {
    const getDeviceType = (): DeviceType => {
      const width = window.innerWidth;

      if (width < 768) return 'phone';
      if (width >= 768 && width < 1024) return 'pad-v';
      if (width >= 1024 && width < 1280) return 'pad';
      return 'pc';
    };

    const handleResize = () => {
      setDeviceType(getDeviceType());
    };

    // Set initial device type
    setDeviceType(getDeviceType());

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
}

export function useIsMobile(): boolean {
  const deviceType = useDeviceType();
  return deviceType === 'phone' || deviceType === 'pad-v';
}
