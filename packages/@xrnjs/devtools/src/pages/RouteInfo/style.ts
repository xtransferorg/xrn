import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerStyle: {
    height: 44,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 20,
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  subTitle: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    paddingLeft: 20,
    marginRight: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  itemBox: {
    marginVertical: 15,
    flexDirection: "column",
    flex: 1,
  },
  redDot: {
    width: 12,
    height: 12,
    backgroundColor: "red",
    borderRadius: 6,
  },
  bundleBox: {
    flexDirection: "row",
  },
  bundleKey: {
    color: "#333",
    fontSize: 14,
  },
  bundleVal: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
  },
  moduleBox: {
    marginTop: 5,
    flexDirection: "row",
  },
  moduleKey: {
    color: "#333",
    fontSize: 14,
  },
  moduleVal: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
  },
  pageBox: {
    marginTop: 5,
    flexDirection: "row",
    marginRight: 10,
  },
  pageKey: {
    color: "#333",
    fontSize: 14,
  },
  pageVal: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
  },
  schemeBox: {
    marginTop: 20,
    // flexDirection: "row",
  },
  schemeKey: {
    color: "#333",
    fontSize: 14,
  },
  schemeVal: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
  },
});
