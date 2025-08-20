import {StyleSheet} from 'react-native';

const T4 = 14;

export default StyleSheet.create({
  wrapper: {padding: 16},
  description: {
    color: '#696680',
    fontWeight: '400',
    fontSize: T4,
    textAlign: 'right',
    lineHeight: 21,
  },
  remind: {
    color: '#FF7A00',
    fontWeight: '400',
    fontSize: T4,
    textAlign: 'right',
    lineHeight: 21,
  },
  switch: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  titleIcon: {
    // paddingLeft: 6,
  },
  title: {
    padding: 12,
  },

  combineTitle: {
    paddingHorizontal: 12,
    paddingTop: 14,
  },

  combineLabel: {
    fontWeight: '400',
    fontSize: T4,
    color: '#696680',
  },
  combineLabelNew: {
    fontWeight: '400',
    fontSize: T4,
    color: '#696680',
    fontStyle: 'normal',
    lineHeight: 22,
  },

  combineDescription: {
    fontWeight: '400',
    fontSize: T4,
    color: '#222222',
    textAlign: 'right',
    lineHeight: 21,
  },
  combineDescriptionNew: {
    fontWeight: '400',
    fontSize: T4,
    color: '#181721',
    // textAlign: 'right',
    fontStyle: 'normal',
    lineHeight: 22,
  },

  // 当行列表每一项
  singleItem: {
    paddingRight: 12,
  },

  // 多行列表的每一项
  multipleItem: {
    paddingRight: 12,
  },

  // 组合列表的每一项
  combineItem: {
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 12,
  },

  footer: {
    height: 5,
  },

  flexShrink: {
    flexShrink: 0.5,
  },
  arrowStyle: {
    // marginTop: 3.5,
  },
  arrowStyleNew: {
    marginTop: 22, // 去除title的高度居中
  },

  rightContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  rightExtra: {
    fontSize: 16,
    lineHeight: 24,
    color: '#696680',
  },
});
