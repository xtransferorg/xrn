import { Dimensions, StyleSheet } from "react-native";
import { BOLD } from "@xrnjs/ui";

const height = Dimensions.get("window").height;

export default StyleSheet.create({
  centeredView: {},
  modalView: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
  },
  logo: {
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 16,
    color: "#181721",
    fontWeight: BOLD,
  },
  contentContainer: {
    width: "100%",
    marginBottom: 24,
    marginTop: 24,
    maxHeight: height * 0.36,
  },
  contentItem: {
    fontSize: 14,
    marginBottom: 8,
    color: "#696680",
    lineHeight: 22,
  },
  containerInner: {
    paddingLeft: 16,
    paddingRight: 16,
    overflow: "hidden",
    flexDirection: "column",
    alignItems: "center",
  },
  buttonContainer: {
    width: "100%",
    paddingBottom: 24,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressText: {
    marginTop: 8,
    color: "#181721",
    fontSize: 14,
  },
});
