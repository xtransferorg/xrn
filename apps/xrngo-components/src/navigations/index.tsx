import {NativeModules, Platform, Text} from 'react-native';
import {DebugPanelRouters} from '@xrnjs/devtools';
import {NavigationContainerWrapper, StackRouteConfig} from '@xrnjs/navigation';

import HomeScreen from './HomeScreen';
import SelectScreen, {SelectThemeKeys} from './SelectScreen';
import BottomBarScreen from './BottomBarScreen';
import LayoutScreen from './LayoutScreen';
import CardScreen, {CardThemeKeys} from './CardScreen';
import TitleScreen from './TitleScreen';
import ButtonScreen, {ButtonThemeKeys} from './ButtonScreen';
import LoadingScreen, {LoadingThemeKeys} from './LoadingScreen';
import NavBarScreen, {NavBarThemeKeys} from './NavBarScreen';
import ListScreen, {ListThemeKeys} from './ListScreen';
import MaskScreen from './MaskScreen';
import TourScreen from './TourScreen';
import TabsScreen, {TabsThemeKeys} from './TabsScreen';
import TagScreen, {TagThemeKeys} from './TagScreen';
import FilterScreen, {FilterThemeKeys} from './FilterScreen';
import OptionGroupScreen, {OptionsGroupThemeKeys} from './OptionGroupScreen';
import CheckboxScreen, {CheckboxThemeKeys} from './CheckboxScreen';
import ShouldRenderScreen from './ShouldRenderScreen';
import FieldScreen, {FieldThemeKeys} from './FieldScreen';
import PopupScreen from './PopupScreen';
import DatePickerScreen, {DatePickerThemeKeys} from './DatePickerScreen';
import NoticeBarScreen, {NoticeBarThemeKeys} from './NoticeBarScreen';
import OptionsScreen, {OptionsThemeKeys} from './OptionsScreen';
import ModalScreen, {ModalThemeKeys} from './ModalScreen';
import SingleCheckOptionsScreen from './SingleCheckOptionsScreen';
import InputScreen, {InputThemeKeys} from './InputScreen';
import AutoCompleteScreen, {AutoCompleteThemeKeys} from './AutoCompleteScreen';
import ImageScreen from './ImageScreen';
import OcrPictureScreen from './OcrPictureScreen';

import FloatingLayerScreen, {
  FloatingLayerThemeKeys,
} from './FloatingLayerScreen';
import PickerScreen from './PickerScreen';
import SearchBarScreen from './SearchBarScreen';
import StepsScreen, {StepsThemeKeys} from './StepsScreen';
import ToastScreen, {ToastThemeKeys} from './ToastScreen';
import VirtualListScreen from './VirtualListScreen';
import BadgeScreen, {BadgeThemeKeys} from './BadgeScreen';
import SwitchScreen, {SwitchThemeKeys} from './SwitchScreen';
import ResultScreen, {ResultThemeKeys} from './ResultScreen';
import SpaceScreen from './SpaceScreen';
import IconScreen from './IconScreen';
import ActionSheetScreen from './ActionSheetScreen';
import DividerScreen from './DividerScreen';
import UploaderScreen, {UploaderThemeKeys} from './UploaderScreen';
import PreviewPdfScreen from './UploaderScreen/PreviewPdfScreen';
import CollapseScreen, {CollapseThemeKeys} from './CollapseScreen';
import DescriptionsScreen, {DescriptionsThemeKeys} from './DescriptionsScreen';
import SwiperScreen, {SwiperThemeKeys} from './SwiperScreen';
import PullToRefreshScreen from './PullToRefreshScreen';
import PullToRefreshNativeScreen from './PullToRefreshNativeScreen';
import ErrorBlockScreen, {ErrorBlockThemeKeys} from './ErrorBlockScreen';
import SkeletonScreen from './SkeletonScreen';
import ImageViewerScreen from './ImageViewerScreen';
import PopoverScreen from './PopoverScreen';
import StepperScreen, {StepperThemeKeys} from './StepperScreen';
import RadioScreen, {RadioThemeKeys} from './RadioScreen';

import CalendarScreen from './CalendarScreen';

import DropdownScreen from './DropdownScreen';

import RowScreen from './RowScreen';

import RateScreen, {RateThemeKeys} from './RateScreen';

import AmountInputScreen, {AmountInputThemeKeys} from './AmountInputScreen';

import NotificationScreen, {NotificationThemeKeys} from './NotificationScreen';
import PasswordInputScreen, {
  PasswordInputThemeKeys,
} from './PasswordInputScreen';
import ProgressScreen, {ProgressThemeKeys} from './ProgressScreen';
import IndexBarScreen, {IndexBarThemeKeys} from './IndexBarScreen';
import CodeInputScreen from './CodeInputScreen';
import FileViewerScreen from './FileViewerScreen';
import QRCodeScreen from './QRCodeScreen';

// fix the issue in MIUI 12
// https://github.com/facebook/react-native/issues/29259
if (Platform.OS === 'android' && NativeModules.PlatformConstants) {
  const fingerprint = NativeModules.PlatformConstants.Fingerprint;

  if (fingerprint?.match(/^(xiaomi|redmi|mi|mix|poco).*\/v12\..*/i)) {
    // @ts-ignore
    const originTextRender = Text.render;

    // @ts-ignore
    Text.render = function render(props, ref) {
      return originTextRender.apply(this, [
        {
          ...props,
          style: [{fontFamily: ''}, props.style],
        },
        ref,
      ]);
    };
  }
}

export const routerConfig: (StackRouteConfig & {themeKeys?: any})[] = [
  {
    path: 'HomeScreen',
    component: HomeScreen,
    navigationOptions: {title: '首页'},
  },
  {path: 'LayoutScreen', component: LayoutScreen},
  {path: 'CardScreen', component: CardScreen, themeKeys: CardThemeKeys},
  {path: 'TitleScreen', component: TitleScreen},
  {path: 'ButtonScreen', component: ButtonScreen, themeKeys: ButtonThemeKeys},
  {
    path: 'LoadingScreen',
    component: LoadingScreen,
    themeKeys: LoadingThemeKeys,
  },
  {path: 'NavBarScreen', component: NavBarScreen, themeKeys: NavBarThemeKeys},
  {path: 'ListScreen', component: ListScreen, themeKeys: ListThemeKeys},
  {path: 'MaskScreen', component: MaskScreen},
  {path: 'TourScreen', component: TourScreen},
  {path: 'QRCodeScreen', component: QRCodeScreen},
  {path: 'TabsScreen', component: TabsScreen, themeKeys: TabsThemeKeys},
  {path: 'TagScreen', component: TagScreen, themeKeys: TagThemeKeys},
  {path: 'FilterScreen', component: FilterScreen, themeKeys: FilterThemeKeys},
  {
    path: 'StepperScreen',
    component: StepperScreen,
    themeKeys: StepperThemeKeys,
  },
  {
    path: 'OptionGroupScreen',
    component: OptionGroupScreen,
    themeKeys: OptionsGroupThemeKeys,
  },
  {
    path: 'CheckboxScreen',
    component: CheckboxScreen,
    themeKeys: CheckboxThemeKeys,
  },
  {path: 'FieldScreen', component: FieldScreen, themeKeys: FieldThemeKeys},
  {path: 'PopupScreen', component: PopupScreen},
  {
    path: 'DatePickerScreen',
    component: DatePickerScreen,
    themeKeys: DatePickerThemeKeys,
  },
  {
    path: 'NoticeBarScreen',
    component: NoticeBarScreen,
    themeKeys: NoticeBarThemeKeys,
  },
  {
    path: 'OptionsScreen',
    component: OptionsScreen,
    themeKeys: OptionsThemeKeys,
  },
  {path: 'ModalScreen', component: ModalScreen, themeKeys: ModalThemeKeys},
  {path: 'SingleCheckOptionsScreen', component: SingleCheckOptionsScreen},
  {
    path: 'AutoCompleteScreen',
    component: AutoCompleteScreen,
    themeKeys: AutoCompleteThemeKeys,
  },
  {path: 'InputScreen', component: InputScreen, themeKeys: InputThemeKeys},
  {
    path: 'FloatingLayerScreen',
    component: FloatingLayerScreen,
    themeKeys: FloatingLayerThemeKeys,
  },
  {path: 'PickerScreen', component: PickerScreen},
  {path: 'SearchBarScreen', component: SearchBarScreen},
  {path: 'StepsScreen', component: StepsScreen, themeKeys: StepsThemeKeys},
  {path: 'ToastScreen', component: ToastScreen, themeKeys: ToastThemeKeys},
  {path: 'VirtualListScreen', component: VirtualListScreen},
  {path: 'BadgeScreen', component: BadgeScreen, themeKeys: BadgeThemeKeys},
  {path: 'SwitchScreen', component: SwitchScreen, themeKeys: SwitchThemeKeys},
  {path: 'ResultScreen', component: ResultScreen, themeKeys: ResultThemeKeys},
  {path: 'ActionSheetScreen', component: ActionSheetScreen},
  {path: 'DividerScreen', component: DividerScreen},
  {
    path: 'UploaderScreen',
    component: UploaderScreen,
    themeKeys: UploaderThemeKeys,
  },
  {path: 'PreviewPdfScreen', component: PreviewPdfScreen},
  {
    path: 'CollapseScreen',
    component: CollapseScreen,
    themeKeys: CollapseThemeKeys,
  },
  {
    path: 'DescriptionsScreen',
    component: DescriptionsScreen,
    themeKeys: DescriptionsThemeKeys,
  },
  {path: 'SwiperScreen', component: SwiperScreen, themeKeys: SwiperThemeKeys},
  {path: 'PullToRefreshScreen', component: PullToRefreshScreen},
  {path: 'PullToRefreshNativeScreen', component: PullToRefreshNativeScreen},
  {
    path: 'ErrorBlockScreen',
    component: ErrorBlockScreen,
    themeKeys: ErrorBlockThemeKeys,
  },
  {path: 'SkeletonScreen', component: SkeletonScreen},
  {path: 'ImageViewerScreen', component: ImageViewerScreen},
  {path: 'PopoverScreen', component: PopoverScreen},
  {path: 'BottomBarScreen', component: BottomBarScreen},
  {path: 'SelectScreen', component: SelectScreen, themeKeys: SelectThemeKeys},
  {path: 'CalendarScreen', component: CalendarScreen},
  {path: 'SpaceScreen', component: SpaceScreen},
  {path: 'IconScreen', component: IconScreen},
  {path: 'ShouldRenderScreen', component: ShouldRenderScreen},
  {path: 'DropdownScreen', component: DropdownScreen},
  {path: 'RowScreen', component: RowScreen},
  {path: 'RateScreen', component: RateScreen, themeKeys: RateThemeKeys},
  {
    path: 'AmountInputScreen',
    component: AmountInputScreen,
    themeKeys: AmountInputThemeKeys,
  },
  {
    path: 'NotificationScreen',
    component: NotificationScreen,
    themeKeys: NotificationThemeKeys,
  },
  {
    path: 'PasswordInputScreen',
    component: PasswordInputScreen,
    themeKeys: PasswordInputThemeKeys,
  },
  {path: 'RadioScreen', component: RadioScreen, themeKeys: RadioThemeKeys},
  {
    path: 'ProgressScreen',
    component: ProgressScreen,
    themeKeys: ProgressThemeKeys,
  },
  {
    path: 'IndexBarScreen',
    component: IndexBarScreen,
    themeKeys: IndexBarThemeKeys,
  },
  {path: 'FileViewerScreen', component: FileViewerScreen},
  {path: 'ImageScreen', component: ImageScreen},
  {path: 'CodeInputScreen', component: CodeInputScreen},
  {path: 'OcrPictureScreen', component: OcrPictureScreen},
  ...DebugPanelRouters,
];

const Navigation = (_: any) => {
  // const {initialRouteParams = {}} = JSON.parse(_?.params || '{}');
  // const AppNavigator = useMemo(() => {
  //   return createStackNavigator(routerWithTitle(routerConfig), {
  //     initialRouteName: 'HomeScreen',
  //     initialRouteParams: initialRouteParams?.params || {},
  //     defaultNavigationOptions: {
  //       headerTitleAlign: 'center',
  //       gestureEnabled: false,
  //     },
  //   });
  // }, [initialRouteParams]);

  // const App = createAppContainer(AppNavigator);
  // eslint-disable-next-line react/react-in-jsx-scope
  return <NavigationContainerWrapper routes={routerConfig} />;
};

export default Navigation;
