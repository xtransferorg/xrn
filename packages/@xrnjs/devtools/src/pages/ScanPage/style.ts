import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
export const REAC_WIDTH = 220;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  camera: {
    width,
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width,
    paddingHorizontal: 14,
  },
  title: { color: "#ff934a", textAlign: "center", flex: 1 },
  rectWrap: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00000000",
  },
  rectTop: { width, backgroundColor: "#00000090", flex: 1 },
  scanArea: {
    width: (width - REAC_WIDTH) / 2,
    height: REAC_WIDTH,
    backgroundColor: "#00000090",
    flex: 1,
  },
  mid: {
    width,
    flex: 1,
    flexDirection: "row",
    minHeight: REAC_WIDTH,
    maxHeight: REAC_WIDTH,
  },
  rect: {
    height: REAC_WIDTH,
    width: REAC_WIDTH,
    borderWidth: 0.5,
    borderColor: "#ff934a",
    backgroundColor: "transparent",
  },
  corner: {
    width: 20,
    height: 20,
    position: "absolute",
    borderColor: "#ff934a",
  },
  lt: {
    left: 0,
    top: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
  },
  rt: {
    right: 0,
    top: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
  },
  lb: {
    left: 0,
    bottom: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
  },
  rb: {
    right: 0,
    bottom: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  wrap: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  warn: {
    color: "#a1a1a1",
  },
  line: {
    // top: 100,
    left: 0,
    width: REAC_WIDTH,
    position: "absolute",
    borderColor: "#ff934a",
    borderBottomWidth: 2,
  },
  tipsWrap: { width, backgroundColor: "#00000090", flex: 1 },
  tips: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
    paddingTop: 20,
  },
});
