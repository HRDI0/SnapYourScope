export function issuePriorityFromStatus(statusType) {
  if (statusType === 'fail') return 'P0'
  if (statusType === 'warn') return 'P1'
  return 'P2'
}

export function groupByPriority(issues) {
  return issues.reduce(
    (acc, issue) => {
      const bucket = issuePriorityFromStatus(issue.statusType)
      acc[bucket].push(issue)
      return acc
    },
    { P0: [], P1: [], P2: [] }
  )
}
