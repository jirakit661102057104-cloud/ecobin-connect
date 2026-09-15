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
  if (n.includes('กระป๋อง') || n.includes('can') || n.includes('aluminium') || n.includes('aluminum')) {
    const can = types.find((t) => t.plastic_code === 8 || t.short_name.toLowerCase().includes('can'));
    if (can) return { points: can.points_per_bottle, carbon: can.carbon_factor, matched: can };
  }
  if (n.includes('ขวดพลาสติก') || n.includes('plastic_bottle') || n.includes('plastic bottle') || n === 'plastic_bottle') {
    const pet = types.find((t) => t.plastic_code === 1);
    if (pet) return { points: pet.points_per_bottle, carbon: pet.carbon_factor, matched: pet };
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
