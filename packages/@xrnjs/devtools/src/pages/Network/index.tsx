import React, { useCallback, useEffect } from "react";
import { View } from "react-native";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";
import NetworkLogger from "../../core/networkLogger/src";
import styles from "./style";
import { ROUTES } from "../..";

const NetworkInfo: React.FC = (props: any) => {
  const { navigation } = props;

  return (
    <Page title="请求列表" hideHeader>
      <View style={styles.container}>
        <NetworkLogger navigation={navigation} />
      </View>
    </Page>
  );
};

export default NetworkInfo;
