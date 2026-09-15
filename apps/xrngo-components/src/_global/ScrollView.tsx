import React from 'react';
import {ScrollView, ScrollViewProps, View} from 'react-native';

interface IProps extends ScrollViewProps {
  noScroll?: boolean;
  children?: React.ReactNode;
}

export default ({noScroll = false, children, ...resProps}: IProps) => {
  return !noScroll ? (
    <ScrollView keyboardShouldPersistTaps={'handled'} {...resProps}>
      {children}
    </ScrollView>
  ) : (
    <View {...resProps}>{children}</View>
  );
};
