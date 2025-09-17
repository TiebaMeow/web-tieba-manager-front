import type { FormRules } from 'element-plus';

const FORM_RULES: FormRules = {
    host: [
        { required: true, message: '请输入服务地址', trigger: 'blur' },
        { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
    ],
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 1, max: 32, message: '长度应为 1 到 32 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 1, max: 32, message: '长度应为 1 到 32 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]+$/, message: '只能包含英文字符、数字和常见符号', trigger: 'blur' }
    ],

    port: [
        { required: true, message: '请输入端口', trigger: 'blur' },
        { type: 'number', message: '端口必须是数字', trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (value >= 1 && value <= 65535) {
                    callback()
                } else {
                    callback(new Error('端口范围应在 1-65535 之间'))
                }
            },
            trigger: 'blur'
        }
    ],

    key: [
        { min: 1, max: 32, message: '长度应为 1 到 32 个字符', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]+$/, message: '只能包含英文字符、数字和常见符号', trigger: 'blur' }
    ],
    code: [
        { required: true, message: '请输入邀请码', trigger: 'blur' },
        { min: 1, max: 32, message: '长度应为 1 到 32 个字符', trigger: 'blur' }
    ],
    hostname: [
        { required: true, message: '请输入主机地址', trigger: 'blur' },
        { pattern: /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?|(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|[0-9])(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|[0-9])){3})$/, message: '请输入合法的IP地址或域名', trigger: 'blur' }

    ]
}

export default FORM_RULES
