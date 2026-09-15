import { UIManager } from "react-native";

function isNewModuleOnly(name) {
  const latestSignature = globalThis.__LATEST_NATIVE_CAPABILITY_SIGNATURE__ || {
    modules: {},
  };
  return latestSignature.modules?.[name];
}

function isNewApiOnly(module, method) {
  const latestSignature = globalThis.__LATEST_NATIVE_CAPABILITY_SIGNATURE__ || {
    modules: {},
  };
  return latestSignature.modules?.[module]?.includes(method);
}

export function isNewComponentOnly(componentName: string): boolean {
  const latestSignature = globalThis.__LATEST_NATIVE_CAPABILITY_SIGNATURE__ || {
    components: [],
  };
  return (
    latestSignature.components?.includes(componentName) &&
    !UIManager.getViewManagerConfig(componentName)
  );
}

export function handleUnsupportedNativeCapability(message) {
  console.error(message);
  (globalThis as any).unsupportedNativeCapabilityHandler?.(message);
}

export function handleUnknownNativeCapability(message) {
  console.error(message);
  (globalThis as any).unknownNativeCapabilityHandler?.(message);
}

export const createModuleProxy = (moduleName, module) => {
  if (module) {
    return new Proxy(module, {
      get: function get(modTarget, methodName, receiver) {
        if (
          methodName in modTarget &&
          typeof modTarget[methodName] !== "undefined"
        ) {
          // 使用 Reflect.get 通过 receiver 获取值，保持正确的属性访问链
          const value = Reflect.get(modTarget, methodName, receiver);
          // 如果是函数且通过 proxy 访问（receiver 不是原始对象），绑定 this 到原始对象
          if (typeof value === "function" && receiver !== modTarget) {
            return value.bind(modTarget);
          }
          return value;
        } else {
          if (!isNewApiOnly(moduleName, methodName)) {
            const value = Reflect.get(modTarget, methodName, receiver);
            if (typeof value === "function" && receiver !== modTarget) {
              return value.bind(modTarget);
            }
            return value;
          }
          return function () {
            handleUnsupportedNativeCapability(
              `[Module] 方法在当前版本中不存在: ${String(moduleName)}.${String(methodName)}，请升级 App`,
            );
          };
        }
      },
    });
  } else {
    // if (!isNewModuleOnly(moduleName)) {
    //   return module;
    // }
    return new Proxy(
      {},
      {
        get: function get(_, methodName, receiver) {
          return function () {
            if (isNewModuleOnly(moduleName)) {
              handleUnsupportedNativeCapability(
                `[Module] 模块在当前版本中不存在: ${String(moduleName)}，无法调用 ${String(methodName)}，请升级 App`,
              );
            } else {
              throw new Error(`模块不存在: ${String(moduleName)}`);
            }
          };
        },
      },
    );
  }
};
