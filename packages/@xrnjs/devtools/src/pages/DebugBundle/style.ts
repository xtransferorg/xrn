import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    marginBottom: 20,
    marginLeft: 20,
  },
  ipContainer: {
    flexDirection: "column",
  },
  bundleContainer: {
    flexDirection: "column",
    marginTop: 30,
    marginBottom: 0,
  },
  tipStyle: {
    fontSize: 16,
    fontWeight: "800",
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
  scanContainer: {
    flexDirection: "column",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  scanStyle: {
    width: 25,
    height: 25,
  },
  bundleTip: {
    fontSize: 16,
    fontWeight: "800",
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
  modalListItem: {
    paddingTop: 10,
    alignItems: "center",
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  bundleName: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  modalBundleName: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  /** 端口输入：右对齐，光标在末尾，新字符从右侧延续 */
  modalPortInput: {
    flex: 1,
    minWidth: 96,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
    textAlign: "right",
    paddingVertical: 4,
  },
  bundleInfo: {
    color: "#333",
    fontSize: 16,
    fontWeight: "700",
  },
  moreChevron: {
    marginLeft: 2,
  },
  switch: {
    marginRight: 0,
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

  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  infoModalText: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#f0f0f0",
  },
  actionButton: {
    backgroundColor: "#007AFF",
  },
  closeButtonText: {
    color: "#333",
  },
  actionButtonText: {
    color: "white",
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5, // 直径的一半就是圆角
    backgroundColor: "green",
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5, // 直径的一半就是圆角
    backgroundColor: "red",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#00000099',
  },
  normalText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
   // 卡片标题样式
  cardTitle: {
    marginBottom: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    // ✅ 关键：让内容靠底部显示
    position: 'absolute',
    height: '50%',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
