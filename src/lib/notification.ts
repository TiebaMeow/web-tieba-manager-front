export async function requestBrowserNotification(): Promise<number> {
    /*
    请求浏览器通知权限
    返回值:
    0: 权限已授予
    -1: 浏览器不支持 Notification API
    -2: 用户拒绝了通知权限
    */
    if (!('Notification' in window)) {
        console.warn('浏览器不支持 Notification API');
        return -1;
    }
    let permission = Notification.permission;

    if (permission === 'default') {
        permission = await Notification.requestPermission();
    }
    if (permission === 'granted') {
        return 0
    } else {
        console.warn('用户拒绝了通知权限');
        return -2;
    }
}

export function browserNotify(title: string, options?: NotificationOptions): Notification | null {
    /*
    显示浏览器通知
    title: 通知标题
    options: 通知选项
    返回值:
    Notification 对象或 null（如果不支持或权限被拒绝）
    */
    if (!('Notification' in window)) {
        console.warn('浏览器不支持 Notification API');
        return null;
    }
    if (Notification.permission !== 'granted') {
        console.warn('用户拒绝了通知权限');
        return null;
    }
    return new Notification(title, options);
}
