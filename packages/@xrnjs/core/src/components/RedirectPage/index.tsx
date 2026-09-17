import React from 'react';
import { Page } from '../Page';
import { NotFound } from './NotFound';
import { bundleConfig } from '../../bundle';
import { NavigationInjectedProps, useRoute } from '@xrnjs/navigation';

type RedirectPageProps = {
  title?: string;
} & NavigationInjectedProps

const RedirectPage: React.FC<RedirectPageProps> = ({ title }) => {
  const route = useRoute();
  const targetPageName = (route.params as { targetPageName?: string })?.targetPageName;

  return (
    <Page
      title={title || ''}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <NotFound isMain={bundleConfig.mainBundle} />
    </Page>
  );
};

export { RedirectPage, NotFound };
