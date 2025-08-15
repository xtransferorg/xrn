import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    alignItems: "center",
    marginTop: 60,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  tipStyle: {
    marginLeft: 20,
    marginTop: 20,
    marginRight: 20,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  inputStyle: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#333",
    marginTop: 30,
    height: 40,
    overflow: "hidden",
    paddingLeft: 10,
    paddingRight: 40,
    fontSize: 18,
    fontWeight: "500",
  },
  confirm: {
    marginTop: 100,
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
