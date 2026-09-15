import { startNetworkLogging } from "./core/networkLogger/src";

import AppInfo from "./pages/AppInfo";
import AppLinking from "./pages/AppLinking";
import DebugBundle from "./pages/DebugBundle";
import DebugCenter from "./pages/DebugCenter";
import DeviceInfo from "./pages/DeviceInfo";
import EnvSetting from "./pages/EnvSetting";
import RouteInfo from "./pages/RouteInfo";
import SchemeHistory from "./pages/AppLinking/History/SchemeHistory";
import NetworkInfo from "./pages/Network";
import NetworkDetail from "./pages/Network/NetworkDetail";
import ScanQRPage from "./pages/ScanPage";
import FeedBack from "./pages/FeedBack";
import NetworkDiagnosis from "./pages/NetDiagnosis";
import CodepushInfo from "./pages/BundleInfo";

export enum ROUTES {
  DebugCenter = "DebugCenter", // debug面板中心
  EnvSetting = "EnvSetting", // 设置环境
  DebugBundle = "DebugBundle", // 动态调试bundle
  DeviceInfo = "DeviceInfo", // 设备信息
  AppInfo = "AppInfo", // App信息
  AppLinking = "AppLinking", // 任意门
  RouteInfo = "RouteInfo", // 路由信息
  SchemeHistory = "SchemeHistory", // 任意门路由历史
  NetworkInfo = "NetworkInfo", // 网络日志列表
  NetworkDetail = "NetworkDetail", // 网络日志详情
  ScanQRPage = "ScanQRPage", // 扫描二维码
  FeedBack = "FeedBack", // 评分反馈
  NetworkDiagnosis = "NetworkDiagnosis", // 网络诊断
  CodepushInfo = "CodepushInfo", // bundle codepush 信息
  CookieSetting = "CookieSetting", // 设置Cookie
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
    path: ROUTES.ScanQRPage,
    component: ScanQRPage,
  },
  {
    path: ROUTES.FeedBack,
    component: FeedBack,
  },
  {
    path: ROUTES.NetworkDiagnosis,
    component: NetworkDiagnosis,
  },
  {
    path: ROUTES.CodepushInfo,
    component: CodepushInfo,
  },
];

console.log("开启网络日志收集🐯🐯🐯");
startNetworkLogging({});
