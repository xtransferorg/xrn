import { RNNavigationAction } from "./ReactNativeTypes";

export interface IActionHandler {
  handle(originAction: RNNavigationAction): boolean
}

export class NavigationRouteConfig {
  path: string
  bundleName: string
  moduleName: string
  pageName: string
  exported: boolean

  constructor(path: string, bundleName: string, moduleName: string, pageName: string, exported: boolean) {
    this.path = path;
    this.bundleName = bundleName;
    this.moduleName = moduleName;
    this.pageName = pageName;
    this.exported = exported;
  }
}