import axios from 'axios'
import type { AxiosResponse } from 'axios'

import Requests from './request'
import type { RequestsConfig, RequestsOptions } from './request'

import message from './message'
import router from '../router'
import { getData } from './utils'
import { saveData } from './utils'
import { setToken, currToken, SwitchTokenEvent, switchTokenByHistory } from './data/tokenManager'



const TokenRequest = new class TokenRequest extends Requests {
    constructor(config: RequestsConfig) {
        super(config)
    }

    logout(deleteToken?: boolean) {
        if (deleteToken) {
            saveData('access_token', '')
        }
        switchTokenByHistory('')
        router.push('/login')
    }

    async httpRequests<T>(method: string, options: RequestsOptions): Promise<AxiosResponse<T>> {
        try {
            return await super.httpRequests<T>(method, options)
        } catch (err) {
            if (err instanceof axios.AxiosError) {
                if (err.response) {
                    if (err.response.status === 401) {
                        message.notify('登录已过期，请重新登录。', message.error)
                        this.logout(true)
                    } else {
                        message.notify('请求失败，错误码：' + err.response?.status, message.error)
                    }
                } else if (err.code === 'ERR_NETWORK') {
                    message.notify('服务器内部错误，请查看服务器日志。', message.error)
                } else {
                    message.notify('请求失败，请检查网络连接。', message.error)
                    this.logout()
                }
            }
            throw err
        }
    }


    async login(
        url: string, username: string, password: string, key?: string
    ) {
        const params = new FormData();
        params.append('grant_type', 'password');  // OAuth2 密码模式
        params.append('username', username);
        params.append('password', password);
        if (key) {
            params.append('key', key);
        }

        const token = await axios.post<{
            access_token: string,
            token_type: string,
            system_access: boolean
        }>(this.host + url, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        saveData('access_token', token.data.access_token)
        saveData('server_host', this.host)
        setToken({
            host: this.host,
            token: token.data.access_token,
            user: username,
            system_access: token.data.system_access
        })
        currToken.value = token.data.access_token
        SwitchTokenEvent.call(token.data.access_token)
        return token
    }


    switchHost(host: string, token?: string) {
        this.host = host
        saveData('server_host', host)
        if (token) {
            currToken.value = token
            saveData('access_token', token);
        }
    }

}({ host: getData<string>('server_host') || 'https://api.example.com' })


export default TokenRequest
