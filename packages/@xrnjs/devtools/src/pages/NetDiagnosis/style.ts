import { Dimensions, StyleSheet } from "react-native";

const { height } = Dimensions.get("window");
export const REAC_WIDTH = 220;

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  contentBox: {
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)", // 半透明背景
    justifyContent: "center",
    alignItems: "center",
  },
  navBox: {
    position: "absolute",
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  leftBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  navTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  rightBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  bgTipBox: {
    backgroundColor: "#EB5444",
    height: 200,
  },
  statusText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    top: 120,
    left: 10,
  },
  tip: {
    top: 130,
    left: 10,
    color: "#fff",
    fontSize: 12,
  },
  infoBox: {
    // position: 'absolute',
    // top: 190,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    // bottom: 0,
    width: "100%",
    // height: height - 160,
  },
  gradientBox: {

  },
  baseInfo: {
    position: "relative",
    marginTop: 26,
    marginLeft: 10,
    marginRight: 10,
  },
  titleBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  baseTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  proxyBox: {},
  pingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusIcon: {
    width: 15,
    height: 15,
  },
  version: {
    color: "#999",
    fontSize: 12,
    marginTop: 10,
  },
  sysVersion: {
    color: "#999",
    fontSize: 12,
    marginTop: 10,
  },
  bottomBox: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    justifyContent: "flex-end",
    marginBottom: 30,
  },
  reCheckBox: {
    height: 30,
    borderRadius: 15,
    backgroundColor: "orange",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 10,
  },
});
