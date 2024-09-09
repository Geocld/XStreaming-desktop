import Token from '../token'
import UserToken from './usertoken'

export interface IMsalToken {
    lpt: string
    refresh_token: string
    user_id: string
}

export default class MsalToken extends Token {
    data:IMsalToken

    constructor(data:IMsalToken) {
        super(data)
        this.data = data
    }
}