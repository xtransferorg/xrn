import React, {useEffect, useState} from 'react';
import {StyleSheet} from 'react-native';
import {Page, Section} from '../components/Page';
import {XRNLoading} from '@xrnjs/core';
import Button from '../components/Button';

export default function XrnLoadingScreen() {
  const {showLoading, hideLoading, updateProgress} = XRNLoading;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    updateProgress(progress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  return (
    <Page>
      <Button
        style={styles.button}
        title="显示loading"
        onPress={() => {
          console.log('点击了showLoading');

          showLoading();
          const timer = setInterval(() => {
            setProgress(preProgress => {
              if (preProgress >= 100) {
                clearInterval(timer);
                hideLoading();
                return 0;
              }
              return preProgress + 20;
            });
          }, 1000);
        }}
      />
      {/* <TouchableOpacity onPress={() => setProgress(progress + 10)}>
        <Text>进度+10</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => hideLoading()}>
        <Text>隐藏进度</Text>
      </TouchableOpacity> */}
    </Page>
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 20,
  },
});

XrnLoadingScreen.navigationOptions = {
  title: 'XrnLoading',
};
