type ParsedCondition = {
    functionName: string;
    field: string;
    condition: string;
};

type FormData = Record<string, any>;

type ConditionFunction = (value: any, condition: string) => boolean;

export class ConditionChecker {


    static conditionFunctions: Record<string, ConditionFunction> = {
        count: (value, condition) => {
            const match = condition.match(/([<>]=?)\s*(\d+)/);
            if (!match) return false;

            const operator = match[1];
            console.log(operator)
            const target = Number(match[2]);
            console.log(target)
            if (Array.isArray(value)) {
                const count = value.length;
                console.log("counting value", count)
                switch (operator) {
                    case '>':
                        console.log("entered here")
                        console.log(count > target)
                        return count > target;
                    case '<':
                        return count < target;
                    case '>=':
                        return count >= target;
                    case '<=':
                        return count <= target;
                    case '==':
                        return count === target;
                    default:
                        return false;
                }
            }

            return false;
        },
    };

    static parseConditionString(input: string): ParsedCondition | null {
        const regex = /^(\w+):(\w+)\[(.+)\]$/; // Regex para capturar partes da string
        const match = input.match(regex);

        if (!match) {
            console.error("Formato de string inválido.");
            return null;
        }

        const [_, functionName, field, condition] = match;

        return {
            functionName,
            field,
            condition,
        };
    }

    static executeConditions(conditions: string[], form: FormData): boolean[] {
        return conditions.map((conditionString) => {
            const parsed = this.parseConditionString(conditionString);
            console.log(parsed)

            if (!parsed) {
                console.error("Condição inválida:", conditionString);
                return false;
            }

            const {functionName, field, condition} = parsed;
            const func = this.conditionFunctions[functionName];

            if (!func) {
                console.error("Função não encontrada:", functionName);
                return false;
            }

            const fieldValue = form[field];
            console.log(fieldValue)
            console.log("Result", func(fieldValue, condition))
            return func(fieldValue, condition);
        });
    }


}