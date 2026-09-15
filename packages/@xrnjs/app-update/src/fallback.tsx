import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Image } from "@xrnjs/image";
import {
  Toast,
  Progress,
  Popup,
  Button,
  Fill,
  Space,
  ErrorBlock,
} from "@xrnjs/ui";

import { getStrings } from "./strings";
import styles from "./styles";
import { SystemVersionLowModal } from "./system-version-low-modal";
import { downloadAndApplyUpdate, fetchAppUpdate } from "./update";
import type { OnUpdateFailure, Update } from "./update";

interface FallbackPageProps {
  language?: string;
  onUpdateFailure?: OnUpdateFailure;
}

export const FallbackPage: React.FC<FallbackPageProps> = ({
  language = "zh",
  onUpdateFailure,
}) => {
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(false);
  const [update, setUpdate] = useState<Update | null>(null);
  const [systemVersionLowVisible, setSystemVersionLowVisible] = useState(false);

  const strings = getStrings(language);

  const changelogs = (() => {
    if (!update) return [strings.update_description];
    try {
      return (
        JSON.parse(update.changelog)[language] || [strings.update_description]
      );
    } catch {
      return [strings.update_description];
    }
  })();

  const updateFeature = (config = {}) => {
    if (!update) return;
    downloadAndApplyUpdate(update, {
      begin: () => {},
      onUpdateFailure,
      ...config,
    });
  };

  const forceUpdate = () => {
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
        Toast(strings.download_error_toast);
      },
    });
  };

  const handleUpgradePress = async () => {
    try {
      const updateData = await fetchAppUpdate();
      if (updateData.need_update && updateData.should_update_system_version) {
        setSystemVersionLowVisible(true);
      } else if (updateData.need_update) {
        setUpdate(updateData);
        setUpdateModalVisible(true);
      } else {
        Toast(strings.already_latest_version);
      }
    } catch (error) {
      console.error("检查更新失败:", error);
      Toast(strings.check_update_failed);
    }
  };

  const handleLaterPress = () => {
    setUpdateModalVisible(false);
  };

  return (
    <>
      <SystemVersionLowModal
        visible={systemVersionLowVisible}
        title={strings.system_version_low_title}
        message={strings.system_version_low_message}
        exitButtonText={strings.system_version_low_exit_button_text}
        upgradeButtonText={strings.system_version_low_upgrade_button_text}
      />

      <ErrorBlock
        style={{
          paddingHorizontal: 16,
        }}
        image={
          <Image
            source={require("../assets/not_support.png")}
            style={{ width: 134, height: 134 }}
            contentFit="fill"
          />
        }
        title={strings.title}
        status="systemCompatibility"
        description={
          <Text style={{ color: "#696680" }}>{strings.description}</Text>
        }
        footer={
          <View style={{ marginTop: 16, width: "100%" }}>
            <Button onPress={handleUpgradePress}>
              {strings.upgrade_button_text}
            </Button>
          </View>
        }
      />

      {/* 升级弹框 */}
      <Popup
        visible={updateModalVisible}
        round
        useNative
        style={styles.centeredView}
        statusBarTranslucent
        onRequestClose={() => {
          return update?.update_type !== "Force";
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
            <Text style={styles.subtitle}>{strings.new_version_found}</Text>

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
                    {strings.downloading_progress_text}
                  </Text>
                </View>
              )}
              {!updateLoading && (
                <Space gap={16} direction="vertical">
                  <Button onPress={forceUpdate}>
                    {downloadError
                      ? strings.update_error_button_text
                      : strings.upgrade_button_text}
                  </Button>
                  {update?.update_type !== "Force" && (
                    <Button onPress={handleLaterPress} fill={Fill.weak}>
                      {strings.later_button_text}
                    </Button>
                  )}
                </Space>
              )}
            </View>
          </View>
        </View>
      </Popup>
    </>
  );
};
