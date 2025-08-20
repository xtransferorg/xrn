import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

const RadarAnimation = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width="120" height="120" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" stroke="#EA3841" strokeWidth="1" fill="none" />
        <Circle cx="50" cy="50" r="30" stroke="#EA3841" strokeWidth="1" fill="none" />
        <Circle cx="50" cy="50" r="15" stroke="#EA3841" strokeWidth="1" fill="none" />

        <Line x1="50" y1="5" x2="50" y2="95" stroke="#EA3841" strokeWidth="1" />
        <Line x1="5" y1="50" x2="95" y2="50" stroke="#EA3841" strokeWidth="1" />

        <Circle cx="30" cy="30" r="3" fill="#EA3841" />
        <Circle cx="70" cy="40" r="3" fill="#EA3841" />
      </Svg>

      <Animated.View
        style={{
          position: "absolute",
          width: 120,
          height: 120,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: rotateInterpolate }],
        }}
      >
        <Svg width="120" height="120" viewBox="0 0 100 100">
          <Path d="M 50,50 L 100,50 A 50,50 0 0,1 50,100 Z" fill="rgba(234, 56, 65, 0.5)" />
        </Svg>
      </Animated.View>
    </View>
  );
};

export default RadarAnimation;
