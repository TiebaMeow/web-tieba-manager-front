export const OPERATION_OPTIONS = {
    ignore: '忽略',
    delete: '删除',
    block: '封禁',
    delete_and_block: '删封',
    custom: '自定义' // note 实际参数并非custom字面量，为 Operation[]
}

export const CUSTOM_OPERATION_OPTIONS = {
    delete: OPERATION_OPTIONS.delete,
    block: OPERATION_OPTIONS.block
}


export interface Operation {
    type: 'delete' | 'block'
    options: object
    direct: boolean
}


export type OperationGroup = 'ignore' | 'delete' | 'block' | 'delete_and_block' | Operation[] | 'custom'
