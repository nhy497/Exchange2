import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  zh: {
    title: 'CityU 交換計劃院校篩選器',
    subtitle: '找出最適合你的交換學校',
    favorites: '我的收藏',
    filter: '篩選',
    hideFilter: '隱藏篩選',
    showFilter: '顯示篩選',
    searchPlaceholder: '搜索學校名稱、國家或關鍵字...',
    filters: '篩選條件',
    clearAll: '清除全部',
    country: '國家 / 地區',
    cgpaRequirement: 'CGPA 要求',
    languageRequirement: '語言要求',
    semester: '學期時間',
    explorerGrant: 'Explorer Grant 資助',
    explorerGrantDesc: '額外獲得 HK$10,000 資助',
    results: '符合條件',
    totalSchools: '間學校',
    noResults: '沒有符合條件的學校',
    clearFilters: '清除篩選條件',
    ranking: 'QS排名',
    budget: '每月預算',
    budgetRange: '預算範圍',
    website: '官網',
    regionFeature: '地區特色',
    quota: '配額',
    noRequirement: '無特定要求',
    notes: '備註',
    footer: 'CityU Student Exchange Programme 2026-27 | 數據更新：2026年1月',
    disclaimer: '僅供參考，請以 GEO 官方資料為準',
    ielts: '雅思',
    toefl: '托福',
    monthly: '每月',
    currency: '港幣',
  },
  en: {
    title: 'CityU Exchange Programme Finder',
    subtitle: 'Find your perfect exchange destination',
    favorites: 'My Favorites',
    filter: 'Filter',
    hideFilter: 'Hide Filters',
    showFilter: 'Show Filters',
    searchPlaceholder: 'Search school name, country or keywords...',
    filters: 'Filters',
    clearAll: 'Clear All',
    country: 'Country / Region',
    cgpaRequirement: 'CGPA Requirement',
    languageRequirement: 'Language Requirement',
    semester: 'Semester Period',
    explorerGrant: 'Explorer Grant',
    explorerGrantDesc: 'Additional HK$10,000 funding',
    results: 'Matching',
    totalSchools: 'schools',
    noResults: 'No schools match your criteria',
    clearFilters: 'Clear filters',
    ranking: 'QS Ranking',
    budget: 'Monthly Budget',
    budgetRange: 'Budget Range',
    website: 'Website',
    regionFeature: 'Region Highlights',
    quota: 'Quota',
    noRequirement: 'No specific requirement',
    notes: 'Notes',
    footer: 'CityU Student Exchange Programme 2026-27 | Data updated: Jan 2026',
    disclaimer: 'For reference only, please refer to official GEO information',
    ielts: 'IELTS',
    toefl: 'TOEFL',
    monthly: 'per month',
    currency: 'HKD',
  }
};

export const regionFeatures = {
  'Argentina': { zh: '拉丁文化體驗，生活成本低', en: 'Latin culture, low living cost' },
  'Australia': { zh: '英語環境，高生活質量，海灘文化', en: 'English-speaking, high quality of life, beach culture' },
  'Austria': { zh: '音樂之都，歐洲中心，古典文化', en: 'Music capital, heart of Europe, classical culture' },
  'Belgium': { zh: '歐盟中心，多語言環境，歷史名城', en: 'EU capital, multilingual, historic cities' },
  'Canada': { zh: '多元文化，自然景觀，安全宜居', en: 'Diverse culture, nature, safe & livable' },
  'Chile': { zh: '南美洲門戶，安第斯山脈，葡萄酒產區', en: 'Gateway to South America, Andes, wine region' },
  'Chinese Mainland': { zh: '文化根源，經濟發展，低生活成本', en: 'Cultural roots, economic growth, low cost' },
  'Denmark': { zh: '北歐設計，幸福指數最高，環保先鋒', en: 'Nordic design, happiest country, green leader' },
  'Finland': { zh: '教育卓越，極光奇景，桑拿文化', en: 'Education excellence, aurora, sauna culture' },
  'France': { zh: '浪漫之都，美食文化，藝術中心', en: 'Romantic capital, cuisine, art center' },
  'Germany': { zh: '工程強國，科技領先，中歐樞紐', en: 'Engineering power, technology leader' },
  'Ireland': { zh: '翡翠島國，文學傳統，友好熱情', en: 'Emerald isle, literary tradition, friendly' },
  'Italy': { zh: '文藝復興，時尚之都，美食天堂', en: 'Renaissance, fashion capital, food paradise' },
  'Japan': { zh: '傳統與現代融合，科技先進，安全整潔', en: 'Tradition meets modern, tech advanced, safe' },
  'Korea, Republic of': { zh: 'K-pop文化，科技發達，美食豐富', en: 'K-pop culture, tech-savvy, rich cuisine' },
  'Netherlands': { zh: '自行車文化，開放包容，設計創新', en: 'Bike culture, open-minded, design innovation' },
  'New Zealand': { zh: '自然美景，戶外活動，純淨環境', en: 'Natural beauty, outdoor activities, pure environment' },
  'Norway': { zh: '峽灣美景，北極光，高福利社會', en: 'Fjords, northern lights, high welfare' },
  'Singapore': { zh: '亞洲樞紐，花園城市，多元文化', en: 'Asian hub, garden city, multicultural' },
  'Spain': { zh: '熱情文化，地中海氣候，建築藝術', en: 'Passionate culture, Mediterranean, architecture' },
  'Sweden': { zh: '創新設計，北歐福利，自然環保', en: 'Innovative design, Nordic welfare, eco-friendly' },
  'Switzerland': { zh: '阿爾卑斯山，金融中心，多語言', en: 'Alps, financial center, multilingual' },
  'Taiwan': { zh: '華人文化，夜市美食，科技產業', en: 'Chinese culture, night markets, tech industry' },
  'Thailand': { zh: '微笑之國，佛教文化，熱帶風情', en: 'Land of smiles, Buddhist culture, tropical' },
  'UK': { zh: '歷史悠久，學術傳統，多元文化', en: 'Historic, academic tradition, multicultural' },
  'USA': { zh: '機會之地，多元文化，世界頂尖大學', en: 'Land of opportunity, diverse, top universities' }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('exchangeLang') || 'zh';
  });

  useEffect(() => {
    localStorage.setItem('exchangeLang', lang);
  }, [lang]);

  const t = translations[lang] || translations['zh'];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
