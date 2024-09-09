import "../styles.css";

import React from "react";
import Head from "next/head";
import Ipc from "../lib/ipc";
import { useRouter } from "next/navigation";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { UserProvider } from "../context/userContext";

import { QueryClient, QueryClientProvider } from "react-query";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const queryClient = new QueryClient();

  const [loggedIn, setLoginState] = React.useState(false);
  const [prevUserState, setPrevUserState] = React.useState({
    signedIn: false,
    gamertag: "",
    gamerpic: "",
    gamerscore: "",
    level: "",
  });
  // const [headerLinks, setHeaderLinks] = React.useState([])
  // const [streamingMode, setStreamingMode] = React.useState(false)
  // const [isLoading, setIsLoading] = React.useState(false)

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
        <Component {...pageProps} />
      </NextThemesProvider>
    </NextUIProvider>
  );
}
