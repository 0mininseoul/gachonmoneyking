export const ANALYSIS_TARGET = 92;

// Ease toward the target so the bar slows as it approaches it (believable "almost done").
export function nextProgress(current, { target = ANALYSIS_TARGET, factor = 0.06 } = {}) {
  if (current >= target) return target;
  return Math.min(target, current + (target - current) * factor);
}

export function stageForProgress(progress) {
  if (progress < 25) return 'upload';
  if (progress < 55) return 'read';
  if (progress < 85) return 'rank';
  return 'report';
}

export const STAGE_KEYS = {
  upload: 'analyzing_stage_upload',
  read: 'analyzing_stage_read',
  rank: 'analyzing_stage_rank',
  report: 'analyzing_stage_report',
};
