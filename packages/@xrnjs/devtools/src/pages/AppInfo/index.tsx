import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import env from "react-native-config";
import DeviceInfoModule from "react-native-device-info";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";

import styles from "./style";
import { DeviceInfoItem } from "./type";
import { nativeToast } from "../../utils/toast";
import { ROUTES } from "../..";

const packageJson = require("../../../package.json");

const AppInfo: React.FC = () => {
  const infoList: DeviceInfoItem[] = [];
  const [data, setData] = useState<DeviceInfoItem[]>(infoList);

  useEffect(() => {
    if (DeviceInfoModule?.getApplicationName) {
      infoList.push({
        title: "App名称",
        value: DeviceInfoModule?.getApplicationName?.(),
      });
    }

    if (DeviceInfoModule.getVersion) {
      infoList.push({
        title: "APP 版本号",
        value: DeviceInfoModule.getVersion(),
      });
    }

    if (DeviceInfoModule.getBuildNumber) {
      infoList.push({
        title: "构建版本号",
        value: DeviceInfoModule.getBuildNumber(),
      });
    }

    if (DeviceInfoModule.getBundleId) {
      infoList.push({
        title: "APP包名",
        value: DeviceInfoModule.getBundleId(),
      });
    }

    if (env.ENV_NAME) {
      infoList.push({
        title: "ENV_NAME",
        value: env.ENV_NAME,
      });
    }

    infoList.push({
      title: "devtools版本",
      value: packageJson?.version,
    });

    if (DeviceInfoModule.getInstallerPackageNameSync) {
      infoList.push({
        title: "安装包名称",
        value: DeviceInfoModule.getInstallerPackageNameSync(),
      });
    }

    if (DeviceInfoModule.getFirstInstallTimeSync) {
      infoList.push({
        title: "安装时间",
        value: _formatDate(DeviceInfoModule.getFirstInstallTimeSync()),
      });
    }

    setData(infoList);
  }, []);

  const _listHeader = () => {
    return <View />;
  };

  const _formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;
    return formattedDate;
  };

  const _copyClick = (value: string) => {
    Clipboard.setString(value);
    nativeToast("复制成功");
  };

  const _copyAll = () => {
    const str = _formatCopyStr(data);
    Clipboard.setString(str);
    nativeToast("一键复制成功");
  };

  const _formatCopyStr = (data: DeviceInfoItem[]): string => {
    return data.map((item) => `${item.title}:\n${item.value}`).join("\n");
  };

  const _renderItem = ({ item }: { item: DeviceInfoItem }) => {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.tipContainer}>
          <Text style={styles.key}>{`${item.title}：`}</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{item.value}</Text>
            <TouchableOpacity
              accessibilityLabel="copyBtn.8984a1f7"
              style={styles.copyBtn}
              onPress={() => _copyClick(`${item.title}：\n${item.value}`)}
            >
              <Image
                style={styles.copyIcon}
                source={require("../../../assets/copy_icon.png")}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const rightButton = useNavRightButton(() => {
    return (
      <TouchableOpacity
        accessibilityLabel="navRightBtn.a7510261"
        style={styles.navRightBtn}
        onPress={() => _copyAll()}
      >
        <Text style={styles.rightBtnText}>一键复制</Text>
      </TouchableOpacity>
    );
  });

  return (
    <Page title="App信息" rightButton={rightButton} hideHeader translucent>
      <View style={styles.container}>
        <FlatList
          data={data}
          renderItem={_renderItem}
          keyExtractor={(item) => item.title}
          ListHeaderComponent={_listHeader}
        />
      </View>
    </Page>
  );
};

export default AppInfo;
