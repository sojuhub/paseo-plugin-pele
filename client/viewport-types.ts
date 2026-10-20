import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { ViewportFitOptions, ViewportSize } from "../shared/viewport-geometry";

export interface ZoomableViewportAction {
  icon: string;
  label: string;
  onPress: () => void;
  testID?: string;
}

export interface ZoomableViewportProps {
  theme: import("@getpaseo/plugin").PluginTheme;
  compact: boolean;
  contentSize: ViewportSize;
  children: ReactNode;
  actions?: ZoomableViewportAction[];
  accessibilityLabel?: string;
  fit?: ViewportFitOptions;
  maxScale?: number;
  minScale?: number;
  onPressOutsideContent?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  wheelActivation?: "always" | "modifier";
}
