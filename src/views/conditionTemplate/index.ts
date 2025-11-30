import LimiterRule from "./LimiterCondition.vue";
import TextRule from "./TextCondition.vue";
import CheckboxRule from "./CheckboxCondition.vue";
import TimeRule from "./TimeCondition.vue";
import SelectRule from "./SelectCondition.vue";
import CustomCondition from "./CustomCondition.vue";
import UnknownCondition from "./UnknownCondition.vue";

const CONDITION_COMPONENTS = {
    text: TextRule,
    limiter: LimiterRule,
    checkbox: CheckboxRule,
    time: TimeRule,
    select: SelectRule,
    custom: CustomCondition,
    unknown: UnknownCondition,
}

export default CONDITION_COMPONENTS
