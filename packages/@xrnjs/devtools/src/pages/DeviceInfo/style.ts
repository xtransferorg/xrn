import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 44,
  },
  listHeader: {},
  itemContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    paddingLeft: 20,
    paddingRight: 10,
    paddingBottom: 10,
    alignItems: "center",
  },
  tipContainer: {
    flexDirection: "column",
    flex: 1,
  },
  key: {
    marginTop: 20,
    color: "#333",
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    marginTop: 20,
    color: "#666",
    fontSize: 12,
    marginRight: 10,
    flex: 1,
  },
  copyBtn: {
    width: 40,
    height: 40,
  },
  copyIcon: {
    position: "absolute",
    bottom: 0,
    right: 10,
  },
  navRightBtn: {
    width: 70,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rightBtnText: {
    color: "#333",
    fontSize: 15,
  },
});
