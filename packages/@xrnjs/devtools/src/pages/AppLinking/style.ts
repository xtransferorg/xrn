import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    marginTop: 30,
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
  tipStyle: {
    marginLeft: 20,
    marginTop: 20,
    marginRight: 20,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  urlRule: {
    marginLeft: 20,
    marginRight: 20,
    color: "#333",
    marginTop: 20,
  },
  urlStr: {
    marginLeft: 20,
    marginRight: 20,
    marginTop: 10,
    color: "#333",
  },
  exampleUrl: {
    marginLeft: 20,
    marginRight: 20,
    color: "#333",
    marginTop: 30,
  },
  inputStyle: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#333",
    marginTop: 30,
    height: 150,
    width: width - 40,
    overflow: "hidden",
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 16,
    marginLeft: 20,
    marginRight: 20,
  },
  confirm: {
    marginTop: 20,
    width: width - 40,
    height: 44,
    backgroundColor: "orange",
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 20,
    marginRight: 20,
  },
  confirmText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
});
