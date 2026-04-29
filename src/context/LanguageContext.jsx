import { createContext, useContext, useEffect } from 'react'

const translations = {
  en: {
    // Navigation
    home: 'Home',
    discover: 'Discover',
    saved: 'Saved',
    account: 'Account',
    login: 'Log In',
    back: 'Back',
    beta: 'beta',
    tagline: 'What parents are actually saying.',
    // Home
    searchPlaceholder: 'Search products, brands...',
    allProducts: 'All {n} products',
    nOfTotal: '{n} of {total} products',
    rankedByMentions: 'ranked by mentions',
    failedToLoad: 'Failed to load products. Check your Supabase connection.',
    noProductsMatch: 'No products match your filters',
    tryAdjusting: 'Try adjusting or clearing your filters',
    // Discover
    browseByCategoryOrTrending: "Browse by category or see what's trending",
    browseByCategory: 'Browse by Category',
    trendingNow: 'Trending Now',
    top4: '🔥 Top 4',
    // Saved
    savedProducts: 'Saved Products',
    loginToSave: 'Log in to save products',
    createAccountToSave: 'Create an account to save your favorite baby products and access them anywhere.',
    logInOrSignUp: 'Log In or Sign Up',
    noSavedYet: 'No saved products yet',
    tapHeartToSave: 'Tap the heart icon on any product to save it here.',
    browseProducts: 'Browse Products',
    itemSaved: 'item saved',
    itemsSaved: 'items saved',
    // Account
    myAccount: 'My Account',
    logOut: 'Log out',
    memberSince: 'Member since',
    settings: 'Settings',
    changePassword: 'Change Password',
    deleteAccount: 'Delete Account',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    passwordsDoNotMatch: 'Passwords do not match.',
    passwordMinLength: 'Password must be at least 6 characters.',
    passwordUpdated: '✅ Password updated!',
    cancel: 'Cancel',
    update: 'Update',
    updating: 'Updating...',
    deleteAccountConfirm: 'This will permanently delete your account and all saved data. Type',
    toConfirm: 'to confirm.',
    typeDeleteToConfirm: 'Type DELETE to confirm',
    delete: 'Delete',
    deleting: 'Deleting...',
    browseProductsLink: 'Browse products',
    // Auth
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    minSixChars: 'Minimum 6 characters',
    loggingIn: 'Logging in...',
    creatingAccount: 'Creating account...',
    createAccount: 'Create Account',
    checkYourEmail: 'Check your email for a verification link. Once verified, you can log in.',
    // Product Detail
    loadingProduct: 'Loading product...',
    productNotFound: 'Product not found.',
    backToHome: 'Back to Home',
    save: 'Save',
    savedLabel: 'Saved',
    loginToSaveShort: 'Log in to save',
    communityMentions: 'community mentions',
    communityVerdict: 'Community Verdict',
    pros: 'Pros',
    cons: 'Cons',
    bestFor: 'Best For',
    mentionsBySource: 'Mentions by Source',
    recallHistory: 'Recall History',
    activeRecall: 'ACTIVE RECALL',
    reason: 'Reason',
    requiredAction: 'Required Action',
    recallSource: 'Source: CPSC recall database. Always verify with the manufacturer for the most current status.',
    noRecalls: 'No recalls on record for this product.',
    // Live Mentions
    liveMentions: 'Live Mentions',
    reddit: 'Reddit',
    youtube: 'YouTube',
    newest: 'Newest',
    mostViewed: 'Most Viewed',
    mostViewedIn6M: 'Most Viewed in 6M',
    mostUpvoted: 'Most Upvoted',
    mostUpvotedIn6M: 'Most Upvoted in 6M',
    noResults: 'No results found.',
    couldNotLoad: 'Could not load results:',
    addYouTubeKey: 'Add your YouTube API key to .env to see videos.',
    comments: 'comments',
    // Filter Panel
    filters: 'Filters',
    clearAll: 'Clear all',
    source: 'Source',
    category: 'Category',
    ageRange: 'Age Range',
    maxPrice: 'Max Price',
    any: 'Any',
    hideRecalledProducts: 'Hide recalled products',
    onlyShowNoRecall: 'Only show products with no recall history',
    // Settings
    language: 'Language',
    notifications: 'Notifications',
    about: 'About',
    version: 'Version',
    disclaimer: 'Disclaimer',
    english: 'English',
    korean: '한국어',
    emailNotifications: 'Email Notifications',
    emailNotificationsDesc: 'Get notified when products you saved have updates, recalls, or price changes.',
    loginToEnableNotifications: 'Log in to enable notifications',
    notificationsSaved: 'Saved',
    aboutText: 'MumSaid helps parents find the best baby products by aggregating reviews and mentions from Reddit, YouTube, BabyGearLab, Consumer Reports, and more — all in one place.',
    disclaimerText: 'MumSaid aggregates publicly available reviews and mentions. We are not affiliated with any brand. Product recalls shown are from public sources and may not be exhaustive — always check the manufacturer\'s website for the latest safety information. Prices and ratings are approximations.',
    // Categories
    cat_Strollers: 'Strollers',
    cat_CarSeats: 'Car Seats',
    cat_Carriers: 'Carriers',
    cat_Feeding: 'Feeding',
    cat_Monitors: 'Monitors',
    cat_NurserySleep: 'Nursery & Sleep',
    cat_GearTravel: 'Gear & Travel',
    cat_ToysPlay: 'Toys & Play',
    cat_BathPotty: 'Bath & Potty',
    cat_HealthSafety: 'Health & Safety',
    // Category descriptions
    desc_Strollers: 'Full-size, lightweight & travel',
    desc_CarSeats: 'Infant, convertible & booster',
    desc_Carriers: 'Soft-structured & wraps',
    desc_Feeding: 'Bottles, pumps & nursing',
    desc_Monitors: 'Video, audio & wearable',
    desc_NurserySleep: 'Cribs, bedding & swaddles',
    desc_GearTravel: 'Bags, bouncers & on-the-go',
    desc_ToysPlay: 'Infant, toddler & learning',
    desc_BathPotty: 'Tubs, care & potty training',
    desc_HealthSafety: 'Thermometers, gates & more',
    // Price tiers
    tier_Budget: 'Budget',
    tier_Mid: 'Mid',
    tier_Premium: 'Premium',
    mentions: 'mentions',
  },
  ko: {
    // Navigation
    home: '홈',
    discover: '둘러보기',
    saved: '저장됨',
    account: '계정',
    login: '로그인',
    back: '뒤로',
    beta: '베타',
    tagline: '믿을 수 있는 유아 제품 가이드',
    // Home
    searchPlaceholder: '제품, 브랜드 검색...',
    allProducts: '전체 {n}개 제품',
    nOfTotal: '{total}개 중 {n}개 제품',
    rankedByMentions: '언급 횟수 순',
    failedToLoad: '제품을 불러오지 못했습니다. Supabase 연결을 확인하세요.',
    noProductsMatch: '필터와 일치하는 제품이 없습니다',
    tryAdjusting: '필터를 조정하거나 초기화해 보세요',
    // Discover
    browseByCategoryOrTrending: '카테고리로 둘러보거나 인기 제품을 확인하세요',
    browseByCategory: '카테고리로 둘러보기',
    trendingNow: '인기 제품',
    top4: '🔥 상위 4개',
    // Saved
    savedProducts: '저장된 제품',
    loginToSave: '제품을 저장하려면 로그인하세요',
    createAccountToSave: '계정을 만들어 좋아하는 유아 제품을 저장하고 어디서든 확인하세요.',
    logInOrSignUp: '로그인 또는 가입',
    noSavedYet: '저장된 제품이 없습니다',
    tapHeartToSave: '제품의 하트 아이콘을 눌러 여기에 저장하세요.',
    browseProducts: '제품 둘러보기',
    itemSaved: '개 저장됨',
    itemsSaved: '개 저장됨',
    // Account
    myAccount: '내 계정',
    logOut: '로그아웃',
    memberSince: '가입일',
    settings: '설정',
    changePassword: '비밀번호 변경',
    deleteAccount: '계정 삭제',
    newPassword: '새 비밀번호',
    confirmNewPassword: '새 비밀번호 확인',
    passwordsDoNotMatch: '비밀번호가 일치하지 않습니다.',
    passwordMinLength: '비밀번호는 6자 이상이어야 합니다.',
    passwordUpdated: '✅ 비밀번호가 변경되었습니다!',
    cancel: '취소',
    update: '변경',
    updating: '변경 중...',
    deleteAccountConfirm: '계정과 모든 저장 데이터가 영구적으로 삭제됩니다.',
    toConfirm: '을(를) 입력하여 확인하세요.',
    typeDeleteToConfirm: 'DELETE를 입력하여 확인',
    delete: '삭제',
    deleting: '삭제 중...',
    browseProductsLink: '제품 둘러보기',
    // Auth
    signUp: '가입',
    email: '이메일',
    password: '비밀번호',
    minSixChars: '6자 이상',
    loggingIn: '로그인 중...',
    creatingAccount: '계정 생성 중...',
    createAccount: '계정 만들기',
    checkYourEmail: '인증 링크를 이메일에서 확인하세요. 인증 후 로그인할 수 있습니다.',
    // Product Detail
    loadingProduct: '제품 로딩 중...',
    productNotFound: '제품을 찾을 수 없습니다.',
    backToHome: '홈으로',
    save: '저장',
    savedLabel: '저장됨',
    loginToSaveShort: '저장하려면 로그인',
    communityMentions: '커뮤니티 언급',
    communityVerdict: '커뮤니티 평가',
    pros: '장점',
    cons: '단점',
    bestFor: '추천 대상',
    mentionsBySource: '출처별 언급',
    recallHistory: '리콜 기록',
    activeRecall: '진행 중인 리콜',
    reason: '사유',
    requiredAction: '필요한 조치',
    recallSource: '출처: CPSC 리콜 데이터베이스. 최신 상태는 제조사에서 확인하세요.',
    noRecalls: '이 제품에 대한 리콜 기록이 없습니다.',
    // Live Mentions
    liveMentions: '실시간 언급',
    reddit: 'Reddit',
    youtube: 'YouTube',
    newest: '최신순',
    mostViewed: '조회수순',
    mostViewedIn6M: '6개월 조회수순',
    mostUpvoted: '추천순',
    mostUpvotedIn6M: '6개월 추천순',
    noResults: '검색 결과가 없습니다.',
    couldNotLoad: '결과를 불러올 수 없습니다:',
    addYouTubeKey: '.env에 YouTube API 키를 추가하세요.',
    comments: '댓글',
    // Filter Panel
    filters: '필터',
    clearAll: '전체 초기화',
    source: '출처',
    category: '카테고리',
    ageRange: '연령대',
    maxPrice: '최대 가격',
    any: '전체',
    hideRecalledProducts: '리콜된 제품 숨기기',
    onlyShowNoRecall: '리콜 기록이 없는 제품만 표시',
    // Settings
    language: '언어',
    notifications: '알림',
    about: '앱 정보',
    version: '버전',
    disclaimer: '면책 조항',
    english: 'English',
    korean: '한국어',
    emailNotifications: '이메일 알림',
    emailNotificationsDesc: '저장한 제품의 업데이트, 리콜 또는 가격 변동 시 알림을 받습니다.',
    loginToEnableNotifications: '알림을 활성화하려면 로그인하세요',
    notificationsSaved: '저장됨',
    aboutText: 'MumSaid는 Reddit, YouTube, BabyGearLab, Consumer Reports 등의 리뷰와 언급을 한곳에 모아 부모님들이 최고의 유아 제품을 찾을 수 있도록 도와드립니다.',
    disclaimerText: 'MumSaid는 공개적으로 이용 가능한 리뷰와 언급을 집계합니다. 저희는 어떤 브랜드와도 제휴 관계가 아닙니다. 표시된 제품 리콜은 공개 출처에서 가져온 것이며 완전하지 않을 수 있습니다. 최신 안전 정보는 항상 제조업체 웹사이트에서 확인하세요. 가격 및 평점은 근사치입니다.',
    // Categories
    cat_Strollers: '유모차',
    cat_CarSeats: '카시트',
    cat_Carriers: '아기띠',
    cat_Feeding: '수유용품',
    cat_Monitors: '베이비모니터',
    cat_NurserySleep: '침구 & 수면',
    cat_GearTravel: '외출 & 여행',
    cat_ToysPlay: '장난감 & 놀이',
    cat_BathPotty: '목욕 & 배변',
    cat_HealthSafety: '건강 & 안전',
    // Category descriptions
    desc_Strollers: '풀사이즈, 경량, 여행용',
    desc_CarSeats: '영아, 컨버터블, 부스터',
    desc_Carriers: '구조형 & 랩',
    desc_Feeding: '젖병, 유축기, 수유용품',
    desc_Monitors: '영상, 음성, 웨어러블',
    desc_NurserySleep: '아기침대, 침구, 속싸개',
    desc_GearTravel: '가방, 바운서, 이동용품',
    desc_ToysPlay: '영아, 유아, 학습용',
    desc_BathPotty: '욕조, 케어, 배변훈련',
    desc_HealthSafety: '체온계, 안전문 등',
    // Price tiers
    tier_Budget: '저가형',
    tier_Mid: '중가형',
    tier_Premium: '프리미엄',
    mentions: '언급',
  },
}

const CATEGORY_KEY_MAP = {
  'Strollers': 'cat_Strollers',
  'Car Seats': 'cat_CarSeats',
  'Carriers': 'cat_Carriers',
  'Feeding': 'cat_Feeding',
  'Monitors': 'cat_Monitors',
  'Nursery & Sleep': 'cat_NurserySleep',
  'Gear & Travel': 'cat_GearTravel',
  'Toys & Play': 'cat_ToysPlay',
  'Bath & Potty': 'cat_BathPotty',
  'Health & Safety': 'cat_HealthSafety',
}

const DESC_KEY_MAP = {
  'Strollers': 'desc_Strollers',
  'Car Seats': 'desc_CarSeats',
  'Carriers': 'desc_Carriers',
  'Feeding': 'desc_Feeding',
  'Monitors': 'desc_Monitors',
  'Nursery & Sleep': 'desc_NurserySleep',
  'Gear & Travel': 'desc_GearTravel',
  'Toys & Play': 'desc_ToysPlay',
  'Bath & Potty': 'desc_BathPotty',
  'Health & Safety': 'desc_HealthSafety',
}

const TIER_KEY_MAP = {
  'Budget': 'tier_Budget',
  'Mid': 'tier_Mid',
  'Premium': 'tier_Premium',
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  // Language toggle removed — app is English only.
  const lang = 'en'

  useEffect(() => {
    document.documentElement.lang = 'en'
    // Clean up any previously-saved language preference
    localStorage.removeItem('mumsaid_language')
  }, [])

  function setLang() { /* no-op */ }

  function t(key, vars) {
    let str = translations[lang]?.[key] ?? translations.en[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, v)
      }
    }
    return str
  }

  // Translate a category value (stored in DB as English) to current language
  function tCategory(cat) {
    const key = CATEGORY_KEY_MAP[cat]
    return key ? t(key) : cat
  }

  function tCategoryDesc(cat) {
    const key = DESC_KEY_MAP[cat]
    return key ? t(key) : ''
  }

  function tTier(tier) {
    const key = TIER_KEY_MAP[tier]
    return key ? t(key) : tier
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tCategory, tCategoryDesc, tTier }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
