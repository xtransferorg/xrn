// Toast.tsx
import React, { useEffect, useRef } from "react";
import {
  Modal,
  Text,
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";

interface ToastProps {
  visible: boolean;
  message: string;
  duration?: number;
  onClose: () => void;
}

const screenWidth = Dimensions.get("window").width;

const XTToast: React.FC<ToastProps> = ({
  visible,
  message,
  duration = 2000,
  onClose,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onClose?.());
      }, duration);

      return () => clearTimeout(timer);
    }
    return () => {
      console.log('AAA')
    }
  },[visible]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        <Animated.View style={[styles.toastBox, { opacity: fadeAnim }]}>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default XTToast;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  toastBox: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    maxWidth: screenWidth * 0.8,
  },
  message: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: "center",
  },
});
