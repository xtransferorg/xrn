import React, {FC} from 'react';
import {View, Text, StyleSheet, ViewProps} from 'react-native';

interface Props extends ViewProps {
  title?: string;
  card?: boolean;
  contentStyle?: ViewProps['style'];
  inset?: boolean;
}

const DemoBlock: FC<Props> = ({
  title,
  card,
  children,
  contentStyle,
  inset,
  ...rest
}) => {
  return (
    <View style={styles.section} {...rest}>
      {title && (
        <View style={styles.title}>
          <Text style={{color: '#969799'}}>{title}</Text>
        </View>
      )}
      <View style={[inset && styles.contentInset, contentStyle]}>
        {card ? (
          <View style={[styles.card, title ? styles.titleCard : null]}>
            {children}
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 10,
    backgroundColor: '#fff',
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
    borderRadius: 4,
  },
  card: {
    marginHorizontal: 12,
    marginTop: 12,
  },
  contentInset: {
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: '500',
    fontStyle: 16,
    margin: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  titleCard: {
    marginTop: 0,
  },
});

export default DemoBlock;
