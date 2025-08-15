import React from 'react';
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import HeadInfo from '../components/HeadInfo';
import {useNavToSubPage} from '../utils';
// import MemoScanIcon from '../components/icons/ScanIcon';

export default function HomeScreen() {
  const {navToSubPage} = useNavToSubPage();
  return (
    <View style={styles.container}>
      <HeadInfo />
      {/* <TouchableOpacity
        onPress={() => {
          navToSubPage('scanner');
        }}>
        <MemoScanIcon fillColor="#666" size={48} />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
});
