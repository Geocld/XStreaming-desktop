import React from "react";
import Head from "next/head";
import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

function Error500Page() {
  return (
    <React.Fragment>
      <Head>
        <title>XStreaming - Error</title>
      </Head>

      <p>Oopsie 500.. Application has an error</p>
    </React.Fragment>
  );
}

export default Error500Page;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common"]);

// eslint-disable-next-line react-refresh/only-export-components
export { getStaticPaths };
