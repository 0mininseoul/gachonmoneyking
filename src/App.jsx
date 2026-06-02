import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { useLanguage } from './i18n/LanguageContext';
import { nationalities } from './i18n/translations';
import { Leaderboard } from './components/Leaderboard';
import { ResultCard } from './components/ResultCard';
import { PrivacyView } from './components/PrivacyView';
import { TermsView } from './components/TermsView';
import {
  clearAnalyticsUser,
  setAnalyticsUser,
  trackPosterQrOpen,
  trackUserAction,
} from './lib/analytics';
import {
  createEventId,
  EVENTS,
  fileExtension,
  safeErrorCode,
  sizeBucket,
  textLengthBucket,
} from './lib/analyticsEvents';
import { nextProgress, stageForProgress, STAGE_KEYS } from './lib/analysisProgress';
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
import { buildShareUrl, shareResult } from './lib/shareResult';

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
  const [rankingsLoaded, setRankingsLoaded] = useState(false);
  const [userRecord, setUserRecord] = useState(null);

  // Upload & OCR State
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showRankCard, setShowRankCard] = useState(false);

  // Admin access state
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Admin details
  const [adminQueue, setAdminQueue] = useState([]);
  const [loadingAdminQueue, setLoadingAdminQueue] = useState(false);

  const handleLanguageChange = (nextLocale, source = 'header') => {
    const previousLocale = locale;
    setLocale(nextLocale);
    if (previousLocale !== nextLocale) {
      trackUserAction(EVENTS.LANGUAGE_CHANGED, {
        from_locale: previousLocale,
        to_locale: nextLocale,
        source,
      });
    }
  };

  useEffect(() => {
    trackPosterQrOpen({ locale, url: window.location.href });
  }, [locale, location.pathname, location.search]);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setAnalyticsUser(currentUser);
        checkUserProfile(currentUser);
        checkAdminRole(currentUser);
      } else {
        clearAnalyticsUser();
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setAnalyticsUser(currentUser);
        checkUserProfile(currentUser);
        checkAdminRole(currentUser);
      } else {
        clearAnalyticsUser();
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
      trackUserAction(EVENTS.ADMIN_CONSOLE_VIEWED, { queue_loaded: adminQueue.length > 0 });
      fetchAdminQueue();
    }
  }, [location.pathname, isAdmin]);

  // Drive the analysis progress gauge while an upload is processing
  useEffect(() => {
    if (!uploading) {
      setUploadProgress(0);
      return;
    }
    setUploadProgress(8);
    const id = setInterval(() => {
      setUploadProgress((p) => nextProgress(p));
    }, 220);
    return () => clearInterval(id);
  }, [uploading]);

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
        trackUserAction(EVENTS.LOGIN_COMPLETED, {
          has_profile: hasProf,
          destination: hasProf ? 'dashboard' : 'profile_setup',
        });
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
    } finally {
      setRankingsLoaded(true);
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
      if (!error) {
        trackUserAction(EVENTS.ADMIN_CORRECTION_CLEARED, { record_present: Boolean(recordId) }, { operational: true });
        fetchAdminQueue();
      }
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
        trackUserAction(EVENTS.ADMIN_VERIFICATION_UPDATED, {
          status,
          record_present: Boolean(recordId),
        }, { operational: true });
        fetchAdminQueue();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error("Error updating verification:", err);
    }
  };

  const handleLogin = async () => {
    trackUserAction(EVENTS.LOGIN_CLICKED, { provider: 'kakao' });
    sessionStorage.setItem('just_logged_in', 'true');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      trackUserAction(EVENTS.LOGIN_FAILED, {
        provider: 'kakao',
        error_code: safeErrorCode(error),
      }, { operational: true });
      console.error("Error logging in via Kakao:", error);
    }
  };

  const handleLogout = async () => {
    trackUserAction(EVENTS.LOGOUT_CLICKED);
    await supabase.auth.signOut();
    clearAnalyticsUser();
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

    const requestId = createEventId('profile');
    trackUserAction(EVENTS.PROFILE_SAVE_STARTED, {
      request_id: requestId,
      nationality,
      marketing_consent: marketingConsent,
    });
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
        trackUserAction(EVENTS.PROFILE_SAVE_SUCCEEDED, {
          request_id: requestId,
          nationality,
          marketing_consent: marketingConsent,
        }, { operational: true });
        setHasProfile(true);
        await checkUserProfile(user);
        navigate('/verify-balance');
      } else {
        trackUserAction(EVENTS.PROFILE_SAVE_FAILED, {
          request_id: requestId,
          error_code: safeErrorCode(error),
        }, { operational: true });
        console.error("Error saving profile:", error);
      }
    } catch (err) {
      trackUserAction(EVENTS.PROFILE_SAVE_FAILED, {
        request_id: requestId,
        error_code: safeErrorCode(err),
      }, { operational: true });
      console.error("Error saving profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const requestId = createEventId('verify');
    let failureStage = 'storage_upload';

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    trackUserAction(EVENTS.BALANCE_UPLOAD_STARTED, {
      request_id: requestId,
      upload_extension: fileExtension(file.name),
      upload_size_bucket: sizeBucket(file.size),
      had_verified_record: userRecord?.status === 'verified',
    }, { operational: true });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      failureStage = 'edge_function';
      trackUserAction(EVENTS.BALANCE_VERIFICATION_STARTED, {
        request_id: requestId,
        locale,
      }, { operational: true });
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('verify-balance', {
        body: { filePath: uploadData.path, userId: user.id, locale, requestId }
      });

      if (edgeError || !edgeData.success) {
        throw new Error(edgeData?.error || edgeError?.message || "Failed to process screenshot balance");
      }

      if (edgeData.verified) {
        trackUserAction(EVENTS.BALANCE_VERIFICATION_SUCCEEDED, {
          request_id: requestId,
          locale,
          rank_report_returned: Boolean(edgeData.rankReport),
        }, { operational: true });
        setUploadSuccess(true);
        await fetchLeaderboard();
        await fetchUserLeaderboardRecord(user.id);
        setShowRankCard(true);
        navigate('/dashboard');
      } else {
        trackUserAction(EVENTS.BALANCE_VERIFICATION_REJECTED, {
          request_id: requestId,
          locale,
          reason: 'not_bank_statement',
        }, { operational: true });
        setUploadError(t('error_invalid'));
        return;
      }

    } catch (err) {
      trackUserAction(
        failureStage === 'storage_upload' ? EVENTS.BALANCE_UPLOAD_FAILED : EVENTS.BALANCE_VERIFICATION_FAILED,
        {
          request_id: requestId,
          locale,
          failure_stage: failureStage,
          error_code: safeErrorCode(err),
        },
        { operational: true }
      );
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const exportCSV = () => {
    trackUserAction(EVENTS.ADMIN_CSV_EXPORTED, { row_count: adminQueue.length });
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
    const stageKey = STAGE_KEYS[stageForProgress(uploadProgress)];
    const pct = Math.round(uploadProgress);
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
            <div className="loader-progress">
              <div className="loader-progress-track">
                <div className="loader-progress-fill" style={{ width: `${pct}%` }}></div>
              </div>
              <div className="loader-progress-meta">
                <span className="loader-stage">{t(stageKey)}</span>
                <span className="loader-percent">{pct}%</span>
              </div>
            </div>
            <p className="loader-caution">{t('loading_caution')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<MainLayout isAdmin={isAdmin} locale={locale} setLocale={handleLanguageChange} user={user} handleLogout={handleLogout} handleLogin={handleLogin} navigate={navigate} location={location} t={t} />}>
        <Route path="/" element={<PublicRoute loading={loading} user={user} hasProfile={hasProfile}><LandingView user={user} rankings={rankings} handleLogin={handleLogin} t={t} navigate={navigate} /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute loading={loading} user={user} hasProfile={hasProfile}><DashboardView t={t} user={user} userRecord={userRecord} showRankCard={showRankCard} setShowRankCard={setShowRankCard} rankings={rankings} /></ProtectedRoute>} />
        <Route path="/verify-balance" element={<ProtectedRoute loading={loading} user={user} hasProfile={hasProfile}><BalanceUploadView t={t} userRecord={userRecord} uploadError={uploadError} uploadSuccess={uploadSuccess} handleFileUpload={handleFileUpload} /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute loading={loading} user={user} hasProfile={hasProfile} isAdmin={isAdmin}><AdminConsoleView loadingAdminQueue={loadingAdminQueue} exportCSV={exportCSV} adminQueue={adminQueue} updateVerificationStatus={updateVerificationStatus} clearCorrectionNote={clearCorrectionNote} /></AdminRoute>} />
        <Route path="/privacy" element={<PrivacyView />} />
        <Route path="/terms" element={<TermsView />} />
        <Route path="/r/:recordId" element={<SharedResultView rankings={rankings} rankingsLoaded={rankingsLoaded} user={user} userRecord={userRecord} handleLogin={handleLogin} t={t} />} />
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
  const navigateWithTracking = (destination, source) => {
    trackUserAction(EVENTS.NAVIGATION_CLICKED, { destination, source });
    navigate(destination);
  };

  return (
    <div className="main-layout">
      <header className="top-nav">
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => navigateWithTracking('/', 'brand')}>
          <img src="/logo.png" className="brand-logo" alt="logo" />
          <span>Gachon Money King</span>
        </div>
        <div className="nav-controls">
          {isAdmin && (
            <button 
              onClick={() => navigateWithTracking(location.pathname === '/admin' ? '/dashboard' : '/admin', 'admin_toggle')}
              className="btn-secondary btn-sm admin-btn"
            >
              {location.pathname === '/admin' ? 'Go to Leaderboard' : 'Admin Console'}
            </button>
          )}

          <div className="lang-selector">
            <span className="lang-globe">🌐</span>
            <select 
              value={locale} 
              onChange={(e) => setLocale(e.target.value, 'header')}
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
            <span onClick={() => navigateWithTracking('/terms', 'footer_terms')}>{t('terms_link')}</span>
            <span className="divider">|</span>
            <span onClick={() => navigateWithTracking('/privacy', 'footer_privacy')}>{t('privacy_link')}</span>
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
          <button
            onClick={() => {
              trackUserAction(EVENTS.NAVIGATION_CLICKED, { destination: 'profile_setup', source: 'landing_profile_nudge' });
              navigate('/profile-setup');
            }}
            className="btn-primary btn-lg banner-login-btn"
          >
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
  const { locale, setLocale } = useLanguage();
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
      if (locale !== nationality) {
        trackUserAction(EVENTS.LANGUAGE_CHANGED, {
          from_locale: locale,
          to_locale: nationality,
          source: 'profile_nationality',
        });
      }
    }
    trackUserAction(EVENTS.PROFILE_STEP_COMPLETED, {
      step: currentStepData.key,
      next_step: steps[Math.min(currentStep + 1, steps.length - 1)]?.key || currentStepData.key,
      nationality: currentStepData.key === 'nationality' ? nationality : undefined,
      marketing_consent: currentStepData.key === 'consent' ? marketingConsent : undefined,
    });
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const goToPreviousStep = () => {
    trackUserAction(EVENTS.NAVIGATION_CLICKED, {
      source: 'profile_previous_step',
      destination: steps[Math.max(currentStep - 1, 0)]?.key || 'profile_start',
    });
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
  const [correctionImage, setCorrectionImage] = React.useState(null);
  const [shareToast, setShareToast] = React.useState(false);
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

  const handleShare = async () => {
    if (!userRecord) return;
    const requestId = createEventId('share');
    const url = buildShareUrl(window.location.origin, userRecord.id);
    trackUserAction(EVENTS.RESULT_SHARE_STARTED, {
      request_id: requestId,
      context: 'owner_dashboard',
      has_rank_report: Boolean(rankReport),
    });
    const result = await shareResult({
      url,
      title: t('shared_result_headline').replace('{nickname}', userRecord.nickname),
      description: rankReport?.mainCopy || '',
      imageUrl: `${window.location.origin}/logo.png`,
      ctaLabel: t('anonymous_rank_cta'),
      homeUrl: window.location.origin,
    });
    trackUserAction(EVENTS.RESULT_SHARE_COMPLETED, {
      request_id: requestId,
      context: 'owner_dashboard',
      method: result,
    }, { operational: result === 'failed' });
    if (result === 'copied') {
      setShareToast(true);
      window.setTimeout(() => setShareToast(false), 1800);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionText.trim()) return;
    const requestId = createEventId('correction');
    trackUserAction(EVENTS.CORRECTION_REQUEST_SUBMITTED, {
      request_id: requestId,
      has_attachment: Boolean(correctionImage),
      text_length_bucket: textLengthBucket(correctionText),
    }, { operational: true });
    setSubmittingCorrection(true);
    try {
      let imageUrl = userRecord?.correction_image_url || null;
      if (correctionImage) {
        const ext = correctionImage.name.split('.').pop();
        const path = `${user.id}/correction-${Date.now()}.${ext}`;
        const { data, error: upErr } = await supabase.storage
          .from('screenshots')
          .upload(path, correctionImage, { upsert: true });
        if (!upErr && data) {
          imageUrl = supabase.storage.from('screenshots').getPublicUrl(data.path).data.publicUrl;
        }
      }
      const { error } = await supabase
        .from('leaderboard')
        .update({ correction_note: correctionText.trim(), correction_image_url: imageUrl })
        .eq('user_id', user.id);
      if (!error) {
        trackUserAction(EVENTS.CORRECTION_REQUEST_SUCCEEDED, {
          request_id: requestId,
          has_attachment: Boolean(correctionImage),
        }, { operational: true });
        setCorrectionSuccess(true);
      } else {
        trackUserAction(EVENTS.CORRECTION_REQUEST_FAILED, {
          request_id: requestId,
          error_code: safeErrorCode(error),
        }, { operational: true });
      }
    } catch (err) {
      trackUserAction(EVENTS.CORRECTION_REQUEST_FAILED, {
        request_id: requestId,
        error_code: safeErrorCode(err),
      }, { operational: true });
      console.error('Error submitting correction:', err);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const openCorrectionModal = () => {
    trackUserAction(EVENTS.CORRECTION_MODAL_OPENED, {
      has_pending_correction: Boolean(userRecord?.correction_note),
    });
    setCorrectionText(userRecord?.correction_note || '');
    setCorrectionImage(null);
    setCorrectionSuccess(false);
    setShowCorrectionModal(true);
  };

  return (
    <>
      <div className="hero-section">
        <h1 className={`headline-${locale}`}>{t('title')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </div>

      {isVerified && rankReport && reportInsight ? (
        <ResultCard
          insight={reportInsight}
          report={rankReport}
          t={t}
          variant="owner"
          onShare={handleShare}
          onCorrection={openCorrectionModal}
        />
      ) : (
        !isVerified && (
          <div className="dashboard-verify-prompt">
            <button
              type="button"
              className="btn-primary btn-lg"
              onClick={() => {
                trackUserAction(EVENTS.DASHBOARD_VERIFY_CLICKED, { source: 'dashboard_prompt' });
                navigate('/verify-balance');
              }}
            >
              {t('go_verify_balance_btn')}
            </button>
          </div>
        )
      )}

      {hasPendingCorrection && (
        <p className="correction-pending-notice dashboard-correction-notice">{t('correction_pending_status')}</p>
      )}

      {shareToast && <div className="share-toast">{t('copy_link_done')}</div>}

      {/* Correction Request Modal */}
      {showCorrectionModal && (
        <div
          className="overlay-celebration"
          onClick={() => {
            trackUserAction(EVENTS.CORRECTION_MODAL_CLOSED, { source: 'overlay' });
            setShowCorrectionModal(false);
          }}
        >
          <div className="correction-modal linear-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-overlay"
              onClick={() => {
                trackUserAction(EVENTS.CORRECTION_MODAL_CLOSED, { source: 'close_button' });
                setShowCorrectionModal(false);
              }}
            >×</button>
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
                <label className="correction-attach">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const nextFile = e.target.files[0] || null;
                      setCorrectionImage(nextFile);
                      if (nextFile) {
                        trackUserAction(EVENTS.CORRECTION_IMAGE_ATTACHED, {
                          upload_extension: fileExtension(nextFile.name),
                          upload_size_bucket: sizeBucket(nextFile.size),
                        });
                      }
                    }}
                    className="file-hidden-input"
                  />
                  <span className="btn-secondary btn-sm">📎 {t('correction_attach_image')}</span>
                  {correctionImage && <span className="correction-file-name">{correctionImage.name}</span>}
                </label>
                <button type="submit" disabled={submittingCorrection} className="btn-primary">
                  {submittingCorrection ? '...' : t('correction_submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showRankCard && userRecord && (
        <div
          className="overlay-celebration"
          onClick={() => {
            trackUserAction(EVENTS.RESULT_CARD_DISMISSED, { source: 'overlay' });
            setShowRankCard(false);
          }}
        >
          <div className="rank-celebration-card linear-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-overlay"
              onClick={() => {
                trackUserAction(EVENTS.RESULT_CARD_DISMISSED, { source: 'close_button' });
                setShowRankCard(false);
              }}
            >×</button>
            <div className="medal-icon">🏆</div>
            <h2>{rankReport?.mainCopy || titleText}</h2>
            <p className="celebration-rank-summary">
              {t('celebration_rank_summary')
                .replace('{rank}', userRank)
                .replace('{percentile}', percentileLabel)}
            </p>
            <p className="celebration-text">{subtitleText}</p>
            <button
              onClick={() => {
                trackUserAction(EVENTS.RESULT_CARD_DISMISSED, { source: 'view_leaderboard' });
                setShowRankCard(false);
              }}
              className="btn-primary"
            >
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
          <button
            type="button"
            className="verify-back-btn"
            onClick={() => {
              trackUserAction(EVENTS.NAVIGATION_CLICKED, { destination: 'dashboard', source: 'verify_back' });
              navigate('/dashboard');
            }}
          >
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
          <p>{t('upload_desc')}</p>
        </div>

        {uploadError && <p className="error-message verify-feedback">{uploadError}</p>}
        {uploadSuccess && <p className="success-message verify-feedback">{t('success')}</p>}
      </div>
    </div>
  );
}

function SharedResultView({ rankings, rankingsLoaded, user, userRecord, handleLogin, t }) {
  const { recordId } = useParams();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const [shareToast, setShareToast] = React.useState(false);
  const record = rankings.find((r) => r.id === recordId);
  const canViewBalances = Boolean(userRecord && userRecord.status === 'verified');

  useEffect(() => {
    if (!rankingsLoaded) return;
    trackUserAction(EVENTS.SHARED_RESULT_VIEWED, {
      result_found: Boolean(record),
      can_view_balances: canViewBalances,
      locale,
    });
  }, [rankingsLoaded, recordId, Boolean(record), canViewBalances, locale]);

  if (!rankingsLoaded) {
    return <div className="app-container loading-container"><div className="spinner"></div></div>;
  }

  if (!record) {
    return (
      <div className="app-container shared-result-view shared-result-missing">
        <p className="shared-not-found">{t('shared_not_found')}</p>
        <button
          className="btn-primary btn-lg"
          onClick={() => {
            trackUserAction(EVENTS.SHARED_RESULT_CTA_CLICKED, { state: 'missing_result', destination: 'home' });
            navigate('/');
          }}
        >
          {t('anonymous_rank_cta')}
        </button>
      </div>
    );
  }

  const insight = buildRankInsight({ userId: record.user_id, userRecord: record, rankings });
  const report = normalizeRankReport(
    record.result_report_json || buildFallbackRankReport(insight, locale),
    insight,
    locale
  );

  const handleShare = async () => {
    const requestId = createEventId('share');
    const url = buildShareUrl(window.location.origin, record.id);
    trackUserAction(EVENTS.RESULT_SHARE_STARTED, {
      request_id: requestId,
      context: 'public_shared_result',
      can_view_balances: canViewBalances,
    });
    const result = await shareResult({
      url,
      title: t('shared_result_headline').replace('{nickname}', record.nickname),
      description: report.mainCopy || '',
      imageUrl: `${window.location.origin}/logo.png`,
      ctaLabel: t('anonymous_rank_cta'),
      homeUrl: window.location.origin,
    });
    trackUserAction(EVENTS.RESULT_SHARE_COMPLETED, {
      request_id: requestId,
      context: 'public_shared_result',
      method: result,
    }, { operational: result === 'failed' });
    if (result === 'copied') {
      setShareToast(true);
      window.setTimeout(() => setShareToast(false), 1800);
    }
  };

  return (
    <div className="shared-result-view">
      <div className="hero-section">
        <h1 className={`headline-${locale}`}>
          {t('shared_result_headline').replace('{nickname}', record.nickname)}
        </h1>
      </div>

      <ResultCard insight={insight} report={report} t={t} variant="public" onShare={handleShare} />

      <div className="leaderboard-wrapper">
        <Leaderboard list={rankings} canViewBalances={canViewBalances} currentUserId={user?.id} />
      </div>

      <div className="shared-cta-wrap">
        <button
          className="btn-primary btn-lg"
          onClick={user ? () => {
            trackUserAction(EVENTS.SHARED_RESULT_CTA_CLICKED, { state: 'logged_in', destination: 'dashboard' });
            navigate('/dashboard');
          } : () => {
            trackUserAction(EVENTS.SHARED_RESULT_CTA_CLICKED, { state: 'logged_out', destination: 'login' });
            handleLogin();
          }}
        >
          {t('anonymous_rank_cta')}
        </button>
      </div>

      {shareToast && <div className="share-toast">{t('copy_link_done')}</div>}
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
                      {row.correction_image_url && (
                        <a href={row.correction_image_url} target="_blank" rel="noopener noreferrer" className="admin-correction-img-link">
                          🖼️ 이미지 보기
                        </a>
                      )}
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
