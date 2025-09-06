import LimiterRule from "./LimiterRule.vue";
import TextRule from "./TextRule.vue";
import CheckBoxRule from "./CheckBoxRule.vue";
import TimeRule from "./TimeRule.vue";
import SelectRule from "./SelectRule.vue";

const RULE_COMPONENTS = {
    Text: TextRule,
    Limiter: LimiterRule,
    CheckBox: CheckBoxRule,
    Time: TimeRule,
    Select: SelectRule
}

export default RULE_COMPONENTS
