import { StyleSheet } from "react-native";

export default StyleSheet.create({
  containerStyle: {
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
  rightBtnBox: {
    marginRight: 20,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rightBtnText: {
    fontSize: 14,
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    paddingLeft: 20,
    marginRight: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  infoStyle: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    marginRight: 20,
  },
  urlText: {
    marginTop: 20,
  },
  btnBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  copyUrlBox: {
    backgroundColor: "orange",
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  openUrlBox: {
    backgroundColor: "orange",
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    marginLeft: 20,
  },
  copyText: {
    color: "#fff",
    fontSize: 15,
  },
  openText: {
    color: "#fff",
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
