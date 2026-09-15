/* eslint-disable react-native/no-inline-styles */
import React, {FC, useEffect, useState} from 'react';
import {Text, SafeAreaView, View, TouchableOpacity} from 'react-native';
import {Filter, VirtualList, VirtualListProps} from '@xrnjs/ui';
import styles from './style';

const newData = Array.from({length: 20}, (_, index) => ({
  title: (0 + index + 1).toString(),
}));

const VirtualListScreen: FC<VirtualListProps<{flashListProps: any}>> = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isBottom, setIsBottom] = useState(false);

  useEffect(() => {
    if (data.length === 0) {
      setIsLoading(true);
      setTimeout(() => {
        setData(newData as never);
        setIsLoading(false);
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setData(newData as never);
      setIsLoading(false);
    }, 1000);
  };

  const loadMoreData = () => {
    if (!isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        const newData = Array.from({length: 20}, (_, index) => ({
          title: (data.length + index + 1).toString(),
        }));
        setData([...data, ...newData] as never);
        setIsLoadingMore(false);
        if ([...data, ...newData].length > 40) {
          setIsBottom(true);
          setIsLoadingMore(true);
        }
      }, 1000);
    }
  };

  const getItemLayout = (_: any, index: number) => ({
    length: 20, // 确切的项高度
    offset: 20 * index,
    index,
  });

  const onPress = (a: any) => {
    console.log(a);
  };

  const renderItem = ({item}: any) => {
    return (
      <TouchableOpacity onPress={() => onPress(item)} key={item.title}>
        <Text
          style={{
            backgroundColor: '#f9c2ff',
            padding: 20,
            marginVertical: 10,
          }}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, paddingHorizontal: 10}}>
      <Filter>
        <Filter.Item placeholder="标签名称1">
          <View style={styles.panel100}>
            <Text>这是内容1</Text>
          </View>
        </Filter.Item>
        <Filter.Item placeholder="标签名称2">
          <View style={styles.panel100}>
            <Text>这是内容2</Text>
          </View>
        </Filter.Item>
        <Filter.Item placeholder="标签名称3">
          <View style={styles.panel100}>
            <Text>这是内容3</Text>
          </View>
        </Filter.Item>
      </Filter>
      <VirtualList
        data={data}
        style={{height: '100%'}}
        refreshing={isLoading}
        onRefresh={reloadData}
        onEndReachedThreshold={0.2}
        initialNumToRender={20}
        onEndReached={loadMoreData} // Add this
        getItemLayout={getItemLayout}
        isEndReached={isBottom}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

export default VirtualListScreen;
