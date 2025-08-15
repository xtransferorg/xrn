import { Dimensions, Platform, StatusBar } from 'react-native';

export function isIphoneX() {
    const dimen = Dimensions.get('window');
    return (
        Platform.OS === 'ios' &&
        !Platform.isPad &&
        !Platform.isTV &&
        ((dimen.height === 780 || dimen.width === 780)
          || (dimen.height === 812 || dimen.width === 812)
          || (dimen.height === 844 || dimen.width === 844)
          || (dimen.height === 896 || dimen.width === 896)
          || (dimen.height === 926 || dimen.width === 926))
    );
}

export function ifIphoneX<T>(iphoneXStyle: T, regularStyle: T) {
    if (isIphoneX()) {
        return iphoneXStyle;
    }
    
    return regularStyle;
}

export function getStatusBarHeight(safe: boolean) {
    return Platform.select({
        ios: ifIphoneX<number>(safe ? 44 : 30, 20),
        android: StatusBar.currentHeight,
        default: 0
    });
}

export function getBottomSpace() {
    return isIphoneX() ? 34 : 0;
}
