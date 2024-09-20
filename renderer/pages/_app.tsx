import React from "react";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { UserProvider } from "../context/userContext";
import "../styles.css";

import "../i18n";

export default function MyApp({ Component, pageProps }) {
  React.useEffect(() => {
    const errorHandler = function (event) {
      console.error(
        "Unhandled rejection (promise: ",
        event.promise,
        ", reason: ",
        event.reason,
        ")."
      );
      if (event.reason.status) {
        alert(
          "HTTP Status: " +
            event.reason.status +
            "\nPath:" +
            event.reason.url +
            "\n" +
            event.reason.body
        );
      } else {
        alert(event.reason);
      }
    };
    window.addEventListener("unhandledrejection", errorHandler);

    // cleanup this component
    return () => {
      window.removeEventListener("unhandledrejection", errorHandler);

      // if(authInterval)
      //     clearInterval(authInterval)
    };
  }, []);

  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="xbox">
        <UserProvider>
          <Component {...pageProps} />
        </UserProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
