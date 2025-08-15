import { startNetworkLogging } from "./core/networkLogger/src";

import AppInfo from "./pages/AppInfo";
import AppLinking from "./pages/AppLinking";
import DebugBundle from "./pages/DebugBundle";
import DebugCenter from "./pages/DebugCenter";
import DeviceInfo from "./pages/DeviceInfo";
import EnvSetting from "./pages/EnvSetting";
import RouteInfo from "./pages/RouteInfo";
import DebugCommon from "./pages/DebugCommon";
import SchemeHistory from "./pages/AppLinking/History/SchemeHistory";
import NetworkInfo from "./pages/Network";
import NetworkDetail from "./pages/Network/NetworkDetail";
import ScanQRPage from "./pages/ScanPage";
import FeedBack from "./pages/FeedBack";
import CodepushInfo from "./pages/BundleInfo";
import NetworkDiagnosis from "./pages/NetDiagnosis"

export enum ROUTES {
  DebugCenter = "DebugCenter", // debug面板中心
  EnvSetting = "EnvSetting", // 设置环境
  DebugBundle = "DebugBundle", // 动态调试bundle
  DeviceInfo = "DeviceInfo", // 设备信息
  AppInfo = "AppInfo", // App信息
  AppLinking = "AppLinking", // 任意门
  RouteInfo = "RouteInfo", // 路由信息
  DebugCommon = "DebugCommon", // common包调试支持
  SchemeHistory = "SchemeHistory", // 任意门路由历史
  NetworkInfo = "NetworkInfo", // 网络日志列表
  NetworkDetail = "NetworkDetail", // 网络日志详情
  NetworkDiagnosis = "NetworkDiagnosis", // 网络诊断
  ScanQRPage = "ScanQRPage", // 扫描二维码
  FeedBack = "FeedBack", // 评分反馈
  CodepushInfo = "CodepushInfo", // bundle codepush 信息
}

export const DebugPanelRouters = [
  {
    path: ROUTES.DebugCenter,
    component: DebugCenter,
  },
  {
    path: ROUTES.EnvSetting,
    component: EnvSetting,
  },
  {
    path: ROUTES.DebugBundle,
    component: DebugBundle,
  },
  {
    path: ROUTES.DeviceInfo,
    component: DeviceInfo,
  },
  {
    path: ROUTES.AppInfo,
    component: AppInfo,
  },
  {
    path: ROUTES.AppLinking,
    component: AppLinking,
  },
  {
    path: ROUTES.RouteInfo,
    component: RouteInfo,
  },
  {
    path: ROUTES.DebugCommon,
    component: DebugCommon,
  },
  {
    path: ROUTES.SchemeHistory,
    component: SchemeHistory,
  },
  {
    path: ROUTES.NetworkInfo,
    component: NetworkInfo,
  },
  {
    path: ROUTES.NetworkDetail,
    component: NetworkDetail,
  },
  {
    path: ROUTES.NetworkDiagnosis,
    component: NetworkDiagnosis,
  },
  {
    path: ROUTES.ScanQRPage,
    component: ScanQRPage,
  },
  {
    path: ROUTES.FeedBack,
    component: FeedBack,
  },
  {
    path: ROUTES.CodepushInfo,
    component: CodepushInfo,
  },
];

startNetworkLogging({
  // ignoredUrls: [''],
});
