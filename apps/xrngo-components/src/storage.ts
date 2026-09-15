import {useMemo} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAsyncStorage = (key: string) => {
  return useMemo(() => {
    return {
      getItem: () => {
        return AsyncStorage.getItem(key);
      },
      setItem: (data: string) => {
        return AsyncStorage.setItem(key, data);
      },
    };
  }, [key]);
};
