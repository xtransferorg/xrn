import { css, Global } from '@emotion/react';
import { ThemeProvider } from '@expo/styleguide';
import { MDXProvider } from '@mdx-js/react';
import * as Sentry from '@sentry/react';
import { AppProps } from 'next/app';
import { Inter, Fira_Code } from 'next/font/google';
import { QueryClient, QueryClientProvider } from 'react-query';

import { preprocessSentryError } from '~/common/sentry-utilities';
import { useNProgress } from '~/common/use-nprogress';
import DocumentationElements from '~/components/page-higher-order/DocumentationElements';
import { AnalyticsProvider } from '~/providers/Analytics';
import { CodeBlockSettingsProvider } from '~/providers/CodeBlockSettingsProvider';
import { TutorialChapterCompletionProvider } from '~/providers/TutorialChapterCompletionProvider';
import { markdownComponents } from '~/ui/components/Markdown';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { ToastContainer } from 'react-toastify';

import * as Tooltip from '~/ui/components/Tooltip';

import 'global-styles/global.css';
import '@expo/styleguide/dist/expo-theme.css';
import '@expo/styleguide-search-ui/dist/expo-search-ui.css';
import 'tippy.js/dist/tippy.css';

const isDev = process.env.NODE_ENV === 'development';

export const regularFont = Inter({
  display: 'swap',
  subsets: ['latin'],
});
export const monospaceFont = Fira_Code({
  weight: ['400', '500'],
  display: 'swap',
  subsets: ['latin'],
});

const initSentry = (id: string) => {
  Sentry.init({
    dsn: 'https://7b7df8d272c73ab68bbb88c0ae21449a@sentry.xtadmins.com/121',
    beforeSend: preprocessSentryError,
    environment: isDev ? 'development' : 'production',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1,
    initialScope: {
      user: {
        id,
      },
    },
  });
};

// Initialize an agent at application startup.

if (typeof window !== 'undefined') {
  FingerprintJS.load()
    .then(fp => fp.get())
    .then(result => {
      console.log('设备指纹', result.visitorId);
      // initSentry(result.visitorId);
    });
} else {
}

const rootMarkdownComponents = {
  ...markdownComponents,
  wrapper: DocumentationElements,
};

const queryClient = new QueryClient();

export { reportWebVitals } from '~/providers/Analytics';

export default function App({ Component, pageProps }: AppProps) {
  useNProgress();
  return (
    <AnalyticsProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TutorialChapterCompletionProvider>
            <CodeBlockSettingsProvider>
              <MDXProvider components={rootMarkdownComponents}>
                <Tooltip.Provider>
                  <Global
                    styles={css({
                      'html, body, kbd, button, input, select': {
                        fontFamily: regularFont.style.fontFamily,
                      },
                      'code, pre, table.diff': {
                        fontFamily: monospaceFont.style.fontFamily,
                      },
                    })}
                  />
                  <Component {...pageProps} />
                  <ToastContainer />
                </Tooltip.Provider>
              </MDXProvider>
            </CodeBlockSettingsProvider>
          </TutorialChapterCompletionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AnalyticsProvider>
  );
}
