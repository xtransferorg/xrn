import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, Platform} from 'react-native';
import {PullToRefresh} from '@xrnjs/ui';

const data: any = [];
for (let i = 0; i < 500; i++) {
  data.push({
    key: `data-${i}`,
    text: `number: ${i}`,
    on: false,
  });
}

const Item = ({title}: {title: string}) => (
  <View style={styles.item}>
    <Text style={styles.title}>
      {title} <Text>{Platform.OS}</Text>
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    marginHorizontal: 16,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
  },
});

const PullToRefreshScreen = () => {
  const [loading, setLoading] = useState(false);

  const onRefresh = () => {
    setLoading(true);
    return new Promise(resolve => {
      setTimeout(() => {
        setLoading(false);
        resolve('');
      }, 3000);
    });
  };

  return (
    <PullToRefresh refreshing={loading} onRefresh={onRefresh}>
      <FlatList
        style={{height: 600, backgroundColor: 'grey', overflow: 'scroll'}}
        data={data}
        renderItem={(renderItem: any) => {
          const {item} = renderItem;
          return <Item title={item.key} />;
        }}
      />
    </PullToRefresh>
  );
};

export default PullToRefreshScreen;
