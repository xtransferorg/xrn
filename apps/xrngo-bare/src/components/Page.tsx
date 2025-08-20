import {useNavigation} from '@react-navigation/native';
import * as React from 'react';
import {PropsWithChildren, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  Text,
  StyleProp,
  ViewStyle,
  BackHandler,
  TouchableOpacity,
  I18nManager,
} from 'react-native';

const Page = ({
  style,
  children,
}: PropsWithChildren<{style?: StyleProp<ViewStyle>}>) => {
  const navigation = useNavigation();

  useEffect(() => {
    const handleBackPress = () => {
      navigation.goBack();
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () =>
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => {
        return (
          <TouchableOpacity
            accessibilityLabel="headerLeft"
            style={{
              height: 48,
              width: 48,
              padding: 12,
            }}
            onPress={async () => {
              navigation.goBack();
            }}>
            <Image
              style={{
                height: 24,
                width: 24,
                resizeMode: 'contain',
                transform: [{scaleX: I18nManager.isRTL ? -1 : 1}],
              }}
              source={require('../assets/back-icon.png')}
              fadeDuration={0}
            />
          </TouchableOpacity>
        );
      },
    });
  }, [navigation]);

  return <View style={[styles.page, style]}>{children}</View>;
};

const ScrollPage = ({
  style,
  children,
}: PropsWithChildren<{style?: StyleProp<ViewStyle>}>) => (
  <ScrollView style={[styles.page, styles.scrollPage, style]}>
    {children}
  </ScrollView>
);

type SectionProps = PropsWithChildren<{title: string; row?: boolean}>;

const Section = ({title, children, row}: SectionProps) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.title}>{title}</Text>
    </View>
    <View style={{flexDirection: row ? 'row' : 'column', gap: 10}}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 12,
    paddingBottom: 12,
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
  title: {
    fontSize: 20,
    color: '#333333',
    fontWeight: 'bold',
  },
});

export {Page, ScrollPage, Section};
