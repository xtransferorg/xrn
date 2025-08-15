import NextHead from 'next/head';
import type { PropsWithChildren } from 'react';

type HeadProps = PropsWithChildren<{ title?: string; description?: string; canonicalUrl?: string }>;

const BASE_TITLE = 'Xrn Documentation';
const BASE_DESCRIPTION = `基建文档建设`;

const Head = ({ title, description, canonicalUrl, children }: HeadProps) => (
  <NextHead>
    <title>{title ? `${title} - ${BASE_TITLE}` : BASE_TITLE}</title>
    <meta charSet="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/xrn/static/images/favicon.ico" sizes="32x32" />
    {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

    <meta name="description" content={description === '' ? BASE_DESCRIPTION : description} />
    <meta property="og:title" content={title} />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content={BASE_TITLE} />
    <meta property="og:description" content={description === '' ? BASE_DESCRIPTION : description} />

    <meta name="twitter:site" content="@xrnjs" />
    <meta name="twitter:card" content="summary" />
    <meta property="twitter:title" content={title} />
    <meta
      name="twitter:description"
      content={description === '' ? BASE_DESCRIPTION : description}
    />

    {children}
  </NextHead>
);

export default Head;
