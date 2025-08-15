import {
  DependencyList,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export function useNavRightButton(
  createRightButton: (params?: DependencyList) => ReactElement,
  deps?: DependencyList
) {
  const [rightBtn, setRightBtn] = useState<ReactElement>();
  useEffect(() => {
    setRightBtn(createRightButton(deps));
  }, deps || []);

  return rightBtn;
}

export function useNavOnBack(
  onBack: (params?: DependencyList) => boolean,
  deps?: DependencyList
) {
  return useCallback(() => {
    return onBack(deps);
  }, deps || []);
}
