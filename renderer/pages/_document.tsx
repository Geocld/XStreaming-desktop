import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import i18next from "../../next-i18next.config.js";

export default function Document() {
  return (
    <Html lang={i18next.i18n.defaultLocale} style={{fontSize: '16px'}}>
      <Head>
        <style id="video-css"></style>
      </Head>
      <body>
        <Main />
        <NextScript />

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-S1W5HZKDBT"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-S1W5HZKDBT');
          `}
        </Script>
      </body>
    </Html>
  );
}