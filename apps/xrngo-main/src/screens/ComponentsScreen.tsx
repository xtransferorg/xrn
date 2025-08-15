import React from 'react';
import ComponentListScreen from './ComponentListScreen';
import {ListScreens} from '../navigation/MergedScreens';
import {Card} from '@xrnjs/ui';
import {ScrollPage} from '../components/Page';

export const ScreenItems = [
  ...ListScreens.map(({name, route, ...rest}) => {
    const to = {
      name: 'Sub',
      params: {
        screen: route || `${name.toLowerCase()}`,
      },
    };
    return {
      name,
      route: to as any,

      // route: 'Sub',
      isAvailable: true,
      ...rest,
    };
  }),
];

export default function ComponentsScreen() {
  return (
    <ScrollPage>
      <Card>
        <ComponentListScreen apis={ScreenItems} />
      </Card>
    </ScrollPage>
  );
}
