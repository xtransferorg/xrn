import React, {useEffect} from 'react';
import {checkRNUpdate} from '@xrnjs/core';
// import 'intl-pluralrules';

import NavigatorScreens from './navigations';
import {LanguageProvider} from './Lang';

const App = (props = {}) => {
  useEffect(() => {
    checkRNUpdate();
  }, []);
  return (
    <LanguageProvider>
      <NavigatorScreens {...props} />
    </LanguageProvider>
  );
};

export default App;
