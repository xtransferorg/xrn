import { Platform } from "../typing";

const COMMON_DEPENDENCIES_CHECK_WHITELIST = [
  "react-native",
  "@react-native-community/netinfo",
];

export const DEPENDENCIES_CHECK_WHITELIST = {
  [Platform.Android]: [...COMMON_DEPENDENCIES_CHECK_WHITELIST],
  [Platform.iOS]: [...COMMON_DEPENDENCIES_CHECK_WHITELIST],
  [Platform.Harmony]: [...COMMON_DEPENDENCIES_CHECK_WHITELIST],
};
