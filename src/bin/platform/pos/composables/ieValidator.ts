/**
 * Validação de Inscrição Estadual — todos os 27 estados brasileiros.
 *
 * Algoritmos baseados nas especificações oficiais SEFAZ/Confaz.
 * Nenhuma dependência externa — validação 100% algorítmica (dígito verificador).
 */

export interface IEValidationResult {
  valid: boolean
  message?: string
}

function ok(): IEValidationResult { return { valid: true } }
function err(msg: string): IEValidationResult { return { valid: false, message: msg } }

function d(ie: string): number[] {
  return ie.replace(/\D/g, '').split('').map(Number)
}

function sw(digits: number[], weights: number[]): number {
  return digits.reduce((acc, v, i) => acc + v * (weights[i] ?? 0), 0)
}

/** Módulo 11 padrão: resto < 2 → 0, senão 11 - resto */
function m11(sum: number): number {
  const r = sum % 11
  return r < 2 ? 0 : 11 - r
}

/** Módulo 10 padrão: resto == 0 → 0, senão 10 - resto */
function m10(sum: number): number {
  const r = sum % 10
  return r === 0 ? 0 : 10 - r
}

// ─────────────────────────────────────────────────────────────────────────────
// Estados
// ─────────────────────────────────────────────────────────────────────────────

/** AC — Acre: 13 dígitos, começa com 01, dois dígitos verificadores */
function ieAC(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 13) return err('IE do AC deve ter 13 dígitos')
  if (n[0] !== 0 || n[1] !== 1) return err('IE do AC deve iniciar com 01')
  if (m11(sw(n.slice(0, 11), [4,3,2,9,8,7,6,5,4,3,2])) !== n[11]) return err('IE do AC inválida')
  if (m11(sw(n.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2])) !== n[12]) return err('IE do AC inválida')
  return ok()
}

/** AL — Alagoas: 9 dígitos, começa com 24 */
function ieAL(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE de AL deve ter 9 dígitos')
  if (n[0] !== 2 || n[1] !== 4) return err('IE de AL deve iniciar com 24')
  if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE de AL inválida')
  return ok()
}

/** AP — Amapá: 9 dígitos, começa com 03 */
function ieAP(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do AP deve ter 9 dígitos')
  if (n[0] !== 0 || n[1] !== 3) return err('IE do AP deve iniciar com 03')
  const num = parseInt(ie.replace(/\D/g, '').substring(0, 8))
  let p = 0, dv = 0
  if (num >= 3000001 && num <= 3017000) { p = 5; dv = 0 }
  else if (num >= 3017001 && num <= 3019022) { p = 9; dv = 1 }
  const sum = sw(n.slice(0, 8), [9,8,7,6,5,4,3,2]) + p
  const r = sum % 11
  const c = r === 0 ? dv : (r === 1 ? dv + 1 : 11 - r)
  if (c !== n[8]) return err('IE do AP inválida')
  return ok()
}

/** AM — Amazonas: 9 dígitos */
function ieAM(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do AM deve ter 9 dígitos')
  if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE do AM inválida')
  return ok()
}

/**
 * BA — Bahia: 8 ou 9 dígitos.
 * Módulo 10 se 1° dígito ∈ {0,1,2,3,4,5,8}; módulo 11 se ∈ {6,7,9}.
 */
function ieBA(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 8 && n.length !== 9) return err('IE da BA deve ter 8 ou 9 dígitos')

  const refDigit = n.length === 8 ? n[0] : n[1]
  const useMod10 = [0, 1, 2, 3, 4, 5, 8].includes(refDigit)
  const calc = (sum: number) => (useMod10 ? m10(sum) : m11(sum))

  if (n.length === 8) {
    // base = 6 dígitos + 2 DVs
    const dv2 = calc(sw(n.slice(0, 6), [7, 6, 5, 4, 3, 2])) // último dígito
    if (dv2 !== n[7]) return err('IE da BA inválida')

    const dv1 = calc(sw([...n.slice(0, 6), dv2], [8, 7, 6, 5, 4, 3, 2])) // penúltimo
    if (dv1 !== n[6]) return err('IE da BA inválida')

    return ok()
  }

  // 9 dígitos: base = 7 dígitos + 2 DVs
  const dv2 = calc(sw(n.slice(0, 7), [8, 7, 6, 5, 4, 3, 2])) // último dígito
  if (dv2 !== n[8]) return err('IE da BA inválida')

  const dv1 = calc(sw([...n.slice(0, 7), dv2], [9, 8, 7, 6, 5, 4, 3, 2])) // penúltimo
  if (dv1 !== n[7]) return err('IE da BA inválida')

  return ok()
}

/** CE — Ceará: 9 dígitos */
function ieCE(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do CE deve ter 9 dígitos')
  if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE do CE inválida')
  return ok()
}

/** DF — Distrito Federal: 13 dígitos, começa com 07, dois verificadores */
function ieDF(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 13) return err('IE do DF deve ter 13 dígitos')
  if (n[0] !== 0 || n[1] !== 7) return err('IE do DF deve iniciar com 07')
  if (m11(sw(n.slice(0, 11), [4,3,2,9,8,7,6,5,4,3,2])) !== n[11]) return err('IE do DF inválida')
  if (m11(sw(n.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2])) !== n[12]) return err('IE do DF inválida')
  return ok()
}

/** ES — Espírito Santo: 9 dígitos */
function ieES(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do ES deve ter 9 dígitos')
  if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE do ES inválida')
  return ok()
}

/** GO — Goiás: 9 dígitos, começa com 10, 11 ou 15 */
function ieGO(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do GO deve ter 9 dígitos')
  const prefix = n[0] * 10 + n[1]
  if (![10,11,15].includes(prefix)) return err('IE do GO deve iniciar com 10, 11 ou 15')
  const r = sw(n.slice(0, 8), [9,8,7,6,5,4,3,2]) % 11
  let c: number
  if (r === 0) c = 0
  else if (r === 1) {
    // Faixa especial 10103105–10119997: dígito = 1; demais: dígito = 0
    const num = parseInt(ie.replace(/\D/g,'').substring(0,8))
    c = (num >= 10103105 && num <= 10119997) ? 1 : 0
  } else {
    c = 11 - r
  }
  if (c !== n[8]) return err('IE do GO inválida')
  return ok()
}

/** MA — Maranhão: 9 dígitos, começa com 12 */
function ieMA(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do MA deve ter 9 dígitos')
  if (n[0] !== 1 || n[1] !== 2) return err('IE do MA deve iniciar com 12')
  if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE do MA inválida')
  return ok()
}

/**
 * MG — Minas Gerais: 13 dígitos (formato XXX.XXX.XXX/XXXX).
 * 1° verificador: algoritmo com inserção de '0' + módulo 10 com soma de produtos.
 * 2° verificador: módulo 11 padrão.
 */
function ieMG(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 13) return err('IE do MG deve ter 13 dígitos')

  // 1º DV (posição 12 / n[11])
  const base = [n[0], n[1], n[2], 0, n[3], n[4], n[5], n[6], n[7], n[8], n[9], n[10]]
  let s1 = 0

  for (let i = 0; i < base.length; i++) {
    const p = base[i] * (i % 2 === 0 ? 1 : 2)
    s1 += p >= 10 ? Math.floor(p / 10) + (p % 10) : p
  }

  const dv1 = m10(s1)
  if (dv1 !== n[11]) return err('IE do MG inválida (1° dígito verificador)')

  // 2º DV (posição 13 / n[12])
  const dv2 = m11(sw(n.slice(0, 12), [3, 2, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]))
  if (dv2 !== n[12]) return err('IE do MG inválida (2° dígito verificador)')

  return ok()
}

/** MS — Mato Grosso do Sul: 9 dígitos, começa com 28 */
function ieMS(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do MS deve ter 9 dígitos')
  if (n[0] !== 2 || n[1] !== 8) return err('IE do MS deve iniciar com 28')
  if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE do MS inválida')
  return ok()
}

/** MT — Mato Grosso: 11 dígitos */
function ieMT(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 11) return err('IE do MT deve ter 11 dígitos')
  if (m11(sw(n.slice(0, 10), [3,2,9,8,7,6,5,4,3,2])) !== n[10]) return err('IE do MT inválida')
  return ok()
}

/** PA — Pará: 9 dígitos, começa com 15 */
function iePA(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do PA deve ter 9 dígitos')

  const prefix = `${n[0]}${n[1]}`
  if (!['15', '75'].includes(prefix)) return err('IE do PA deve iniciar com 15 ou 75')

  if (m11(sw(n.slice(0, 8), [9, 8, 7, 6, 5, 4, 3, 2])) !== n[8]) return err('IE do PA inválida')
  return ok()
}

/** PB — Paraíba: 9 dígitos */
function iePB(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE da PB deve ter 9 dígitos')
  const r = sw(n.slice(0, 8), [9,8,7,6,5,4,3,2]) % 11
  const c = r < 2 ? 0 : 11 - r
  if (c !== n[8]) return err('IE da PB inválida')
  return ok()
}

/**
 * PE — Pernambuco: 9 dígitos (formato antigo) ou 14 dígitos (formato novo/CNPJ).
 * O formato de 14 dígitos usa os mesmos pesos do CNPJ.
 */
function iePE(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length === 9) {
    // Formato antigo: dois verificadores
    const r1 = sw(n.slice(0, 7), [8,7,6,5,4,3,2]) % 11
    const c1 = r1 < 2 ? 0 : 11 - r1
    if (c1 !== n[7]) return err('IE do PE inválida')
    const r2 = sw(n.slice(0, 8), [9,8,7,6,5,4,3,2]) % 11
    const c2 = r2 < 2 ? 0 : 11 - r2
    if (c2 !== n[8]) return err('IE do PE inválida')
    return ok()
  }
  if (n.length === 14) {
    // Formato novo: baseado no CNPJ
    const w1 = [5,4,3,2,9,8,7,6,5,4,3,2]
    const r1 = sw(n.slice(0, 12), w1) % 11
    const c1 = r1 < 2 ? 0 : 11 - r1
    if (c1 !== n[12]) return err('IE do PE inválida')
    const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]
    const r2 = sw(n.slice(0, 13), w2) % 11
    const c2 = r2 < 2 ? 0 : 11 - r2
    if (c2 !== n[13]) return err('IE do PE inválida')
    return ok()
  }
  return err('IE do PE deve ter 9 ou 14 dígitos')
}

/** PI — Piauí: 9 dígitos */
function iePI(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do PI deve ter 9 dígitos')
  if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE do PI inválida')
  return ok()
}

/**
 * PR — Paraná: 10 dígitos, dois verificadores.
 */
function iePR(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 10) return err('IE do PR deve ter 10 dígitos')
  const c1 = m11(sw(n.slice(0, 8), [3,2,7,6,5,4,3,2]))
  if (c1 !== n[8]) return err('IE do PR inválida (1° dígito verificador)')
  const c2 = m11(sw(n.slice(0, 9), [4,3,2,7,6,5,4,3,2]))
  if (c2 !== n[9]) return err('IE do PR inválida (2° dígito verificador)')
  return ok()
}

/**
 * RJ — Rio de Janeiro: 8 dígitos.
 */
function ieRJ(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 8) return err('IE do RJ deve ter 8 dígitos')
  if (m11(sw(n.slice(0, 7), [2,7,6,5,4,3,2])) !== n[7]) return err('IE do RJ inválida')
  return ok()
}

/** RN — Rio Grande do Norte: 9 ou 10 dígitos, começa com 20 */
function ieRN(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9 && n.length !== 10) return err('IE do RN deve ter 9 ou 10 dígitos')
  if (n[0] !== 2 || n[1] !== 0) return err('IE do RN deve iniciar com 20')
  const weights = n.length === 9 ? [9,8,7,6,5,4,3,2] : [10,9,8,7,6,5,4,3,2]
  const c = m11(sw(n.slice(0, n.length - 1), weights))
  if (c !== n[n.length - 1]) return err('IE do RN inválida')
  return ok()
}

/**
 * RO — Rondônia: 14 dígitos (formato atual) ou 9 dígitos (antigo).
 */
function ieRO(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length === 9) {
    // Formato antigo: verificador em d[8] com mod 11 sobre d[0..7]
    if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE do RO inválida')
    return ok()
  }
  if (n.length === 14) {
    // Formato atual: verificador em d[13]
    if (m11(sw(n.slice(0, 13), [6,5,4,3,2,9,8,7,6,5,4,3,2])) !== n[13]) return err('IE do RO inválida')
    return ok()
  }
  return err('IE do RO deve ter 9 ou 14 dígitos')
}

/** RR — Roraima: 9 dígitos, começa com 24 */
function ieRR(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE do RR deve ter 9 dígitos')
  if (n[0] !== 2 || n[1] !== 4) return err('IE do RR deve iniciar com 24')

  const sum = sw(n.slice(0, 8), [1, 2, 3, 4, 5, 6, 7, 8])
  const dv = sum % 9

  if (dv !== n[8]) return err('IE do RR inválida')
  return ok()
}

/** RS — Rio Grande do Sul: 10 dígitos */
function ieRS(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 10) return err('IE do RS deve ter 10 dígitos')
  if (m11(sw(n.slice(0, 9), [2,9,8,7,6,5,4,3,2])) !== n[9]) return err('IE do RS inválida')
  return ok()
}

/** SC — Santa Catarina: 9 dígitos */
function ieSC(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE de SC deve ter 9 dígitos')
  if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE de SC inválida')
  return ok()
}

/** SE — Sergipe: 9 dígitos */
function ieSE(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 9) return err('IE de SE deve ter 9 dígitos')
  if (m11(sw(n.slice(0, 8), [9,8,7,6,5,4,3,2])) !== n[8]) return err('IE de SE inválida')
  return ok()
}

/**
 * SP — São Paulo: 12 dígitos (industrial) ou rural (começa com P, 12 dígitos numéricos).
 * Dois verificadores: d[8] e d[11].
 */
function ieSP(ie: string): IEValidationResult {
  const raw = ie.trim().toUpperCase()

  // Produtor rural: PXXXXXXXXDXXX
  if (raw.startsWith('P')) {
    const n = raw.replace(/\D/g, '').split('').map(Number)
    if (n.length !== 12) return err('IE rural de SP deve ter 12 dígitos após P')

    const dv = (sw(n.slice(0, 8), [1, 3, 4, 5, 6, 7, 8, 10]) % 11) % 10
    if (dv !== n[8]) return err('IE rural de SP inválida')

    return ok()
  }

  const n = d(ie)
  if (n.length !== 12) return err('IE de SP deve ter 12 dígitos')

  // 1º DV = posição 9
  const dv1 = (sw(n.slice(0, 8), [1, 3, 4, 5, 6, 7, 8, 10]) % 11) % 10
  if (dv1 !== n[8]) return err('IE de SP inválida (1° dígito verificador)')

  // 2º DV = posição 12
  const dv2 = (sw(n.slice(0, 11), [3, 2, 10, 9, 8, 7, 6, 5, 4, 3, 2]) % 11) % 10
  if (dv2 !== n[11]) return err('IE de SP inválida (2° dígito verificador)')

  return ok()
}

/** TO — Tocantins: 11 dígitos */
function ieTO(ie: string): IEValidationResult {
  const n = d(ie)
  if (n.length !== 11) return err('IE do TO deve ter 11 dígitos')

  // Usa posições 1,2,5,6,7,8,9,10 (ignora 3 e 4)
  const base = [...n.slice(0, 2), ...n.slice(4, 10)]
  if (m11(sw(base, [9, 8, 7, 6, 5, 4, 3, 2])) !== n[10]) return err('IE do TO inválida')

  return ok()
}

// ─────────────────────────────────────────────────────────────────────────────
// Entrada pública
// ─────────────────────────────────────────────────────────────────────────────

const validators: Record<string, (ie: string) => IEValidationResult> = {
  AC: ieAC, AL: ieAL, AP: ieAP, AM: ieAM, BA: ieBA,
  CE: ieCE, DF: ieDF, ES: ieES, GO: ieGO, MA: ieMA,
  MG: ieMG, MS: ieMS, MT: ieMT, PA: iePA, PB: iePB,
  PE: iePE, PI: iePI, PR: iePR, RJ: ieRJ, RN: ieRN,
  RO: ieRO, RR: ieRR, RS: ieRS, SC: ieSC, SE: ieSE,
  SP: ieSP, TO: ieTO,
}

/**
 * Valida uma Inscrição Estadual para o UF informado.
 *
 * @param uf  Sigla do estado (ex: "SP", "MG") — pode ser minúsculo
 * @param ie  Inscrição Estadual — pode conter pontos, barras, hífens
 * @returns   { valid: true } ou { valid: false, message: "motivo" }
 */
export function validateIE(uf: string, ie: string): IEValidationResult {
  const raw = ie?.trim()
  if (!raw) return err('Inscrição Estadual não informada')
  const u = uf?.toUpperCase().trim()
  const fn = validators[u]
  if (!fn) return err(`UF desconhecida: ${uf}`)
  return fn(raw)
}

/** Retorna true se a IE for válida para o UF. */
export function isValidIE(uf: string, ie: string): boolean {
  return validateIE(uf, ie).valid
}
