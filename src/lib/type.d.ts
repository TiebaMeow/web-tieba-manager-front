declare interface BaseResponse<T> {
    code: number;
    data: T;
    message: string
}

/*
状态定义
undefined: 未加载
null: 正在加载
false: 加载失败
*/
declare type RefResponse<T> = T | null | false | undefined

declare interface TiebaUser {
    user_name: string
    nick_name: string
    user_id: number
    portrait: string
    level: number
}

declare interface Content {
    title: string | null
    text: string
    images: Array<{
        hash: string
        src: string
        width: number
        height: number
    }>
    create_time: number
    tid: number
    pid: number
    floor: number
    type: 'thread' | 'post' | 'comment'
    user: TiebaUser
}

declare interface Thread extends Content {
    type: 'thread'
    floor: 1
}

declare interface Post extends Content {
    type: 'post'
}

declare interface Comment extends Content {
    type: 'comment'
}

