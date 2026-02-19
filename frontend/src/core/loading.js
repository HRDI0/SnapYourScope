function ensureLoadingModal(modalId, defaultMessage) {
  let modal = document.getElementById(modalId)
  if (modal) {
    return modal
  }

  modal = document.createElement('div')
  modal.id = modalId
  modal.className =
    'hidden fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm'
  modal.innerHTML = `
    <div class="rounded-2xl border border-slate-700/60 bg-slate-900/90 px-5 py-4 shadow-2xl">
      <div class="flex items-center gap-3">
        <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"></span>
        <p data-loading-label class="text-sm font-semibold text-slate-100">${defaultMessage}</p>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  return modal
}

export function createLoadingController(options = {}) {
  const modalId = options.modalId || 'page-loading-modal'
  const defaultMessage = options.defaultMessage || 'Loading...'
  const modal = ensureLoadingModal(modalId, defaultMessage)
  const label = modal.querySelector('[data-loading-label]')

  return {
    show(message) {
      if (label) {
        label.textContent = message || defaultMessage
      }
      modal.classList.remove('hidden')
    },
    hide() {
      modal.classList.add('hidden')
    },
  }
}
