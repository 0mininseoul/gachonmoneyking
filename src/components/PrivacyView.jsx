import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export function PrivacyView() {
  const { locale } = useLanguage();
  const isKorean = locale === 'ko';

  return (
    <div className="app-container" style={{ maxWidth: '800px', margin: '40px auto' }}>
      <div className="linear-card" style={{ padding: '40px', lineHeight: '1.7', color: 'var(--color-ink-muted)' }}>
        {isKorean ? (
          <>
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
              <li><strong>카카오 로그인 연동 항목:</strong> 이름, 이메일 주소, 프로필 이미지 URL, 카카오 고유 ID</li>
              <li><strong>프로필 설정 필수 항목:</strong> 닉네임, 국적, 전화번호</li>
              <li><strong>서비스 이용 과정 중 수집 항목:</strong> 은행 잔고 증명 이미지(스크린샷) 및 분석된 자산 금액</li>
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
              <li><strong>이벤트 운영:</strong> 우수 자산가 대상 상품 발송, 추첨 이벤트(편의점 기프티콘 등) 당첨자 고지 및 리더보드 수상 안내 SMS 발송</li>
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
              7. 개인정보 보호책임 부서 및 연락처
            </h2>
            <p style={{ marginBottom: '16px' }}>
              개인정보 처리에 관한 문의사항, 불만 처리, 피해 구제 등에 관한 사항은 아래의 개인정보 보호 부서로 연락해 주시기 바랍니다.
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyle: 'none' }}>
              <li><strong>개인정보 보호책임 부서:</strong> 운영 사무국</li>
              <li><strong>문의 메일:</strong> contact@ascentum.co.kr</li>
            </ul>

            <p style={{ marginTop: '32px', fontSize: '0.85rem', color: 'var(--color-ink-subtle)', textAlign: 'right' }}>
              시행일자: 2026년 5월 28일
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '2rem', marginBottom: '24px', fontWeight: 600, color: 'var(--color-ink)', letterSpacing: '-0.5px' }}>
              Privacy Policy (개인정보처리방침)
            </h1>
            
            <p style={{ marginBottom: '16px' }}>
              Gachon Money King (hereinafter referred to as the 'Service', domain: https://gachonmoneyking.vercel.app) protects users' personal information and processes related complaints swiftly and safely, establishing and disclosing this Privacy Policy as follows.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              1. Items of Personal Information Collected and Collection Method
            </h2>
            <p style={{ marginBottom: '8px' }}>
              The Service collects the following minimum amount of personal information upon initial membership registration and Kakao account integration login.
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li><strong>Kakao Login Items:</strong> Name, Email Address, Profile Image URL, Kakao Unique ID</li>
              <li><strong>Mandatory Profile Setup Items:</strong> Nickname, Nationality, Phone Number</li>
              <li><strong>Items Collected During Service Use:</strong> Bank Balance Statement Image (Screenshot), and Analyzed Asset Amount</li>
              <li><strong>Collection Method:</strong> Registration form inputs, Kakao Simple Login API integration, Image upload interface</li>
            </ul>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              2. Purpose of Collection and Use of Personal Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Collected personal information is not used for purposes other than the following, and user consent will be obtained in advance if the purpose of use changes.
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li><strong>Member Management:</strong> Identity verification of Gachon University international students and prevention of duplicate registrations</li>
              <li><strong>Leaderboard Ranking:</strong> Review and verification of bank screenshots to grant asset ranking</li>
              <li><strong>Event Operation:</strong> Prize shipment for top asset holders, winner announcement of drawing events (e.g., convenience store coupons), and SMS notices for leaderboard awards</li>
              <li><strong>Service Improvement:</strong> Statistical analysis of multilingual usage and customer complaint resolution</li>
            </ul>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              3. Retention and Use Period of Personal Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              In principle, users' personal information is destroyed without delay once the purpose of collection and use is achieved. However, the following cases are exceptions.
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li><strong>Event and Ranking Aggregation:</strong> Retained until the end of the leaderboard event operation</li>
              <li><strong>User Withdrawal:</strong> Destroyed without delay upon receipt of account deletion request</li>
            </ul>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              4. Destruction Procedure and Method of Personal Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              The procedure and method of personal information destruction are as follows.
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li><strong>Procedure:</strong> Personal information that has achieved its purpose is moved to a separate database and stored for a certain period according to laws or internal policies before destruction.</li>
              <li><strong>Method:</strong> Personal information stored in electronic file format is deleted using technical methods that make records unrecoverable, and printed paper documents are shredded.</li>
            </ul>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              5. Users' Rights and How to Exercise Them
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Users can view or modify their registered personal information at any time, or request cancellation of membership (withdrawal of consent). View/modify or withdrawal requests can be resolved through My Page or by contacting the privacy department via mail or email.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              6. Safety Measures for Personal Information
            </h2>
            <p style={{ marginBottom: '16px' }}>
              The Service takes the following measures to secure personal information safety:
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li><strong>Technical Measures:</strong> Encrypted password storage using Supabase, transmission encryption via HTTPS, database access restriction (RLS policy applied)</li>
              <li><strong>Administrative Measures:</strong> Minimization of staff handling personal information and regular security training</li>
            </ul>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              7. Privacy Department and Contact Details
            </h2>
            <p style={{ marginBottom: '16px' }}>
              For inquiries regarding personal information processing, complaint handling, or damage relief, please contact the department below.
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyle: 'none' }}>
              <li><strong>Privacy Department:</strong> Operations Secretariat</li>
              <li><strong>Email:</strong> contact@ascentum.co.kr</li>
            </ul>

            <p style={{ marginTop: '32px', fontSize: '0.85rem', color: 'var(--color-ink-subtle)', textAlign: 'right' }}>
              Effective Date: May 28, 2026
            </p>
          </>
        )}
      </div>
    </div>
  );
}
