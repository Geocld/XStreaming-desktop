import Token from '../token'

export interface ISisuToken {
    DeviceToken: string
    TitleToken: ISisuTitleToken
    UserToken: ISisuUserToken
    AuthorizationToken
    WebPage: string
    Sandbox: string
    UseModernGamertag: boolean
    Flow: string
}

interface ISisuUserToken {
    IssueInstant: string
    NotAfter: string
    Token: string
    DisplayClaims: {
        xui: {
            uhs: string
        }
    }
}

interface ISisuTitleToken {
    IssueInstant: string
    NotAfter: string
    Token: string
    DisplayClaims: {
        xti: {
            tid: string
        }
    }
}

export default class SisuToken extends Token {
    data:ISisuToken

    constructor(data:ISisuToken) {
        super(data)
        this.data = data
    }

    getSecondsValid(){
        const secondsLeftTitle = this.calculateSecondsLeft(new Date(this.data.TitleToken.NotAfter))
        const secondsLeftUser = this.calculateSecondsLeft(new Date(this.data.UserToken.NotAfter))
        const secondsLeftAuthorization = this.calculateSecondsLeft(new Date(this.data.AuthorizationToken.NotAfter))
        return Math.min(secondsLeftTitle, secondsLeftUser, secondsLeftAuthorization)
    }

    isValid(){
        const secondsLeftTitle = this.calculateSecondsLeft(new Date(this.data.TitleToken.NotAfter))
        if(secondsLeftTitle <= 0){
            return false
        }

        const secondsLeftUser = this.calculateSecondsLeft(new Date(this.data.UserToken.NotAfter))
        if(secondsLeftUser <= 0){
            return false
        }

        const secondsLeftAuthorization = this.calculateSecondsLeft(new Date(this.data.AuthorizationToken.NotAfter))
        if(secondsLeftAuthorization <= 0){
            return false
        }

        return true
    }

    getUserHash(){
        return this.data.UserToken.DisplayClaims.xui[0].uhs
    }

    getGamertag(){
        return this.data.AuthorizationToken.DisplayClaims.xui[0].gtg
    }
}