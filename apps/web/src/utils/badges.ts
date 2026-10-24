import { Software } from '../types/software';

const NEW_WINDOW_DAYS = 90;

// Single source of truth for "is this software newly launched" — used by
// cards, the quick-view popup, and the comparison page so the definition
// never drifts between them.
export function isNewlyLaunched(software: Pick<Software, 'launchDate'>) {
  if (!software.launchDate) return false;
  const launched = new Date(software.launchDate).getTime();
  const ageDays = (Date.now() - launched) / (1000 * 60 * 60 * 24);
  return ageDays >= 0 && ageDays <= NEW_WINDOW_DAYS;
}
