import React, {useState} from 'react';
import {Alert, ScrollView, Text, View} from 'react-native';
import {List, Title, Space, Card, Modal, Provider} from '@xrnjs/ui';
import styles from './style';
import HeadInfo from '../../components/HeadInfo';
import PackageJson from '../../../package.json';
import {useNavToSubPage} from '../../utils';
import ReactNativeOhPkg from '@react-native-oh/react-native-harmony/package.json';

const AboutScreen = () => {
  const {navToSubPage, navToWebsite} = useNavToSubPage();
  const [visible2, setVisible2] = useState(false);
  return (
    <ScrollView style={styles.wrapper}>
      <Modal.Component
        title="版本信息"
        message={
          <View>
            <Text>
              React Native 版本：{PackageJson.dependencies['react-native']}
            </Text>
            <Text>
              React Native Harmony 版本：
              {(ReactNativeOhPkg as any).version}
            </Text>
          </View>
        }
        visible={visible2}
        onPressConfirm={() => {
          setVisible2(false);
        }}
        confirmButtonProps={{
          style: {
            backgroundColor: '#1E6fff',
          },
        }}
        solidButton
      />

      <Space gap={20}>
        <Card>
          <HeadInfo />
        </Card>
        <Card>
          <List header={<Title style={styles.title}>应用信息</Title>}>
            <List.Item
              onPress={() => {
                setVisible2(true);
              }}
              style={styles.singleItem}>
              React Native 版本
            </List.Item>
            <List.Item
              onPress={() => {
                console.log('点击了');
                navToSubPage('dependencies');
              }}
              style={styles.singleItem}>
              项目依赖
            </List.Item>
          </List>
        </Card>

        <Card>
          <List header={<Title style={styles.title}>相关链接</Title>}>
            <List.Item
              onPress={() => {
                const website = 'https://github.com/xtransferorg/xrn';
                navToWebsite(website);
              }}
              style={styles.singleItem}>
              项目源码
            </List.Item>
            <List.Item
              onPress={() => {
                const website = 'https://xtransferorg.github.io/xrn/';
                navToWebsite(website);
              }}
              style={styles.singleItem}>
              官方网站
            </List.Item>
          </List>
        </Card>
      </Space>
    </ScrollView>
  );
};

AboutScreen.navigationOptions = {
  title: '关于',
};

export default AboutScreen;
