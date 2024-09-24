import React from "react";
import Head from "next/head";
import { getStaticPaths, makeStaticProperties } from "../../lib/get-static";

function Error404Page() {
  return (
    <React.Fragment>
      <Head>
        <title>XStreaming - Error</title>
      </Head>

      <p>Oopsie 404.. Action not found</p>
    </React.Fragment>
  );
}

export default Error404Page;

// eslint-disable-next-line react-refresh/only-export-components
export const getStaticProps = makeStaticProperties(["common"]);

// eslint-disable-next-line react-refresh/only-export-components
export { getStaticPaths };
