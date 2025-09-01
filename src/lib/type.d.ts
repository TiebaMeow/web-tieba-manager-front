declare interface BaseResponse<T> {
    code: number;
    data: T;
}

/*
状态定义
undefined: 未加载
null: 正在加载
false: 加载失败
*/
declare type RefResponse<T> = T | null | false | undefined
