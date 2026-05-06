import React, { useState, useMemo, useEffect } from 'react';
import { Heart, MapPin, Calendar, Award, GraduationCap, Globe, Filter, X, Star, BookOpen, DollarSign, ExternalLink, TrendingUp, Info, Languages, Building2, Lightbulb, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Scale, Loader2 } from 'lucide-react';
import { LanguageProvider, useLanguage } from './LanguageContext';

// 載入學校數據
function useSchoolsData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 [DEBUG] 開始載入學校數據...');
    
    // 從 GitHub Pages 載入（更穩定）
    const rawGitHubUrl = 'https://nhy497.github.io/Exchange2/data/schools_complete.json';
    console.log('🔍 [DEBUG] 完整URL:', rawGitHubUrl);
    
    fetch(rawGitHubUrl)
      .then(res => {
        console.log('🔍 [DEBUG] Fetch response:', res);
        console.log('🔍 [DEBUG] Response status:', res.status);
        console.log('🔍 [DEBUG] Response ok:', res.ok);
        
        if (!res.ok) {
          const errorText = `HTTP ${res.status}: ${res.statusText}`;
          console.error('❌ [ERROR] Failed to load schools data:', errorText);
          throw new Error(errorText);
        }
        return res.json();
      })
      .then(json => {
        console.log('✅ [SUCCESS] 學校數據載入成功，總數:', json?.schools?.length || 0);
        let schoolsArray = json.schools || json;
        // 確保數據是數組
        if (!Array.isArray(schoolsArray)) {
          console.error('❌ [ERROR] 數據格式錯誤，期望數組但收到:', typeof schoolsArray);
          schoolsArray = [];
        }
        console.log('🔍 [DEBUG] 實際使用的數據:', schoolsArray);
        setData(schoolsArray);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ [ERROR] 載入學校數據時發生錯誤:', err);
        console.error('❌ [ERROR] 錯誤堆疊:', err.stack);
        setError(err.message);
        setLoading(false);
        
        const errorInfo = {
          timestamp: new Date().toISOString(),
          error: err.message,
          stack: err.stack,
          requestUrl: rawGitHubUrl,
          userAgent: navigator.userAgent
        };
        
        console.log('📋 [DEBUG] 完整錯誤信息:', errorInfo);
        window.lastError = errorInfo;
      });
  }, []);

  return { data, loading, error };
}

function AppContent() {
  const { lang, setLang, t } = useLanguage();
  const { data, loading, error } = useSchoolsData();

  // 所有hooks必須在條件返回之前聲明
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('exchangeFavorites');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = localStorage.getItem('exchangeCompare');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedSchool, setExpandedSchool] = useState(null);
  const [filters, setFilters] = useState({
    region: '',
    country: '',
    exchangeType: '',
    semester: '',
    gpa: '4.0',
    language: '',
    search: ''
  });

  // 顯示網站版本號到控制台
  useEffect(() => {
    console.log('%c Exchange Finder %c v1.0.0 ', 'background: #0056b3; color: white; padding: 4px 8px; border-radius: 4px 0 0 4px;', 'background: #00a651; color: white; padding: 4px 8px; border-radius: 0 4px 4px 0;');
    console.log('🔍 [DEBUG] 組件已掛載');
    console.log('🔍 [DEBUG] 當前語言:', lang);
    console.log('🔍 [DEBUG] 數據狀態:', { loading, error, dataLength: data?.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // 在條件返回之前定義 useMemo - 遵守 React Hook 規則
  const filteredSchools = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (!Array.isArray(favorites)) return [];
    
    let schools = showFavoritesOnly 
      ? data.filter(school => school && school.name && favorites.includes(school.name)) 
      : data.filter(school => school && school.name);
    
    if (filters.region) {
      schools = schools.filter(school => school && school.region === filters.region);
    }
    if (filters.country) {
      schools = schools.filter(school => school && school.country === filters.country);
    }
    if (filters.exchangeType) {
      schools = schools.filter(school => school && school.exchangeType === filters.exchangeType);
    }
    if (filters.semester) {
      schools = schools.filter(school => school && school.semester === filters.semester);
    }
    if (filters.gpa) {
      schools = schools.filter(school => {
        if (!school || school.gpa === undefined) return false;
        const schoolGpa = parseFloat(school.gpa);
        const filterGpa = parseFloat(filters.gpa);
        return !isNaN(schoolGpa) && !isNaN(filterGpa) && schoolGpa <= filterGpa;
      });
    }
    if (filters.language) {
      schools = schools.filter(school => 
        school && Array.isArray(school.language) && school.language.includes(filters.language)
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      schools = schools.filter(school => {
        if (!school) return false;
        const nameMatch = school.name && typeof school.name === 'string' && school.name.toLowerCase().includes(searchLower);
        const countryMatch = school.country && typeof school.country === 'string' && school.country.toLowerCase().includes(searchLower);
        const regionMatch = school.region && typeof school.region === 'string' && school.region.toLowerCase().includes(searchLower);
        return nameMatch || countryMatch || regionMatch;
      });
    }
    
    return schools;
  }, [data, filters.region, filters.country, filters.exchangeType, filters.semester, filters.gpa, filters.language, filters.search, showFavoritesOnly, favorites]);

  // 錯誤處理和調試信息
  if (error) {
    console.error('❌ [ERROR] 應用程式錯誤:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-800 mb-4">載入失敗</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="bg-gray-100 rounded p-4 text-left">
              <h3 className="font-bold mb-2">調試信息:</h3>
              <p className="text-sm text-gray-600 mb-2">請打開瀏覽器主控台 (F12) 查看詳細錯誤信息</p>
              <p className="text-sm text-gray-600 mb-2">在主控台中執行以下命令複製完整錯誤信息:</p>
              <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                copy(JSON.stringify(window.lastError, null, 2))
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 原有的應用程式邏輯繼續...（filteredSchools useMemo 已移至頂部）

  const uniqueRegions = Array.isArray(data) 
    ? [...new Set(data.filter(s => s && s.region).map(school => school.region))] 
    : [];
  const uniqueCountries = Array.isArray(data) 
    ? [...new Set(data.filter(s => s && s.country).map(school => school.country))] 
    : [];
  const uniqueExchangeTypes = Array.isArray(data) 
    ? [...new Set(data.filter(s => s && s.exchangeType).map(school => school.exchangeType))] 
    : [];
  const uniqueSemesters = Array.isArray(data) 
    ? [...new Set(data.filter(s => s && s.semester).map(school => school.semester))] 
    : [];
  const uniqueLanguages = Array.isArray(data) 
    ? [...new Set(data.flatMap(school => Array.isArray(school?.language) ? school.language : []))] 
    : [];

  const toggleFavorite = (schoolName) => {
    setFavorites(prev => {
      const currentFavorites = Array.isArray(prev) ? prev : [];
      const newFavorites = currentFavorites.includes(schoolName)
        ? currentFavorites.filter(name => name !== schoolName)
        : [...currentFavorites, schoolName];
      try {
        localStorage.setItem('exchangeFavorites', JSON.stringify(newFavorites));
      } catch (e) {
        console.warn('Failed to save favorites to localStorage:', e);
      }
      return newFavorites;
    });
  };

  const addToCompare = (schoolName) => {
    setCompareList(prev => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.length >= 3) {
        console.warn('Compare list is full (max 3 schools)');
        return current;
      }
      const newCompare = [...current, schoolName];
      try {
        localStorage.setItem('exchangeCompare', JSON.stringify(newCompare));
      } catch (e) {
        console.warn('Failed to save compare list to localStorage:', e);
      }
      return newCompare;
    });
  };

  const removeFromCompare = (schoolName) => {
    setCompareList(prev => {
      const current = Array.isArray(prev) ? prev : [];
      const newCompare = current.filter(name => name !== schoolName);
      try {
        localStorage.setItem('exchangeCompare', JSON.stringify(newCompare));
      } catch (e) {
        console.warn('Failed to save compare list to localStorage:', e);
      }
      return newCompare;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 mb-4">
            {t('subtitle')}
          </p>
          <div className="flex items-center gap-4">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                showFavoritesOnly 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              {t('favorites')}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t('filters')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('search')}
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder={t('searchPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('country')}
                  </label>
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('clearAll')}</option>
                    {uniqueCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('semester')}
                  </label>
                  <select
                    value={filters.semester}
                    onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('clearAll')}</option>
                    {uniqueSemesters.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('cgpaRequirement')} {filters.gpa && `(${filters.gpa})`}
                  </label>
                  <input
                    type="range"
                    min="2.0"
                    max="4.0"
                    step="0.1"
                    value={filters.gpa}
                    onChange={(e) => setFilters(prev => ({ ...prev, gpa: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('languageRequirement')}
                  </label>
                  <select
                    value={filters.language}
                    onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('clearAll')}</option>
                    {uniqueLanguages.map(language => (
                      <option key={language} value={language}>{language}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setFilters({
                    region: '',
                    country: '',
                    exchangeType: '',
                    semester: '',
                    gpa: '4.0',
                    language: '',
                    search: ''
                  })}
                  className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  {t('clearFilters')}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">
                {t('results')}: {filteredSchools.length} {t('totalSchools')}
              </p>
              {Array.isArray(compareList) && compareList.length > 0 && (
                <button
                  onClick={() => console.log('Compare functionality')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  {t('compare')} ({compareList.length})
                </button>
              )}
            </div>

            <div className="space-y-4">
              {filteredSchools.map((school, index) => (
                <div key={school?.id || school?.name || `school-${index}`} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {school?.name || 'Unknown School'}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {school?.country || 'Unknown Country'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => school?.name && toggleFavorite(school.name)}
                        className={`p-2 rounded-lg ${
                          Array.isArray(favorites) && school?.name && favorites.includes(school.name)
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${Array.isArray(favorites) && school?.name && favorites.includes(school.name) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => school?.name && addToCompare(school.name)}
                        disabled={!school?.name || (Array.isArray(compareList) && compareList.includes(school?.name)) || (Array.isArray(compareList) && compareList.length >= 3)}
                        className={`p-2 rounded-lg ${
                          Array.isArray(compareList) && school?.name && compareList.includes(school.name)
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        } ${Array.isArray(compareList) && compareList.length >= 3 && !(Array.isArray(compareList) && school?.name && compareList.includes(school.name)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Scale className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => school?.name && setExpandedSchool(expandedSchool === school.name ? null : school.name)}
                        disabled={!school?.name}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50"
                      >
                        {school?.name && expandedSchool === school.name ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('semester')}:</span>
                      <p className="text-gray-600">{school?.semester || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">{t('cgpaRequirement')}:</span>
                      <p className="text-gray-600">{school?.cgpa !== undefined ? school.cgpa : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">{t('languageRequirement')}:</span>
                      <p className="text-gray-600">{Array.isArray(school?.language) ? school.language.join(', ') : (school?.language || 'N/A')}</p>
                    </div>
                  </div>

                  {school?.name && expandedSchool === school.name && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">{t('notes')}:</span>
                          <p className="text-gray-600">{school?.notes || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium">{t('quota')}:</span>
                          <p className="text-gray-600">{school?.quota || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
