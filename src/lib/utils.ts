import type { Ref } from 'vue'
export { v4 as uuid } from 'uuid'


export function hasOwn<T extends object, K extends keyof T>(obj: T, key: K): obj is T & { [P in K]: T[P] };
export function hasOwn<T extends object, K extends string>(obj: T, key: K): obj is T & Record<K, unknown>;
export function hasOwn(obj: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export function saveData(name: string, data: object | string | number) {
    let dataStr: string
    if (typeof data === 'object') {
        dataStr = JSON.stringify(data)
    } else {
        dataStr = data.toString()
    }
    localStorage.setItem(name, dataStr)
}

export function getData<T>(name: string): T | null {
    let data = localStorage.getItem(name)
    if (data) {
        try {
            data = JSON.parse(data)
        } catch {
        }
    }
    return data as T | null
}

export function keysOf<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
}

export function iterateObject<T extends object>(obj: T, callback: (key: keyof T, value: T[keyof T]) => void): void {
    keysOf(obj).forEach(key => {
        callback(key, obj[key]);
    });
}

export function copy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

export function formatDate(unixTimestamp: number): string {
    // 将Unix时间戳转换为毫秒（JavaScript的Date对象使用毫秒）
    const date = new Date(unixTimestamp * 1000)

    // 获取年、月、日、小时和分钟
    const month = date.getMonth() + 1 // 月份从0开始，所以需要加1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()

    // 格式化日期和时间
    return `${month}月${day}日 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

interface CallBackWithData<T> {
    (data: T): void
}

export function doAfter<T>(fn: () => T | null, callback: CallBackWithData<NonNullable<T>>, cd = 0) {
    const res = fn()
    if (res) {
        callback(res)
    } else {
        setTimeout(() => {
            doAfter(fn, callback, cd)
        }, cd)
    }
}

export function doAfterRefMounted<T>(ref: Ref<T>, callback: CallBackWithData<Ref<NonNullable<T>>>) {
    doAfter(() => {
        return ref.value ? ref as Ref<NonNullable<T>> : null
    }, callback, 0)
}

export function getViewMode(width: number): 'desktop' | 'mobile' {
    return window.innerWidth > width ? 'desktop' : 'mobile'
}

export function getContentMark(content: Content) {
    switch (content.type) {
        case 'thread':
            return content.title
        case 'post':
            return `${content.title} ${content.floor}楼`
        case 'comment':
            return `${content.title} ${content.floor}楼 楼中楼`
    }
}

export function gotoPortrait(portrait: string) {
    window.open('https://tieba.baidu.com/home/main?id=' + portrait, '_blank')
}


export function gotoPost(tid: number, pid: number): void
export function gotoPost(thread: Content): void
export function gotoPost(thread_or_tid: Content | number, pid?: number): void {
    if (typeof thread_or_tid === 'number') {
        if (pid === undefined) {
            throw new Error('pid is required when tid is provided')
        }
        window.open(`https://tieba.baidu.com/p/${thread_or_tid}?pid=${pid}#${pid}`, '_blank')
        return
    }
    const thread = thread_or_tid
    if (thread.type === 'thread') {
        window.open(`https://tieba.baidu.com/p/${thread.tid}`, '_blank')
        return
    }
    if (thread.pid === undefined) {
        throw new Error('pid is required when thread is not a thread')
    }
    window.open(`https://tieba.baidu.com/p/${thread.tid}?pid=${thread.pid}#${thread.pid}`, '_blank')
}
