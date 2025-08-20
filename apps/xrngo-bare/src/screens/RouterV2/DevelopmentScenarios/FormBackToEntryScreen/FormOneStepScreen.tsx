import {TextInput, Alert} from 'react-native';
import React, {useState} from 'react';
import {Page} from '../../../../components/Page';
import HeadingText from '../../../../components/HeadingText';
import {RouteProp, useNavigation, useRoute} from '@xrnjs/core';
import {RouterParamList} from '../../../../../Routers';
import Button from '../../../../components/Button';

const FormOneStepScreen = () => {
  const navigation = useNavigation();
  const {params} = useRoute<RouteProp<RouterParamList, 'CreateFormOneStep'>>();

  const [name, setName] = useState('');

  return (
    <Page>
      <HeadingText style={{fontSize: 14}}>Name:</HeadingText>
      <TextInput
        value={name}
        onChangeText={setName}
        style={{
          height: 32,
          marginVertical: 12,
          borderWidth: 1,
          padding: 4,
        }}
      />
      <Button
        title="Next"
        onPress={() => {
          if (!name) {
            Alert.alert('Please input name');
            return;
          }

          navigation.navigate('scenario-form-back-to-entry-2', {
            from: params?.from,
            name,
          });
        }}
        buttonStyle={{width: '100%'}}
      />
    </Page>
  );
};

export default FormOneStepScreen;
