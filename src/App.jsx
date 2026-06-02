import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { useLanguage } from './i18n/LanguageContext';
import { nationalities } from './i18n/translations';
import { Leaderboard } from './components/Leaderboard';
import { PrivacyView } from './components/PrivacyView';
import { TermsView } from './components/TermsView';
import { trackPosterQrOpen } from './lib/analytics';
import {
  buildFallbackRankReport,
  buildRankInsight,
  normalizeRankReport,
} from './lib/rankReport';
import {
  buildProfilePayload,
  isPhoneNumberComplete,
  isProfileFormComplete,
  joinPhoneSegments,
  splitPhoneNumber,
} from './lib/profilePayload';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
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
    trackPosterQrOpen({ locale, url: window.location.href });
  }, [locale, location.pathname, location.search]);

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
        setNickname('');
        setNationality('');
        setPhoneNumber('');
        setTermsAgreed(false);
        setPrivacyAgreed(false);
        setMarketingConsent(false);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (user && payload.new && payload.new.id === user.id) {
          checkUserProfile(user);
        }
        fetchLeaderboard();
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

      let hasProf = false;
      if (data) {
        setNickname(data.nickname || '');
        setNationality(data.nationality || '');
        setPhoneNumber(data.phone_number || '');
        setTermsAgreed(Boolean(data.terms_agreed));
        setPrivacyAgreed(Boolean(data.privacy_agreed));
        setMarketingConsent(Boolean(data.marketing_consent));

        hasProf = isProfileFormComplete({
          nickname: data.nickname,
          nationality: data.nationality,
          phoneNumber: data.phone_number,
          termsAgreed: data.terms_agreed,
          privacyAgreed: data.privacy_agreed,
        });
        setHasProfile(hasProf);
        if (hasProf) {
          fetchUserLeaderboardRecord(currentUser.id);
        }

        // Auto-sync email & avatar_url from Kakao user metadata if missing or updated
        const meta = currentUser.user_metadata || {};
        const emailVal = currentUser.email || meta.email || '';
        const avatarVal = meta.avatar_url || meta.picture || '';
        if (emailVal || avatarVal) {
          if (data.email !== emailVal || data.avatar_url !== avatarVal) {
            await supabase
              .from('profiles')
              .update({ email: emailVal, avatar_url: avatarVal })
              .eq('id', currentUser.id);
          }
        }
      } else {
        setHasProfile(false);
        setNickname('');
        setNationality('');
        setPhoneNumber('');
        setTermsAgreed(false);
        setPrivacyAgreed(false);
        setMarketingConsent(false);
      }

      // Check if this was a just-logged-in event
      if (sessionStorage.getItem('just_logged_in') === 'true') {
        sessionStorage.removeItem('just_logged_in');
        if (hasProf) {
          navigate('/dashboard');
        } else {
          navigate('/profile-setup');
        }
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
      return data || [];
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      return [];
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
      return data || null;
    } catch (err) {
      console.error("Error fetching user leaderboard record:", err);
      return null;
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

  const clearCorrectionNote = async (recordId) => {
    try {
      const { error } = await supabase
        .from('leaderboard')
        .update({ correction_note: null })
        .eq('id', recordId);
      if (!error) fetchAdminQueue();
    } catch (err) {
      console.error("Error clearing correction note:", err);
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
    sessionStorage.setItem('just_logged_in', 'true');
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
    setNickname('');
    setNationality('');
    setPhoneNumber('');
    setTermsAgreed(false);
    setPrivacyAgreed(false);
    setMarketingConsent(false);
    navigate('/');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isProfileFormComplete({ nickname, nationality, phoneNumber, termsAgreed, privacyAgreed })) return;

    setSavingProfile(true);
    try {
      const profilePayload = buildProfilePayload({
        user,
        nickname,
        nationality,
        phoneNumber,
        termsAgreed,
        privacyAgreed,
        marketingConsent,
      });

      const { error } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (!error) {
        setHasProfile(true);
        await checkUserProfile(user);
        navigate('/verify-balance');
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
        body: { filePath: uploadData.path, userId: user.id, locale }
      });

      if (edgeError || !edgeData.success) {
        throw new Error(edgeData?.error || edgeError?.message || "Failed to process screenshot balance");
      }

      if (edgeData.verified) {
        setUploadSuccess(true);
        await fetchLeaderboard();
        await fetchUserLeaderboardRecord(user.id);
        setShowRankCard(true);
        navigate('/dashboard');
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
    csvContent += "Nickname,Real Name,Phone Number,Nationality,Balance,Status,Marketing Consent,Uploaded At\n";
    
    adminQueue.forEach((row) => {
      const profile = row.profiles || {};
      const line = [
        row.nickname,
        profile.real_name || '',
        profile.phone_number || '',
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
          <div className="loader-content-wrap">
            <p className="loader-text">{t('loading')}</p>
            <p className="loader-caution">{t('loading_caution')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout isAdmin={isAdmin} locale={locale} setLocale={setLocale} user={user} handleLogout={handleLogout} handleLogin={handleLogin} navigate={navigate} location={location} t={t} />}>
        <Route path="/" element={<PublicRoute loading={loading} user={user} hasProfile={hasProfile}><LandingView user={user} rankings={rankings} handleLogin={handleLogin} t={t} navigate={navigate} /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute loading={loading} user={user} hasProfile={hasProfile}><DashboardView t={t} user={user} userRecord={userRecord} showRankCard={showRankCard} setShowRankCard={setShowRankCard} rankings={rankings} /></ProtectedRoute>} />
        <Route path="/verify-balance" element={<ProtectedRoute loading={loading} user={user} hasProfile={hasProfile}><BalanceUploadView t={t} userRecord={userRecord} uploadError={uploadError} uploadSuccess={uploadSuccess} handleFileUpload={handleFileUpload} /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute loading={loading} user={user} hasProfile={hasProfile} isAdmin={isAdmin}><AdminConsoleView loadingAdminQueue={loadingAdminQueue} exportCSV={exportCSV} adminQueue={adminQueue} updateVerificationStatus={updateVerificationStatus} clearCorrectionNote={clearCorrectionNote} /></AdminRoute>} />
        <Route path="/privacy" element={<PrivacyView />} />
        <Route path="/terms" element={<TermsView />} />
      </Route>
      <Route path="/profile-setup" element={<OnboardingRoute loading={loading} user={user} hasProfile={hasProfile}><ProfileSetupView t={t} nickname={nickname} setNickname={setNickname} nationality={nationality} setNationality={setNationality} phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} termsAgreed={termsAgreed} setTermsAgreed={setTermsAgreed} privacyAgreed={privacyAgreed} setPrivacyAgreed={setPrivacyAgreed} marketingConsent={marketingConsent} setMarketingConsent={setMarketingConsent} savingProfile={savingProfile} handleSaveProfile={handleSaveProfile} /></OnboardingRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Route Guard Definitions
function CenteredSpinner() {
  return <div className="loading-container"><div className="spinner"></div></div>;
}

function PublicRoute({ children, loading, user, hasProfile }) {
  if (loading) return <CenteredSpinner />;
  if (user) {
    if (hasProfile) return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function ProtectedRoute({ children, loading, user, hasProfile }) {
  if (loading) return <CenteredSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (!hasProfile) return <Navigate to="/profile-setup" replace />;
  return children;
}

function OnboardingRoute({ children, loading, user, hasProfile }) {
  if (loading) return <CenteredSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (hasProfile) return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ children, loading, user, hasProfile, isAdmin }) {
  if (loading) return <CenteredSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (!hasProfile) return <Navigate to="/profile-setup" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function MainLayout({ isAdmin, locale, setLocale, user, handleLogout, handleLogin, navigate, location, t }) {
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

          <div className="lang-selector">
            <span className="lang-globe">🌐</span>
            <select 
              value={locale} 
              onChange={(e) => setLocale(e.target.value)}
              className="lang-select"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="zh">中文</option>
              <option value="mn">Монгол</option>
              <option value="uz">O'zbek</option>
              <option value="ja">日本語</option>
              <option value="en">English</option>
              <option value="ko">한국어</option>
            </select>
          </div>

          {user ? (
            <button onClick={handleLogout} className="btn-secondary btn-sm">
              {t('logout_btn')}
             </button>
          ) : (
            <button onClick={handleLogin} className="btn-primary btn-sm">
              {t('start_btn')}
            </button>
          )}
        </div>
      </header>
      <div className="announcement-banner">
        {(() => {
          const text = t('banner_promo');
          const idx = text.lastIndexOf('(');
          if (idx === -1) return <span>{text}</span>;
          return (
            <>
              <span className="banner-main">{text.slice(0, idx).trimEnd()}</span>
              <span className="banner-paren">{text.slice(idx)}</span>
            </>
          );
        })()}
      </div>
      <main className="content-area">
        <Outlet />
      </main>
      <footer className="main-footer">
        <div className="footer-top">
          <div className="footer-info">
            <h4 className="footer-brand">Gachon Money King</h4>
            <p className="footer-desc">{t('footer_desc')}</p>
            <a className="footer-contact-link" href="mailto:contact@ascentum.co.kr">
              contact@ascentum.co.kr
            </a>
          </div>
          <div className="footer-links">
            <span onClick={() => navigate('/terms')}>{t('terms_link')}</span>
            <span className="divider">|</span>
            <span onClick={() => navigate('/privacy')}>{t('privacy_link')}</span>
          </div>
        </div>
        <div className="footer-separator"></div>
        <div className="footer-bottom">
          <p className="footer-copyright">© 2026 Gachon Money King. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function LandingView({ user, rankings, handleLogin, t, navigate }) {
  const { locale } = useLanguage();
  return (
    <>
      <div className="hero-section">
        <h1 className={`headline-${locale}`}>{t('title')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </div>
      {user ? (
        <div className="auth-nudge-banner linear-card animate-fade-in">
          <p className="banner-notice">{t('logged_in_no_profile_notice')}</p>
          <button onClick={() => navigate('/profile-setup')} className="btn-primary btn-lg banner-login-btn">
            {t('setup_profile_btn')}
          </button>
        </div>
      ) : (
        <div className="auth-nudge-banner linear-card">
          <p className="banner-notice">{t('non_logged_in_notice')}</p>
          <button onClick={handleLogin} className="btn-primary btn-lg banner-login-btn">
            {t('anonymous_rank_cta')}
          </button>
        </div>
      )}
      <div className="leaderboard-wrapper">
        <Leaderboard list={rankings} canViewBalances={false} currentUserId={user?.id} />
      </div>
    </>
  );
}

function ProfileSetupView({
  t,
  nickname,
  setNickname,
  nationality,
  setNationality,
  phoneNumber,
  setPhoneNumber,
  termsAgreed,
  setTermsAgreed,
  privacyAgreed,
  setPrivacyAgreed,
  marketingConsent,
  setMarketingConsent,
  savingProfile,
  handleSaveProfile
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const { setLocale } = useLanguage();
  const canSubmit = isProfileFormComplete({
    nickname,
    nationality,
    phoneNumber,
    termsAgreed,
    privacyAgreed,
  });

  const allConsentsChecked = termsAgreed && privacyAgreed && marketingConsent;
  const phoneSegments = splitPhoneNumber(phoneNumber);
  const steps = [
    {
      key: 'nationality',
      title: t('profile_step_nationality_title'),
      complete: Boolean(nationality),
    },
    {
      key: 'nickname',
      title: t('profile_step_nickname_title'),
      complete: Boolean(nickname.trim()),
    },
    {
      key: 'phone',
      title: t('profile_step_phone_title'),
      complete: isPhoneNumberComplete(phoneNumber),
    },
    {
      key: 'consent',
      title: t('profile_step_consent_title'),
      complete: termsAgreed && privacyAgreed,
    },
  ];
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleAgreeAllChange = (checked) => {
    setTermsAgreed(checked);
    setPrivacyAgreed(checked);
    setMarketingConsent(checked);
  };

  const handlePhoneSegmentChange = (segment, value) => {
    setPhoneNumber(joinPhoneSegments({
      ...phoneSegments,
      [segment]: value,
    }));
  };

  const goToNextStep = () => {
    if (!currentStepData.complete) return;
    if (currentStepData.key === 'nationality' && nationality) {
      setLocale(nationality);
    }
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const goToPreviousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleProfileStepSubmit = (e) => {
    if (!isLastStep) {
      e.preventDefault();
      goToNextStep();
      return;
    }
    handleSaveProfile(e);
  };

  return (
    <div className="app-container">
      <div className="linear-card profile-card profile-wizard-card">
        <h2>{t('setup_profile')}</h2>
        <form onSubmit={handleProfileStepSubmit} className="profile-wizard-form">
          <div className="profile-progress" aria-label={`${currentStep + 1} / ${steps.length}`}>
            {steps.map((step, index) => (
              <span
                key={step.key}
                className={`profile-progress-segment ${index <= currentStep ? 'active' : ''}`}
              />
            ))}
          </div>

          <div className="profile-step">
            <h3>{currentStepData.title}</h3>

            {currentStepData.key === 'nationality' && (
              <div className="profile-choice-grid">
                {nationalities.map((nat) => (
                  <button
                    key={nat.code}
                    type="button"
                    className={`profile-choice-btn ${nationality === nat.code ? 'selected' : ''}`}
                    onClick={() => setNationality(nat.code)}
                  >
                    <span>{nat.flag}</span>
                    <span>{nat.name}</span>
                  </button>
                ))}
              </div>
            )}

            {currentStepData.key === 'nickname' && (
              <div className="form-group profile-step-field">
                <label>{t('nickname')}<span className="required-mark">*</span></label>
                <input
                  type="text"
                  placeholder={t('enter_nickname')}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                  required
                />
                <span className="field-hint">{t('nickname_hint')}</span>
              </div>
            )}

            {currentStepData.key === 'phone' && (
              <div className="form-group profile-step-field">
                <label>{t('phone_number')}<span className="required-mark">*</span></label>
                <div className="phone-segment-grid">
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    aria-label={`${t('phone_number')} 1`}
                    placeholder="010"
                    value={phoneSegments.first}
                    onChange={(e) => handlePhoneSegmentChange('first', e.target.value)}
                    maxLength={3}
                    required
                  />
                  <span className="phone-separator">-</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    aria-label={`${t('phone_number')} 2`}
                    placeholder="1234"
                    value={phoneSegments.middle}
                    onChange={(e) => handlePhoneSegmentChange('middle', e.target.value)}
                    maxLength={4}
                    required
                  />
                  <span className="phone-separator">-</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    aria-label={`${t('phone_number')} 3`}
                    placeholder="5678"
                    value={phoneSegments.last}
                    onChange={(e) => handlePhoneSegmentChange('last', e.target.value)}
                    maxLength={4}
                    required
                  />
                </div>
                <span className="field-hint">{t('phone_number_hint')}</span>
              </div>
            )}

            {currentStepData.key === 'consent' && (
              <div className="consent-box">
                <label className="checkbox-container agree-all-row">
                  <input
                    type="checkbox"
                    checked={allConsentsChecked}
                    onChange={(e) => handleAgreeAllChange(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="consent-label">{t('agree_all')}</span>
                </label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    required
                  />
                  <span className="checkmark"></span>
                  <span className="consent-label">
                    <LinkedConsentLabel text={t('terms_required_label')} t={t} />
                  </span>
                </label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    required
                  />
                  <span className="checkmark"></span>
                  <span className="consent-label">
                    <LinkedConsentLabel text={t('privacy_required_label')} t={t} />
                  </span>
                </label>
                <div className="consent-item">
                  <label className="checkbox-container optional-consent">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span className="consent-label">{t('marketing_consent_label')}</span>
                  </label>
                  <p className="nudge-text">{t('nudge')}</p>
                </div>
              </div>
            )}
          </div>

          <div className={`profile-actions ${currentStep === 0 ? 'single-action' : ''}`}>
            {currentStep > 0 && (
              <button type="button" className="btn-secondary profile-nav-btn" onClick={goToPreviousStep}>
                {t('previous_profile_step')}
              </button>
            )}
            {isLastStep ? (
              <button type="submit" disabled={savingProfile || !canSubmit} className="btn-primary profile-nav-btn">
                {savingProfile ? t('saving_profile') : t('submit_profile')}
              </button>
            ) : (
              <button
                type="button"
                disabled={!currentStepData.complete}
                className="btn-primary profile-nav-btn"
                onClick={goToNextStep}
              >
                {t('next_profile_step')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function LinkedConsentLabel({ text, t }) {
  return text.split(/(\{terms\}|\{privacy\})/g).map((part, index) => {
    if (part === '{terms}') {
      return <Link key={index} to="/terms">{t('terms_link')}</Link>;
    }
    if (part === '{privacy}') {
      return <Link key={index} to="/privacy">{t('privacy_link')}</Link>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function DashboardView({
  t,
  user,
  userRecord,
  showRankCard,
  setShowRankCard,
  rankings
}) {
  const navigate = useNavigate();
  const [showCorrectionModal, setShowCorrectionModal] = React.useState(false);
  const [correctionText, setCorrectionText] = React.useState('');
  const [submittingCorrection, setSubmittingCorrection] = React.useState(false);
  const [correctionSuccess, setCorrectionSuccess] = React.useState(false);
  const [copiedShareIndex, setCopiedShareIndex] = React.useState(null);
  const canViewLeaderboardBalances = Boolean(userRecord && userRecord.status === 'verified');
  const isVerified = canViewLeaderboardBalances;

  const currentBalance = userRecord ? Number(userRecord.balance) : 0;
  const otherHigherRanked = rankings.filter(
    r => r.user_id !== user.id && Number(r.balance) > currentBalance
  );
  const userRank = otherHigherRanked.length + 1;
  const total = rankings.length;

  const topPct = total > 0 ? Math.ceil(userRank / total * 100) : 0;
  const percentileLabel = total > 0
    ? topPct <= 50
      ? `${t('percentile_top')} ${topPct}%`
      : `${t('percentile_bottom')} ${Math.ceil((total - userRank + 1) / total * 100)}%`
    : '';

  const nickname = userRecord?.nickname || '';

  const titleText = userRecord
    ? t('celebration_title')
        .replace('{nickname}', nickname)
        .replace('{rank}', userRank)
        .replace('{percentile}', percentileLabel)
    : '';

  const subtitleText = userRecord
    ? t('celebration_subtitle')
        .replace('{nickname}', nickname)
        .replace('{balance}', Number(userRecord.balance).toLocaleString())
    : '';

  const hasPendingCorrection = isVerified && !!userRecord?.correction_note;
  const { locale } = useLanguage();
  const reportInsight = isVerified
    ? buildRankInsight({
        userId: user.id,
        userRecord,
        rankings: rankings.length ? rankings : [userRecord],
      })
    : null;
  const rankReport = reportInsight
    ? normalizeRankReport(userRecord?.result_report_json || buildFallbackRankReport(reportInsight, locale), reportInsight, locale)
    : null;

  const handleCopyShareCard = async (card, index) => {
    const text = `${card.title}\n${card.subtitle}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedShareIndex(index);
      window.setTimeout(() => setCopiedShareIndex(null), 1600);
    } catch (err) {
      console.error('Could not copy share card:', err);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionText.trim()) return;
    setSubmittingCorrection(true);
    try {
      const { error } = await supabase
        .from('leaderboard')
        .update({ correction_note: correctionText.trim() })
        .eq('user_id', user.id);
      if (!error) {
        setCorrectionSuccess(true);
      }
    } catch (err) {
      console.error('Error submitting correction:', err);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const openCorrectionModal = () => {
    setCorrectionText(userRecord?.correction_note || '');
    setCorrectionSuccess(false);
    setShowCorrectionModal(true);
  };

  return (
    <>
      <div className="hero-section">
        <h1 className={`headline-${locale}`}>{t('title')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </div>

      <div className={`leaderboard-access-rail ${isVerified ? 'unlocked' : 'locked'}`}>
        <div>
          <span>{isVerified ? t('leaderboard_unlocked_label') : t('leaderboard_locked_label')}</span>
          <p>{isVerified ? t('leaderboard_unlocked_desc') : t('leaderboard_locked_desc')}</p>
        </div>
        <div className="leaderboard-access-actions">
          {isVerified && (
            <button type="button" className="btn-secondary btn-sm" onClick={openCorrectionModal}>
              {t('correction_btn')}
            </button>
          )}
          <button type="button" className="btn-primary btn-sm" onClick={() => navigate('/verify-balance')}>
            {isVerified ? t('update_balance_btn') : t('go_verify_balance_btn')}
          </button>
        </div>
      </div>

      {hasPendingCorrection && (
        <p className="correction-pending-notice dashboard-correction-notice">{t('correction_pending_status')}</p>
      )}

      {isVerified && rankReport && reportInsight && (
        <section className="rank-report-panel">
          <div className="rank-report-hero linear-card">
            <div className="anonymous-pill">{t('anonymous_badge_label')}</div>
            <h2>{rankReport.mainCopy}</h2>
            <p>{rankReport.personaDescription}</p>
            <div className="rank-metric-grid">
              <MetricTile label={t('rank_report_overall')} value={`#${reportInsight.overallRank} / ${reportInsight.overallTotal}`} />
              <MetricTile label={t('rank_report_nationality')} value={`#${reportInsight.nationalRank} / ${reportInsight.nationalTotal}`} />
              <MetricTile label={t('rank_report_percentile')} value={`${t('percentile_top')} ${reportInsight.percentileTop}%`} />
              <MetricTile label={t('rank_report_next_gap')} value={reportInsight.gapToNextRank > 0 ? `₩${Number(reportInsight.gapToNextRank).toLocaleString()}` : 'TOP'} />
              <MetricTile label={t('rank_report_people_below')} value={`${reportInsight.peopleBelow}`} />
            </div>
          </div>

          <div className="rank-report-grid">
            <article className="rank-report-block">
              <span>{rankReport.personaName}</span>
              <h3>{t('rank_report_title')}</h3>
              <p>{rankReport.rankComment}</p>
            </article>
            <article className="rank-report-block">
              <span>{t('rank_report_next_gap')}</span>
              <h3>{reportInsight.gapToNextRank > 0 ? `₩${Number(reportInsight.gapToNextRank).toLocaleString()}` : 'TOP'}</h3>
              <p>{rankReport.gapComment}</p>
            </article>
            <article className="rank-report-block">
              <span>{t('rank_report_nationality')}</span>
              <h3>#{reportInsight.nationalRank}</h3>
              <p>{rankReport.nationalityComment}</p>
            </article>
            <article className="rank-report-block">
              <span>WALLET MAP</span>
              <div className={`wallet-zone-map zone-${reportInsight.balanceZone}`}>
                <i></i><i></i><i></i><i></i><i></i>
              </div>
              <p>{rankReport.positionMapComment}</p>
            </article>
          </div>

          <div className="rank-conclusion-card linear-card">
            <p>{rankReport.finalConclusion}</p>
          </div>

          <div className="share-card-section">
            <h3>{t('rank_report_share_title')}</h3>
            <div className="share-card-grid">
              {rankReport.shareCards.map((card, index) => (
                <article key={`${card.type}-${index}`} className="share-copy-card">
                  <span>{card.type}</span>
                  <h4>{card.title}</h4>
                  <p>{card.subtitle}</p>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => handleCopyShareCard(card, index)}>
                    {copiedShareIndex === index ? t('share_card_copied') : t('copy_share_card')}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Correction Request Modal */}
      {showCorrectionModal && (
        <div className="overlay-celebration" onClick={() => setShowCorrectionModal(false)}>
          <div className="correction-modal linear-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-overlay" onClick={() => setShowCorrectionModal(false)}>×</button>
            <h3>{t('correction_modal_title')}</h3>
            <p>{t('correction_modal_desc')}</p>
            {correctionSuccess ? (
              <p className="success-message" style={{ textAlign: 'center', padding: '16px 0' }}>
                ✅ {t('correction_success')}
              </p>
            ) : (
              <form onSubmit={handleCorrectionSubmit}>
                {userRecord?.correction_note && (
                  <div className="correction-existing">
                    <strong>{t('correction_existing')}</strong>
                    {userRecord.correction_note}
                  </div>
                )}
                <textarea
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  placeholder={t('correction_placeholder')}
                  required
                />
                <button type="submit" disabled={submittingCorrection} className="btn-primary">
                  {submittingCorrection ? '...' : t('correction_submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showRankCard && userRecord && (
        <div className="overlay-celebration" onClick={() => setShowRankCard(false)}>
          <div className="rank-celebration-card linear-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-overlay" onClick={() => setShowRankCard(false)}>×</button>
            <div className="medal-icon">🏆</div>
            <h2>{titleText}</h2>
            <p className="celebration-text">{subtitleText}</p>
            <button onClick={() => setShowRankCard(false)} className="btn-primary">
              {t('view_leaderboard_btn')}
            </button>
          </div>
        </div>
      )}

      <div className="leaderboard-wrapper">
        <Leaderboard list={rankings} canViewBalances={canViewLeaderboardBalances} currentUserId={user?.id} />
      </div>
    </>
  );
}

function BalanceUploadView({
  t,
  userRecord,
  uploadError,
  uploadSuccess,
  handleFileUpload
}) {
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const isVerified = userRecord && userRecord.status === 'verified';

  return (
    <div className="app-container verify-page">
      <div className="verify-mobile-shell">
        <div className="verify-step-header">
          <button type="button" className="verify-back-btn" onClick={() => navigate('/dashboard')}>
            ←
          </button>
          <div>
            <span>{t('verify_step_label')}</span>
            <h1 className={`headline-${locale}`}>{isVerified ? t('upload_title_verified') : t('upload_title')}</h1>
          </div>
        </div>

        <p className="verify-page-subtitle">
          {isVerified ? t('upload_desc_verified') : t('verify_page_subtitle')}
        </p>

        <div className="verify-status-strip">
          <span>{t('anonymous_badge_label')}</span>
          <strong>{isVerified ? t('leaderboard_unlocked_label') : t('leaderboard_locked_label')}</strong>
        </div>

        {isVerified && (
          <div className="verify-balance-summary">
            <span>{t('registered_balance_label')}</span>
            <strong>{Number(userRecord.balance).toLocaleString()} KRW</strong>
          </div>
        )}

        <div className="upload-trust-sheet verify-trust-sheet">
          <div className="trust-sheet-title">{t('upload_trust_title')}</div>
          <ul>
            <li>{t('upload_trust_ai_reads')}</li>
            <li>{t('upload_trust_public_identity')}</li>
            <li>{t('upload_trust_delete')}</li>
            <li>{t('upload_trust_reward')}</li>
          </ul>
        </div>

        <div className="verify-upload-zone">
          <input
            type="file"
            id="screenshot-file-upload"
            accept="image/*"
            onChange={handleFileUpload}
            className="file-hidden-input"
          />
          <label htmlFor="screenshot-file-upload" className="btn-primary verify-upload-btn">
            {isVerified ? t('update_balance_btn') : t('upload_btn')}
          </label>
          <p>{t('verify_upload_hint')}</p>
        </div>

        {uploadError && <p className="error-message verify-feedback">{uploadError}</p>}
        {uploadSuccess && <p className="success-message verify-feedback">{t('success')}</p>}
      </div>
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="rank-metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdminConsoleView({
  loadingAdminQueue,
  exportCSV,
  adminQueue,
  updateVerificationStatus,
  clearCorrectionNote
}) {
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
            <div>Phone / Nation</div>
            <div>Screenshot Image</div>
            <div>AI Extracted Balance</div>
            <div>Status / Actions</div>
          </div>
          <div className="admin-grid-body">
            {adminQueue.length === 0 ? (
              <p className="no-data">No uploads in verification queue</p>
            ) : (
              adminQueue.map((row) => (
                <div key={row.id}>
                  <div className="admin-row">
                    <div className="admin-col-user">
                      <strong>{row.nickname}</strong>
                      <span className="sub-text">{row.profiles?.real_name || 'No Name'}</span>
                    </div>
                    <div className="admin-col-meta">
                      <div>{row.profiles?.phone_number || 'No Phone'}</div>
                      <div className="sub-text">{row.nationality}</div>
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
                  {row.correction_note && (
                    <div className="admin-correction-row">
                      <span className="admin-correction-label">🔄 수정 요청</span>
                      <span className="admin-correction-text">{row.correction_note}</span>
                      <button
                        onClick={() => clearCorrectionNote(row.id)}
                        className="btn-action"
                        style={{ background: '#3e3e44', color: '#f7f8f8', marginLeft: 8 }}
                      >
                        확인 완료
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
