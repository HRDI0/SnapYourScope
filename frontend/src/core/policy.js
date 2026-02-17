export const PROMPT_INCLUDED_COUNT = 5
export const PROMPT_ADDON_BLOCK_SIZE = 5
export const PROMPT_ADDON_BLOCK_PRICE_USD = 0

export function calculatePromptAddOnMonthly(promptCount) {
  const extraCount = Math.max(0, promptCount - PROMPT_INCLUDED_COUNT)
  if (!extraCount) return 0
  const addOnUnits = Math.ceil(extraCount / PROMPT_ADDON_BLOCK_SIZE)
  return addOnUnits * PROMPT_ADDON_BLOCK_PRICE_USD
}
