import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export function TermsView() {
  const { locale } = useLanguage();
  const isKorean = locale === 'ko';

  return (
    <div className="app-container" style={{ maxWidth: '800px', margin: '40px auto' }}>
      <div className="linear-card" style={{ padding: '40px', lineHeight: '1.7', color: 'var(--color-ink-muted)' }}>
        {isKorean ? (
          <>
            <h1 style={{ fontSize: '2rem', marginBottom: '24px', fontWeight: 600, color: 'var(--color-ink)', letterSpacing: '-0.5px' }}>
              서비스 이용약관 (Terms of Service)
            </h1>
            
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              제 1 조 (목적)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              본 약관은 Gachon Money King 서비스(이하 '서비스', 도메인: https://gachonmoneyking.vercel.app)가 제공하는 모든 서비스의 이용 조건 및 절차, 이용자와 서비스의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              제 2 조 (용어의 정의)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li><strong>서비스:</strong> Gachon Money King 어플리케이션을 의미합니다.</li>
              <li><strong>이용자:</strong> 서비스에 접속하여 본 약관에 동의하고 서비스를 이용하는 회원(가천대학교 유학생 등)을 의미합니다.</li>
              <li><strong>인증 스크린샷:</strong> 통장 잔고를 증명하기 위해 이용자가 제출하는 모바일 뱅킹 화면 캡처 이미지를 의미합니다.</li>
            </ul>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              제 3 조 (이용계약의 성립 및 정보 제공)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. 이용계약은 이용자가 본 약관 및 개인정보처리방침에 동의한 후 카카오 계정을 통한 소셜 로그인을 완료하거나 회원가입 절차를 진행함으로써 성립됩니다.<br />
              2. 이용자는 카카오 로그인 후 프로필 설정 단계에서 닉네임, 국적, 전화번호를 필수 항목으로 제공하여야 정상적인 리더보드 랭킹 참여 및 혜택 수령이 가능합니다.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              제 4 조 (잔고 인증 및 리더보드 이용)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. 이용자는 모바일 뱅킹 서비스(토스, 카카오뱅크 등)의 실제 잔고 화면 스크린샷을 업로드하여 자산 검증을 요청합니다.<br />
              2. 인공지능(AI) OCR 시스템과 관리자 검수를 거쳐 검증이 완료된 금액만이 리더보드 순위표에 정식 등록 및 공개됩니다.<br />
              3. 로그인하지 않은 제3자는 리더보드 내 다른 이용자의 구체적인 자산 금액을 조회할 수 없도록 마스킹 처리됩니다.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              제 5 조 (부정 행위의 제한)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. 타인의 자산 화면이나 위조/변조된 통장 잔고 캡처 이미지(포토샵 합성 등)를 업로드하는 행위는 엄격히 금지됩니다.<br />
              2. 부정 행위가 적발되거나 의심되는 경우, 서비스 운영자는 사전 통지 없이 다음과 같은 제재 조치를 취할 수 있습니다.
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li>리더보드 랭킹에서 즉시 제외 및 등록된 자산 정보 무효화</li>
              <li>서비스 이용 정지 및 카카오 로그인 연동 강제 해제</li>
              <li>이벤트 경품 당첨 자격 취소 및 기 지급된 경품 회수</li>
            </ul>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              제 6 조 (이벤트 운영 및 상품 발송)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. 리더보드 활성화를 위한 이벤트의 당첨자 선정 기준(순위권 및 추첨 20명 등)은 서비스 화면에 고지된 규정을 따릅니다.<br />
              2. 당첨자에게 경품(편의점 기프티콘 등)을 발송하거나 리더보드 수상 안내 문자를 보내기 위해 프로필 설정에서 수집된 전화번호를 사용하며, 이를 거부하거나 번호가 불명확한 경우 당첨 또는 수상 안내가 제한될 수 있습니다.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              제 7 조 (서비스의 중단 및 약관 변경)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. 서비스는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.<br />
              2. 약관이 개정되는 경우 개정된 약관의 적용일자 및 개정사유를 서비스 초기 화면에 고지합니다.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              제 8 조 (준거법 및 관할법원)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              본 약관의 해석 및 이용자와 서비스 간의 분쟁에 대하여는 대한민국 법률을 준거법으로 하며, 분쟁 해결을 위한 관할 법원은 민사소송법에 따릅니다.
            </p>

            <p style={{ marginTop: '32px', fontSize: '0.85rem', color: 'var(--color-ink-subtle)', textAlign: 'right' }}>
              시행일자: 2026년 5월 28일
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '2rem', marginBottom: '24px', fontWeight: 600, color: 'var(--color-ink)', letterSpacing: '-0.5px' }}>
              Terms of Service (서비스 이용약관)
            </h1>
            
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              Article 1 (Purpose)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              These Terms and Conditions regulate the terms of use, procedures, rights, duties, and responsibilities between users and the Gachon Money King service (hereinafter referred to as the 'Service', domain: https://gachonmoneyking.vercel.app).
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              Article 2 (Definitions)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              The definitions of the terms used in these Terms are as follows:
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li><strong>Service:</strong> Refers to the Gachon Money King web application.</li>
              <li><strong>User:</strong> Refers to a registered member (Gachon University international students, etc.) who accesses the service, agrees to these Terms, and uses the service.</li>
              <li><strong>Verification Screenshot:</strong> Refers to the mobile banking app capture image uploaded by the user to prove bank balance.</li>
            </ul>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              Article 3 (Formation of Contract and Provision of Information)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. The contract of use is established when a user agrees to these Terms and the Privacy Policy and completes social login through a Kakao account or proceeds with the sign-up form.<br />
              2. After Kakao login, users must provide nickname, nationality, and phone number during profile setup to participate in the leaderboard ranking and receive benefits.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              Article 4 (Balance Verification and Leaderboard Use)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. Users upload bank statement screenshots of their mobile banking services (Toss, KakaoBank, etc.) to request balance verification.<br />
              2. Only amounts verified through the artificial intelligence (AI) OCR system and administrator inspection will be registered and publicly displayed on the leaderboard ranking.<br />
              3. Unauthenticated third parties cannot view specific asset amounts of other users; balances will appear masked.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              Article 5 (Restrictions on Abusive Behavior)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. Uploading other people's asset screens or forged/modified balance images (e.g., Photoshop edit) is strictly prohibited.<br />
              2. If abusive behavior is detected or suspected, the service operator may take the following actions without prior notice:
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
              <li>Immediate exclusion from the leaderboard ranking and invalidation of registered assets</li>
              <li>Service suspension and forced disconnection of Kakao login</li>
              <li>Cancellation of drawing eligibility and recovery of already delivered prizes</li>
            </ul>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              Article 6 (Event Operations and Prize Shipment)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. Criteria for selecting event winners (e.g., top ranks and 20 raffle winners) follow the rules announced on the service screens.<br />
              2. The phone number collected during profile setup is used to send prizes (e.g., mobile coupons) and leaderboard award SMS notices. If the number is invalid or delivery is refused, prize or award notification may be limited.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              Article 7 (Suspension of Service and Terms Amendment)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              1. The Service may change or suspend all or part of its services due to operational or technical requirements.<br />
              2. In case of amendment, revised Terms will be posted on the main screen of the service with effective dates and reasons for changes.
            </p>

            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-ink)', marginTop: '24px', marginBottom: '12px', fontWeight: 500 }}>
              Article 8 (Governing Law and Jurisdiction)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              The interpretation of these Terms and disputes between users and the Service shall be governed by the laws of the Republic of Korea, and the competent court shall be determined in accordance with the Civil Procedure Act.
            </p>

            <p style={{ marginTop: '32px', fontSize: '0.85rem', color: 'var(--color-ink-subtle)', textAlign: 'right' }}>
              Effective Date: May 28, 2026
            </p>
          </>
        )}
      </div>
    </div>
  );
}
