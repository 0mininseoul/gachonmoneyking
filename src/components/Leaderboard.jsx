import React, { useState } from 'react';
import { nationalities } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';

export function Leaderboard({ list, isAuthenticated, currentUserId }) {
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

  // Tabs selection logic
  const tabs = ['all', 'vi', 'ja', 'zh', 'mn', 'uz'];

  // Filter rankings based on nationality tab
  const filteredList = activeTab === 'all'
    ? list
    : list.filter(item => item.nationality === activeTab);

  // Map each item to include its overall rank
  const listWithRank = filteredList.map(item => {
    const overallIndex = list.findIndex(x => x.id === item.id);
    return { ...item, overallRank: overallIndex + 1 };
  });

  // Exclude current user from the main scrollable list to avoid duplication
  const displayList = currentUserId
    ? listWithRank.filter(item => item.user_id !== currentUserId)
    : listWithRank;

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(`tab_${tab}`)}
          </button>
        ))}
      </div>

      <div className="leaderboard-table-card">
        <div className="table-header">
          <div className="col-rank">{t('ranking')}</div>
          <div className="col-user">{t('nickname')}</div>
          <div className="col-nationality">{t('nationality')}</div>
          <div className="col-balance">{t('balance')}</div>
        </div>
        
        <div className="table-body">
          {/* Pinned logged-in user row */}
          {userItem && (
            <div className="table-row pinned-user-row">
              <div className="col-rank">
                <span className={`rank-badge rank-${userOverallRank} pinned-rank`}>
                  {userOverallRank}
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
                <span className={isAuthenticated ? 'balance-amount' : 'balance-amount blurred'}>
                  {isAuthenticated ? `${Number(userItem.balance).toLocaleString()} KRW` : '●●●,●●●,●●● KRW'}
                </span>
              </div>
            </div>
          )}

          {displayList.length === 0 && !userItem ? (
            <div className="no-data">{t('no_rankings_yet')}</div>
          ) : (
            displayList.map((item) => (
              <div key={item.id} className="table-row">
                <div className="col-rank">
                  <span className={`rank-badge rank-${item.overallRank}`}>
                    {item.overallRank}
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
                  <span className={isAuthenticated ? 'balance-amount' : 'balance-amount blurred'}>
                    {isAuthenticated ? `${Number(item.balance).toLocaleString()} KRW` : '●●●,●●●,●●● KRW'}
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

