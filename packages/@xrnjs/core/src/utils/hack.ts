import { NativeModules, Platform, Text } from "react-native"

/**
   * hack： 安卓端字体显示问题
   * issue: https://github.com/facebook/react-native/issues/29259
   */
export function hackAndriodFont() {
  if (Platform.OS === 'android' && NativeModules.PlatformConstants) {
		const fingerprint = NativeModules.PlatformConstants.Fingerprint

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
