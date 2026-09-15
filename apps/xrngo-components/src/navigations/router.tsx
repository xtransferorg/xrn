import {View, TouchableWithoutFeedback, Text} from 'react-native';
import React, {FC, useCallback, useState} from 'react';
import {IconMAReturn1} from '@xrnjs/ui';
import {useLanguage, useThemeDemo} from '../Lang';
import {
  Button,
  Field,
  Fill,
  FloatingLayer,
  Input,
  LangType,
  Picker,
  Space,
} from '@xrnjs/ui';
import {useAsyncStorage} from '../storage';
import {THEME_TOKEN} from 'root/Theme/constant';
import {getThemeToken, TThemeKey} from './getThemeToken';
import {merge} from 'lodash';
const langColumns = [
  {value: LangType.zh_HK, label: '繁体'},
  {value: LangType.en_US, label: '英文'},
  {value: LangType.zh_CN, label: '中文'},
  {value: LangType.es_ES, label: '西语'},
];

const HeaderRight = ({keys}: {keys: TThemeKey}) => {
  const [visible, setVisible] = useState(false);
  const {setLang, lang} = useLanguage();
  const {token, setToken} = useThemeDemo();
  const compentToken = getThemeToken(keys, token);
  const [localToken, setLocalToken] = useState(compentToken || token);
  const {setItem} = useAsyncStorage('XTD_RN_LANG');

  const onChangTheme = useCallback(() => {
    setToken(merge({}, token, localToken));
    setVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localToken, setToken]);

  const onResetTheme = useCallback(() => {
    setToken(THEME_TOKEN);
    setLocalToken(getThemeToken(keys, THEME_TOKEN) || THEME_TOKEN);
  }, [setToken, keys]);

  const onVisibleThemeModel = useCallback(() => {
    setVisible(true);
  }, []);

  return (
    <View style={{flexDirection: 'row'}}>
      <TouchableWithoutFeedback onPress={onVisibleThemeModel}>
        <View style={{padding: 14, paddingRight: 0}}>
          <Text>更换主题</Text>
        </View>
      </TouchableWithoutFeedback>
      <FloatingLayer
        useNative
        visible={visible}
        showConfirmButton={false}
        footer={
          <Space direction="horizontal">
            <Button fill={Fill.weak} onPress={onResetTheme}>
              重置
            </Button>
            <Button onPress={onChangTheme}>确认</Button>
          </Space>
        }
        onCancel={() => setVisible(false)}
        onPressOverlay={() => setVisible(false)}>
        {/* 方便移动端调试设置值，设置paddingTop:180 */}
        <View style={{width: '100%', paddingTop: 180}}>
          {Object.entries(localToken).map(([key, v1]) => (
            <Field label={key} layout="horizontal" key={key} requiredMark>
              <Input
                placeholder="请输入主题色"
                value={String(v1)}
                onChange={v2 =>
                  setLocalToken(s => ({
                    ...s,
                    [key]: /^\d+$/.test(v2) ? Number(v2) : v2,
                  }))
                }
              />
            </Field>
          ))}
        </View>
      </FloatingLayer>
      <TouchableWithoutFeedback
        onPress={() =>
          Picker({
            // @ts-ignore
            defaultValue: [lang],
            columns: langColumns,
          }).then(data => {
            if (data.action === 'confirm') {
              setLang(data.values[0] as LangType);
              setItem(data.values[0] as string);
            }
          })
        }>
        <View style={{padding: 14}}>
          <Text>{langColumns.find(item => item.value === lang)?.label}</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const Container: FC<{children: any; onBack?: any; navigation?: any}> = ({
  children,
}) => {
  return children;
};

export const routerWithTitle = (routerConfigs: Array<any>) => {
  const routerConfig: any = {};
  const routerHashSet = new Set();
  routerConfigs.forEach(item => {
    if (routerHashSet.has(item.path)) {
      throw new Error(`路由名称${item.path}已存在`);
    }
    routerHashSet.add(item.path);
    routerConfig[item.path] = {
      screen: (props = {}) => {
        return (
          <Container {...props}>
            <item.component {...props} />
          </Container>
        );
      },
      navigationOptions: ({navigation}: any) => {
        if (item.theme?.length > 0) {
        }
        const hideHeader = navigation?.getParam('hideHeader');
        if (hideHeader) {
          return {header: null};
        }

        return {
          title: navigation?.getParam('pageTitle'),
          headerLeft: () =>
            navigation.state.routeName === 'HomeScreen' ? (
              <></>
            ) : (
              <TouchableWithoutFeedback
                accessibilityLabel="headerLeft"
                onPress={() => {
                  if (navigation?.getParam('onBack')) {
                    navigation?.getParam('onBack')();
                  } else {
                    navigation?.goBack();
                  }
                }}>
                <View style={{paddingLeft: 14}}>
                  <IconMAReturn1 size={24} />
                </View>
              </TouchableWithoutFeedback>
            ),
          headerRight: () => {
            return (
              navigation?.getParam('headerRight') || (
                <HeaderRight keys={item?.themeKeys} />
              )
            );
          },
        };
      },
    };
  });
  return routerConfig;
};
