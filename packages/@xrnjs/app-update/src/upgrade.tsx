import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Platform, ScrollView } from "react-native";
import DeviceInfo from "react-native-device-info";
import { Image } from "@xrnjs/image";
import { XRNNativeStorage } from "@xrnjs/native-storage";
import { Modal, Toast, Progress, Popup, Button, Fill, Space } from "@xrnjs/ui";

import styles from "./styles";
import {
  downloadAndApplyUpdate,
  Update,
  fetchAppUpdate,
  enableStoreUpdate,
} from "./update";

interface UpdateModalStrings {
  downloadErrorToast: string;
  downloadingBackgroundToast: string;
  iosSystemVersionLowMessage: string;
  newVersionUpdateTitle: string;
  downloadingProgressText: string;
  updateButtonText: string;
  updateErrorButtonText: string;
  laterButtonText: string;
  updateDescription: string;
}

function compareAppVersion(version1: string, version2: string): number {
  const v1: number[] = version1.split(".").map((num) => parseInt(num, 10));
  const v2: number[] = version2.split(".").map((num) => parseInt(num, 10));

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1: number = v1[i] || 0;
    const num2: number = v2[i] || 0;
    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  return 0;
}

interface UpdateModalProps {
  isVisible: boolean;
  update: Update;
  onUpdatePress: () => void;
  onLaterPress: () => void;
  onBackupUpdatePress: () => void;
  onOpenStoreError?: (error: any) => void;
  strings: UpdateModalStrings;
  language: string;
}

const UpdateModal: React.FC<UpdateModalProps> = ({
  isVisible,
  update,
  onUpdatePress,
  onLaterPress,
  onBackupUpdatePress,
  onOpenStoreError,
  strings,
  language,
}) => {
  const [iosTipModal, setIosTipModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(false);

  const changelogs = useMemo<string[]>(() => {
    try {
      return (
        JSON.parse(update.changelog)[language] || [strings.updateDescription]
      );
    } catch {
      return [strings.updateDescription];
    }
  }, [update.changelog, language]);

  const updateFeature = useCallback(
    (config = {}) => {
      downloadAndApplyUpdate(update, {
        begin: () => {},
        onOpenStoreError,
        ...config,
      });
    },
    [update, onUpdatePress, onBackupUpdatePress, onOpenStoreError]
  );

  const forceUpdate = useCallback(() => {
    if (enableStoreUpdate()) {
      setUpdateLoading(true);
    }
    setDownloadError(false);
    updateFeature({
      progressing: (res, progress) => {
        setProgress(progress);
      },
      completed: () => {
        setUpdateLoading(false);
      },
      error: () => {
        setUpdateLoading(false);
        setDownloadError(true);
        Toast(strings.downloadErrorToast);
      },
    });
  }, []);
  const silentUpdate = useCallback(() => {
    enableStoreUpdate() &&
      Toast({ message: strings.downloadingBackgroundToast });
    onBackupUpdatePress();
    updateFeature({
      error: () => {
        Toast(strings.downloadErrorToast);
      },
    });
  }, []);

  const updateAndroidApp = useCallback(() => {
    switch (update.update_type) {
      case "Suggestion":
        silentUpdate();
        break;
      case "Force":
        forceUpdate();
        break;
      default:
        silentUpdate();
    }
  }, [update]);

  const onInnerLaterPress = useCallback(() => {
    onLaterPress();
  }, []);

  if (Platform.OS === "ios") {
    // APP的版本号
    const appVersion = DeviceInfo.getVersion();
    // 手机系统
    const systemVersion = DeviceInfo.getSystemVersion();
    const iosUpgradeTag = "IOS13_UPGRADE_MODAL";
    // 逻辑：如果systemVersion低于13.0并且appVersion小于3.3.8时，显示自定义弹框提示用户，弹框只弹一次，否则走老逻辑
    if (
      compareAppVersion(systemVersion, "13.0.0") === -1 &&
      compareAppVersion(appVersion, "3.3.8") === -1
    ) {
      const val = XRNNativeStorage?.getItemSync(iosUpgradeTag);
      // 点击过确认按钮，或者已经弹过框，则不在显示弹框
      if (iosTipModal || val === "1") {
        return null;
      }
      return (
        <Modal.Component
          visible
          message={strings.iosSystemVersionLowMessage}
          solidButton
          onPressConfirm={() => {
            setIosTipModal(true);
            XRNNativeStorage?.setItemSync(iosUpgradeTag, "1");
          }}
        />
      );
    }
  }

  return (
    <Popup
      visible={isVisible}
      round
      useNative
      style={styles.centeredView}
      statusBarTranslucent
      onRequestClose={() => {
        return update.update_type !== "Force";
      }}
    >
      <View style={styles.modalView}>
        <View style={styles.containerInner}>
          <Image
            source={require("../assets/bg.png")}
            style={styles.bg}
            contentFit="fill"
          />
          <Image source={require("../assets/logo.svg")} style={styles.logo} />
          <Text style={styles.subtitle}>{strings.newVersionUpdateTitle}</Text>

          <ScrollView style={styles.contentContainer}>
            {changelogs.map((item, index) => (
              <Text key={index} style={styles.contentItem}>
                {`${index + 1}.${item}`}
              </Text>
            ))}
          </ScrollView>
          <View style={styles.buttonContainer}>
            {updateLoading && !downloadError && (
              <View style={styles.progressContainer}>
                <Progress.Line percent={progress} showInfo={false} />
                <Text style={styles.progressText}>
                  {strings.downloadingProgressText}
                </Text>
              </View>
            )}
            {!updateLoading && (
              <Space gap={16} direction="vertical">
                <Button onPress={updateAndroidApp}>
                  {downloadError
                    ? strings.updateErrorButtonText
                    : strings.updateButtonText}
                </Button>
                {update.update_type !== "Force" && (
                  <Button onPress={onInnerLaterPress} fill={Fill.weak}>
                    {strings.laterButtonText}
                  </Button>
                )}
              </Space>
            )}
          </View>
        </View>
      </View>
    </Popup>
  );
};

export const AppUpdateChecker: React.FC<{
  strings: UpdateModalStrings;
  language: string;
  /**
   * 是否允许自定义更新逻辑
   * 如果开启，则不自动检查更新，使用外部传入的update和visible
   * 如果不开启，则自动检查更新
   */
  enableCustomUpdate?: boolean;
  visible?: boolean;
  update?: Update | null;
  onOpenStoreError?: (error: any) => void;
  onVisibleChange?: (visible: boolean) => void;
  noUpdate?: () => void;
}> = ({
  strings,
  language,
  enableCustomUpdate = false,
  update: outUpdate = null,
  visible: outVisible = false,
  onOpenStoreError,
  onVisibleChange,
  noUpdate,
}) => {
  const [update, setUpdate] = useState<null | Update>(outUpdate);
  const [visible, setVisible] = useState(outVisible);

  useEffect(() => {
    if (enableCustomUpdate) return;
    fetchAppUpdate()
      .then(async (res) => {
        if (res.need_update && res.update_type !== "Silent") {
          // 如果是强制更新，直接弹出更新
          if (res.update_type === "Suggestion") {
            // 如果是建议更新，进入4次app后弹出更新
            const count = Number(
              (await XRNNativeStorage.getItem("app_update_suggestion_count")) ||
                0
            );
            if (count < 3) {
              const newCount = (Number(count) || 0) + 1;
              XRNNativeStorage.setItem(
                "app_update_suggestion_count",
                String(newCount)
              );
              noUpdate?.();
              return;
            }
            XRNNativeStorage.removeItem("app_update_suggestion_count");
          }
          setUpdate(res);
          setVisible(true);
          onVisibleChange?.(true);
        } else {
          // 如果不需要更新，调用noUpdate回调
          noUpdate?.();
        }
      })
      .catch(() => {
        noUpdate?.();
      });
  }, []);

  useEffect(() => {
    if (!enableCustomUpdate) return;
    if (outVisible !== visible) {
      setVisible(outVisible);
    }
  }, [outVisible, visible]);

  useEffect(() => {
    if (!enableCustomUpdate) return;
    if (outUpdate !== update) {
      setUpdate(outUpdate);
    }
  }, [outUpdate, update]);

  const hide = useCallback(() => {
    setVisible(false);
    onVisibleChange?.(false);
  }, [setVisible]);

  if (!update) return null;

  return (
    <UpdateModal
      language={language}
      isVisible={visible}
      update={update}
      onUpdatePress={() => {}}
      onLaterPress={hide}
      onBackupUpdatePress={hide}
      onOpenStoreError={onOpenStoreError}
      strings={strings}
    />
  );
};
