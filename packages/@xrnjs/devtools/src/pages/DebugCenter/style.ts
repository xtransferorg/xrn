import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const itemWidth = width / 4;
const itemHeight = itemWidth;

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  rightBtnBox: {
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "orange",
    height: 30,
    marginRight: 15,
  },
  rightBtnText: {
    color: "#fff",
    // fontWeight: 'bold'
  },
  headerContainer: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  headerTitle: {
    marginLeft: 15,
    fontSize: 16,
  },
  footer: {
    width: "100%",
    height: 10,
    backgroundColor: "#f5f5f5",
  },
  rowContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    backgroundColor: "#fff",
  },
  item: {
    height: itemHeight,
    backgroundColor: "#fff",
    borderColor: "#f5f5f5",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconStyle: {
    width: 30,
    height: 30,
  },
  itemText: {
    marginTop: 10,
    fontSize: 13,
    textAlign: "center",
  }
});
