import { findLastIndex } from "lodash";
import EventEmitter from "react-native/Libraries/vendor/emitter/EventEmitter";
import { NavigationContainerRef } from "../react-navigation";

import * as helpers from "../../compatV4/helpers";

export type NavigationContainerRefStack<ParamList extends {}> = EventEmitter & {
  push: (ref: NavigationContainerRef<ParamList>) => void;
  pop: (ref: NavigationContainerRef<ParamList>) => boolean;
  peek: () => NavigationContainerRef<ParamList> | undefined;
  all: () => NavigationContainerRef<ParamList>[];
};

export class NavigationContainerRefStackImpl<ParamList extends {}>
  extends EventEmitter
  implements NavigationContainerRefStack<ParamList>
{
  private refs: NavigationContainerRef<ParamList>[] = [];

  push(ref: NavigationContainerRef<ParamList>) {
    this.refs.push({
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

    this.emit("change", this.peek());
  }

  pop(ref: NavigationContainerRef<ParamList>) {
    if (!ref) return false;

    const index = findLastIndex(
      this.refs,
      (val) => val && val.getRootState().key === ref.getRootState().key,
    );

    if (index !== -1) {
      this.refs.splice(index, 1);
      this.emit("change", this.peek());
      return true;
    }

    return false;
  }

  peek() {
    if (this.refs.length === 0) {
      return undefined;
    }

    return this.refs[this.refs.length - 1];
  }

  all() {
    return this.refs;
  }
}
