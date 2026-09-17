import React, { useCallback, useEffect } from "react";
import { TouchableOpacity, View, Text, Share } from "react-native";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";

import RequestDetails from "../../core/networkLogger/src/components/RequestDetails";
import styles from "./style";
import { sensorsFundClick, sensorsFundPageView } from "../../utils/sensorsTrack";
import { ROUTES } from "../..";
import Clipboard from "@react-native-clipboard/clipboard";

const NetworkDetail: React.FC = (props: any) => {
  // const { request } = props?.route?.params;
  const { request } = props?.navigation?.state?.params || {};

  useEffect(() => {
    sensorsFundPageView({ module_name: `devtools_${ROUTES.NetworkDetail}` });
  }, []);

  const _shareCURL = useCallback(() => {
    Clipboard.setString(request.curlRequest);
    sensorsFundClick({ button_name: 'devtools_btn_click', devtools_click_btn_name: '网络日志 分享Curl' });
  }, []);

  const renderRightButton = () => {
    return (
      <TouchableOpacity style={styles.detailNavRightBox} onPress={() => _shareCURL()}>
        <Text style={styles.detailNavRightText}>分享CURL</Text>
      </TouchableOpacity>
    );
  };

  const rightButton = useNavRightButton(renderRightButton);

  return (
    <Page title="请求详情" rightButton={rightButton}>
      <View style={styles.container}>
        <RequestDetails request={request} />
      </View>
    </Page>
  );
};

export default NetworkDetail;
