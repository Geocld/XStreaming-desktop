import { session, dialog } from 'electron'
import { createWindow } from './helpers'
import Application from './application'
import { Xal, TokenStore } from './xal'
import AuthTokenStore from './helpers/tokenstore'
import { defaultSettings } from '../renderer/context/userContext.defaults'

export default class Authentication {
    _application:Application

    _tokenStore:AuthTokenStore
    _xal:Xal
    
    _authWindow
    _authCallback

    _isAuthenticating:boolean = false
    _isAuthenticated:boolean = false
    _appLevel:number = 0

    constructor(application:Application){
        this._application = application
        this._tokenStore = new AuthTokenStore()
        this._tokenStore.load()
        this._xal = new Xal(this._tokenStore)
    }

    checkAuthentication(){
        this._application.log('authenticationV2', '[checkAuthentication()] Starting token check...')
        if(this._tokenStore.hasValidAuthTokens()){
            this._application.log('authenticationV2', '[checkAuthentication()] Tokens are valid.')
            this.startSilentFlow()

            return true

        } else {
            if(this._tokenStore.getUserToken() !== undefined){
                // We have a user token, lets try to refresh it.
                this._application.log('authenticationV2', '[checkAuthentication()] Tokens are expired but we have a user token. Lets try to refresh the tokens.')
                this.startSilentFlow()

                return true
    
            } else {
                this._application.log('authenticationV2', '[checkAuthentication()] No tokens are present.')
                return false
            }
        }
    }

    startSilentFlow(){
        this._application.log('authenticationV2', '[startSilentFlow()] Starting silent flow...')
        this._isAuthenticating = true
        this._xal.refreshTokens(this._tokenStore).then(() => {
            this._application.log('authenticationV2', '[startSilentFlow()] Tokens have been refreshed')

            this.getStreamingToken(this._tokenStore).then((streamingTokens) => {
                if(streamingTokens.xCloudToken !== null){
                    this._application.log('authenticationV2', '[startSilentFlow()] Retrieved both xHome and xCloud tokens')
                    this._appLevel = 2
                } else {
                    this._application.log('authenticationV2', '[startSilentFlow()] Retrieved xHome token only')
                    this._appLevel = 1
                }

                this._xal.getWebToken(this._tokenStore).then((webToken) => {
                    this._application.log('authenticationV2', __filename+'[startSilentFlow()] Web token received')
                    
                    this._application.authenticationCompleted(streamingTokens, webToken)

                }).catch((error) => {
                    this._application.log('authenticationV2', __filename+'[startSilentFlow()] Failed to retrieve web tokens:', error)
                    dialog.showMessageBox({
                        message: 'Error: Failed to retrieve web tokens:'+ JSON.stringify(error),
                        type: 'error',
                    })
                })

            }).catch((err) => {
                this._application.log('authenticationV2', '[startSilentFlow()] Failed to retrieve streaming tokens:', err)
                dialog.showMessageBox({
                    message: 'Error: Failed to retrieve streaming tokens:'+ JSON.stringify(err),
                    type: 'error',
                })
            })

        }).catch((err) => {
            this._application.log('authenticationV2', '[startSilentFlow()] Error refreshing tokens:', err)
            this._tokenStore.clear()
        })
    }

    startAuthflow(){
        this._application.log('authenticationV2', '[startAuthflow()] Starting authentication flow')
        
        this._xal.getRedirectUri().then((redirect) => {
            this.openAuthWindow(redirect.sisuAuth.MsaOauthRedirect)

            this._authCallback = (redirectUri) => {
                this._isAuthenticating = true
                this._application.log('authenticationV2', '[startAuthFlow()] Got redirect URI:', redirectUri)
                this._xal.authenticateUser(this._tokenStore, redirect, redirectUri).then((result) => {
                    this._application.log('authenticationV2', '[startAuthFlow()] Authenticated user:', result)

                    this.startSilentFlow()

                }).catch((err) => {
                    this._application.log('authenticationV2', '[startAuthFlow()] Error authenticating user:', err)
                    dialog.showErrorBox('Error', 'Error authenticating user. Error details: '+JSON.stringify(err))
                })
            }
        }).catch((err) => {
            this._application.log('authenticationV2', '[startAuthFlow()] Error getting redirect URI:', err)
            dialog.showErrorBox('Error', 'Error getting redirect URI. Error details: '+JSON.stringify(err))
        })
    }

    startWebviewHooks(){
        this._application.log('authenticationV2', '[startWebviewHooks()] Starting webview hooks')

        session.defaultSession.webRequest.onHeadersReceived({
            urls: [
                'https://login.live.com/oauth20_authorize.srf?*',
                'https://login.live.com/ppsecure/post.srf?*',
            ],
        }, (details, callback) => {

            if(details.responseHeaders.Location !== undefined && details.responseHeaders.Location[0].includes(this._xal._app.RedirectUri)){
                this._application.log('authenticationV2', '[startWebviewHooks()] Got redirect URI from OAUTH:', details.responseHeaders.Location[0])
                this._authWindow.close()

                if(this._authCallback !== undefined){
                    this._authCallback(details.responseHeaders.Location[0])
                } else {
                    this._application.log('authenticationV2', '[startWebviewHooks()] Authentication Callback is not defined:', this._authCallback)
                    dialog.showErrorBox('Error', 'Authentication Callback is not defined. Error details: '+JSON.stringify(this._authCallback))
                }

                callback({ cancel: true })
            } else {
                callback(details)
            }
        })
    }

    openAuthWindow(url){
        const authWindow = createWindow('auth', {
            width: 500,
            height: 600,
            title: 'Authentication',
        })
        
        authWindow.loadURL(url)
        this._authWindow = authWindow

        this._authWindow.on('close', () => {
            this._application.log('authenticationV2', '[openAuthWindow()] Closed auth window')
            // @TODO: What to do?
        })
    }

    async getStreamingToken(tokenStore:TokenStore){
        const sisuToken = tokenStore.getSisuToken()
        if(sisuToken === undefined)
            throw new Error('Sisu token is missing. Please authenticate first')

        const xstsToken = await this._xal.doXstsAuthorization(sisuToken, 'http://gssv.xboxlive.com/')

        if(this._xal._xhomeToken === undefined || this._xal._xhomeToken.getSecondsValid() <= 60){
            this._xal._xhomeToken = await this._xal.getStreamToken(xstsToken, 'xhome')
        }

        const settings: any = this._application._store.get('settings', defaultSettings)
        if(this._xal._xcloudToken === undefined || this._xal._xcloudToken.getSecondsValid() <= 60){
            try {
                this._xal._xcloudToken = await this._xal.getStreamToken(xstsToken, 'xgpuweb', settings.force_region_ip)
            } catch(error){
                try {
                    this._xal._xcloudToken = await this._xal.getStreamToken(xstsToken, 'xgpuwebf2p', settings.force_region_ip)
                } catch(error){
                    this._xal._xcloudToken = null
                }
            }
        }

        return { xHomeToken: this._xal._xhomeToken, xCloudToken: this._xal._xcloudToken }
    }

    
}
