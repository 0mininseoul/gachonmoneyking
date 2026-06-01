import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SignupView() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePrivacy: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      setError('필수 약관 및 개인정보처리방침에 동의하셔야 합니다.');
      return;
    }

    setSuccess(true);
    // Mock signup behavior
    setTimeout(() => {
      alert('회원가입이 완료되었습니다! 카카오 로그인을 이용해 주세요.');
      navigate('/');
    }, 1500);
  };

  return (
    <div className="app-container" style={{ maxWidth: '520px', margin: '40px auto' }}>
      <div className="linear-card profile-card" style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '24px', textAlign: 'center', fontWeight: 600, letterSpacing: '-0.5px' }}>
          회원가입 (Sign Up)
        </h2>
        
        {success ? (
          <div style={{ textAlign: 'center', color: 'var(--color-primary-hover)', padding: '20px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
            <h3>회원가입 완료!</h3>
            <p style={{ color: 'var(--color-ink-muted)', marginTop: '8px' }}>잠시 후 메인 페이지로 이동합니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>이름 (Real Name) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                name="name"
                placeholder="홍길동 (Gildong Hong)"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>전화번호 (Phone Number) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="tel"
                name="phone"
                placeholder="010-1234-5678"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>이메일 주소 (Email Address) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="email"
                name="email"
                placeholder="example@gachon.ac.kr"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>비밀번호 (Password) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="password"
                name="password"
                placeholder="영문, 숫자 포함 8자 이상"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>비밀번호 확인 (Confirm Password) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="비밀번호 재입력"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', padding: '12px', backgroundColor: 'var(--color-surface-2)', borderRadius: 'var(--rounded-md)', border: '1px solid var(--color-hairline)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                />
                <span>[필수] 서비스 이용약관 동의</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  name="agreePrivacy"
                  checked={formData.agreePrivacy}
                  onChange={handleChange}
                  required
                />
                <span>[필수] 개인정보 수집 및 이용 방침 동의</span>
              </label>
            </div>

            {error && <p className="error-message" style={{ margin: 0, textAlign: 'left' }}>❌ {error}</p>}

            <button type="submit" className="btn-primary" style={{ marginTop: '12px', width: '100%', padding: '12px' }}>
              가입하기 (Sign Up)
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
