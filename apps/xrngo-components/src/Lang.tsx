import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import React, {createContext, useContext, useEffect, useState} from 'react';
import {THEME_TOKEN, Token} from 'root/Theme/constant';
import {LangType, Provider} from '@xrnjs/ui';

export const LanguageContext = createContext<{
  lang: LangType;
  setLang: any;
}>({
  lang: LangType.en_US,
  setLang: () => {
    throw new Error('Function not implemented.');
  },
});

const ThemeContext = createContext<{token: Token; setToken: any}>({
  token: THEME_TOKEN,
  setToken: () => {},
});

export const useLanguage = () => useContext(LanguageContext);
export const useThemeDemo = () => useContext(ThemeContext);

export const LanguageProvider = (props: {children: any}) => {
  const {getItem} = useAsyncStorage('XTD_RN_LANG');
  const [lang, setLang] = useState(LangType.en_US);
  const [token, setToken] = useState(THEME_TOKEN);

  useEffect(() => {
    getItem().then(lang => {
      if (lang) {
        setLang(lang as LangType);
      }
    });
  }, [getItem]);

  return (
    <LanguageContext.Provider value={{lang, setLang}}>
      <ThemeContext.Provider value={{token, setToken}}>
        <Provider
          langType={lang}
          theme={{
            ...token,
            '--color-primary-1': '#16b1cf',
            '--color-primary-2': '#17b9d9',
            '--color-primary-3': '#18c2e3',
            '--color-primary-4': '#20c6e7',
            '--color-primary-5': '#2ac9e8',
            '--color-primary-6': '#39cdea',
            '--color-primary-7': '#3eceea',
            '--color-primary-8': '#49d1eb',
            '--color-primary-9': '#53d3ec',
            '--color-primary-10': '#5dd6ed',
          }}>
          {props.children}
        </Provider>
      </ThemeContext.Provider>
    </LanguageContext.Provider>
  );
};
