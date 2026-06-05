export const EVENTS = Object.freeze({
  POSTER_QR_OPENED: 'Poster QR Opened',
  ONLINE_LINK_OPENED: 'Online Link Opened',
  LANGUAGE_CHANGED: 'Language Changed',
  NAVIGATION_CLICKED: 'Navigation Clicked',
  LOGIN_CLICKED: 'Login Clicked',
  LOGIN_COMPLETED: 'Login Completed',
  LOGIN_FAILED: 'Login Failed',
  LOGOUT_CLICKED: 'Logout Clicked',
  PROFILE_STEP_COMPLETED: 'Profile Step Completed',
  PROFILE_SAVE_STARTED: 'Profile Save Started',
  PROFILE_SAVE_SUCCEEDED: 'Profile Save Succeeded',
  PROFILE_SAVE_FAILED: 'Profile Save Failed',
  DASHBOARD_VERIFY_CLICKED: 'Dashboard Verify Clicked',
  BALANCE_UPLOAD_STARTED: 'Balance Upload Started',
  BALANCE_UPLOAD_SUCCEEDED: 'Balance Upload Succeeded',
  BALANCE_UPLOAD_FAILED: 'Balance Upload Failed',
  BALANCE_VERIFICATION_STARTED: 'Balance Verification Started',
  BALANCE_VERIFICATION_RESPONSE_RECEIVED: 'Balance Verification Response Received',
  BALANCE_VERIFICATION_FUNCTION_STAGE: 'Balance Verification Function Stage',
  BALANCE_VERIFICATION_SUCCEEDED: 'Balance Verification Succeeded',
  BALANCE_VERIFICATION_REJECTED: 'Balance Verification Rejected',
  BALANCE_VERIFICATION_FAILED: 'Balance Verification Failed',
  LEADERBOARD_TAB_SELECTED: 'Leaderboard Tab Selected',
  RESULT_CARD_DISMISSED: 'Result Card Dismissed',
  RESULT_SHARE_STARTED: 'Result Share Started',
  RESULT_SHARE_COMPLETED: 'Result Share Completed',
  CORRECTION_MODAL_OPENED: 'Correction Modal Opened',
  CORRECTION_MODAL_CLOSED: 'Correction Modal Closed',
  CORRECTION_IMAGE_ATTACHED: 'Correction Image Attached',
  CORRECTION_REQUEST_SUBMITTED: 'Correction Request Submitted',
  CORRECTION_REQUEST_SUCCEEDED: 'Correction Request Succeeded',
  CORRECTION_REQUEST_FAILED: 'Correction Request Failed',
  SHARED_RESULT_VIEWED: 'Shared Result Viewed',
  SHARED_RESULT_CTA_CLICKED: 'Shared Result CTA Clicked',
  ADMIN_CONSOLE_VIEWED: 'Admin Console Viewed',
  ADMIN_CSV_EXPORTED: 'Admin CSV Exported',
  ADMIN_VERIFICATION_UPDATED: 'Admin Verification Updated',
  ADMIN_CORRECTION_CLEARED: 'Admin Correction Cleared',
  LOGIN_SHEET_OPENED: 'Login Sheet Opened',
  REGISTRATION_COMPLETED: 'Registration Completed',
});

export const OPERATIONAL_EVENTS = new Set([
  EVENTS.LOGIN_FAILED,
  EVENTS.PROFILE_SAVE_SUCCEEDED,
  EVENTS.PROFILE_SAVE_FAILED,
  EVENTS.BALANCE_UPLOAD_STARTED,
  EVENTS.BALANCE_UPLOAD_SUCCEEDED,
  EVENTS.BALANCE_UPLOAD_FAILED,
  EVENTS.BALANCE_VERIFICATION_STARTED,
  EVENTS.BALANCE_VERIFICATION_RESPONSE_RECEIVED,
  EVENTS.BALANCE_VERIFICATION_FUNCTION_STAGE,
  EVENTS.BALANCE_VERIFICATION_SUCCEEDED,
  EVENTS.BALANCE_VERIFICATION_REJECTED,
  EVENTS.BALANCE_VERIFICATION_FAILED,
  EVENTS.CORRECTION_REQUEST_SUBMITTED,
  EVENTS.CORRECTION_REQUEST_SUCCEEDED,
  EVENTS.CORRECTION_REQUEST_FAILED,
  EVENTS.ADMIN_VERIFICATION_UPDATED,
  EVENTS.ADMIN_CORRECTION_CLEARED,
]);

export function createEventId(prefix = 'evt') {
  const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

export function fileExtension(fileName = '') {
  const ext = String(fileName).split('.').pop();
  return ext && ext !== fileName ? ext.toLowerCase().slice(0, 12) : 'unknown';
}

export function sizeBucket(bytes = 0) {
  const size = Number(bytes) || 0;
  if (size <= 0) return 'unknown';
  if (size < 500_000) return '<500kb';
  if (size < 2_000_000) return '500kb-2mb';
  if (size < 5_000_000) return '2mb-5mb';
  return '5mb+';
}

export function textLengthBucket(text = '') {
  const length = String(text).trim().length;
  if (length === 0) return 'empty';
  if (length < 50) return '<50';
  if (length < 200) return '50-199';
  return '200+';
}

export function safeErrorCode(error) {
  const code = sanitizeErrorCode(error?.code);
  if (code) return code;

  const message = String(error?.message || error?.name || '').toLowerCase();
  if (/download|screenshot/.test(message)) return 'storage_download_failed';
  if (/upload|storage/.test(message)) return 'storage_upload_failed';
  if (/oauth|kakao|sign.?in|auth/.test(message)) return 'auth_failed';
  if (/profile/.test(message)) return 'profile_save_failed';
  if (/leaderboard|database|upsert|update/.test(message)) return 'database_write_failed';
  if (/vertex|gemini|ai/.test(message)) return 'ai_verification_failed';
  if (/network|fetch|timeout/.test(message)) return 'network_failed';
  if (/invalid|rejected|bank_statement|statement/.test(message)) return 'verification_rejected';
  if (/missing|required/.test(message)) return 'missing_required_input';

  return sanitizeErrorCode(error?.name) || 'unknown_error';
}

function sanitizeErrorCode(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  if (!sanitized || sanitized.length > 40 || /\d{6,}/.test(sanitized)) return '';
  return sanitized;
}
