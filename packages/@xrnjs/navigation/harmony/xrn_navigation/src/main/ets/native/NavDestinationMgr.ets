import { LinkedList } from "@kit.ArkTS"
import { RNNavigationState, RNNavigationRoute } from "../reactnative/types/ReactNativeTypes"

export class NativeNavDestinationStateHolder {
  nativeId: string
  bundleName: string
  moduleName: string
  rnId: string | null = null
  rnState: string | null = null

  constructor(nativeId: string, bundleName: string, moduleName: string) {
    this.nativeId = nativeId
    this.bundleName = bundleName
    this.moduleName = moduleName
  }
}

/**
 * 递归遍历导航状态树（含嵌套导航器的 route.state），判断是否存在 name 与目标页面一致的路由。
 */
function containsPage(state: RNNavigationState | undefined, pageName: string): boolean {
  const routes = state?.routes
  if (!routes) {
    return false
  }

  return routes.some((route: RNNavigationRoute) =>
    route.name === pageName || containsPage(route.state, pageName)
  )
}

/**
 * 通过容器缓存的 RN 导航状态（rnState）判断其导航树中是否包含目标页面。
 *
 * - 目标未指定具体页面（pageName 为空）或状态尚未保存时，仅按 bundle + module 匹配。
 * - 状态格式异常无法解析时返回 false，避免误命中。
 */
function hasSamePage(rnState: string | null, pageName?: string): boolean {
  if (!rnState || !pageName) {
    return false
  }

  try {
    const state = JSON.parse(rnState) as RNNavigationState
    return containsPage(state, pageName)
  } catch (e) {
    return false
  }
}

export class IndexedNativeNavDestinationStateHolder {
  index: number
  state: NativeNavDestinationStateHolder

  constructor(index: number, state: NativeNavDestinationStateHolder) {
    this.index = index
    this.state = state
  }
}

class NativeNavDestinationMgrInternal {
  private destinationIdList = new LinkedList<string>()
  private destinationStateMap = new Map<string, NativeNavDestinationStateHolder>()

  push(nativeDestinationId: string, bundleName: string, moduleName: string) {
    this.destinationIdList.add(nativeDestinationId)
    this.destinationStateMap.set(nativeDestinationId,
      new NativeNavDestinationStateHolder(nativeDestinationId, bundleName, moduleName))
  }

  pop(nativeDestinationId: string) {
    this.destinationIdList.removeLastFound(nativeDestinationId)
    this.destinationStateMap.delete(nativeDestinationId)
  }

  matched(rnId: string): IndexedNativeNavDestinationStateHolder | null {
    for (let state of this.destinationStateMap.values()) {
      if (rnId === state.rnId) {
        const index = this.destinationIdList.getLastIndexOf(state.nativeId)

        if (index >= 0) {
          return new IndexedNativeNavDestinationStateHolder(
            index,
            state
          )
        }
      }
    }

    return null
  }

  lastMatched(
    bundleName: string,
    moduleName: string,
    pageName?: string
  ): IndexedNativeNavDestinationStateHolder | null {
    for (let state of this.destinationStateMap.values()) {
      if (bundleName === state.bundleName &&
        moduleName === state.moduleName &&
        hasSamePage(state.rnState, pageName)) {
        const index = this.destinationIdList.getLastIndexOf(state.nativeId)

        if (index >= 0) {
          return new IndexedNativeNavDestinationStateHolder(
            index,
            state
          )
        }
      }
    }

    return null
  }

  top(): NativeNavDestinationStateHolder | undefined {
    const nativeDestinationId = this.destinationIdList.getLast()
    if (nativeDestinationId && this.destinationStateMap.has(nativeDestinationId)) {
      return this.destinationStateMap.get(nativeDestinationId)
    } else {
      return undefined
    }
  }

  setTopRnId(rnId: string) {
    const top = this.top()
    if (top) {
      top.rnId = rnId
    }
  }

  setTopRnState(rnState: string) {
    const top = this.top()
    if (top) {
      top.rnState = rnState
    }
  }

  getTopRnId(): string | null {
    const top = this.top()

    if (!top) {
      return null
    }

    return top.rnId
  }
}

const NavDestinationMgr = new NativeNavDestinationMgrInternal()

export default NavDestinationMgr