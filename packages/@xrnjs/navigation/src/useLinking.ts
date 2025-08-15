import { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { Linking } from "react-native";
import URLParse from "url-parse";
// import { isTargetLink, parseCallAppParamsByLink } from "xt-web-core";
// import { CallAppTargetParams } from "xt-web-core/lib/callapp/callapp";

// import { CommonActions } from "./core";

export type LinkingConfig = {
  processLink?: (url: string) => string;
};

export const parseCallAppParamsByPath = (url: string): any => {
  let urlParse: URLParse<Record<string, string | undefined>> | null = null;
  try {
    urlParse = URLParse(url, true);
  } catch (e) {
    throw new Error(`Failed to parse URL: ${url}`, e);
  }

  if (!urlParse) {
    throw new Error(`Failed to parse URL: ${url}`);
  }

  const reg = new RegExp(`^/([^/]+)/([^/]+)/([^/]+)$`);

  const match = urlParse.pathname.match(reg);

  if (match) {
    const startIndex = 0;

    return {
      bundleName: match[startIndex + 1],
      moduleName: match[startIndex + 2],
      pageName: match[startIndex + 3],
      params: urlParse.query,
    };
  } else {
    return null;
  }
};

export const useLinking = (
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>,
  linkingConfig?: LinkingConfig,
) => {
  const { processLink } = linkingConfig || {};

  const handleURL = (url?: string | null) => {
    // if (!url) return;
    // if (processLink) {
    //   url = processLink(url);
    // }
    // try {
    //   let callAppByLinkParams: CallAppTargetParams | null = null;
    //   if (isTargetLink(url)) {
    //     callAppByLinkParams = parseCallAppParamsByLink(url);
    //   } else {
    //     // 处理 '/bundleName/moduleName/pageName' 的链接
    //     callAppByLinkParams = parseCallAppParamsByPath(url);
    //   }
    //   const { bundleName, moduleName, pageName, params } =
    //     callAppByLinkParams || {};
    //   if (!bundleName) {
    //     return;
    //   }
    //   if (pageName && navigationRef.getState().routeNames.includes(pageName)) {
    //     navigationRef.dispatch(
    //       CommonActions.navigate({
    //         name: pageName,
    //         params,
    //       }),
    //     );
    //     return;
    //   }
    //   navigationRef.dispatch(
    //     CommonActions.navigate({
    //       name:
    //         "/" +
    //         [bundleName, moduleName, pageName].filter((item) => item).join("/"),
    //       params,
    //     }),
    //   );
    // } catch (e) {
    //   console.error(e);
    // }
  };

  const handleInitialURLIfExist = () => {
    Linking.getInitialURL().then((url) => {
      handleURL(url);
    });
  };

  const addURLChangedListener = () => {
    Linking.addEventListener("url", (data) => {
      handleURL(data?.url);
    });
  };

  const initializeLinkingHandler = () => {
    handleInitialURLIfExist();
    addURLChangedListener();
  };

  return {
    enableLinking: !!linkingConfig,
    initializeLinkingHandler,
  };
};
