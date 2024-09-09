import Token from '../token'

export interface IUserToken {
    token_type: string
    expires_in: number
    scope: string
    access_token: string
    refresh_token: string
    user_id: string
    expires_on: string
}

export default class UserToken extends Token {
    data:IUserToken

    constructor(data:IUserToken) {
        super(data)
        this.data = data
    }

    calculateSecondsLeft(date:Date){
        const expiresOn = date
        const currentDate = new Date()
        return Math.floor((expiresOn.getTime() - currentDate.getTime()) / 1000)
    }

    getSecondsValid(){
        return this.calculateSecondsLeft(new Date(this.data.expires_on))
    }

    isValid(){
        const secondsLeft = this.calculateSecondsLeft(new Date(this.data.expires_on))
        return secondsLeft > 0
    }
}