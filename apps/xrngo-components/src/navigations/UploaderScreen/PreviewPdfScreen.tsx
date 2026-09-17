import React from 'react';
import {View} from 'react-native';
// import Pdf from 'react-native-pdf';

const PreviewPdfScreen = (_: any) => {
  // const pdfUrl = props.route?.params?.uri;
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        // marginTop: 45,
      }}>
      {/* <Pdf
        trustAllCerts={Platform.OS === 'ios'}
        source={{uri: pdfUrl}}
        style={{
          flex: 1,
          width: Dimensions.get('window').width,
          height: Dimensions.get('window').height,
        }}
        onLoadComplete={(numberOfPages, filePath) => {
          console.log(`Number of pages: ${numberOfPages}`);
        }}
        onPageChanged={(page, numberOfPages) => {
          console.log(`Current page: ${page}`);
        }}
        onError={error => {
          console.log('error>>>', error);
        }}
        onPressLink={uri => {
          console.log(`Link pressed: ${uri}`);
        }}
      /> */}
    </View>
  );
};

export default PreviewPdfScreen;
