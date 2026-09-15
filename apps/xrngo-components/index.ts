import {AppRegistry, Platform} from 'react-native';
import {name as appName} from './app.json';
import {NativeModules} from 'react-native';
import EnvSetting from './src/components/EnvSetting';
import {KeyboardManager} from 'react-native-keyboard-manager';
import App from './src/App';

if (Platform.OS === 'ios') {
  KeyboardManager.setEnable(true);
  KeyboardManager.setEnableDebugging(false);
  KeyboardManager.setKeyboardDistanceFromTextField(10);
  KeyboardManager.setEnableAutoToolbar(true);
  KeyboardManager.setToolbarManageBehaviourBy('subviews');
  KeyboardManager.setToolbarPreviousNextButtonEnable(true);
  KeyboardManager.setShouldToolbarUsesTextFieldTintColor(false);
  KeyboardManager.setShouldShowToolbarPlaceholder(false);
  KeyboardManager.setOverrideKeyboardAppearance(false);
  KeyboardManager.setShouldResignOnTouchOutside(true);
}

NativeModules.XRNLoadingModule?.hideLoading?.();
NativeModules.XRNLoadingModule?.hide();

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerComponent('Main', () => App);