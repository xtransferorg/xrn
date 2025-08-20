import React, { Fragment } from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme, useThemedStyles } from '../theme';

const icons = {
  close: require('../../../../../assets/network/close.png'),
  filter: require('../../../../../assets/network/filter.png'),
  more: require('../../../../../assets/network/more.png'),
  search: require('../../../../../assets/network/search.png'),
  share: require('../../../../../assets/network/share.png'),
};

type ButtonProps =
  | {
      onPress?: never;
      accessibilityLabel?: string;
    }
  | ({
      onPress: () => void;
      accessibilityLabel: string;
    } & TouchableOpacity['props']);

const Icon = ({
  name,
  onPress,
  accessibilityLabel,
  iconStyle,
  ...rest
}: {
  name: keyof typeof icons;
  iconStyle?: Image['props']['style'];
} & ButtonProps) => {
  const styles = useThemedStyles(themedStyles);
  const Wrapper = onPress ? TouchableOpacity : Fragment;

  return (
    <Wrapper
      {...(onPress && {
        onPress,
        accessibilityLabel,
        accessibilityRole: 'button',
        style: styles.iconWrapper,
        ...rest,
      })}
    >
      <Image
        source={icons[name]}
        resizeMode="contain"
        style={[styles.icon, onPress && styles.iconButton, iconStyle]}
      />
    </Wrapper>
  );
};

const themedStyles = (theme: Theme) =>
  StyleSheet.create({
    icon: {
      width: 15,
      height: 15,
      marginRight: 10,
      alignSelf: 'center',
      tintColor: theme.colors.muted,
    },
    iconButton: {
      tintColor: theme.colors.text,
    },
    iconWrapper: {
      alignSelf: 'center',
    },
  });

export default Icon;
