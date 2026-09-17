export enum RNNavigationActionType {
  NAVIGATE = 'NAVIGATE',
  REPLACE = 'REPLACE',
  PUSH = 'PUSH',
  GO_BACK = 'GO_BACK',
}

export class RNNavigationActionPayload {
  name: string | null
  params: Record<string, number | string | boolean> | null
  count: number

  constructor(name: string | null, params: Record<string, number | string | boolean> | null, count: number = 0) {
    this.name = name
    this.params = params
    this.count = count
  }
}

export class RNNavigationAction {
  type: RNNavigationActionType
  source: string
  payload: RNNavigationActionPayload | null
  target: string | null

  constructor(
    type: RNNavigationActionType,
    source: string,
    payload: RNNavigationActionPayload | null = null,
    target: string | null = null
  ) {
    this.type = type
    this.source = source
    this.payload = payload
    this.target = target
  }
}

// React Navigation 序列化后的导航状态结构，用于解析容器缓存的 rnState。
export interface RNNavigationRoute {
  name?: string
  state?: RNNavigationState
}

export interface RNNavigationState {
  type?: string
  index?: number
  routes?: RNNavigationRoute[]
}

