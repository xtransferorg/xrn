import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Platform, ScrollView } from "react-native";
import DeviceInfo from "react-native-device-info";
import { Image } from "@xrnjs/image";
import { XRNNativeStorage } from "@xrnjs/native-storage";
import { pushAllEvent } from "@xrnjs/navigation";
import { Toast, Progress, Popup, Button, Fill, Space } from "@xrnjs/ui";

import styles from "./styles";
import { SystemVersionLowModal } from "./system-version-low-modal";
import { downloadAndApplyUpdate, fetchAppUpdate } from "./update";
import type { OnUpdateFailure, Update } from "./update";

export const APP_UPDATE_CHECK_RESULT_STORAGE_KEY =
  "app_update_check_result" as const;
export const UPDATE_VERSION_ANDROID_EVENT = "UPDATE_VERSION_ANDROID" as const;

export type AppUpdateCheckResultPayload = {
  ts: number;
  update: Update;
  appVersion: string;
};

export function createAppUpdateCheckResultPayload(
  update: Update,
): AppUpdateCheckResultPayload {
  return {
    ts: Date.now(),
    update,
    appVersion: DeviceInfo.getVersion(),
  };
}

export async function persistAppUpdateCheckResult(
  payload: AppUpdateCheckResultPayload,
): Promise<void> {
  try {
    await XRNNativeStorage?.setItem?.(
      APP_UPDATE_CHECK_RESULT_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // ignore
  }
}

export async function removeAppUpdateCheckResult(): Promise<void> {
  try {
    await XRNNativeStorage?.removeItem?.(APP_UPDATE_CHECK_RESULT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * 入参须为 `JSON.stringify(AppUpdateCheckResultPayload)` 得到的字符串。
 */
export function normalizeBroadcastPayload(
  input: string,
): Partial<AppUpdateCheckResultPayload> | null {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    return null;
  }
  if (data == null || typeof data !== "object") return null;
  const d = data as Partial<AppUpdateCheckResultPayload>;
  const { update } = d;
  return {
    ts: typeof d.ts === "number" ? d.ts : undefined,
    appVersion: typeof d.appVersion === "string" ? d.appVersion : undefined,
    update:
      typeof update === "object" && update !== null
        ? (update as Update)
        : undefined,
  };
}

interface UpdateModalStrings {
  downloadErrorToast: string;
  downloadingBackgroundToast: string;
  /** @deprecated 旧 iOS 硬编码逻辑已移除，此字段仅保留兼容性，不再使用 */
  iosSystemVersionLowMessage?: string;
  /** 系统版本过低弹窗标题 */
  systemVersionLowTitle: string;
  systemVersionLowMessage: string;
  /** 系统版本过低弹窗左侧按钮文案 */
  systemVersionLowExitButtonText: string;
  /** 系统版本过低弹窗右侧按钮文案 */
  systemVersionLowUpgradeButtonText: string;
  newVersionUpdateTitle: string;
  downloadingProgressText: string;
  updateButtonText: string;
  updateErrorButtonText: string;
  laterButtonText: string;
  updateDescription: string;
}

interface UpdateModalProps {
  isVisible: boolean;
  update: Update;
  onUpdatePress: () => void;
  onLaterPress: () => void;
  onBackupUpdatePress: () => void;
  onUpdateFailure?: OnUpdateFailure;
  strings: UpdateModalStrings;
  language: string;
}

const UpdateModal: React.FC<UpdateModalProps> = ({
  isVisible,
  update,
  onUpdatePress,
  onLaterPress,
  onBackupUpdatePress,
  onUpdateFailure,
  strings,
  language,
}) => {
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
        onUpdateFailure,
        ...config,
      });
    },
    [onUpdateFailure, update],
  );

  const forceUpdate = useCallback(() => {
    setDownloadError(false);
    updateFeature({
      begin: () => {
        setUpdateLoading(true);
      },
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
  }, [strings.downloadErrorToast, updateFeature]);
  const silentUpdate = useCallback(() => {
    onBackupUpdatePress();
    updateFeature({
      begin: () => {
        Toast({ message: strings.downloadingBackgroundToast });
      },
      error: () => {
        Toast(strings.downloadErrorToast);
      },
    });
  }, [
    onBackupUpdatePress,
    strings.downloadingBackgroundToast,
    strings.downloadErrorToast,
    updateFeature,
  ]);

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
  }, [forceUpdate, silentUpdate, update.update_type]);

  const onInnerLaterPress = useCallback(() => {
    onLaterPress();
  }, []);

  return (
    <Popup
      visible={isVisible}
      round
      useNative
      style={styles.centeredView}
      statusBarTranslucent
      onRequestClose={() => {
        if (Platform.OS === "android") {
          if (update.update_type === "Force") return false;
          onInnerLaterPress();
          return true;
        } else {
          return update.update_type !== "Force";
        }
      }}
    >
      <View style={styles.modalView}>
        <View style={styles.containerInner}>
          <Image
            source={require("../assets/bg.png")}
            style={styles.bg}
            contentFit="fill"
          />
          {/* <Image source={require("../assets/logo.svg")} style={styles.logo} /> */}
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
  onUpdateFailure?: OnUpdateFailure;
  onVisibleChange?: (visible: boolean) => void;
  /** 与 visible 类似：自定义更新模式下由外部控制是否展示系统版本过低弹窗 */
  systemVersionLowVisible?: boolean;
  onSystemVersionLowVisibleChange?: (visible: boolean) => void;
  noUpdate?: () => void;
  /** 系统版本过低时的回调，可用于业务层埋点等 */
  onSystemVersionLow?: () => void;
}> = ({
  strings,
  language,
  enableCustomUpdate = false,
  update: outUpdate = null,
  visible: outVisible = false,
  systemVersionLowVisible: outSystemVersionLow = false,
  onUpdateFailure,
  onVisibleChange,
  onSystemVersionLowVisibleChange,
  noUpdate,
  onSystemVersionLow,
}) => {
  const [update, setUpdate] = useState<null | Update>(outUpdate);
  const [visible, setVisible] = useState(outVisible);
  const [systemVersionLow, setSystemVersionLow] = useState(outSystemVersionLow);

  useEffect(() => {
    if (enableCustomUpdate) return;
    fetchAppUpdate()
      .then(async (res) => {
        if (res.need_update && res.should_update_system_version) {
          // 有新版本但系统版本过低，弹出阻塞式提示
          setSystemVersionLow(true);
          onSystemVersionLowVisibleChange?.(true);
          onSystemVersionLow?.();
          return;
        }
        if (res.need_update && res.update_type !== "Silent") {
          // 如果是强制更新，直接弹出更新
          if (res.update_type === "Suggestion") {
            // 如果是建议更新，进入4次app后弹出更新
            const count = Number(
              (await XRNNativeStorage.getItem("app_update_suggestion_count")) ||
                0,
            );
            if (count < 3) {
              const newCount = (Number(count) || 0) + 1;
              XRNNativeStorage.setItem(
                "app_update_suggestion_count",
                String(newCount),
              );
              noUpdate?.();
              return;
            }
            XRNNativeStorage.removeItem("app_update_suggestion_count");
          }
          // Android only: persist result and broadcast to other bundles/modules.
          if (Platform.OS === "android") {
            const payload = createAppUpdateCheckResultPayload(res);
            await persistAppUpdateCheckResult(payload);
            pushAllEvent(UPDATE_VERSION_ANDROID_EVENT, payload);
            noUpdate?.();
            return;
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

  useEffect(() => {
    if (!enableCustomUpdate) return;
    if (outSystemVersionLow !== systemVersionLow) {
      setSystemVersionLow(outSystemVersionLow);
    }
  }, [outSystemVersionLow, systemVersionLow]);

  const hide = useCallback(() => {
    setVisible(false);
    onVisibleChange?.(false);
  }, [setVisible]);

  const later = useCallback(() => {
    hide();
    if (Platform.OS === "android") {
      noUpdate?.();
    }
  }, [hide, noUpdate]);

  if (systemVersionLow) {
    return (
      <SystemVersionLowModal
        visible={systemVersionLow}
        title={strings.systemVersionLowTitle}
        message={strings.systemVersionLowMessage}
        exitButtonText={strings.systemVersionLowExitButtonText}
        upgradeButtonText={strings.systemVersionLowUpgradeButtonText}
      />
    );
  }

  if (!update) return null;

  return (
    <UpdateModal
      language={language}
      isVisible={visible}
      update={update}
      onUpdatePress={() => {}}
      onLaterPress={later}
      onBackupUpdatePress={hide}
      onUpdateFailure={onUpdateFailure}
      strings={strings}
    />
  );
};
