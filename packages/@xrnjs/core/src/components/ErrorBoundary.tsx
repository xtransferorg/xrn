import React from "react";
import { View, Text } from "react-native";

type Props = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    // 更新 state 以触发 fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // 可以将错误信息上报给日志服务
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <View>
            <Text>页面报错了</Text>
          </View>
        )
      );
    }

    return this.props.children;
  }
}
