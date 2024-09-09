import React from 'react'
import Head from 'next/head'

function Error500Page() {
    return (
        <React.Fragment>
            <Head>
                <title>XStreaming - Error</title>
            </Head>

            <p>Oopsie 500.. Application has an error</p>
        </React.Fragment>
    )
}

export default Error500Page
