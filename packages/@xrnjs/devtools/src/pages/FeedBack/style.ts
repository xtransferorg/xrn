import { StyleSheet, Platform } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  rateBox: {
    padding: 15,
  },
  rateTitle: {
    color: '#333',
    fontWeight: 'bold'
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  leftTip: {
    color: '#666',
    fontSize: 12,
    marginLeft: 10
  },
  rightTip: {
    color: '#666',
    fontSize: 12,
    marginLeft: 80,
  },
  rate: {
    
  },
  reasonBox: {
    padding: 15,
  },
  tagTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    paddingTop: 2
  },
  reasonTip: {
    color: '#333',
    fontWeight: 'bold'
  },
  itemBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginRight: 10,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectedTag: {
    backgroundColor: 'orange',
  },
  tagText: {
    fontSize: 13,
    color: '#333',
  },
  selectedTagText: {
    color: '#fff',
  },
  feedbackBox: {
    padding: 15,
  },
  feedbackTip: {
    color: '#333',
    fontWeight: 'bold'
  },
  inputBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginTop: 10,
  },
  input: {
    minHeight: 40,
    maxHeight: 150,
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
    marginBottom: 10,
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#666',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 14,
    color: '#999',
  },
  percentBox: {
    padding: 15,
  },
  contactBox: {
    padding: 15,
  },
  contactTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    color: '#333',
    fontWeight: 'bold'
  },
  contactTip: {
    color: '#999',
    fontSize: 12
  },
  contactInput: {
    marginTop: 10,
    height: 30,
    fontSize: 12,
    paddingHorizontal: 8,
    color: '#666',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    textAlignVertical: 'center',
    paddingVertical: Platform.OS === 'android' ? 6 : 0,
  },
  confirm: {
    marginHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    backgroundColor: 'orange',
    marginTop: 30,
    marginBottom: 30,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
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
});
