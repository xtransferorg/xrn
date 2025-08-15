import {
  SectionList,
  SectionListRenderItem,
  View,
  Text,
  ViewToken,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {ScreenConfig} from '../types/ScreenConfig';
import React, {useMemo, useRef} from 'react';

/**
 * Group数据
 */
export class Group {
  /**
   * Group名
   */
  name: string;
  /**
   * Group描述
   */
  desc: string;
  /**
   * Group key，唯一标识 Group
   * Item 通过 key 匹配到 Group
   */
  groupKey: string;
  /**
   * 优先级
   * 用于 Group 之间排序
   */
  priority?: number;
}

/**
 * Item 数据
 */
export class Item {
  /**
   * Item 名
   */
  name: string;
  /**
   * Item 描述
   */
  desc?: string;
  /**
   * Item key，唯一标识
   */
  itemKey: string;
  /**
   * Group Key，用于匹配到 Group
   */
  groupKey: string;
  /**
   * 关键字
   * Item之间通过 keyword 排序，相同关键字的会放在一块；
   */
  keyword: string;
}

/**
 * GroupListScreen Props
 */
export class GroupListProps {
  /**
   * Item 数组
   */
  items: Item[];
  /**
   * 绘制 Item
   */
  renderItem: (item: Item) => React.ReactElement;
  /**
   * 绘制 Item 之间分隔
   */
  renderItemSeparator?: () => React.ReactElement;
  /**
   * Group 数组
   */
  groups: Group[];
  /**
   * Group索引容器 Style
   */
  groupIndexContainerStyle?: object;
  /**
   * 绘制Group索引的标签
   */
  renderGroupIndexLabel?: (groups: Group[]) => React.ReactElement;
  /**
   * 绘制Group索引
   */
  renderGroupIndex?: (group: Group) => React.ReactElement;
  /**
   * 绘制 Group 头部
   */
  renderGroupHeader: (group: Group) => React.ReactElement;
  /**
   * 绘制 Group 底部
   */
  renderGroupFooter: (group: Group) => React.ReactElement;
  /**
   * 绘制 Group 之间分隔
   */
  renderGroupSeparator?: () => React.ReactElement;
  /**
   * 绘制整个 GroupList 头部
   */
  renderGroupListHeader?: () => React.ReactElement;
  /**
   * 绘制整个 GroupList 底部
   */
  renderGroupListFooter?: () => React.ReactElement;
}

/**
 * 用于 SectionList 数据
 */
class GroupListItemInfo {
  group: Group;
  data: Item[];
}

/**
 * 未分类 Group
 */
const GROUP_UNKNOWN: Group = {
  name: '其他',
  desc: '未分类',
  groupKey: 'unknown',
  priority: 9999,
};

export function GroupListScreen(props: GroupListProps) {
  const sectionListRef = useRef<SectionList>(null);
  const groupData: Group[] = useMemo(() => {
    return props.groups.sort((first, second) => {
      return first.priority - second.priority;
    });
  }, [props.groups]);
  const showData: GroupListItemInfo[] = useMemo(() => {
    //Item排序
    props.items.sort((first, second) => {
      return first.keyword < second.keyword ? -1 : 1;
    });
    //Group排序
    props.groups.sort((first, second) => {
      return first.priority - second.priority;
    });
    //添加 Item 到 GroupListItemInfo 中
    const groupMap = new Map<string, GroupListItemInfo>();
    props.items.forEach(item => {
      let groupListItem: GroupListItemInfo = groupMap.get(item.groupKey);
      if (!groupListItem) {
        //groupMap 没有匹配到 分类
        let matchGroup: Group = props.groups.find((group: Group) => {
          return group.groupKey === item.groupKey ? group : null;
        });
        if (matchGroup) {
          //匹配到分类
          groupListItem = {
            group: matchGroup,
            data: [],
          };
          groupMap.set(groupListItem.group.groupKey, groupListItem);
        }
      }
      //未匹配到分类
      if (!groupListItem) {
        groupListItem = groupMap.get(GROUP_UNKNOWN.groupKey);
        if (!groupListItem) {
          groupListItem = {
            group: GROUP_UNKNOWN,
            data: [],
          };
          groupMap.set(groupListItem.group.groupKey, groupListItem);
        }
      }
      groupListItem.data.push(item);
    });
    return [...groupMap.values()].sort(
      (first: GroupListItemInfo, seconde: GroupListItemInfo) => {
        return first.group.priority - seconde.group.priority;
      },
    );
  }, [props.groups, props.items]);
  return (
    <View style={styles.root}>
      {props.renderGroupIndex && (
        <View style={props.groupIndexContainerStyle}>
          {props.renderGroupIndexLabel &&
            props.renderGroupIndexLabel(groupData)}
          {props.renderGroupIndex && (
            <FlatList
              contentContainerStyle={styles.flatListContentContainer}
              data={groupData}
              keyExtractor={group => {
                return group.groupKey;
              }}
              renderItem={({item, index}) => {
                const element = props.renderGroupIndex(item);
                return (
                  <TouchableOpacity
                    onPress={() => {
                      sectionListRef.current.scrollToLocation({
                        animated: true,
                        sectionIndex: index,
                        itemIndex: 1,
                      });
                    }}>
                    {element}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}
      <SectionList
        style={styles.sectionList}
        ref={sectionListRef}
        sections={showData}
        keyExtractor={item => {
          return item.itemKey;
        }}
        renderItem={({item}) => {
          return props.renderItem(item);
        }}
        renderSectionHeader={({section}) => {
          // console.log(`info=${JSON.stringify(section)}`);
          return props.renderGroupHeader(section.group);
        }}
        renderSectionFooter={({section}) => {
          return props.renderGroupFooter(section.group);
        }}
        ItemSeparatorComponent={() => {
          return props.renderItemSeparator?.() ?? null;
        }}
        ListHeaderComponent={() => {
          return props.renderGroupListHeader?.() ?? null;
        }}
        ListFooterComponent={() => {
          return props.renderGroupListFooter?.() ?? null;
        }}
        SectionSeparatorComponent={() => {
          return props.renderGroupSeparator?.() ?? null;
        }}
        stickySectionHeadersEnabled={true}
        onViewableItemsChanged={info => {
          // info.viewableItems
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    height: '100%',
  },
  flatListItemContainer: {
    backgroundColor: '#ffff00',
  },
  flatListContentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // 允许自动换行
    justifyContent: 'flex-start',
  },
  sectionList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
