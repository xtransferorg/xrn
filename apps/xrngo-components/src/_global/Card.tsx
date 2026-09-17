import React from 'react';
import {StyleProp, Text, ViewStyle} from 'react-native';
import {Card, Space, ShouldRender} from '@xrnjs/ui';

interface IProps {
  children?: React.ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  gap?: number | 's' | 'm' | 'l';
  noSpace?: boolean;
}

export default ({
  children,
  title,
  style,
  itemStyle,
  gap,
  noSpace,
}: IProps) => {
  return (
    <Card style={[{padding: 10}, style]}>
      <ShouldRender condition={!!title}>
        <Text style={{marginBottom: 10}}>{title}</Text>
      </ShouldRender>
      {/* @ts-ignore */}
      {noSpace ? (
        children
      ) : (
        <Space itemStyle={itemStyle} gap={gap ?? 's'}>
          {children}
        </Space>
      )}
    </Card>
  );
};
