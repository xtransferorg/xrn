import { LinkedList } from "@kit.ArkTS"

export class NativeNavDestinationStateHolder {
  nativeId: string
  bundleName: string
  moduleName: string
  rnId: string | null = null

  constructor(nativeId: string, bundleName: string, moduleName: string) {
    this.nativeId = nativeId
    this.bundleName = bundleName
    this.moduleName = moduleName
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

  lastMatched(bundleName: string, moduleName: string): IndexedNativeNavDestinationStateHolder | null {
    for (let state of this.destinationStateMap.values()) {
      if (bundleName === state.bundleName && moduleName === state.moduleName) {
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