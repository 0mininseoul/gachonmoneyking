// src/lib/participation.js
export function participantCounts(list = []) {
  const byNationality = {};
  for (const item of list) {
    const key = item?.nationality || 'unknown';
    byNationality[key] = (byNationality[key] || 0) + 1;
  }
  return { total: list.length, byNationality };
}

export function topNationality(list = []) {
  const { byNationality } = participantCounts(list);
  let best = null;
  for (const [code, count] of Object.entries(byNationality)) {
    if (code === 'unknown') continue;
    if (!best || count > best.count) best = { code, count };
  }
  return best;
}
