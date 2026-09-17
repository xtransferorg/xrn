import React, {FC, RefObject, useEffect, useRef} from 'react';
import {Layout, List, Card, Title, BottomSafeArea, Space} from '@xrnjs/ui';
import {
  DeviceEventEmitter,
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
  ScrollView,
  View,
} from 'react-native';

import {Routes} from '../enum';
import styles from './style';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: FC<HomeScreenProps> = props => {
  const {navigation} = props;
  const index = navigation?.state?.params?.index;

  const view1Ref = useRef<View>(null);
  const view2Ref = useRef<View>(null);
  const view3Ref = useRef<View>(null);
  const view4Ref = useRef<View>(null);
  const view5Ref = useRef<View>(null);
  const view6Ref = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const itemPositions = useRef<{
    [key: string]: number;
  }>({});

  const onLayout = (event: any, index: string, ref: RefObject<View>) => {
    if (ref.current && scrollViewRef.current) {
      ref.current.measureLayout(
        // @ts-ignore
        scrollViewRef.current,
        (x, y) => {
          itemPositions.current[index] = y - 6;
        },
      );
    }
  };

  const scrollToPosition = (yPosition: number) => {
    scrollViewRef.current?.scrollTo({y: yPosition, animated: true});
  };

  function toggle(fn: () => void) {
    if (typeof itemPositions.current[index] === 'number') {
      fn();
    } else {
      setTimeout(() => {
        toggle(fn);
      }, 100);
    }
  }

  if (index) {
    toggle(() => {
      scrollToPosition(itemPositions.current[index]);
    });
  }

  useEffect(() => {
    let subscription: EmitterSubscription;
    if (Platform.OS === 'ios') {
      const iosEventEmitter = new NativeEventEmitter(
        NativeModules?.BundleNavigation,
      );
      subscription = iosEventEmitter?.addListener(
        'NATIVE_FLOAT_BAR_CLICK',
        (_res: any) => {
          navigation.navigate('DebugCenter');
        },
      );
    } else {
      subscription = DeviceEventEmitter.addListener(
        'NATIVE_FLOAT_BAR_CLICK',
        (_res: any) => {
          navigation.navigate('DebugCenter');
        },
      );
    }

    return () => {
      subscription?.remove?.();
    };
  }, [navigation]);

  return (
    <Layout>
      <ScrollView ref={scrollViewRef}>
        <Space>
          <View ref={view1Ref}>
            <Card onLayout={event => onLayout(event, 'layout', view1Ref)}>
              <List
                header={
                  <Title
                    style={styles.titleWrapper}
                    titleStyle={styles.titleStyle}>
                    布局
                  </Title>
                }>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.LayoutScreen);
                  }}>
                  Layout 布局
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.CardScreen);
                  }}>
                  Card 卡片
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.SpaceScreen);
                  }}>
                  Space 间距
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ShouldRenderScreen);
                  }}>
                  ShouldRender 是否渲染
                </List.Item>
              </List>
            </Card>
          </View>
          <View ref={view2Ref}>
            <Card onLayout={event => onLayout(event, 'navigation', view2Ref)}>
              <List
                header={
                  <Title
                    style={styles.titleWrapper}
                    titleStyle={styles.titleStyle}>
                    导航
                  </Title>
                }>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.NavBarScreen);
                  }}>
                  NavBar 导航栏
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.TabsScreen);
                  }}>
                  Tabs 标签页
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.SearchBarScreen);
                  }}>
                  SearchBar 搜索框
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.IndexBarScreen);
                  }}>
                  IndexBar 索引栏
                </List.Item>
              </List>
            </Card>
          </View>
          <View ref={view3Ref}>
            <Card onLayout={event => onLayout(event, 'data', view3Ref)}>
              <List
                header={
                  <Title
                    style={styles.titleWrapper}
                    titleStyle={styles.titleStyle}>
                    信息展示
                  </Title>
                }>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.FileViewerScreen);
                  }}>
                  FileViewer 文件预览
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.QRCodeScreen);
                  }}>
                  QRCode 二维码
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.OcrPictureScreen);
                  }}>
                  OcrPicture 扫码
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.CodeInputScreen);
                  }}>
                  CodeInput 输入框
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.BottomBarScreen);
                  }}>
                  BottomBar 底部栏
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.TitleScreen);
                  }}>
                  Title 标题
                </List.Item>

                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.PullToRefreshScreen);
                  }}>
                  PullToRefresh 下拉刷新
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.PullToRefreshNativeScreen);
                  }}>
                  PullToRefreshNative 下拉刷新
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.SwiperScreen);
                  }}>
                  Swiper 走马灯
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.CollapseScreen);
                  }}>
                  Collapse 折叠面板
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.DescriptionsScreen);
                  }}>
                  Descriptions 描述列表
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ListScreen);
                  }}>
                  List 列表
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.VirtualListScreen);
                  }}>
                  VirtualList 列表
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.TagScreen);
                  }}>
                  Tag 标签
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.NoticeBarScreen);
                  }}>
                  NoticeBar 通告栏
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.StepsScreen);
                  }}>
                  Steps 步骤条
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.SwitchScreen);
                  }}>
                  Switch 开关
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.BadgeScreen);
                  }}>
                  Badge 徽标数
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ResultScreen);
                  }}>
                  Result 结果
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.DividerScreen);
                  }}>
                  Divider 分割线
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ErrorBlockScreen);
                  }}>
                  ErrorBlock 空状态
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ImageViewerScreen);
                  }}>
                  ImageViewer 图片预览
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ImageScreen);
                  }}>
                  Image 图片
                </List.Item>
              </List>
            </Card>
          </View>
          <View ref={view4Ref}>
            <Card onLayout={event => onLayout(event, 'feedback', view4Ref)}>
              <List
                header={
                  <Title
                    style={styles.titleWrapper}
                    titleStyle={styles.titleStyle}>
                    反馈
                  </Title>
                }>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.LoadingScreen);
                  }}>
                  Loading 加载中
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.MaskScreen);
                  }}>
                  Mask 背景蒙层
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.TourScreen);
                  }}>
                  Tour 漫游式引导
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.PopupScreen);
                  }}>
                  Popup 弹出层
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ModalScreen);
                  }}>
                  Modal 弹窗
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.FloatingLayerScreen);
                  }}>
                  FloatingLayer 底浮层
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ToastScreen);
                  }}>
                  Toast 轻提示
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ActionSheetScreen);
                  }}>
                  ActionSheet 动作面板
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.PopoverScreen);
                  }}>
                  Popover 气泡弹出框
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.SkeletonScreen);
                  }}>
                  Skeleton 骨架屏
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.SelectScreen);
                  }}>
                  Select 选择弹窗
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ProgressScreen);
                  }}>
                  Progress 进度条
                </List.Item>
              </List>
            </Card>
          </View>
          <View ref={view5Ref}>
            <Card onLayout={event => onLayout(event, 'general', view5Ref)}>
              <List
                header={
                  <Title
                    style={styles.titleWrapper}
                    titleStyle={styles.titleStyle}>
                    通用
                  </Title>
                }>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.ButtonScreen);
                  }}>
                  Button 按钮
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.OptionGroupScreen);
                  }}>
                  OptionGroup 选项组
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.FilterScreen);
                  }}>
                  Filter 筛选器
                </List.Item>
              </List>
            </Card>
          </View>
          <View ref={view6Ref}>
            <Card onLayout={event => onLayout(event, 'form', view6Ref)}>
              <List
                header={
                  <Title
                    style={styles.titleWrapper}
                    titleStyle={styles.titleStyle}>
                    信息录入
                  </Title>
                }>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.CheckboxScreen);
                  }}>
                  Checkbox 复选框
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.RadioScreen);
                  }}>
                  Radio 复选框
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.OptionsScreen);
                  }}>
                  Options 选项
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.SingleCheckOptionsScreen);
                  }}>
                  SingleCheckOptions 选项
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.AutoCompleteScreen);
                  }}>
                  AutoComplete 自动补全输入框
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.InputScreen);
                  }}>
                  Input 输入框
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.PasswordInputScreen);
                  }}>
                  PasswordInput 输入框
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.DatePickerScreen);
                  }}>
                  DatePicker 时间选择器
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.PickerScreen);
                  }}>
                  Picker 选择器
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.UploaderScreen);
                  }}>
                  Upload 上传
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.FieldScreen);
                  }}>
                  Field 字段
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.CalendarScreen);
                  }}>
                  Calendar 日历
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.StepperScreen);
                  }}>
                  Stepper 步进器
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.RowScreen);
                  }}>
                  Row 布局
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.RateScreen);
                  }}>
                  Rate 评分
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.AmountInputScreen);
                  }}>
                  AmountInput 金额输入框
                </List.Item>
                <List.Item
                  onPress={() => {
                    navigation.navigate(Routes.NotificationScreen);
                  }}>
                  Notification 通知
                </List.Item>
              </List>
            </Card>
          </View>
        </Space>

        <BottomSafeArea />
      </ScrollView>
    </Layout>
  );
};

export default HomeScreen;
