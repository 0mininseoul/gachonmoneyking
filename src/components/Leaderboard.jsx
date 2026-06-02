import React, { useState } from 'react';
import { nationalities } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';
import { trackUserAction } from '../lib/analytics';
import { EVENTS } from '../lib/analyticsEvents';

export function Leaderboard({ list, canViewBalances = false, currentUserId }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');

  const getFlag = (nationalityCode) => {
    const nat = nationalities.find(n => n.code === nationalityCode);
    return nat ? nat.flag : '🌐';
  };

  const getCountryName = (nationalityCode) => {
    const nat = nationalities.find(n => n.code === nationalityCode);
    return nat ? nat.name : 'Unknown';
  };

  // Find user's record and overall rank from the full list
  const userIndex = list.findIndex(item => item.user_id === currentUserId);
  const userItem = userIndex !== -1 ? list[userIndex] : null;
  const userOverallRank = userIndex !== -1 ? userIndex + 1 : null;

  // Calculate user's rank within their own nationality
  const userNationRank = userItem
    ? list.filter(item => item.nationality === userItem.nationality).findIndex(item => item.user_id === currentUserId) + 1
    : null;

  // Pinned user visibility condition and rank determination
  const shouldShowPinned = userItem && (activeTab === 'all' || activeTab === userItem.nationality);
  const userDisplayRank = activeTab === 'all' ? userOverallRank : userNationRank;

  // Tabs selection logic
  const tabs = ['all', 'vi', 'zh', 'mn', 'uz', 'ja'];

  // Filter rankings based on nationality tab
  const filteredList = activeTab === 'all'
    ? list
    : list.filter(item => item.nationality === activeTab);

  // Map each item to include its active rank in the current tab view
  const listWithRank = filteredList.map((item, index) => {
    return { ...item, activeRank: index + 1 };
  });

  // Exclude current user from the main scrollable list to avoid duplication
  const displayList = currentUserId
    ? listWithRank.filter(item => item.user_id !== currentUserId)
    : listWithRank;

  // Get flag icon and label for each tab button
  const getTabLabel = (tab) => {
    if (tab === 'all') {
      return `🌐 ${t('tab_all')}`;
    }
    const flag = getFlag(tab);
    return `${flag} ${t(`tab_${tab}`)}`;
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    trackUserAction(EVENTS.LEADERBOARD_TAB_SELECTED, {
      tab,
      can_view_balances: canViewBalances,
      has_current_user: Boolean(currentUserId),
      visible_rows: tab === 'all' ? list.length : list.filter(item => item.nationality === tab).length,
    });
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => selectTab(tab)}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      <div className="leaderboard-table-card">
        <div className="table-header">
          <div className="col-rank" title={t('ranking')}>#</div>
          <div className="col-user">{t('nickname')}</div>
          <div className="col-nationality">{t('nationality')}</div>
          <div className="col-balance">{t('balance')}</div>
        </div>
        
        <div className="table-body">
          {/* Pinned logged-in user row */}
          {shouldShowPinned && (
            <div className="table-row pinned-user-row">
              <div className="col-rank">
                <span className={`rank-badge rank-${userDisplayRank} pinned-rank`}>
                  {userDisplayRank}
                </span>
              </div>
              <div className="col-user">
                <span className="user-nickname">
                  {userItem.nickname}
                  <span className="me-badge">{t('me_label')}</span>
                </span>
              </div>
              <div className="col-nationality">
                <span className="flag-icon">{getFlag(userItem.nationality)}</span>
                <span className="country-name">{getCountryName(userItem.nationality)}</span>
              </div>
              <div className="col-balance">
                <span className={canViewBalances ? 'balance-amount amp-mask' : 'balance-amount blurred amp-mask'}>
                  {canViewBalances ? `${Number(userItem.balance).toLocaleString()} KRW` : '●●●,●●●,●●● KRW'}
                </span>
              </div>
            </div>
          )}

          {displayList.length === 0 && !shouldShowPinned ? (
            <div className="no-data">{t('no_rankings_yet')}</div>
          ) : (
            displayList.map((item) => (
              <div key={item.id} className="table-row">
                <div className="col-rank">
                  <span className={`rank-badge rank-${item.activeRank}`}>
                    {item.activeRank}
                  </span>
                </div>
                <div className="col-user">
                  <span className="user-nickname">{item.nickname}</span>
                </div>
                <div className="col-nationality">
                  <span className="flag-icon">{getFlag(item.nationality)}</span>
                  <span className="country-name">{getCountryName(item.nationality)}</span>
                </div>
                <div className="col-balance">
                  <span className={canViewBalances ? 'balance-amount amp-mask' : 'balance-amount blurred amp-mask'}>
                    {canViewBalances ? `${Number(item.balance).toLocaleString()} KRW` : '●●●,●●●,●●● KRW'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
