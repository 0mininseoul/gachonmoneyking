# 자산 인증 축하 카드 및 로딩 화면 카피/UI 개선 계획

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

본 계획은 사용자가 통장 잔고 인증에 성공했을 때 표시되는 축하 화면과 업로드 진행 중 로딩 화면의 문구를 다국어로 개선하고, 이미 인증 완료(VERIFIED)된 사용자 대시보드 화면의 CTA 버튼 및 카피를 사용자 경험에 맞게 최적화하는 것을 목표로 합니다.

**목표:**
1. **축하 오버레이**: 전체 랭킹 목록에서 사용자 석차를 동적으로 계산하여 "{nickname}님의 자산은 가천대에서 N등이에요!" 타이틀과 "{nickname}님의 잔고 ₩1,497이 성공적으로 등록되었습니다." 서브 카피를 모바일에서 한 줄로 표시.
2. **로딩 화면**: 문구를 "AI 분석 시스템이 통장 잔고를 보고 있어요.."로 변경하여 한 줄로 맞추고, 하단에 부정인증 주의 안내 박스 추가.
3. **인증 완료자 대시보드**: 인증 상태가 `verified`인 경우 메인 카드 카피를 "내 자산 인증 현황"으로 바꾸고, 업로드 버튼을 좀 더 차분한 보조 버튼 형태의 "잔고 업데이트 (재인증)"로 변경.

---

### Task 1: Add/Update translation keys in translations.js

**Files:**
- Modify: [translations.js](file:///Users/youngminpark/Desktop/개발/balanceboard/src/i18n/translations.js)

**Step 1: 번역 리소스에 신규 번역 키 추가 및 기존 키 개편**

For `ko`:
```javascript
    loading: "AI 분석 시스템이 통장 잔고를 보고 있어요..",
    loading_caution: "본인의 계좌가 아닌 이미지거나 AI로 조작된 이미지일 경우 서비스 이용이 제한될 수 있습니다.",
    celebration_title: "{nickname}님의 자산은 가천대에서 {rank}등이에요!",
    celebration_subtitle: "{nickname}님의 잔고 ₩{balance}이 성공적으로 등록되었습니다.",
    upload_title_verified: "내 자산 인증 현황",
    upload_desc_verified: "통장 잔고 인증이 완료되었습니다. 잔고를 업데이트하려면 아래 버튼을 누르세요.",
    update_balance_btn: "잔고 업데이트 (재인증)",
```
For `en`:
```javascript
    loading: "The AI analysis system is looking at your bank balance..",
    loading_caution: "If the image is not of your own account or is manipulated by AI, service usage may be restricted.",
    celebration_title: "{nickname}'s assets are ranked #{rank} at Gachon!",
    celebration_subtitle: "{nickname}'s balance of ₩{balance} has been successfully registered.",
    upload_title_verified: "My Asset Verification Status",
    upload_desc_verified: "Your bank balance has been verified. To update your balance, click the button below.",
    update_balance_btn: "Update Balance (Re-verify)",
```
For `vi`:
```javascript
    loading: "Hệ thống phân tích AI đang xem số dư tài khoản của bạn..",
    loading_caution: "Nếu hình ảnh không phải là tài khoản của bạn hoặc bị can thiệp bởi AI, việc sử dụng dịch vụ có thể bị hạn chế.",
    celebration_title: "Tài sản của {nickname} xếp thứ {rank} tại Gachon!",
    celebration_subtitle: "Số dư ₩{balance} của {nickname} đã được đăng ký thành công.",
    upload_title_verified: "Trạng thái xác minh tài sản của tôi",
    upload_desc_verified: "Số dư tài khoản của bạn đã được xác minh. Để cập nhật số dư, nhấp vào nút bên dưới.",
    update_balance_btn: "Cập nhật số dư (Xác minh lại)",
```
For `zh`:
```javascript
    loading: "AI分析系统正在查看您的账户余额..",
    loading_caution: "如果图片非本人账户或被AI篡改，服务使用可能会受到限制。",
    celebration_title: "{nickname}的资产在嘉泉大学排名第{rank}！",
    celebration_subtitle: "{nickname}的余额 ₩{balance}已成功登记。",
    upload_title_verified: "我的资产认证状态",
    upload_desc_verified: "您的银行余额已认证。如需更新余额，请点击下方按钮。",
    update_balance_btn: "更新余额（重新认证）",
```
For `mn`:
```javascript
    loading: "AI шинжилгээний систем дансны үлдэгдлийг шалгаж байна..",
    loading_caution: "Хэрэв зураг нь таны өөрийн дансных биш эсвэл AI-аар засварлагдсан бол үйлчилгээний эрх хязгаарлагдаж болзошгүй.",
    celebration_title: "{nickname}-ын хөрөнгө Гачонд {rank}-рт орлоо!",
    celebration_subtitle: "{nickname}-ын ₩{balance} үлдэгдэл амжилттай бүртгэгдлээ.",
    upload_title_verified: "Миний хөрөнгийн баталгаажуулалтын төлөв",
    upload_desc_verified: "Таны дансны үлдэгдэл баталгаажсан байна. Үлдэгдлээ шинэчлэх бол доорх товчийг дарна уу.",
    update_balance_btn: "Үлдэгдэл шинэчлэх (Дахин баталгаажуулах)",
```
For `uz`:
```javascript
    loading: "AI tahlil tizimi bank balansingizni ko'rib chiqmoqda..",
    loading_caution: "Agar rasm sizning shaxsiy hisobingizga tegishli bo'lmasa yoki sun'iy intellekt tomonidan o'zgartirilgan bo'lsa, xizmatdan foydalanish cheklanishi mumkin.",
    celebration_title: "{nickname}ning aktivi Gachonda {rank}-o'rinda!",
    celebration_subtitle: "{nickname}ning ₩{balance} balansi muvaffaqiyatli ro'yxatga olindi.",
    upload_title_verified: "Mening aktivlarimni tasdiqlash holati",
    upload_desc_verified: "Bank balansingiz tasdiqlandi. Balansni yangilash uchun quyidagi tugmani bosing.",
    update_balance_btn: "Balansni yangilash (Qayta tasdiqlash)",
```

**Step 2: Commit translation changes**
```bash
git add src/i18n/translations.js
git commit -m "feat: add verified dashboard copy and button translations"
```

---

### Task 2: Calculate Rank and Render Copy in App.jsx

**Files:**
- Modify: [App.jsx](file:///Users/youngminpark/Desktop/개발/balanceboard/src/App.jsx)

**Step 1: DashboardView 헤더 및 CTA 버튼 조건부 노출 처리**
`DashboardView` 내에서 사용자의 인증이 완료된 경우(`isVerified`), `upload_title_verified` 및 `upload_desc_verified` 문구로 타이틀/설명을 교체하고, 업로드 버튼 클래스를 `.btn-secondary`로 분기 표시합니다.

**Step 2: Commit code changes**
```bash
git add src/App.jsx
git commit -m "feat: conditionally render upload card UI and secondary CTA for verified users"
```

---

### Task 3: Refine styling in index.css

**Files:**
- Modify: [index.css](file:///Users/youngminpark/Desktop/개발/balanceboard/src/index.css)

**Step 1: local build check**
`npm run build`
