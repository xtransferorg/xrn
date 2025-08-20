import {useNavigation} from '@xrnjs/core';

export const useNavToSubPage = () => {
  const nav = useNavigation();
  const navToSubPage = (screen: string, params?: any) => {
    console.log('navToSubPage', screen, params);
    nav.navigate({
      name: 'Sub',
      params: {
        screen,
        params,
      },
    });
  };
  return {
    navToSubPage,
    navToWebsite: (website: string) => {
      navToSubPage('website', {url: website});
    },
  };
};
