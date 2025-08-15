import { Page } from '@xrnjs/core'
import React from 'react'
import { Text, View } from 'react-native'

const NavigationDemo: React.FC = (props: any) => {
  const { navigation } = props

  return (
    <Page
      title={'内层路由'}
      hideHeader={navigation.getParam('hideHeader')}
      onBack={() => {
        navigation.goBack()
        return true
      }}
    >
      <View style={{ margin: 8 }}>
        <Text>内层路由</Text>
      </View>
    </Page>
  )
}

export default NavigationDemo
