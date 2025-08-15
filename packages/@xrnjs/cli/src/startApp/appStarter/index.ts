import { startAppContext } from "../StartAppContext";
import { DevServer } from "../devServer";
import { DeviceType, XrnStartArgs } from "../types";
import { AndroidAppStarter } from "./AndroidAppStarter";
import { AppStarter } from "./AppStarter";
import { HarmonyAppStarter } from "./HarmonyAppStarter";
import { IOSAppStarter } from "./IOSAppStarter";
import { IOSSimulatorAppStarter } from "./IOSSimulatorAppStarter";

/**
 * Factory function to create platform-specific app starters
 * Returns the appropriate AppStarter implementation based on the device type
 * 
 * @param deviceType - The target platform device type
 * @param options - Command line arguments and configuration options
 * @param devServer - Development server instance for port forwarding
 * @returns Platform-specific AppStarter instance
 * @throws Error if device type is not supported
 */
export function createAppStarter(
  deviceType: DeviceType,
  options: XrnStartArgs,
  devServer: DevServer,
): AppStarter {
  const config = startAppContext.appJsonConfig;
  switch (deviceType) {
    case DeviceType.ANDROID:
      return new AndroidAppStarter(options, devServer, config);
    case DeviceType.IOS:
      return new IOSAppStarter(options, devServer, config);
    case DeviceType.IOS_SIMULATOR:
      return new IOSSimulatorAppStarter(options, devServer, config);
    case DeviceType.HARMONY:
      return new HarmonyAppStarter(options, devServer, config);
    default:
      throw new Error("未知设备类型");
  }
}
