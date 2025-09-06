import LimiterRule from "./LimiterRule.vue";
import TextRule from "./TextRule.vue";
import CheckboxRule from "./CheckboxRule.vue";
import TimeRule from "./TimeRule.vue";
import SelectRule from "./SelectRule.vue";

const RULE_COMPONENTS = {
    text: TextRule,
    limiter: LimiterRule,
    checkbox: CheckboxRule,
    time: TimeRule,
    select: SelectRule
}

export default RULE_COMPONENTS
