import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Button from './Button';
import { useThemedStyles } from '../theme';
import NLModal from './Modal';
import Icon from './Icon';

interface Props {
  options: { text: string; onPress: () => Promise<void> }[];
}

const Options: React.FC<Props> = ({ options }) => {
  const styles = useThemedStyles(themedStyles);
  const [openOptions, setOpenOptions] = useState(false);

  return (
    <>
      <Icon
        name="more"
        onPress={() => {
          setOpenOptions(true);
        }}
        testID="options-menu"
        accessibilityLabel="More"
        iconStyle={styles.iconButton}
      />
      <NLModal
        visible={openOptions}
        onClose={() => setOpenOptions(false)}
        title="更多"
      >
        {options.map(({ text, onPress }) => (
          <Button
            textStyle={{paddingLeft: 0, marginTop: 20}}
            key={text}
            onPress={async () => {
              // Need to await in order for the getHar option to work
              await onPress();
              setOpenOptions(false);
            }}
          >
            {text}
          </Button>
        ))}
      </NLModal>
    </>
  );
};

const themedStyles = () =>
  StyleSheet.create({
    iconButton: {
      width: 20,
    },
  });

export default Options;
