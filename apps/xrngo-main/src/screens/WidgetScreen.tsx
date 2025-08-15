import React from 'react';
import {ScrollView, Text} from 'react-native';
import {useNavigation} from '@xrnjs/core';
import {List, Title, Space, Card, Provider} from '@xrnjs/ui';

const WidgetScreen = function WidgetScreen() {
  const navigation = useNavigation();
  return (
    <ScrollView style={{padding: 16}}>
      <Space gap={20}>
        <Card>
          <List header={<Title style={{padding: 12}}>组件库</Title>}>
            <List.Item
              onPress={() => {
                navigation.navigate('/xt-package-xrn/Main', {
                  params: {
                    index: 'layout',
                  },
                });
              }}>
              布局
            </List.Item>
            <List.Item
              onPress={() => {
                navigation.navigate('/xt-package-xrn/Main', {
                  params: {
                    index: 'navigation',
                  },
                });
              }}>
              导航
            </List.Item>
            <List.Item
              onPress={() => {
                navigation.navigate('/xt-package-xrn/Main', {
                  params: {
                    index: 'data',
                  },
                });
              }}>
              信息展示
            </List.Item>
            <List.Item
              onPress={() => {
                navigation.navigate('/xt-package-xrn/Main', {
                  params: {
                    index: 'feedback',
                  },
                });
              }}>
              反馈
            </List.Item>
            <List.Item
              onPress={() => {
                navigation.navigate('/xt-package-xrn/Main', {
                  params: {
                    index: 'general',
                  },
                });
              }}>
              通用
            </List.Item>
            <List.Item
              onPress={() => {
                navigation.navigate('/xt-package-xrn/Main', {
                  params: {
                    index: 'form',
                  },
                });
              }}>
              信息录入
            </List.Item>
          </List>
        </Card>
      </Space>
    </ScrollView>
  );
};

export default WidgetScreen;
