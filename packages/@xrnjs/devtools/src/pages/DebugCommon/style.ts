import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    marginTop: 20,
    marginLeft: 20,
  },
  bundleContainer: {
    flexDirection: "column",
    marginTop: 30,
    marginBottom: 10,
  },
  tipStyle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  inputStyle: {
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 20,
    width: 180,
    height: 40,
    overflow: "hidden",
    paddingLeft: 10,
    paddingRight: 40,
    fontSize: 16,
    fontWeight: "500",
  },
  bundleTip: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  listItem: {
    paddingLeft: 20,
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  bundleName: {
    flex: 1,
    color: "#333",
    fontSize: 16,
  },
  switch: {
    marginRight: 20,
  },
  confirm: {
    position: "relative",
    bottom: 60,
    alignSelf: "center",
    width: 300,
    height: 44,
    backgroundColor: "orange",
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
});
