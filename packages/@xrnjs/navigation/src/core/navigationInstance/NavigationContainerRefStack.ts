import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";
import { NavigationContainerRef } from "../react-navigation";

import * as helpers from "../../compatV4/helpers";

export type NavigationContainerRefStack<ParamList extends {}> = EventEmitter & {
  push: (key: string, ref: NavigationContainerRef<ParamList>) => void;
  pop: (key: string) => boolean;
  peek: () => NavigationContainerRef<ParamList> | undefined;
  all: () => NavigationContainerRef<ParamList>[];
};

export class NavigationContainerRefStackImpl<ParamList extends {}>
  extends EventEmitter
  implements NavigationContainerRefStack<ParamList>
{
  private refs = new Map<string, NavigationContainerRef<ParamList>>();

  // 缓存栈顶 key，使 peek 保持 O(1)
  private topKey: string | undefined;

  push(key: string, ref: NavigationContainerRef<ParamList>) {
    if (!key) return;

    // 重复 push 相同 key 时，移动到栈顶
    if (this.refs.has(key)) {
      this.refs.delete(key);
    }

    this.refs.set(key, {
      ...ref,
      ...Object.entries(helpers).reduce<{
        [key: string]: (...args: any[]) => void;
      }>((acc, [name, method]: [string, Function]) => {
        if (name in ref) {
          acc[name] = (...args: any[]) => ref.dispatch(method(...args));
        }

        return acc;
      }, {}),
    });

    this.topKey = key;

    this.emit("change", this.peek());
  }

  pop(key: string) {
    if (!key) return false;

    if (this.refs.delete(key)) {
      // 仅当移除的是栈顶时才需要回溯新的栈顶
      if (key === this.topKey) {
        this.topKey = this.lastKey();
      }
      this.emit("change", this.peek());
      return true;
    }

    return false;
  }

  peek() {
    return this.topKey === undefined ? undefined : this.refs.get(this.topKey);
  }

  private lastKey() {
    let last: string | undefined;
    for (const key of this.refs.keys()) {
      last = key;
    }
    return last;
  }

  all() {
    return Array.from(this.refs.values());
  }
}
