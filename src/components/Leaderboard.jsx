import React from 'react';
import { nationalities } from '../i18n/translations';

export function Leaderboard({ list, isAuthenticated }) {
  const getFlag = (nationalityCode) => {
    const nat = nationalities.find(n => n.code === nationalityCode);
    return nat ? nat.flag : '🌐';
  };

  const getCountryName = (nationalityCode) => {
    const nat = nationalities.find(n => n.code === nationalityCode);
    return nat ? nat.name : 'Unknown';
  };

  return (
    <div className="leaderboard-table-card">
      <div className="table-header">
        <div className="col-rank">Rank</div>
        <div className="col-user">User</div>
        <div className="col-nationality">Nationality</div>
        <div className="col-balance">Asset Balance</div>
      </div>
      
      <div className="table-body">
        {list.length === 0 ? (
          <div className="no-data">No verified rankings yet. Be the first to upload!</div>
        ) : (
          list.map((item, index) => (
            <div key={item.id} className="table-row">
              <div className="col-rank">
                <span className={`rank-badge rank-${index + 1}`}>
                  {index + 1}
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
  );
}
