import {TextInput, Alert} from 'react-native';
import React, {useState} from 'react';
import {Page} from '../../../../components/Page';
import HeadingText from '../../../../components/HeadingText';
import {RouteProp, useNavigation, useRoute} from '@xrnjs/core';
import {RouterParamList} from '../../../../../Routers';
import MonoText from '../../../../components/MonoText';
import Button from '../../../../components/Button';

const FormSecondStepScreen = () => {
  const navigation = useNavigation();
  const {params} =
    useRoute<RouteProp<RouterParamList, 'CreateFormSecondStep'>>();

  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <Page>
      <HeadingText style={{fontSize: 14}}>Remark:</HeadingText>
      <TextInput
        value={remark}
        onChangeText={setRemark}
        style={{
          height: 32,
          marginVertical: 12,
          borderWidth: 1,
          padding: 4,
        }}
      />

      <Button
        title="Submit"
        loading={submitting}
        onPress={() => {
          if (!remark) {
            Alert.alert('Please input remark');
            return;
          }

          setSubmitting(true);
          setTimeout(() => {
            setSubmitting(false);
            navigation.navigate('FormSuccess', {
              from: params?.from,
            });
          }, 1000);
        }}
        buttonStyle={{width: '100%'}}
      />

      <HeadingText style={{fontSize: 14}}>Current form data:</HeadingText>
      <MonoText>{JSON.stringify({name: params.name}, null, 2)}</MonoText>
    </Page>
  );
};

export default FormSecondStepScreen;
