import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";
import NetworkLogger from "../../core/networkLogger/src";
import styles from "./style";
import { sensorsFundPageView } from "../../utils/sensorsTrack";
import { ROUTES } from "../..";

const NetworkInfo: React.FC = (props: any) => {
  const { navigation } = props;
  useEffect(() => {
    sensorsFundPageView({ module_name: `devtools_${ROUTES.NetworkInfo}` });
  }, []);

  return (
    <Page title="请求列表">
      <View style={styles.container}>
        <NetworkLogger navigation={navigation} />
      </View>
    </Page>
  );
};

export default NetworkInfo;
