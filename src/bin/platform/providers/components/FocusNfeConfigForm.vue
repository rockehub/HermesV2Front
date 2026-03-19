<template>
  <div class="space-y-5">
    <!-- Token -->
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1"
        >Token de Acesso</label
      >
      <input
        v-model="form.token"
        type="password"
        :placeholder="hasExistingToken ? '••••••••••••' : 'Token da FocusNFe (obtido no painel)'"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
      />
      <p v-if="hasExistingToken && !form.token" class="text-xs text-slate-400 mt-1">
        Deixe em branco para manter o token atual
      </p>
    </div>

    <!-- Sandbox toggle -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        :class="[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          form.sandbox ? 'bg-amber-400' : 'bg-slate-200 dark:bg-navy-600'
        ]"
        @click="form.sandbox = !form.sandbox"
      >
        <span
          :class="[
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            form.sandbox ? 'translate-x-6' : 'translate-x-1'
          ]"
        />
      </button>
      <span class="text-sm text-slate-700 dark:text-navy-200">
        {{ form.sandbox ? 'Homologação (sandbox)' : 'Produção' }}
      </span>
    </div>

    <!-- ── Emitente ─────────────────────────────────────────── -->
    <div class="border-t border-slate-100 dark:border-navy-700 pt-4">
      <h4 class="text-sm font-semibold text-slate-700 dark:text-navy-200 mb-3">
        Dados do Emitente
      </h4>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1">CNPJ</label>
        <input
          v-model="e.cnpjEmitente"
          type="text"
          placeholder="00000000000191"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Inscrição Estadual</label
        >
        <input
          v-model="e.inscricaoEstadualEmitente"
          type="text"
          placeholder="111111111111"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Nome / Razão Social</label
        >
        <input
          v-model="e.nomeEmitente"
          type="text"
          placeholder="Empresa Ltda"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Nome Fantasia</label
        >
        <input
          v-model="e.nomeFantasiaEmitente"
          type="text"
          placeholder="Empresa"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div class="col-span-2">
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Logradouro</label
        >
        <input
          v-model="e.logradouroEmitente"
          type="text"
          placeholder="Rua das Flores"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Número</label
        >
        <input
          v-model="e.numeroEmitente"
          type="text"
          placeholder="100"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Bairro</label
        >
        <input
          v-model="e.bairroEmitente"
          type="text"
          placeholder="Centro"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Município</label
        >
        <input
          v-model="e.municipioEmitente"
          type="text"
          placeholder="São Paulo"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1">UF</label>
        <select
          v-model="e.ufEmitente"
          class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
        >
          <option v-for="uf in UFS" :key="uf" :value="uf">{{ uf }}</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1">CEP</label>
        <input
          v-model="e.cepEmitente"
          type="text"
          placeholder="01001000"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Regime Tributário</label
        >
        <select
          v-model="e.regimeTributarioEmitente"
          class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
        >
          <option value="1">1 - Simples Nacional</option>
          <option value="2">2 - Simples Nacional (excesso)</option>
          <option value="3">3 - Regime Normal</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Natureza da Operação</label
        >
        <input
          v-model="e.naturezaOperacao"
          type="text"
          placeholder="Venda de mercadoria"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Modalidade de Frete</label
        >
        <select
          v-model="e.modalidadeFrete"
          class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
        >
          <option value="0">0 - Por conta do emitente</option>
          <option value="1">1 - Por conta do destinatário</option>
          <option value="9">9 - Sem frete</option>
        </select>
      </div>
    </div>

    <!-- ── ICMS ──────────────────────────────────────────────── -->
    <div class="border-t border-slate-100 dark:border-navy-700 pt-4">
      <h4 class="text-sm font-semibold text-slate-700 dark:text-navy-200 mb-1">ICMS</h4>
      <p class="text-xs text-slate-400 mb-3">
        Valor padrão usado como fallback quando o produto não possui CST/CSOSN configurado.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >CST / CSOSN (fallback)</label
        >
        <select
          v-model="e.icmsSituacaoTributaria"
          class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
        >
          <optgroup label="Simples Nacional (CSOSN)">
            <option value="101">101 - Tributada com crédito</option>
            <option value="102">102 - Tributada sem crédito</option>
            <option value="103">103 - Isenta (faixa de receita)</option>
            <option value="300">300 - Imune</option>
            <option value="400">400 - Não tributada</option>
            <option value="500">500 - ICMS cobrado por ST</option>
            <option value="900">900 - Outros</option>
          </optgroup>
          <optgroup label="Regime Normal (CST)">
            <option value="00">00 - Tributada integralmente</option>
            <option value="10">10 - Tributada com ST</option>
            <option value="20">20 - Com redução de BC</option>
            <option value="40">40 - Isenta</option>
            <option value="41">41 - Não tributada</option>
            <option value="50">50 - Suspensão</option>
            <option value="60">60 - ICMS cobrado por ST</option>
            <option value="70">70 - Redução de BC com ST</option>
            <option value="90">90 - Outros</option>
          </optgroup>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Alíquota ICMS (%)</label
        >
        <input
          v-model="e.aliquotaIcms"
          type="text"
          placeholder="0"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Modalidade BC ICMS</label
        >
        <select
          v-model="e.icmsModalidadeBaseCalculo"
          class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
        >
          <option value="0">0 - Margem Valor Agregado</option>
          <option value="1">1 - Pauta</option>
          <option value="2">2 - Preço Tabelado Máximo</option>
          <option value="3">3 - Valor da Operação</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Código Benefício Fiscal</label
        >
        <input
          v-model="e.codigoBeneficioFiscal"
          type="text"
          placeholder="SP850048 (se aplicável)"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
        <p class="text-[10px] text-slate-400 mt-0.5">
          Obrigatório quando CST implica isenção/redução
        </p>
      </div>
    </div>

    <!-- ── PIS / COFINS ──────────────────────────────────────── -->
    <div class="border-t border-slate-100 dark:border-navy-700 pt-4">
      <h4 class="text-sm font-semibold text-slate-700 dark:text-navy-200 mb-1">PIS / COFINS</h4>
      <p class="text-xs text-slate-400 mb-3">
        CST padrão por regime e alíquotas para Regime Normal. O CST do produto prevalece quando
        configurado.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >CST PIS — Simples Nacional</label
        >
        <select
          v-model="e.pisCstSimples"
          class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
        >
          <option value="06">06 - Alíquota Zero</option>
          <option value="07">07 - Isenta</option>
          <option value="08">08 - Sem Incidência</option>
          <option value="09">09 - Suspensão</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >CST COFINS — Simples Nacional</label
        >
        <select
          v-model="e.cofinsCstSimples"
          class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
        >
          <option value="06">06 - Alíquota Zero</option>
          <option value="07">07 - Isenta</option>
          <option value="08">08 - Sem Incidência</option>
          <option value="09">09 - Suspensão</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >CST PIS — Regime Normal (fallback)</label
        >
        <select
          v-model="e.pisCstNormal"
          class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
        >
          <option value="01">01 - Tributável (alíq. normal)</option>
          <option value="02">02 - Tributável (alíq. diferenciada)</option>
          <option value="04">04 - Monofásica</option>
          <option value="06">06 - Alíquota Zero</option>
          <option value="07">07 - Isenta</option>
          <option value="08">08 - Sem Incidência</option>
          <option value="49">49 - Outras saídas</option>
        </select>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >CST COFINS — Regime Normal (fallback)</label
        >
        <select
          v-model="e.cofinsCstNormal"
          class="form-select w-full rounded-lg border border-slate-300 bg-white px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
        >
          <option value="01">01 - Tributável (alíq. normal)</option>
          <option value="02">02 - Tributável (alíq. diferenciada)</option>
          <option value="04">04 - Monofásica</option>
          <option value="06">06 - Alíquota Zero</option>
          <option value="07">07 - Isenta</option>
          <option value="08">08 - Sem Incidência</option>
          <option value="49">49 - Outras saídas</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Alíquota PIS — Regime Normal (%)</label
        >
        <input
          v-model="e.pisAliquota"
          type="text"
          placeholder="0.65"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >Alíquota COFINS — Regime Normal (%)</label
        >
        <input
          v-model="e.cofinsAliquota"
          type="text"
          placeholder="3.00"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
    </div>

    <!-- ── CFOP ──────────────────────────────────────────────── -->
    <div class="border-t border-slate-100 dark:border-navy-700 pt-4">
      <h4 class="text-sm font-semibold text-slate-700 dark:text-navy-200 mb-1">CFOP</h4>
      <p class="text-xs text-slate-400 mb-3">
        Determinado automaticamente pela comparação entre UF emitente e UF destinatário.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >CFOP Operação Interna (mesma UF)</label
        >
        <input
          v-model.number="e.cfopInterno"
          type="number"
          placeholder="5102"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
          >CFOP Operação Interestadual</label
        >
        <input
          v-model.number="e.cfopInterestadual"
          type="number"
          placeholder="6102"
          class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        />
      </div>
    </div>

    <!-- ── NF-Ce (PDV) ──────────────────────────────────────── -->
    <div class="border-t border-slate-100 dark:border-navy-700 pt-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            e.nfce ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-navy-600'
          ]"
          @click="e.nfce = !e.nfce"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              e.nfce ? 'translate-x-6' : 'translate-x-1'
            ]"
          />
        </button>
        <div>
          <span class="text-sm font-semibold text-slate-700 dark:text-navy-200">
            Emitir NF-Ce (PDV / Varejo presencial)
          </span>
          <p class="text-xs text-slate-400">
            Quando ativo, vendas do PDV emitem NF-Ce (tipo 65) em vez de NF-e (tipo 1). Requer
            credenciamento NF-Ce na SEFAZ.
          </p>
        </div>
      </div>
    </div>

    <!-- ── Reforma Tributária ────────────────────────────────── -->
    <div class="border-t border-slate-100 dark:border-navy-700 pt-4">
      <div class="flex items-center gap-3 mb-3">
        <button
          type="button"
          :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            e.reformaTributaria ? 'bg-primary' : 'bg-slate-200 dark:bg-navy-600'
          ]"
          @click="e.reformaTributaria = !e.reformaTributaria"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              e.reformaTributaria ? 'translate-x-6' : 'translate-x-1'
            ]"
          />
        </button>
        <div>
          <span class="text-sm font-semibold text-slate-700 dark:text-navy-200"
            >Reforma Tributária (LC 214/2024)</span
          >
          <p class="text-xs text-slate-400">
            Inclui campos IBS/CBS nos itens. Validação SEFAZ ativa a partir de 01/04/2026.
          </p>
        </div>
      </div>

      <template v-if="e.reformaTributaria">
        <div class="rounded-lg bg-slate-50 dark:bg-navy-700 p-3 space-y-3">
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
                >Alíquota CBS (%)</label
              >
              <input
                v-model="e.cbsAliquota"
                type="text"
                placeholder="0.9"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
              <p class="text-[10px] text-slate-400 mt-0.5">CBS = PIS+COFINS+IPI (federal)</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
                >Alíquota IBS Estadual (%)</label
              >
              <input
                v-model="e.ibsUfAliquota"
                type="text"
                placeholder="0.1"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
              <p class="text-[10px] text-slate-400 mt-0.5">IBS = ICMS+ISS (estadual)</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
                >Alíquota IBS Municipal (%)</label
              >
              <input
                v-model="e.ibsMunAliquota"
                type="text"
                placeholder="0"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
              <p class="text-[10px] text-slate-400 mt-0.5">IBS = ICMS+ISS (municipal)</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
                >IBS/CBS Situação Tributária</label
              >
              <input
                v-model="e.ibsCbsSituacaoTributaria"
                type="text"
                placeholder="000"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
              <p class="text-[10px] text-slate-400 mt-0.5">000 = tributada integralmente</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 dark:text-navy-300 mb-1"
                >IBS/CBS Classificação Tributária</label
              >
              <input
                v-model="e.ibsCbsClassificacaoTributaria"
                type="text"
                placeholder="000001"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              />
              <p class="text-[10px] text-slate-400 mt-0.5">000001 = venda de mercadoria</p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ── Actions ───────────────────────────────────────────── -->
    <div class="flex items-center gap-3 pt-2">
      <button
        type="button"
        :disabled="saving || !isFormValid"
        class="btn btn-primary text-sm"
        @click="handleActivate"
      >
        <em v-if="saving" class="fa-solid fa-spinner fa-spin mr-1"></em>
        {{
          saving
            ? 'Salvando...'
            : currentStatus === 'ACTIVE'
              ? 'Atualizar configuração'
              : 'Ativar FocusNFe'
        }}
      </button>
      <button
        v-if="currentStatus === 'ACTIVE'"
        type="button"
        :disabled="saving"
        class="btn btn-error btn-outline text-sm"
        @click="emit('disable')"
      >
        Desativar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { FiscalProviderConfigResponse } from '../composables/useProvidersApi'

const props = defineProps<{
  config?: FiscalProviderConfigResponse | null
  saving?: boolean
}>()

const emit = defineEmits<{
  activate: [form: { token: string; sandbox: boolean; extraConfig: string }]
  disable: []
}>()

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

interface Emitente {
  cnpjEmitente: string
  nomeEmitente: string
  nomeFantasiaEmitente: string
  regimeTributarioEmitente: string
  naturezaOperacao: string
  logradouroEmitente: string
  numeroEmitente: string
  bairroEmitente: string
  municipioEmitente: string
  ufEmitente: string
  cepEmitente: string
  inscricaoEstadualEmitente: string
  modalidadeFrete: string
  // ICMS
  icmsSituacaoTributaria: string
  icmsModalidadeBaseCalculo: string
  aliquotaIcms: string
  codigoBeneficioFiscal: string
  // PIS / COFINS
  pisCstSimples: string
  cofinsCstSimples: string
  pisCstNormal: string
  cofinsCstNormal: string
  pisAliquota: string
  cofinsAliquota: string
  // CFOP
  cfopInterno: number
  cfopInterestadual: number
  // NF-Ce
  nfce: boolean
  // Reforma Tributária
  reformaTributaria: boolean
  cbsAliquota: string
  ibsUfAliquota: string
  ibsMunAliquota: string
  ibsCbsSituacaoTributaria: string
  ibsCbsClassificacaoTributaria: string
}

const form = reactive({ token: '', sandbox: true })

const e = reactive<Emitente>({
  cnpjEmitente: '',
  nomeEmitente: '',
  nomeFantasiaEmitente: '',
  regimeTributarioEmitente: '1',
  naturezaOperacao: 'Venda de mercadoria',
  logradouroEmitente: '',
  numeroEmitente: '',
  bairroEmitente: '',
  municipioEmitente: '',
  ufEmitente: 'SP',
  cepEmitente: '',
  inscricaoEstadualEmitente: '',
  modalidadeFrete: '9',
  // ICMS
  icmsSituacaoTributaria: '400',
  icmsModalidadeBaseCalculo: '3',
  aliquotaIcms: '0',
  codigoBeneficioFiscal: '',
  // PIS / COFINS
  pisCstSimples: '07',
  cofinsCstSimples: '07',
  pisCstNormal: '01',
  cofinsCstNormal: '01',
  pisAliquota: '0.65',
  cofinsAliquota: '3.00',
  // CFOP
  cfopInterno: 5102,
  cfopInterestadual: 6102,
  // NF-Ce
  nfce: false,
  // Reforma Tributária
  reformaTributaria: false,
  cbsAliquota: '0.9',
  ibsUfAliquota: '0.1',
  ibsMunAliquota: '0',
  ibsCbsSituacaoTributaria: '000',
  ibsCbsClassificacaoTributaria: '000001'
})

const currentStatus = computed(() => props.config?.status ?? 'NOT_CONFIGURED')
const hasExistingToken = computed(() => !!props.config?.hasToken)

const isFormValid = computed(
  () =>
    e.cnpjEmitente.trim().length >= 14 &&
    e.nomeEmitente.trim().length > 0 &&
    (form.token.trim().length > 0 || hasExistingToken.value)
)

watch(
  () => props.config,
  (c) => {
    if (!c) return
    form.sandbox = c.sandbox ?? true
    form.token = ''
    if (c.extraConfig) {
      try {
        Object.assign(e, JSON.parse(c.extraConfig))
      } catch {
        /* ignore */
      }
    }
  },
  { immediate: true }
)

function handleActivate() {
  emit('activate', {
    token: form.token,
    sandbox: form.sandbox,
    extraConfig: JSON.stringify({ ...e })
  })
}
</script>
