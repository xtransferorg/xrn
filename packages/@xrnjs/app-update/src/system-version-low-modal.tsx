import React, { useCallback } from "react";
import { Linking, Platform } from "react-native";
import { XRNAppUtils } from "@xrnjs/app-utils";
import { Modal, Toast } from "@xrnjs/ui";

interface SystemVersionLowModalProps {
  visible: boolean;
  title: string;
  message: string;
  exitButtonText: string;
  upgradeButtonText: string;
}

export const SystemVersionLowModal: React.FC<SystemVersionLowModalProps> = ({
  visible,
  title,
  message,
  exitButtonText,
  upgradeButtonText,
}) => {
  const onSystemVersionLowExitPress = useCallback(() => {
    XRNAppUtils?.exitApp?.();
  }, []);

  const onSystemVersionLowUpgradePress = useCallback(() => {
    const fallbackExitApp = () => {
      XRNAppUtils?.exitApp?.();
    };

    if (Platform.OS === "android") {
      Linking.sendIntent("android.settings.SETTINGS")
        .catch(() => fallbackExitApp())
        .catch(() => {
          Toast(message);
        });
      return;
    }

    fallbackExitApp();
  }, [message]);

  return (
    <Modal.Component
      visible={visible}
      status="info"
      title={title}
      message={message}
      onRequestClose={() => false}
      showCancelButton
      cancelButtonText={exitButtonText}
      confirmButtonText={upgradeButtonText}
      onPressCancel={onSystemVersionLowExitPress}
      onPressConfirm={onSystemVersionLowUpgradePress}
      solidButton
    />
  );
};
