import { ElMessage, ElMessageBox } from 'element-plus'
import type { ElMessageBoxOptions, MessageParams } from 'element-plus';

const message: {
    info: string,
    success: string,
    warning: string,
    error: string,
    notify: (text: string, type?: string) => void,
    confirm: (text: string, title?: string, confirm?: () => void, cancel?: () => void, type?: string) => void,
} = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
    notify(text: string,
        type: string = message.info) {
        ElMessage(
            {
                type,
                message: text
            } as MessageParams
        )
    },
    confirm(text: string,
        title: string = '提示',
        confirm?: () => void,
        cancel?: () => void,
        type = message.warning) {
        ElMessageBox
            .confirm(text, title,
                {
                    type,
                    confirmButtonText: '确认',
                    cancelButtonText: '取消'
                } as ElMessageBoxOptions
            )
            .then(confirm || null)
            .catch(cancel || null)
    }
}

export default message
