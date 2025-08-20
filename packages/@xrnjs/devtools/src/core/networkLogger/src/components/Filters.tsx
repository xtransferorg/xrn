import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import NLModal from "./Modal";
import Button from "./Button";
import { useAppContext } from "./AppContext";
import { Theme, useTheme, useThemedStyles } from "../theme";

const FilterButton = ({
  onPress,
  active,
  children,
}: {
  onPress: () => void;
  active?: boolean;
  children: string;
}) => {
  const styles = useThemedStyles(themedStyles);

  return (
    <Button
      style={[styles.methodButton, active && styles.buttonActive]}
      textStyle={[styles.buttonText, active && styles.buttonActiveText]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
    >
      {children}
    </Button>
  );
};

const Filters = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { filter, dispatch } = useAppContext();
  const styles = useThemedStyles(themedStyles);
  const theme = useTheme();

  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"] as const;

  return (
    <View>
      <NLModal visible={open} onClose={onClose} title="筛选条件">
        <Text style={styles.subTitle} accessibilityRole="header">
          Method
        </Text>
        <View style={styles.methods}>
          {methods.map((method) => (
            <FilterButton
              key={method}
              active={filter.methods?.has(method)}
              onPress={() => {
                const newMethods = new Set(filter.methods);
                if (newMethods.has(method)) {
                  newMethods.delete(method);
                } else {
                  newMethods.add(method);
                }
                dispatch({
                  type: "SET_FILTER",
                  payload: {
                    ...filter,
                    methods: newMethods,
                  },
                });
              }}
            >
              {method}
            </FilterButton>
          ))}
        </View>
        <Text style={styles.subTitle} accessibilityRole="header">
          Status
        </Text>
        <View style={styles.methods}>
          <FilterButton
            active={filter.statusErrors}
            onPress={() => {
              dispatch({
                type: "SET_FILTER",
                payload: {
                  ...filter,
                  statusErrors: !filter.statusErrors,
                  status: undefined,
                },
              });
            }}
          >
            Errors
          </FilterButton>
          <TextInput
            style={styles.statusInput}
            placeholder="Status Code"
            placeholderTextColor={theme.colors.muted}
            keyboardType="number-pad"
            value={filter.status?.toString() || ""}
            maxLength={3}
            accessibilityLabel="Status Code"
            onChangeText={(text) => {
              const status = parseInt(text, 10);
              dispatch({
                type: "SET_FILTER",
                payload: {
                  ...filter,
                  statusErrors: false,
                  status: isNaN(status) ? undefined : status,
                },
              });
            }}
          />
        </View>
        <TouchableOpacity
          style={styles.resetStyle}
          onPress={() => {
            dispatch({
              type: "CLEAR_FILTER",
            });
            onClose();
          }}
        >
          <Text style={styles.resetText}>重置筛选</Text>
        </TouchableOpacity>
      </NLModal>
    </View>
  );
};

const themedStyles = (theme: Theme) =>
  StyleSheet.create({
    subTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
      marginTop: 8,
    },
    filterValue: {
      fontWeight: "bold",
    },
    methods: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 15,
    },
    methodButton: {
      marginVertical: 4,
      marginRight: 8,
      borderWidth: 1,
      borderRadius: 10,
      borderColor: theme.colors.muted,
    },
    statusInput: {
      color: theme.colors.text,
      marginLeft: 10,
      borderColor: theme.colors.muted,
      padding: 5,
      borderBottomWidth: 1,
      minWidth: 100,
    },
    buttonText: {
      fontSize: 12,
    },
    buttonActive: {
      backgroundColor: theme.colors.secondary,
    },
    buttonActiveText: {
      color: theme.colors.onSecondary,
    },
    clearButton: {
      color: theme.colors.statusBad,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.muted,
      marginTop: 20,
    },
    resetStyle: {
      marginTop: 30,
      width: 300,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.xtTheme,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center'
    },
    resetText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold'
    }
  });

export default Filters;
