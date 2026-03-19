import type { FieldCondition } from '@/classes/form/schemas';


export const evaluateCondition = (condition: FieldCondition, values: any) => {
    const fieldValue = values[condition.field];

    if (fieldValue === undefined) return false;

    const conditionValues = Array.isArray(condition.value) ? condition.value : [condition.value];

    switch (condition.operator) {
        case '=':
            return conditionValues.includes(fieldValue);
        case '!=':
            return !conditionValues.includes(fieldValue);
        case '>':
            return conditionValues.some(value => Number(fieldValue) > Number(value));
        case '<':
            return conditionValues.some(value => Number(fieldValue) < Number(value));
        default:
            console.error('Unsupported operator:', condition.operator);
            return false;
    }
};



