import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { useLanguage } from './i18n/LanguageContext';
import { nationalities } from './i18n/translations';
import { Leaderboard } from './components/Leaderboard';
import { SignupView } from './components/SignupView';
import { PrivacyView } from './components/PrivacyView';
import { TermsView } from './components/TermsView';

function App() {
  const { locale, setLocale, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Profile Form State
  const [hasProfile, setHasProfile] = useState(false);
  const [nickname, setNickname] = useState('');
  const [nationality, setNationality] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Leaderboard & Rank State
  const [rankings, setRankings] = useState([]);
  const [userRecord, setUserRecord] = useState(null);

  // Upload & OCR State
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showRankCard, setShowRankCard] = useState(false);

  // Admin access state
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Admin details
  const [adminQueue, setAdminQueue] = useState([]);
  const [loadingAdminQueue, setLoadingAdminQueue] = useState(false);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        checkUserProfile(currentUser);
        checkAdminRole(currentUser);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        checkUserProfile(currentUser);
        checkAdminRole(currentUser);
      } else {
        setHasProfile(false);
        setUserRecord(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // 3. Fetch public leaderboard rankings
    fetchLeaderboard();

    // 4. Subscribe to Realtime DB updates
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => {
        fetchLeaderboard();
        if (user) {
          fetchUserLeaderboardRecord(user.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch admin queue when navigating to /admin
  useEffect(() => {
    if (location.pathname === '/admin' && isAdmin) {
      fetchAdminQueue();
    }
  }, [location.pathname, isAdmin]);

  const checkUserProfile = async (currentUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        setHasProfile(true);
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

  const checkAdminRole = async (currentUser) => {
    const userEmail = currentUser.email || '';
    if (userEmail.endsWith('@archy.ai') || userEmail === '0mininseoul@gmail.com') {
      setIsAdmin(true);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data } = await supabase
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

  const fetchAdminQueue = async () => {
    setLoadingAdminQueue(true);
    try {
      const { data } = await supabase
        .from('leaderboard')
        .select(`
          *,
          profiles:user_id (
            real_name,
            phone_number,
            gender,
            marketing_consent
          )
        `)
        .order('updated_at', { ascending: false });
      if (data) {
        setAdminQueue(data);
      }
    } catch (err) {
      console.error("Error fetching admin queue:", err);
    } finally {
      setLoadingAdminQueue(false);
    }
  };

  const updateVerificationStatus = async (recordId, status, balanceInput) => {
    try {
      const balanceVal = Number(balanceInput);
      const { error } = await supabase
        .from('leaderboard')
        .update({ status, balance: balanceVal })
        .eq('id', recordId);
      if (!error) {
        fetchAdminQueue();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error("Error updating verification:", err);
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
    navigate('/');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !nationality) return;

    setSavingProfile(true);
    try {
      const meta = user.user_metadata || {};
      const realName = meta.name || meta.full_name || 'Kakao User';
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
        await checkUserProfile(user);
        navigate('/dashboard');
      } else {
        console.error("Error saving profile:", error);
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('verify-balance', {
        body: { filePath: uploadData.path, userId: user.id }
      });

      if (edgeError || !edgeData.success) {
        throw new Error(edgeData?.error || edgeError?.message || "Failed to process screenshot balance");
      }

      if (edgeData.verified) {
        setUploadSuccess(true);
        setShowRankCard(true);
        fetchLeaderboard();
        fetchUserLeaderboardRecord(user.id);
      } else {
        throw new Error(t('error_invalid'));
      }

    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nickname,Real Name,Phone Number,Gender,Nationality,Balance,Status,Marketing Consent,Uploaded At\n";
    
    adminQueue.forEach((row) => {
      const profile = row.profiles || {};
      const line = [
        row.nickname,
        profile.real_name || '',
        profile.phone_number || '',
        profile.gender || '',
        row.nationality,
        row.balance,
        row.status,
        profile.marketing_consent ? 'Yes' : 'No',
        row.updated_at
      ].join(",");
      csvContent += line + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gachon_balance_leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Route Guard Definitions
  function PublicRoute({ children }) {
    if (loading) return <div className="spinner"></div>;
    if (user) {
      if (!hasProfile) return <Navigate to="/profile-setup" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  function ProtectedRoute({ children }) {
    if (loading) return <div className="spinner"></div>;
    if (!user) return <Navigate to="/" replace />;
    if (!hasProfile) return <Navigate to="/profile-setup" replace />;
    return children;
  }

  function OnboardingRoute({ children }) {
    if (loading) return <div className="spinner"></div>;
    if (!user) return <Navigate to="/" replace />;
    if (hasProfile) return <Navigate to="/dashboard" replace />;
    return children;
  }

  function AdminRoute({ children }) {
    if (loading) return <div className="spinner"></div>;
    if (!user) return <Navigate to="/" replace />;
    if (!hasProfile) return <Navigate to="/profile-setup" replace />;
    if (!isAdmin) return <Navigate to="/dashboard" replace />;
    return children;
  }

  // Layout View Components
  function MainLayout() {
    return (
      <div className="main-layout">
        <header className="top-nav">
          <div className="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/logo.png" className="brand-logo" alt="logo" />
            <span>Gachon Money King</span>
          </div>
          <div className="nav-controls">
            {isAdmin && (
              <button 
                onClick={() => navigate(location.pathname === '/admin' ? '/dashboard' : '/admin')} 
                className="btn-secondary btn-sm admin-btn"
              >
                {location.pathname === '/admin' ? 'Go to Leaderboard' : 'Admin Console'}
              </button>
            )}

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
        <main className="content-area">
          <Outlet />
        </main>
        <footer className="main-footer">
          <div className="footer-links">
            <span onClick={() => navigate('/terms')}>서비스 이용약관</span>
            <span className="divider">|</span>
            <span onClick={() => navigate('/privacy')}>개인정보처리방침</span>
            <span className="divider">|</span>
            <span onClick={() => navigate('/signup')}>회원가입</span>
          </div>
          <p className="footer-copyright">© 2026 Gachon Money King. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  function LandingView() {
    return (
      <>
        <div className="hero-section">
          <h1>{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>
        <div className="auth-nudge-banner linear-card">
          <p className="banner-notice">{t('non_logged_in_notice')}</p>
          <button onClick={handleLogin} className="btn-primary btn-lg banner-login-btn">
            {t('login_btn')}
          </button>
        </div>
        <div className="leaderboard-wrapper">
          <Leaderboard list={rankings} isAuthenticated={false} />
        </div>
      </>
    );
  }

  function ProfileSetupView() {
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
                maxLength={20}
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

  function DashboardView() {
    return (
      <>
        <div className="hero-section">
          <h1>{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>

        <div className="user-dashboard-card linear-card">
          <h3>{t('upload_title')}</h3>
          <p className="desc">{t('upload_desc')}</p>
          
          {userRecord && userRecord.status ? (
            <div className="user-record-status">
              <p className="verified-status-info">
                Status: <strong className={`status-${userRecord.status}`}>{userRecord.status.toUpperCase()}</strong>
              </p>
              <p className="balance-info-text">
                Your registered balance: <strong>{Number(userRecord.balance).toLocaleString()} KRW</strong>
              </p>
            </div>
          ) : null}

          <div className="upload-input-container">
            <input
              type="file"
              id="screenshot-file-upload"
              accept="image/*"
              onChange={handleFileUpload}
              className="file-hidden-input"
            />
            <label htmlFor="screenshot-file-upload" className="btn-primary upload-label-btn">
              {t('upload_btn')}
            </label>
          </div>
          
          {uploadError && <p className="error-message">❌ {uploadError}</p>}
          {uploadSuccess && <p className="success-message">✅ {t('success')}</p>}
        </div>

        {showRankCard && userRecord && (
          <div className="overlay-celebration" onClick={() => setShowRankCard(false)}>
            <div className="rank-celebration-card linear-card" onClick={(e) => e.stopPropagation()}>
              <button className="close-overlay" onClick={() => setShowRankCard(false)}>×</button>
              <div className="medal-icon">🏆</div>
              <h2>Verification Complete!</h2>
              <p className="celebration-text">
                Your balance of <strong>{Number(userRecord.balance).toLocaleString()} KRW</strong> has been registered!
              </p>
               <button onClick={() => setShowRankCard(false)} className="btn-primary">
                View Leaderboard
              </button>
            </div>
          </div>
        )}

        <div className="leaderboard-wrapper">
          <Leaderboard list={rankings} isAuthenticated={true} />
        </div>
      </>
    );
  }

  function AdminConsoleView() {
    return (
      <div className="admin-console">
        <div className="admin-header">
          <h2>Admin Verification Console</h2>
          <button onClick={exportCSV} className="btn-primary btn-sm">Export CSV Data</button>
        </div>
        {loadingAdminQueue ? (
          <p>Loading queue data...</p>
        ) : (
          <div className="admin-table-card">
            <div className="admin-grid-header">
              <div>User (Nickname / Name)</div>
              <div>Phone / Gender / Nation</div>
              <div>Screenshot Image</div>
              <div>AI Extracted Balance</div>
              <div>Status / Actions</div>
            </div>
            <div className="admin-grid-body">
              {adminQueue.length === 0 ? (
                <p className="no-data">No uploads in verification queue</p>
              ) : (
                adminQueue.map((row) => (
                  <div key={row.id} className="admin-row">
                    <div className="admin-col-user">
                      <strong>{row.nickname}</strong>
                      <span className="sub-text">{row.profiles?.real_name || 'No Name'}</span>
                    </div>
                    <div className="admin-col-meta">
                      <div>{row.profiles?.phone_number || 'No Phone'}</div>
                      <div className="sub-text">{row.profiles?.gender} / {row.nationality}</div>
                    </div>
                    <div className="admin-col-img">
                      <a href={row.screenshot_url} target="_blank" rel="noopener noreferrer">
                        <img src={row.screenshot_url} alt="Bank Screen" className="admin-thumb" />
                      </a>
                    </div>
                    <div className="admin-col-balance">
                      <input 
                        type="number" 
                        defaultValue={row.balance} 
                        onBlur={(e) => updateVerificationStatus(row.id, row.status, e.target.value)}
                        className="balance-edit-input"
                      />
                    </div>
                    <div className="admin-col-actions">
                      <span className={`status-badge badge-${row.status}`}>{row.status}</span>
                      <div className="action-buttons">
                        <button 
                          onClick={() => updateVerificationStatus(row.id, 'verified', row.balance)}
                          className="btn-action approve-btn"
                          disabled={row.status === 'verified'}
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => updateVerificationStatus(row.id, 'rejected', 0)}
                          className="btn-action reject-btn"
                          disabled={row.status === 'rejected'}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-container loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="app-container loader-overlay">
        <div className="loader-box">
          <div className="orbit-spinner">
            <div className="orbit"></div>
            <div className="orbit"></div>
            <div className="orbit"></div>
          </div>
          <p className="loader-text">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<PublicRoute><LandingView /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardView /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminConsoleView /></AdminRoute>} />
        <Route path="/signup" element={<SignupView />} />
        <Route path="/privacy" element={<PrivacyView />} />
        <Route path="/terms" element={<TermsView />} />
      </Route>
      <Route path="/profile-setup" element={<OnboardingRoute><ProfileSetupView /></OnboardingRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
