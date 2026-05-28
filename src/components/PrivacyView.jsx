import React from 'react';

export function PrivacyView() {
  return (
    <div className="app-container" style={{ maxWidth: '800px', margin: '40px auto' }}>
      <div className="linear-card" style={{ padding: '40px', lineHeight: '1.7', color: 'var(--color-ink-muted)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '24px', fontWeight: 600, color: 'var(--color-ink)', letterSpacing: '-0.5px' }}>
          개인정보처리방침 (Privacy Policy)
        </h1>
        
        <p style={{ marginBottom: '16px' }}>
          Gachon Money King 서비스(이하 '서비스', 도메인: https://gachonmoneyking.vercel.app)는 이용자의 개인정보를 신속하고 안전하게 보호하며, 이와 관련한 고충을 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </p>

        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
          1. 수집하는 개인정보의 항목 및 수집 방법
        </h2>
        <p style={{ marginBottom: '8px' }}>
          서비스는 최초 회원가입 및 카카오 계정 연동 로그인 시 다음과 같은 최소한의 개인정보를 수집하고 있습니다.
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
          <li><strong>필수 수집 항목:</strong> 이름, 성별, 출생연도, 카카오 계정 전화번호, 이메일 주소, 카카오 고유 ID</li>
          <li><strong>서비스 이용 과정 중 수집 항목:</strong> 닉네임, 국적, 은행 잔고 증명 이미지(스크린샷) 및 분석된 자산 금액</li>
          <li><strong>수집 방법:</strong> 회원가입 폼 작성, 카카오 간편 가입 API 연동, 이미지 업로드 인터페이스</li>
        </ul>

        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
          2. 개인정보의 수집 및 이용 목적
        </h2>
        <p style={{ marginBottom: '16px' }}>
          수집된 개인정보는 다음 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경될 시에는 사전 동의를 구할 예정입니다.
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
          <li><strong>회원 관리:</strong> 가천대학교 유학생 본인 확인 및 중복 가입 방지</li>
          <li><strong>리더보드 집계:</strong> 잔고 스크린샷 검증을 통한 자산 순위(랭킹) 부여</li>
          <li><strong>이벤트 운영:</strong> 우수 자산가 대상 상품 발송, 추첨 이벤트(편의점 기프티콘 등) 당첨자 고지 및 모바일 기프티콘 SMS 발송</li>
          <li><strong>서비스 개선:</strong> 다국어 이용 통계 분석 및 고객 고충 처리</li>
        </ul>

        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
          3. 개인정보의 보유 및 이용 기간
        </h2>
        <p style={{ marginBottom: '16px' }}>
          이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용 목적이 달성되면 지체 없이 파기합니다. 단, 다음의 경우 예외로 합니다.
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
          <li><strong>이벤트 및 순위 집계:</strong> 리더보드 이벤트 운영 종료 시까지 보유</li>
          <li><strong>이용자 탈퇴:</strong> 탈퇴 요청 접수 시 지체 없이 파기</li>
        </ul>

        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
          4. 개인정보의 파기 절차 및 방법
        </h2>
        <p style={{ marginBottom: '16px' }}>
          개인정보 파기의 절차 및 방법은 다음과 같습니다.
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
          <li><strong>파기 절차:</strong> 이용 목적이 달성된 개인정보는 별도의 DB로 옮겨져 관련 법령 또는 내부 방침에 따라 일정 기간 저장된 후 파기됩니다.</li>
          <li><strong>파기 방법:</strong> 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이 문서로 출력된 개인정보는 분쇄기로 분쇄하여 파기합니다.</li>
        </ul>

        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
          5. 이용자의 권리 및 그 행사 방법
        </h2>
        <p style={{ marginBottom: '16px' }}>
          이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지(동의철회)를 요청할 수 있습니다. 개인정보 조회/수정 및 가입해지는 마이페이지 또는 개인정보 보호책임자에게 서면, 전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다.
        </p>

        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
          6. 개인정보의 안전성 확보 조치
        </h2>
        <p style={{ marginBottom: '16px' }}>
          서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
          <li><strong>기술적 조치:</strong> Supabase를 활용한 비밀번호 암호화 저장, HTTPS 통신을 통한 전송 암호화, 데이터베이스 접근 제한(RLS 정책 적용)</li>
          <li><strong>관리적 조치:</strong> 개인정보 취급 직원의 최소화 및 보안 교육</li>
        </ul>

        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
          7. 개인정보 보호책임자 및 연락처
        </h2>
        <p style={{ marginBottom: '16px' }}>
          개인정보 처리에 관한 문의사항, 불만 처리, 피해 구제 등에 관한 사항은 아래의 개인정보 보호책임자 및 담당 부서로 연락해 주시기 바랍니다.
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyle: 'none' }}>
          <li><strong>개인정보 보호책임 부서:</strong> 운영 사무국</li>
          <li><strong>문의 메일:</strong> contact@ascentum.co.kr</li>
        </ul>

        <p style={{ marginTop: '32px', fontSize: '0.85rem', color: 'var(--color-ink-subtle)', textAlign: 'right' }}>
          시행일자: 2026년 5월 28일
        </p>
      </div>
    </div>
  );
}
