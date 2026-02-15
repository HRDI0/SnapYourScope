import { groupByPriority } from './components'

export function renderComparisonRows(rows, escapeHtml) {
  return rows
    .map(
      (row) =>
        `<li><strong>${escapeHtml(row.type)}: ${escapeHtml(row.url || '')}</strong><span>SEO ${escapeHtml(String(row.score))}</span></li>`
    )
    .join('')
}

export function renderIssueBoard(issues, escapeHtml, labels) {
  const grouped = groupByPriority(issues)

  const renderColumn = (title, key) => {
    const rows = grouped[key]
    if (!rows.length) {
      return `
        <article class="issue-priority-column">
          <h5>${title}</h5>
          <p class="issue-empty">${labels.empty}</p>
        </article>
      `
    }

    return `
      <article class="issue-priority-column">
        <h5>${title}</h5>
        <ul>
          ${rows
            .map(
              (issue) =>
                `<li>
                  <strong>${escapeHtml(issue.label)}</strong>
                  <span><b>Why:</b> ${escapeHtml(issue.why || issue.detail || issue.status)}</span>
                  <span><b>Fix:</b> ${escapeHtml(issue.fixSteps || 'Review this signal and apply recommended updates.')}</span>
                  <span><b>Impact:</b> ${escapeHtml(issue.expectedImpact || 'Visibility consistency improvement.')}</span>
                  <span><b>Refs:</b> ${escapeHtml(issue.references || 'Hybrid Visibility')}</span>
                </li>`
            )
            .join('')}
        </ul>
      </article>
    `
  }

  return `
    <div class="issue-priority-board">
      ${renderColumn(labels.p0, 'P0')}
      ${renderColumn(labels.p1, 'P1')}
      ${renderColumn(labels.p2, 'P2')}
    </div>
  `
}
