import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {StatusBar, StyleSheet, ScrollView} from 'react-native';
import {Card, List, Space, Title} from '@xrnjs/ui';
import {ScreenConfig} from '../types/ScreenConfig';
import {ScrollPage} from '../components/Page';

export interface ListElement extends ScreenConfig {
  isAvailable?: boolean;
}

interface Props {
  apis: ListElement[];
  sort?: boolean;
}

function ComponentList(props: Props) {
  const nav = useNavigation();

  const sortedApis = React.useMemo(() => {
    if (props.sort === false) {
      return props.apis;
    }
    return props.apis.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        if (a.isAvailable) {
          return -1;
        }
        return 1;
      }
      return a.name?.toLowerCase() > b.name?.toLowerCase() ? 1 : -1;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.apis]);

  return (
    <List>
      {sortedApis.map(item => {
        const title = `${item.showName || item.name} ${
          item.packageName ? `(${item.packageName})` : ''
        }`;
        return (
          <List.Item
            key={item.name}
            description={item.description}
            onPress={() => {
              console.log(
                'item.route',
                item.route,
                'item.onClick',
                item.onClick,
              );
              if (item.onClick) {
                item.onClick();
              } else {
                // @ts-ignore
                nav.navigate(item.route);
              }
            }}>
            {title}
          </List.Item>
        );
      })}
    </List>
  );
}

export default function ComponentListScreen(props: Props) {
  React.useEffect(() => {
    StatusBar.setHidden(false);
  }, []);

  return (
    <ScrollView>
      <ComponentList {...props} />
    </ScrollView>
  );
}

export function GroupComponentListScreen(props: Props) {
  // 定义一个方法，根据groupName返回权重
  const getGroupWeight = (groupName: string) => {
    const groupWeights: Record<string, number> = {
      未分类: 0,
      监控与性能: 50,
      网络通信: 60,
      资源管理: 40,
      工具函数: 70,
      界面组件: 90,
      数据存储: 20,
      通知与推送: 80,
      路由与导航: 30,
      安全与认证: 100,
    };
    return groupWeights[groupName] || 100; // 默认权重为100
  };

  const groupedApis = React.useMemo(() => {
    const groups: Record<string, ListElement[]> = {};

    props.apis.forEach(api => {
      const groupName = api.group || '未分类';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(api);
    });

    // 按照权重对groups的groupName排序
    const sortedGroups = Object.entries(groups).sort(([groupA], [groupB]) => {
      return getGroupWeight(groupA) - getGroupWeight(groupB);
    });

    return sortedGroups;
  }, [props.apis]);

  return (
    <ScrollPage>
      <Space>
        {groupedApis.map(([groupName, items]) => (
          <Card key={groupName} title={groupName}>
            <ComponentList
              apis={items
                .filter(item => item.isAvailable)
                .map(item => ({...item, showName: item.showName || item.name}))}
            />
          </Card>
        ))}
      </Space>
    </ScrollPage>
  );
}
const styles = StyleSheet.create({
  wrapper: {padding: 16},
});
