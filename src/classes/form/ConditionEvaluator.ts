/**
 * Classe abstrata para avaliadores de condição customizados
 */
export abstract class ConditionEvaluator {
  abstract handle(values: any): Promise<boolean>
}

/**
 * Implementação base de ConditionEvaluator usando função
 */
export class FunctionConditionEvaluator extends ConditionEvaluator {
  constructor(private readonly evaluateFn: (values: any) => boolean | Promise<boolean>) {
    super()
  }

  async handle(values: any): Promise<boolean> {
    return this.evaluateFn(values)
  }
}

/**
 * Factory para criar condition evaluators a partir de função
 */
export function createCondition(
  evaluateFn: (values: any) => boolean | Promise<boolean>
): ConditionEvaluator {
  return new FunctionConditionEvaluator(evaluateFn)
}

/**
 * Combina múltiplas condições com AND
 */
export function andConditions(...conditions: ConditionEvaluator[]): ConditionEvaluator {
  return createCondition(async (values) => {
    const results = await Promise.all(conditions.map((c) => c.handle(values)))
    return results.every((r) => r)
  })
}

/**
 * Combina múltiplas condições com OR
 */
export function orConditions(...conditions: ConditionEvaluator[]): ConditionEvaluator {
  return createCondition(async (values) => {
    const results = await Promise.all(conditions.map((c) => c.handle(values)))
    return results.some((r) => r)
  })
}
