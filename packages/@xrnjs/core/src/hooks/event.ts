/** @format */

import { useEffect, useRef } from 'react'
import { DeviceEventEmitter, EmitterSubscription, NativeEventEmitter, NativeModule, Platform } from 'react-native'
import { XRNBundleNavigation as BundleNavigation } from '@xrnjs/navigation'
enum EMPhoneOS {
	Android = 'android',
	Ios = 'ios',
}

interface Params {
	eventName: string
	callback: (msg: any) => void
}

export const useNativeEventListeners = (params: Params[]) => {
	const subscriptions = useRef<EmitterSubscription[]>([])
	useEffect(() => {
		params.forEach(({ eventName, callback }) => {
			let subscription: EmitterSubscription
			if (Platform.OS === EMPhoneOS.Ios) {
				const iosEventEmitter = new NativeEventEmitter(BundleNavigation as unknown as NativeModule)
				subscription = iosEventEmitter.addListener(eventName, callback)
			} else {
				subscription = DeviceEventEmitter.addListener(eventName, callback)
			}
			subscriptions.current.push(subscription)
		})
		return () => {
			subscriptions.current.forEach((subscription: any) => {
				subscription?.remove()
			})
		}
	}, [])
}
