import { createContext, useContext, useState, useEffect } from 'react'

const translations = {
  en: {
    // Navigation
    home: 'Home',
    discover: 'Discover',
    saved: 'Saved',
    account: 'Account',
    login: 'Log In',
    // Settings
    settings: 'Settings',
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
    aboutText: 'BabyLens helps parents find the best baby products by aggregating reviews and mentions from Reddit, YouTube, BabyGearLab, Consumer Reports, and more — all in one place.',
    disclaimerText: 'BabyLens aggregates publicly available reviews and mentions. We are not affiliated with any brand. Product recalls shown are from public sources and may not be exhaustive — always check the manufacturer\'s website for the latest safety information. Prices and ratings are approximations.',
    back: 'Back',
  },
  ko: {
    // Navigation
    home: '홈',
    discover: '둘러보기',
    saved: '저장됨',
    account: '계정',
    login: '로그인',
    // Settings
    settings: '설정',
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
    aboutText: 'BabyLens는 Reddit, YouTube, BabyGearLab, Consumer Reports 등의 리뷰와 언급을 한곳에 모아 부모님들이 최고의 유아 제품을 찾을 수 있도록 도와드립니다.',
    disclaimerText: 'BabyLens는 공개적으로 이용 가능한 리뷰와 언급을 집계합니다. 저희는 어떤 브랜드와도 제휴 관계가 아닙니다. 표시된 제품 리콜은 공개 출처에서 가져온 것이며 완전하지 않을 수 있습니다. 최신 안전 정보는 항상 제조업체 웹사이트에서 확인하세요. 가격 및 평점은 근사치입니다.',
    back: '뒤로',
  },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('babylens_language') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('babylens_language', lang)
  }, [lang])

  function setLang(next) {
    setLangState(next)
  }

  function t(key) {
    return translations[lang]?.[key] || translations.en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
