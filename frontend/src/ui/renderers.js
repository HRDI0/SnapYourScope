import { groupByPriority } from './components'

const HOVER_GLOW =
  'transition duration-200 ease-out hover:scale-[1.01] hover:border-violet-500/30 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.25),0_12px_30px_rgba(0,0,0,0.55)]'

export function renderComparisonRows(rows, escapeHtml) {
  return rows
    .map((row) => {
      const label = escapeHtml(row.type)
      const url = escapeHtml(row.url || '')
      const score = escapeHtml(String(row.score))
      return `
        <li class="flex items-center justify-between gap-4 rounded-xl border border-slate-800/60 bg-slate-950/35 px-4 py-3 ${HOVER_GLOW}">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-white">${label}</p>
            <p class="mt-0.5 truncate text-xs text-slate-400" title="${url}">${url}</p>
          </div>
          <div class="shrink-0 text-xs font-semibold text-slate-300">SEO <span class="ml-1 text-sm font-extrabold text-white">${score}</span></div>
        </li>
      `
    })
    .join('')
}

export function renderIssueBoard(issues, escapeHtml, labels) {
  const grouped = groupByPriority(issues)

  const renderColumn = (title, key, dotClass) => {
    const rows = grouped[key]
    if (!rows.length) {
      return `
        <section class="rounded-xl border border-slate-800/60 bg-slate-950/25 p-4">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-semibold uppercase tracking-widest text-slate-400">${title}</h5>
            <span class="h-2.5 w-2.5 rounded-full ${dotClass}"></span>
          </div>
          <p class="mt-3 text-sm text-slate-400">${labels.empty}</p>
        </section>
      `
    }

    return `
      <section class="rounded-xl border border-slate-800/60 bg-slate-950/25 p-4">
        <div class="flex items-center justify-between">
          <h5 class="text-xs font-semibold uppercase tracking-widest text-slate-400">${title}</h5>
          <span class="h-2.5 w-2.5 rounded-full ${dotClass}"></span>
        </div>
        <ul class="mt-4 space-y-2">
          ${rows
            .map(
              (issue) =>
                `<li class="rounded-xl border border-slate-800/60 bg-slate-950/35 p-3 ${HOVER_GLOW}">
                  <p class="text-sm font-semibold text-white break-words">${escapeHtml(issue.label)}</p>
                  <p class="mt-1 text-xs text-slate-300 break-words">${escapeHtml(issue.why || '')}</p>
                </li>`
            )
            .join('')}
        </ul>
      </section>
    `
  }

  return `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      ${renderColumn(labels.p0, 'P0', 'bg-rose-400')}
      ${renderColumn(labels.p1, 'P1', 'bg-amber-400')}
      ${renderColumn(labels.p2, 'P2', 'bg-emerald-400')}
    </div>
  `
}
