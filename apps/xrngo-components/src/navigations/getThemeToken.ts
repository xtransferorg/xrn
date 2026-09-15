import {THEME_TOKEN} from 'root/Theme/constant';

export type TThemeKey = keyof THEME_TOKEN;
export type TTheme = {[k: TThemeKey]: number | string};
export const getThemeToken = (keys: TThemeKey, tokens: TTheme) => {
  if (!(keys && tokens)) {
    return null;
  }
  const themeToken: TTheme = {};
  keys?.forEach?.(k => (themeToken[k] = tokens[k]));

  return themeToken;
};
