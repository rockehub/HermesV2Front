import type { Directive, DirectiveBinding } from 'vue'

interface BindingValue {
  value: number
}

const formatCurrency = (el: any, binding: DirectiveBinding<BindingValue>) => {
  const userCurrency = localStorage.getItem('userCurrency') || 'BRL'
  const userLocale = localStorage.getItem('userLocale') || 'pt-BR'

  const value = Number(binding.value)

  const formatter = new Intl.NumberFormat(userLocale, {
    style: 'currency',
    currency: userCurrency,
    currencyDisplay: 'symbol'
  })

  el.textContent = formatter.format(value)
}

const currencyDirective: Directive = {
  mounted(el, binding) {
    formatCurrency(el, binding)
    if (typeof window !== 'undefined') {
      window.addEventListener('currency-changed', () => {
        formatCurrency(el, binding)
      })
    }
  },

  updated(el, binding) {
    formatCurrency(el, binding)
  }
}

export default currencyDirective
