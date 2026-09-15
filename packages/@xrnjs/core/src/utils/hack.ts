import { Platform, Text } from "react-native"
import { requireNativeModule } from '@xrnjs/modules-core'

const PlatformConstants = requireNativeModule<any>('PlatformConstants')

/**
   * hack： 安卓端字体显示问题
   * issue: https://github.com/facebook/react-native/issues/29259
   */
export function hackAndriodFont() {
  if (Platform.OS === 'android' && PlatformConstants) {
		const fingerprint = PlatformConstants?.Fingerprint

		if (fingerprint?.match(/^(xiaomi|redmi|mi|mix|poco).*\/v12\..*/i)) {
      // @ts-ignore
			const originTextRender = Text.render

      // @ts-ignore
			Text.render = function render(props, ref) {
				return originTextRender.apply(this, [
					{
						...props,
						style: [{ fontFamily: '' }, props.style],
					},
					ref,
				])
			}
		}
	}
}
