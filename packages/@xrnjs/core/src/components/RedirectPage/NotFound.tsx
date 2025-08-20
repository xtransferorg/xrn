import React, { FC, useState } from "react";
import { checkRNUpdate } from "../../utils/codePushUtils";
import { useMount } from "ahooks";
import { Button, Text, View } from "react-native";
// import * as Sentry from '@sentry/react-native';
// import { getCurrentModuleInfo } from '@xrnjs/navigation';

interface CodePushResult {
  loading: boolean;
  progress: number;
  errorMsg: string;
  updateToDate: boolean;
}

interface NotFoundProps {
  isMain?: boolean;
}

export const NotFound: FC<NotFoundProps> = ({ isMain = false }) => {
  const [codePushResult, setCodePushResult] = useState<CodePushResult>({
    loading: false,
    progress: 0,
    errorMsg: "",
    updateToDate: false,
  });

  const { loading } = codePushResult;

  const checkUpdate = () => {
    return checkRNUpdate({
      isMain,
      shouldUpdate: true,
      onStart: () => {
        setCodePushResult({ ...codePushResult, loading: true });
      },
      onDownload: (progress) => {
        setCodePushResult({ ...codePushResult, progress });
      },
      onSuccess: () => {
        setCodePushResult({ ...codePushResult, loading: false });
      },

      onError: (e) => {
        setCodePushResult({ ...codePushResult, errorMsg: e.message });
      },
      onUpToDate: () => {
        setCodePushResult({ ...codePushResult, updateToDate: true });
      },
      onNoUpdate: () => {
        setCodePushResult({ ...codePushResult, loading: false });
      },
    });
  };

  useMount(async () => {
    checkUpdate();
    // const moduleInfo = (await getCurrentModuleInfo()) || {}
    // Sentry.captureException(new Error('404 Not Found'), {
    //   tags: {
    //     ...moduleInfo
    //   }
    // });
  });

  return loading ? (
    <View>
      <Text>loading...</Text>
    </View>
  ) : (
    <View>
      <Text>loading...</Text>

      <Button
        title="Retry"
        accessibilityLabel="404"
        onPress={() => {
          checkUpdate();
        }}
      />
    </View>
  );
};
