import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  TextInput,
  Platform,
  TouchableOpacity
} from 'react-native';
import NetworkRequestInfo from '../NetworkRequestInfo';
import { useThemedStyles, Theme } from '../theme';
import ResultItem from './ResultItem';
import Header from './Header';
import Button from './Button';
import Clipboard from "@react-native-clipboard/clipboard";
import { nativeToast } from '../../../../utils/toast';

interface Props {
  request: NetworkRequestInfo;
}

const Headers = ({
  title = 'Headers',
  headers,
}: {
  title: string;
  headers?: object;
}) => {
  const styles = useThemedStyles(themedStyles);
  return (
    <View>
      <Header shareContent={headers && JSON.stringify(headers, null, 2)}>
        {title}
      </Header>
      <View style={styles.content}>
        {Object.entries(headers || {}).map(([name, value]) => (
          <View style={styles.headerContainer} key={name}>
            <Text style={styles.headerKey}>{name}: </Text>
            <Text style={styles.headerValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const LargeText: React.FC<{ children: string }> = ({ children }) => {
  const styles = useThemedStyles(themedStyles);

  if (Platform.OS === 'ios') {
    /**
     * A readonly TextInput is used because large Text blocks sometimes don't render on iOS
     * See this issue https://github.com/facebook/react-native/issues/19453
     * Note: Even with the fix mentioned in the comments, text with ~10,000 lines still fails to render
     */
    return (
      <TextInput
        style={[styles.content, styles.largeContent]}
        multiline
        editable={false}
        value={children}
      />
    );
  }

  return (
    <View style={styles.largeContent}>
      <ScrollView nestedScrollEnabled>
        <View>
          <Text style={styles.content} selectable>
            {children}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const RequestDetails: React.FC<Props> = ({ request }) => {
  const [responseBody, setResponseBody] = useState('Loading...');
  const styles = useThemedStyles(themedStyles);

  useEffect(() => {
    (async () => {
      const body = await request.getResponseBody();
      setResponseBody(body);
    })();
  }, [request]);

  const requestBody = request.getRequestBody(!!request.gqlOperation);

  const getFullRequest = () => {
    let response;
    if (responseBody) {
      try {
        response = JSON.parse(responseBody);
      } catch {
        response = `${responseBody}`;
      }
    }
    const processedRequest = {
      ...request,
      response,
      duration: request.duration,
    };
    return JSON.stringify(processedRequest, null, 2);
  };

  return (
    <View style={styles.container}>
      <ResultItem request={request} style={styles.info} />
      <ScrollView style={styles.scrollView} nestedScrollEnabled>
        <Headers title="Request Header" headers={request.requestHeaders} />
        <Header shareContent={requestBody}>Request Body</Header>
        <LargeText>{requestBody}</LargeText>
        <Headers title="Response Header" headers={request.responseHeaders} />
        <Header shareContent={responseBody}>Response Body</Header>
        <LargeText>{responseBody}</LargeText>
        <Header>More</Header>
        <TouchableOpacity style={styles.fullBox} onPress={() => {
          // Share.share({ message: getFullRequest() });
          nativeToast("复制成功")
          Clipboard.setString(getFullRequest());
        }}>
          <Text style={styles.shareText}>复制完整Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const themedStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 10,
    },
    info: {
      margin: 0,
      marginVertical: 8,
    },
    close: {
      position: 'absolute',
      right: 10,
      top: 0,
    },
    scrollView: {
      width: '100%',
    },
    headerContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    headerKey: { fontWeight: 'bold', color: theme.colors.text },
    headerValue: { color: theme.colors.text },
    text: {
      fontSize: 16,
      color: theme.colors.text,
    },
    content: {
      backgroundColor: theme.colors.card,
      padding: 10,
      color: theme.colors.text,
    },
    largeContent: {
      maxHeight: 300,
    },
    shareBox: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 30,
    },
    fullBox: {
      height: 40,
      borderRadius: 20,
      backgroundColor: "orange",
      justifyContent: 'center',
      alignItems: 'center',
      width: 300,
      alignSelf: 'center',
      marginBottom: 30,
      marginTop: 10,
    },
    shareText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: 'bold'
    }
  });

export default RequestDetails;
