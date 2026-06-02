import React from 'react';
import { ZONE_LABELS } from '../lib/rankReport';

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}

export function ResultCard({ insight, report, t, variant = 'owner', onShare, onCorrection }) {
  const zoneLabel = ZONE_LABELS[insight.balanceZone] || ZONE_LABELS.maintenance;
  return (
    <section className="result-card linear-card amp-mask">
      <button type="button" className="result-share-btn" onClick={onShare} aria-label={t('share_result_btn')}>
        <ShareIcon />
      </button>

      <h2 className="result-main-copy">{report.mainCopy}</h2>

      <div className="result-metric-row">
        <div className="result-metric">
          <span>{t('rank_report_overall')}</span>
          <strong>#{insight.overallRank} / {insight.overallTotal}</strong>
        </div>
        <div className="result-metric">
          <span>{t('rank_report_percentile')}</span>
          <strong>{t('percentile_top')} {insight.percentileTop}%</strong>
        </div>
      </div>

      <div className="result-zone">
        <span>WALLET ZONE</span>
        <div className={`wallet-zone-map zone-${insight.balanceZone}`}>
          <i></i><i></i><i></i><i></i><i></i>
        </div>
        <strong>{zoneLabel}</strong>
      </div>

      {variant === 'owner' && (
        <button type="button" className="result-correction-link" onClick={onCorrection}>
          {t('correction_btn')}
        </button>
      )}
    </section>
  );
}
