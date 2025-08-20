import * as React from 'react';
import {PropsWithChildren} from 'react';
import {StyleSheet, View, ScrollView, StyleProp, ViewStyle} from 'react-native';
import {Card} from '@xrnjs/ui';

const Page = ({
  style,
  children,
}: PropsWithChildren<{style?: StyleProp<ViewStyle>}>) => (
  <View style={[styles.page, style]}>{children}</View>
);

const ScrollPage = ({
  style,
  children,
}: PropsWithChildren<{style?: StyleProp<ViewStyle>}>) => (
  <ScrollView style={[styles.page, styles.scrollPage, style]}>
    {children}
  </ScrollView>
);

const Section = Card;
// <View style={styles.section}>
//   <View style={styles.sectionHeader}>
//     <Text style={styles.title}>{title}</Text>
//   </View>
//   <View style={{flexDirection: row ? 'row' : 'column', gap: 10}}>
//     {children}
//   </View>
// </View>

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollPage: {
    flex: 1,
  },
  section: {
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
    gap: 10,
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionContent: {
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    color: '#333333',
    fontWeight: 'bold',
  },
});

export {Page, ScrollPage, Section};
