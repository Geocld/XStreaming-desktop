import Token from '../token'

export interface IXstsToken {
    IssueInstant: string
    NotAfter: string
    Token: string
    DisplayClaims: {
        xui: {
            uhs: string
        }
    }
}

export default class XstsToken extends Token {
    data:IXstsToken

    constructor(data:IXstsToken) {
        super(data)
        this.data = data
    }

    getSecondsValid(){
        return this.calculateSecondsLeft(new Date(this.data.NotAfter))
    }

    isValid(){

        if(this.calculateSecondsLeft(new Date(this.data.NotAfter)) <= 0){
            return false
        }

        return true
    }
}