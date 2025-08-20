import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { SelectCard } from './SelectCard';

type Platform = 'android' | 'ios' | 'harmony';
type Device = 'physical' | 'simulated';

export function PlatformAndDeviceForm() {
  const router = useRouter();
  const { query, isReady } = router;
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(
    function queryDidUpdate() {
      if (isReady) {
        if (query.platform) {
          setPlatform(query.platform as Platform);
        } else {
          setPlatform('android');
        }
        if (query.device) {
          setDevice(query.device as Device);
        } else {
          setDevice('physical');
        }
      }
    },
    [query.platform, query.device, isReady]
  );

  function onRadioChange(platform: Platform, device: Device) {
    setPlatform(platform);
    setDevice(device);

    router.push(
      {
        query: {
          ...query,
          platform,
          device,
        },
      },
      undefined,
      { shallow: true }
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-wrap gap-4">
        <SelectCard
          imgSrc="/xrn/static/images/get-started/android-device.png"
          darkImgSrc="/xrn/static/images/get-started/android-device-dark.png"
          title="Android 真机"
          alt="Android device"
          isSelected={platform === 'android' && device === 'physical'}
          onClick={() => onRadioChange('android', 'physical')}
        />
        <SelectCard
          imgSrc="/xrn/static/images/get-started/ios-device.png"
          darkImgSrc="/xrn/static/images/get-started/ios-device-dark.png"
          title="iOS 真机"
          alt="iOS device"
          isSelected={platform === 'ios' && device === 'physical'}
          onClick={() => onRadioChange('ios', 'physical')}
        />
        <SelectCard
          imgSrc="/xrn/static/images/get-started/harmony-simulator.png"
          darkImgSrc="/xrn/static/images/get-started/harmony-device-dark.png"
          title="鸿蒙真机"
          alt="HarmonyOS device"
          isSelected={platform === 'harmony' && device === 'physical'}
          onClick={() => onRadioChange('harmony', 'physical')}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <SelectCard
          imgSrc="/xrn/static/images/get-started/android-emulator.png"
          darkImgSrc="/xrn/static/images/get-started/android-emulator-dark.png"
          title="Android 模拟器"
          alt="Android Emulator"
          isSelected={platform === 'android' && device === 'simulated'}
          onClick={() => onRadioChange('android', 'simulated')}
        />
        <SelectCard
          imgSrc="/xrn/static/images/get-started/ios-simulator.png"
          darkImgSrc="/xrn/static/images/get-started/ios-simulator-dark.png"
          title="iOS 模拟器"
          alt="iOS Simulator"
          isSelected={platform === 'ios' && device === 'simulated'}
          onClick={() => onRadioChange('ios', 'simulated')}
        />
        <SelectCard
          imgSrc="/xrn/static/images/get-started/harmony-simulator.png"
          darkImgSrc="/xrn/static/images/get-started/harmony-simulator-dark.png"
          title="鸿蒙模拟器"
          alt="HarmonyOS Simulator"
          isSelected={platform === 'harmony' && device === 'simulated'}
          onClick={() => onRadioChange('harmony', 'simulated')}
        />
      </div>
    </div>
  );
}
