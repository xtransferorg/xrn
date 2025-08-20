import { NavigationRouteConfig } from './types/NativeTypes'

interface INavigationRoutingTable {
  get(path?: string | null): NavigationRouteConfig | null
}

class FakeNavigationRoutingTable implements INavigationRoutingTable {
  get(path?: string | null): NavigationRouteConfig | null {
    if (!path) {
      return null
    }

    const pathSplit = path.split("/")

    const bundleName = pathSplit[1]
    const moduleName = pathSplit[2]
    const pageName = pathSplit[3]

    if (!bundleName || !moduleName) {
      return null
    }

    return new NavigationRouteConfig(
      path,
      bundleName,
      moduleName,
      pageName,
      true
    )
  }
}

const NativeNavigationRoutingTable = new FakeNavigationRoutingTable()

export default NativeNavigationRoutingTable