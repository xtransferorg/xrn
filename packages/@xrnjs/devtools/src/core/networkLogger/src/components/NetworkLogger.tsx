import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Share, Text } from 'react-native';
import logger from '../loggerSingleton';
import NetworkRequestInfo from '../NetworkRequestInfo';
import { Theme, ThemeContext, ThemeName } from '../theme';
import { DeepPartial } from '../types';
import RequestList from './RequestList';
import createHar from '../utils/createHar';
import Unmounted from './Unmounted';
import { AppContextProvider } from './AppContext';
import { nativeToast } from '../../../../utils/toast';
import Clipboard from "@react-native-clipboard/clipboard";

interface Props {
  theme?: ThemeName | DeepPartial<Theme>;
  sort?: 'asc' | 'desc';
  compact?: boolean;
  maxRows?: number;
  navigation?: any;
}

const sortRequests = (requests: NetworkRequestInfo[], sort: 'asc' | 'desc') => {
  if (sort === 'asc') {
    return requests.reverse();
  }
  return [...requests];
};

const NetworkLogger: React.FC<Props> = ({
  theme = 'light',
  sort = 'desc',
  compact = false,
  maxRows,
  navigation,
}) => {

  const [requests, setRequests] = useState(logger.getRequests());
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState<boolean>(logger.isPaused);

  useEffect(() => {
    logger.setCallback((updatedRequests: NetworkRequestInfo[]) => {
      setRequests([...updatedRequests]);
    });

    // logger.enableXHRInterception();
    setMounted(true);

    return () => {
      // no-op if component is unmounted
      logger.setCallback(() => {});
    };
  }, [sort]);

  const requestsInfo = useMemo(() => {
    return sortRequests(requests, sort).map((r) => r.toRow());
  }, [sort, requests]);

  const getHar = useCallback(async () => {
    const har = await createHar(logger.getRequests());
    Clipboard.setString(JSON.stringify(har));
    nativeToast("复制成功");
  }, []);

  const options = useMemo(() => {
    return [
      {
        text: paused ? '启用收集' : '暂停收集',
        onPress: async () => {
          setPaused((prev: boolean) => {
            logger.onPausedChange(!prev);
            return !prev;
          });
        },
      },
      {
        text: '清空日志',
        onPress: async () => {
          logger.clearRequests();
        },
      },
      {
        text: '导出所有日志',
        onPress: getHar,
      },
    ];
  }, [paused, getHar]);

  return (
    <ThemeContext.Provider value={theme}>
      <AppContextProvider>
        <View style={styles.container}>
          {mounted && !logger.enabled && !requests.length ? (
            <Unmounted />
          ) : (
            <>
              {paused && (
                <View style={styles.pausedBanner}>
                  <Text>网络收集已暂停</Text>
                </View>
              )}
              <RequestList
                compact={compact}
                requestsInfo={requestsInfo}
                options={options}
                maxRows={maxRows ?? requests.length}
                onPressItem={(id) => {
                  const request = requests.find((r) => r.id === id);
                  if (request) {
                    navigation?.navigate?.("NetworkDetail", { request });
                  } else {
                    nativeToast('未获取到request');
                  }
                }}
              />
            </>
          )}
        </View>
      </AppContextProvider>
    </ThemeContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pausedBanner: {
    backgroundColor: '#ff7c7c',
    padding: 10,
    alignItems: 'center',
  },
});

export { NetworkLogger as default, Props as NetworkLoggerProps };
