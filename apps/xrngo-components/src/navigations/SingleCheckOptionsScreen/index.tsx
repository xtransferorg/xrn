import React from 'react';
import {ScrollView, Text, View} from 'react-native';
import {Field, SingleCheckOptions} from '@xrnjs/ui';
import styles from './style';

const SingleCheckOptionsScreen = () => {
  return (
    <ScrollView>
      <View style={styles.section}>
        <Text style={styles.title}>单行文字</Text>
        <SingleCheckOptions
          defaultValue={'2'}
          options={[
            {
              label: '结汇提现',
              value: '1',
            },
            {
              label: '普通体现',
              value: '2',
            },
            {
              disabled: true,
              label: '易企结',
              value: '3',
            },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>主副标题</Text>
        <SingleCheckOptions
          defaultValue={'1'}
          options={[
            {
              label: '法人代表/实际控制人',
              description: '占股10%及以上',
              value: '1',
            },
            {
              label: '法人代表/实际控制人',
              description: '占股10%及以上',
              value: '占股10%及以上',
            },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>双行文字选项</Text>
        <SingleCheckOptions
          defaultValue={'1'}
          options={[
            {
              label: '法人代表/实际控制人占股10%及以上',
              value: '1',
            },
            {
              label: '法人代表/实际控制人占股20%及以上',
              value: '2',
            },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Field
          layout="horizontal"
          label="提现方式"
          labelStyle={styles.labelText}>
          <SingleCheckOptions
            style={styles.optionsHorizontal}
            defaultValue={'1'}
            options={[
              {
                label: '结汇提现',
                value: '1',
              },
              {
                label: '普通体现',
                value: '2',
              },
            ]}
          />
        </Field>
      </View>
    </ScrollView>
  );
};

export default SingleCheckOptionsScreen;
