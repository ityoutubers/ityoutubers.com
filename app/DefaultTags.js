import Script from "next/script";

export default function DefaultTags() {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" type="image/png" href="/fav.png" />

      <Script src="https://www.googletagmanager.com/gtag/js?id=G-QBYCDEYL37" />
      <Script id="gtag">
        {`
          window.dataLayer = window.dataLayer || []; 
          function gtag() {dataLayer.push(arguments)}
          gtag('js', new Date()); gtag('config', 'G-QBYCDEYL37');
        `}
      </Script>
    </>
  );
}
