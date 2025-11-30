import DeleteOperation from "./DeleteOperation.vue"
import BlockOperation from "./BlockOperation.vue"
import CustomOperation from "./CustomOperation.vue"

const OPERATION_COMPONENTS = {
    block: BlockOperation,
    delete: DeleteOperation,
    custom: CustomOperation
}

export default OPERATION_COMPONENTS
