// How many people belong to each area and field, counted by the database (views area_counts and field_counts).
// Filled in place when the site loads and whenever the signed-in member changes.
export const COUNTS = { area: {}, field: {} }

export function setCounts(next) {
  COUNTS.area = next?.area || {}
  COUNTS.field = next?.field || {}
}
