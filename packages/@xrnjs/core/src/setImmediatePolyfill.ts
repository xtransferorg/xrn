/**
 * Bridgeless 下 RN 有时不会在 JS 侧安装 setImmediate（依赖 C++ event loop）。
 * Host 未装上时会白屏：Property 'setImmediate' doesn't exist。
 */
declare const global: typeof globalThis & {
  setImmediate?: (callback: (...args: any[]) => void, ...args: any[]) => number;
  clearImmediate?: (id: number) => void;
};

if (typeof global.setImmediate !== 'function') {
  global.setImmediate = (callback: any, ...args: any[]) =>
    setTimeout(callback, 0, ...args) as unknown as number;
}

if (typeof global.clearImmediate !== 'function') {
  global.clearImmediate = id => clearTimeout(id);
}
