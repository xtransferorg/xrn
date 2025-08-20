import { useRef, useEffect } from 'react'
import { BackHandler, ToastAndroid } from 'react-native'
import { useNavigation } from '@xrnjs/navigation'
import { XRNAppUtils } from '@xrnjs/app-utils'

interface DoubleBackExitOptions {
	interval?: number
	message?: string
}

/**
 * 用于处理双击返回按钮退出应用程序。
 *
 * @param {DoubleBackExitOptions} options - 配置双击返回退出行为的选项。
 * @param {number} [options.interval=2000] - 在此时间间隔（毫秒）内必须按两次返回按钮才能退出应用程序。
 * @param {string} [options.message='再按一次退出应用'] - 当按一次返回按钮时显示的消息。
 *
 * @returns {void}
 *
 * @example
 * ```typescript
 * useDoubleBackExit({ interval: 3000, message: '再按一次退出应用' });
 * ```
 */
export const useDoubleBackExit = (options: DoubleBackExitOptions) => {
	const navigation = useNavigation()
	const lastBackPressed = useRef(0)
	const { interval = 2000, message = '再按一次退出应用' } = options

	useEffect(() => {
		const handleBackPress = () => {
			if (navigation.canGoBack()) return false

			const now = Date.now()
			if (now - lastBackPressed.current < interval) {
				XRNAppUtils.exitApp()
			} else {
				lastBackPressed.current = now
				ToastAndroid.show(message, ToastAndroid.SHORT)
			}
			return true
		}

		BackHandler.addEventListener('hardwareBackPress', handleBackPress)

		return () => {
			BackHandler.removeEventListener('hardwareBackPress', handleBackPress)
		}
	}, [interval, message, navigation])
}
