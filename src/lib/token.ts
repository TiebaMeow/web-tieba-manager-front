import axios from 'axios'
import type { AxiosResponse } from 'axios'

import Requests from './request'
import type { RequestsConfig, RequestsOptions } from './request'

import message from './message'
import router from '../router'
import { getData } from './utils'
import Hook from './hook'
import { saveData } from './utils'
import { setToken, deleteHost } from './data/hostManager'

export const SwitchHostEvent = new Hook<string>()


const TokenRequest = new class TokenRequest extends Requests {
    constructor(config: RequestsConfig) {
        super(config)
    }

    async httpRequests<T>(method: string, options: RequestsOptions): Promise<AxiosResponse<T>> {
        try {
            return await super.httpRequests<T>(method, options)
        } catch (err) {
            if (err instanceof axios.AxiosError) {
                if (err.response) {
                    if (err.response.status === 401) {
                        message.notify('登录已过期，请重新登录。', message.error)
                        deleteHost(this.host)
                        router.push('/login')
                    } else {
                        message.notify('请求失败，错误码：' + err.response?.status, message.error)
                    }
                } else if (err.code === 'ERR_NETWORK') {
                    message.notify('服务器内部错误，请查看服务器日志。', message.error)
                } else {
                    message.notify('请求失败，请检查网络连接。', message.error)
                    router.push('/login')
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
        }>(this.host + url, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        saveData('access_token', token.data.access_token)
        saveData('server_host', this.host)
        setToken({
            host: this.host,
            token: token.data.access_token,
            user: username,
        })
        SwitchHostEvent.call(this.host)
        return token
    }


    switchHost(host: string) {
        this.host = host
    }

}({ host: getData<string>('server_host') || 'https://api.example.com' })


export default TokenRequest
