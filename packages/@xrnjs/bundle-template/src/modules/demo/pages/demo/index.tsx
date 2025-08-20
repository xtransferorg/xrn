import React, { useEffect, useState } from 'react'
import { View, Button, Text } from 'react-native'
import { Page } from '@xrnjs/core'
import { XRNLoading } from '@xrnjs/core'
import { ROUTES } from './router'

const Demo: React.FC = (props: any) => {
  const [title] = useState('Demo页面')
  useEffect(() => {
    XRNLoading.hide()
  }, [])
  return (
    <Page hideHeader title={title}>
      <View style={{ margin: 8 }} />
      <Button
        title='跳转Demo'
        accessibilityLabel='test'
        onPress={() => {
          props.navigation.navigate(ROUTES.NavigationDemo)
        }}
      ></Button>
      <View style={{ margin: 8 }}>
        <Text>XRN Demo</Text>
      </View>
    </Page>
  )
}

export default Demo
