import React, { useCallback, useEffect } from "react";
import { TouchableOpacity, View, Text, Share } from "react-native";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";

import RequestDetails from "../../core/networkLogger/src/components/RequestDetails";
import styles from "./style";
import { ROUTES } from "../..";
import Clipboard from "@react-native-clipboard/clipboard";
import { nativeToast } from "../../utils/toast";

const NetworkDetail: React.FC = (props: any) => {
  const { request } = props?.navigation?.state?.params || {};

  const _shareCURL = useCallback(() => {
    // Share.share({ message: request.curlRequest });
    nativeToast("复制成功");
    Clipboard.setString(request.curlRequest);
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
    <Page title="请求详情" rightButton={rightButton} hideHeader>
      <View style={styles.container}>
        <RequestDetails request={request} />
      </View>
    </Page>
  );
};

export default NetworkDetail;
