import { initModule } from '@xrnjs/core';
import { DemoRouter } from './pages/demo/router';
export const AppRouterConfigs = [...DemoRouter]

export const module = initModule({ routers: AppRouterConfigs })



