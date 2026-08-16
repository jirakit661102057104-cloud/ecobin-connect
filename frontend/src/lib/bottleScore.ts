import type { PlasticType } from '../types';

export function matchBottleScore(
  types: PlasticType[],
  plasticType: string,
  fallbackPoints: number,
  fallbackCarbon: number
) {
  const n = (plasticType || '').toLowerCase().trim();
  if (!n || types.length === 0) {
    return { points: fallbackPoints, carbon: fallbackCarbon, matched: null as PlasticType | null };
  }
  let matched: PlasticType | null = null;
  for (const t of types) {
    const hay = `${t.display_name_th} ${t.short_name} ${t.full_name}`.toLowerCase();
    const short = (t.short_name.split('/')[0] || '').trim().toLowerCase();
    if (hay.includes(n) || n.includes((t.display_name_th || '').toLowerCase()) || (short.length >= 2 && n.includes(short))) {
      matched = t;
      if (n.includes((t.display_name_th || '').toLowerCase())) break;
    }
  }
  if (!matched) {
    return { points: fallbackPoints, carbon: fallbackCarbon, matched: null };
  }
  return { points: matched.points_per_bottle, carbon: matched.carbon_factor, matched };
}
