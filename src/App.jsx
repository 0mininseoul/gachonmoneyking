import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { useLanguage } from './i18n/LanguageContext';
import { nationalities } from './i18n/translations';
import { Leaderboard } from './components/Leaderboard';

function App() {
  const { locale, setLocale, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile Form State
  const [hasProfile, setHasProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nationality, setNationality] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Leaderboard data
  const [rankings, setRankings] = useState([]);
  const [userRecord, setUserRecord] = useState(null);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserProfile(session.user);
      } else {
        setHasProfile(false);
        setLoading(false);
      }
    });

    // 3. Fetch public leaderboard rankings
    fetchLeaderboard();

    return () => subscription.unsubscribe();
  }, []);

  const checkUserProfile = async (currentUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        setHasProfile(true);
        // Also fetch user's leaderboard record
        fetchUserLeaderboardRecord(currentUser.id);
      } else {
        setHasProfile(false);
      }
    } catch (err) {
      console.error("Error checking profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('status', 'verified')
        .order('balance', { ascending: false });
      
      if (data) {
        setRankings(data);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  const fetchUserLeaderboardRecord = async (userId) => {
    try {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (data) {
        setUserRecord(data);
      }
    } catch (err) {
      console.error("Error fetching user leaderboard record:", err);
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error("Error logging in via Kakao:", error);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHasProfile(false);
    setUserRecord(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !nationality) return;

    setSavingProfile(true);
    try {
      // Extract metadata provided by Kakao Simple Sign-up
      const meta = user.user_metadata || {};
      const realName = meta.name || meta.full_name || 'Anonymous User';
      const phoneNumber = meta.phone_number || '';
      const gender = meta.gender || 'unknown';

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          nickname: nickname.trim(),
          nationality: nationality,
          real_name: realName,
          phone_number: phoneNumber,
          gender: gender,
          marketing_consent: marketingConsent
        });

      if (!error) {
        setHasProfile(true);
        checkUserProfile(user);
      } else {
        console.error("Error saving profile:", error);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // 1. Profile Setup Form (If logged in but doesn't have profile record yet)
  if (user && !hasProfile) {
    return (
      <div className="app-container">
        <div className="linear-card profile-card">
          <h2>{t('setup_profile')}</h2>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label>{t('nickname')}</label>
              <input
                type="text"
                placeholder={t('enter_nickname')}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t('nationality')}</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                required
              >
                <option value="">-- {t('select_nationality')} --</option>
                {nationalities.map(nat => (
                  <option key={nat.code} value={nat.code}>
                    {nat.flag} {nat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="consent-box">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="consent-label">Agree to marketing SMS (Marketing Consent)</span>
              </label>
              <p className="nudge-text">{t('nudge')}</p>
            </div>

            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'Saving...' : t('submit_profile')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Main Dashboard & Leaderboard View
  return (
    <div className="main-layout">
      {/* Header / Navbar */}
      <header className="top-nav">
        <div className="brand">🪙 Gachon VIP</div>
        <div className="nav-controls">
          <select 
            value={locale} 
            onChange={(e) => setLocale(e.target.value)}
            className="lang-select"
          >
            <option value="ko">🇰🇷 한국어</option>
            <option value="en">🌐 English</option>
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="mn">🇲🇳 Монгол</option>
            <option value="uz">🇺🇿 O'zbek</option>
          </select>

          {user ? (
            <button onClick={handleLogout} className="btn-secondary btn-sm">
              {t('logout_btn')}
            </button>
          ) : (
            <button onClick={handleLogin} className="btn-primary btn-sm">
              {t('login_btn')}
            </button>
          )}
        </div>
      </header>

      {/* Main Section */}
      <main className="content-area">
        <div className="hero-section">
          <h1>{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>

        {/* Auth nudge or Upload balance section */}
        {!user ? (
          <div className="auth-nudge-banner">
            <p>{t('non_logged_in_notice')}</p>
            <button onClick={handleLogin} className="btn-primary btn-lg">
              {t('login_btn')}
            </button>
          </div>
        ) : (
          <div className="user-dashboard-card linear-card">
            {/* Authenticated user balance verification control goes here */}
            <h3>{t('upload_title')}</h3>
            <p className="desc">{t('upload_desc')}</p>
            {/* We will implement upload logic in the next tasks */}
          </div>
        )}

        {/* Leaderboard view */}
        <div className="leaderboard-wrapper">
          <Leaderboard list={rankings} isAuthenticated={!!user} />
        </div>
      </main>
    </div>
  );
}

export default App;
