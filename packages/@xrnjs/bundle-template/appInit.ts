import { Navigation } from '@xrnjs/core'

Navigation.interceptor.use(({ action, nextRouteName }) => {
	if (action && nextRouteName) {
		//
		return true
	}
})
