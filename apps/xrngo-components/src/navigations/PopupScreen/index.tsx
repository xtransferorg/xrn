import {ScrollView} from 'react-native';
import {default as Header} from 'root/Popup/__fixtures__/header';
import {default as Popup} from 'root/Popup/__fixtures__/popup';

export default () => {
  return (
    <ScrollView>
      <Header />
      <Popup />
    </ScrollView>
  );
};
