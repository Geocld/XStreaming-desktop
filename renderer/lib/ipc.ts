export default {

    // on(channel:string, listener){
    //     ipcRenderer.on(channel, listener)
    // },

    send(channel:string, action:string, data = {}){
        if(window.XStreaming === undefined){
            // Electron API Not available. Lets mock!
            window.XStreaming = this.websocketFallbackApi()
        }

        // console.log('DEBUG:', window.XStreaming)
        return window.XStreaming.send(channel, action, data)
    },

    on(channel:string, listener){
        if(window.XStreaming === undefined){
            // Electron API Not available. Lets mock!
            window.XStreaming = this.websocketFallbackApi()
        }

        // console.log('DEBUG', window.XStreaming)
        return window.XStreaming.on(channel, listener)
    }, 

    onAction(channel:string, action:string, listener){
        if(window.XStreaming === undefined){
            // Electron API Not available. Lets mock!
            window.XStreaming = this.websocketFallbackApi()
        }

        // console.log('DEBUG', window.XStreaming)
        return window.XStreaming.onAction(channel, action, listener)
    },

    removeListener(channel:string, listener){
        if(window.XStreaming === undefined){
            // Electron API Not available. Lets mock!
            window.XStreaming = this.websocketFallbackApi()
        }

        // console.log('DEBUG', window.XStreaming)
        return window.XStreaming.removeListener(channel, listener)
    },
}

