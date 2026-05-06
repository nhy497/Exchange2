import React, { useState, useMemo, useEffect } from 'react';
import { Heart, MapPin, Calendar, Award, GraduationCap, Globe, Filter, X, Star, BookOpen, DollarSign, ExternalLink, TrendingUp, Info, Languages, Building2, Lightbulb, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Plus, Minus, Scale, Loader2 } from 'lucide-react';
import { LanguageProvider, useLanguage, regionFeatures } from './LanguageContext';

// 載入學校數據
function useSchoolsData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/schools_complete.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load schools data');
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading schools data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

function AppContent() {
  const { lang, setLang, t } = useLanguage();

  // 顯示網站版本號到控制台
  useEffect(() => {
    console.log('%c Exchange Finder %c v1.0.0 ', 'background: #0056b3; color: white; padding: 4px 8px; border-radius: 4px 0 0 4px;', 'background: #00a651; color: white; padding: 4px 8px; border-radius: 0 4px 4px 0;');
  }, []);
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('exchangeFavorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [compareList, setCompareList] = useState(() => {
    const saved = localStorage.getItem('exchangeCompare');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedSchool, setExpandedSchool] = useState(null);
  const [showCriteriaGuide, setShowCriteriaGuide] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showComparePanel, setShowComparePanel] = useState(false);
  
  // 讀取學校資料
  const { data: schoolsData, loading, error } = useSchoolsData();

  // 輔助函數：根據語言獲取學校字段
  const getSchoolField = (school, field) => {
    if (lang === 'zh') {
      const zhField = school[`${field}Zh`];
      if (zhField !== undefined && zhField !== null && zhField !== '') {
        return zhField;
      }
    }
    return school[field];
  };

  // 輔助函數：獲取 selectionFactors 字段
  const getSelectionFactor = (school, factor) => {
    const sf = lang === 'zh' ? school.selectionFactorsZh : school.selectionFactors;
    if (!sf) return '';
    return sf[factor] || '';
  };
  
  // 計?國家?表
  const countries = useMemo(() => {
    if (!schoolsData) return [];
    return [...new Set(schoolsData.schools.map(s => s.country))].sort();
  }, [schoolsData]);
  
  // 篩選條件 - 初始值
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [cgpaMode, setCgpaMode] = useState('max'); // 'max' or 'min'
  const [cgpaValue, setCgpaValue] = useState(4.0);
  const [ieltsMode, setIeltsMode] = useState('min'); // 'min' or 'max'
  const [ieltsValue, setIeltsValue] = useState(0);
  const [budgetMode, setBudgetMode] = useState('max'); // 'max' or 'min'
  const [budgetValue, setBudgetValue] = useState(16000);
  const [explorerGrant, setExplorerGrant] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    localStorage.setItem('exchangeFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('exchangeCompare', JSON.stringify(compareList));
  }, [compareList]);

  const toggleCompare = (id) => {
    setCompareList(prev => {
      if (prev.includes(id)) {
        return prev.filter(cid => cid !== id);
      }
      if (prev.length >= 4) {
        alert(lang === 'zh' ? '最多只能比較 4 間學校' : 'You can compare up to 4 schools');
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const openSchoolModal = (school) => {
    setSelectedSchool(school);
  };

  const closeSchoolModal = () => {
    setSelectedSchool(null);
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const filteredSchools = useMemo(() => {
    if (!schoolsData) return [];
    return schoolsData.schools.filter(school => {
      if (showFavoritesOnly && !favorites.includes(school.id)) return false;
      if (selectedCountries.length > 0 && !selectedCountries.includes(school.country)) return false;
      
      // CGPA 要求篩選
      if (school.cgpa > 0) {
        if (cgpaMode === 'max' && school.cgpa > cgpaValue) return false;
        if (cgpaMode === 'min' && school.cgpa < cgpaValue) return false;
      }
      
      if (explorerGrant && !school.explorerGrant) return false;
      
      // IELTS 要求篩選
      const schoolIelts = parseFloat(school.ielts) || 0;
      if (ieltsValue > 0) {
        if (ieltsMode === 'min' && schoolIelts < ieltsValue && schoolIelts > 0) return false;
        if (ieltsMode === 'max' && schoolIelts > ieltsValue) return false;
      }
      
      // 預算篩選
      if (budgetMode === 'max' && school.budget > budgetValue) return false;
      if (budgetMode === 'min' && school.budget < budgetValue) return false;
      
      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchable = [
          school.name,
          school.country,
          school.city,
          school.notes,
          school.ielts,
          school.toefl,
          school.semester,
          ...(school.languages || []),
          ...(school.uniqueFeatures || []),
          school.selectionFactors?.academicFit || ''
        ].join(' ').toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      
      return true;
    });
  }, [selectedCountries, cgpaMode, cgpaValue, explorerGrant, ieltsMode, ieltsValue, budgetMode, budgetValue, showFavoritesOnly, favorites, searchTerm]);

  const toggleCountry = (country) => {
    setSelectedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  const clearFilters = () => {
    setSelectedCountries([]);
    setCgpaMode('max');
    setCgpaValue(4.0);
    setExplorerGrant(false);
    setIeltsMode('min');
    setIeltsValue(0);
    setBudgetMode('max');
    setBudgetValue(16000);
    setSearchTerm('');
  };

  const toggleSchoolExpand = (id) => {
    setExpandedSchool(expandedSchool === id ? null : id);
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--bg)' }}>
      {/* Hero Header */}
      <header className="hero-gradient text-white rounded-[32px] p-8 mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute right-[-60px] top-[-60px] w-[220px] h-[220px] rounded-full bg-white/5" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <div className="text-white/75 text-sm mb-2">2026-27 Main Round Application</div>
            <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-3 mb-3">
              <Globe className="w-10 h-10 text-[var(--accent)]" />
              {lang === 'zh' ? '尋找你的最佳交流選擇' : 'Find Your Best Exchange Match'}
            </h1>
            <p className="text-white/85 max-w-[70ch] text-lg">
              {lang === 'zh' 
                ? `瀏覽各地大學，比較 CGPA 和語言要求，更清晰地找到最適合你的選擇。共 ${schoolsData?.schools?.length ?? 0} 間合作院校。`
                : `Browse universities by region, compare CGPA and language requirements, and find your perfect match from ${schoolsData?.schools?.length ?? 0} partner institutions.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="px-4 py-2 bg-white/10 text-white rounded-[12px] hover:bg-white/20 transition-all font-medium border border-white/20"
            >
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[12px] font-medium transition-all border ${
                showFavoritesOnly 
                  ? 'bg-[var(--accent)] text-[var(--text)] border-[var(--accent)]' 
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              {t.favorites} {favorites.length > 0 && `(${favorites.length})`}
            </button>
            {compareList.length > 0 && (
              <button
                onClick={() => setShowComparePanel(!showComparePanel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[12px] font-medium transition-all border ${
                  showComparePanel 
                    ? 'bg-[var(--accent)] text-[var(--text)] border-[var(--accent)]' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                <Scale className="w-5 h-5" />
                {lang === 'zh' ? '比較' : 'Compare'} ({compareList.length})
              </button>
            )}
          </div>
        </div>

        {/* 搜索框 */}
        <div className="mt-6 flex gap-3 max-w-[860px]">
          <div className="flex-1 flex items-center bg-white rounded-[18px] p-2">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 text-gray-800 outline-none text-base"
            />
          </div>
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center gap-2 px-5 py-3 bg-[var(--brand)] text-white rounded-[18px] hover:bg-[var(--brand2)] transition-all font-semibold"
          >
            <Filter className="w-5 h-5" />
            {showFilterPanel ? t.hideFilter : t.showFilter}
          </button>
          <button
            onClick={() => setShowCriteriaGuide(!showCriteriaGuide)}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-[18px] hover:bg-white/20 transition-all border border-white/20"
          >
            <Lightbulb className="w-5 h-5" />
            {lang === 'zh' ? '選校指南' : 'Guide'}
          </button>
        </div>

        {/* 資料來源 */}
        <div className="mt-4 p-4 rounded-[20px] bg-[var(--soft)]/30 border border-[var(--brand)]/20 text-[var(--accent)] text-sm">
          {lang === 'zh' 
            ? '資料來源：CityU GEO I-level Quota PDF（更新於2026年1月16日）。預算估算根據具體城市，包含住宿、餐飲、交通等基本生活費'
            : 'Data source: CityU GEO I-level Quota PDF (updated Jan 16, 2026). Budget estimates are city-specific, covering accommodation, food, transport.'}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 篩選面板 - 默認顯示 */}
        {showFilterPanel && (
          <aside className="lg:w-[320px] filter-section p-5 h-fit sticky top-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Filter className="w-5 h-5 text-[var(--brand)]" />
                {t.filters}
              </h2>
              <button
                onClick={clearFilters}
                className="text-sm text-[var(--brand)] hover:text-[var(--brand2)] flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[var(--soft)] transition-all"
              >
                <X className="w-4 h-4" />
                {t.clearAll}
              </button>
            </div>

            {/* 國家篩選 */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--muted)]" />
                {t.country}
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {countries.map(country => (
                  <label key={country} className="flex items-center gap-2.5 cursor-pointer hover:bg-[var(--bg)] p-2 rounded-[12px] transition-all">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(country)}
                      onChange={() => toggleCountry(country)}
                      className="w-4 h-4 text-[var(--brand)] rounded border-[var(--line)] focus:ring-[var(--brand)]"
                    />
                    <span className="text-sm text-[var(--text)]">{country}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* CGPA 要求篩選 */}
            <div className="mb-5 p-4 bg-[var(--bg)] rounded-[16px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[var(--muted)]" />
                  {t.cgpaRequirement}
                </h3>
                <div className="flex bg-white rounded-lg p-0.5 border border-[var(--line)]">
                  <button
                    onClick={() => setCgpaMode('max')}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${cgpaMode === 'max' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}
                  >
                    最高                  </button>
                  <button
                    onClick={() => setCgpaMode('min')}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${cgpaMode === 'min' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}
                  >
                    最低                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2.0"
                  max="4.0"
                  step="0.1"
                  value={cgpaValue}
                  onChange={(e) => setCgpaValue(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-[var(--line)] rounded-lg appearance-none cursor-pointer accent-[var(--brand)]"
                />
                <span className="text-sm font-bold text-[var(--brand)] min-w-[3ch]">{cgpaValue.toFixed(1)}</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">
                {cgpaMode === 'max'
                  ? (lang === 'zh' ? '顯示 CGPA 要求低於 ' : 'Show schools with CGPA below ') + cgpaValue.toFixed(1)
                  : (lang === 'zh' ? '顯示 CGPA 要求高於 ' : 'Show schools with CGPA above ') + cgpaValue.toFixed(1)}
              </p>
            </div>

            {/* IELTS 要求篩選 */}
            <div className="mb-5 p-4 bg-[var(--bg)] rounded-[16px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--muted)]" />
                  {t.languageRequirement}
                </h3>
                <div className="flex bg-white rounded-lg p-0.5 border border-[var(--line)]">
                  <button
                    onClick={() => setIeltsMode('min')}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${ieltsMode === 'min' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}
                  >
                    最低                  </button>
                  <button
                    onClick={() => setIeltsMode('max')}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${ieltsMode === 'max' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}
                  >
                    最高                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="8.0"
                  step="0.5"
                  value={ieltsValue}
                  onChange={(e) => setIeltsValue(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-[var(--line)] rounded-lg appearance-none cursor-pointer accent-[var(--brand)]"
                />
                <span className="text-sm font-bold text-[var(--brand)] min-w-[3ch]">{ieltsValue.toFixed(1)}</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">
                {ieltsMode === 'min'
                  ? (lang === 'zh' ? '顯示 IELTS 要求低於 ' : 'Show schools with IELTS below ') + ieltsValue.toFixed(1)
                  : (lang === 'zh' ? '顯示 IELTS 要求高於 ' : 'Show schools with IELTS above ') + ieltsValue.toFixed(1)}
              </p>
            </div>

            {/* 預算篩選 */}
            <div className="mb-5 p-4 bg-[var(--bg)] rounded-[16px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[var(--muted)]" />
                  {t.budgetRange}
                </h3>
                <div className="flex bg-white rounded-lg p-0.5 border border-[var(--line)]">
                  <button
                    onClick={() => setBudgetMode('max')}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${budgetMode === 'max' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}
                  >
                    最高                  </button>
                  <button
                    onClick={() => setBudgetMode('min')}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${budgetMode === 'min' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted)]'}`}
                  >
                    最低                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="3000"
                  max="16000"
                  step="500"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-[var(--line)] rounded-lg appearance-none cursor-pointer accent-[var(--brand)]"
                />
                <span className="text-sm font-bold text-[var(--brand)] min-w-[5ch]">HK${(budgetValue/1000).toFixed(0)}K</span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-2">
                {budgetMode === 'max' 
                  ? (lang === 'zh' ? '顯示預算最多 HK$' : 'Show budget ≤ HK$') + budgetValue.toLocaleString() + (lang === 'zh' ? '/月' : '/month')
                  : (lang === 'zh' ? '顯示預算至少 HK$' : 'Show budget ≥ HK$') + budgetValue.toLocaleString() + (lang === 'zh' ? '/月' : '/month')}
              </p>
            </div>

            {/* Explorer Grant */}
            <div className="mb-4 p-3 bg-[var(--soft)]/50 rounded-[12px]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={explorerGrant}
                  onChange={(e) => setExplorerGrant(e.target.checked)}
                  className="w-5 h-5 text-[var(--brand)] rounded border-[var(--line)] focus:ring-[var(--brand)]"
                />
                <div>
                  <span className="font-semibold text-[var(--text)] flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-[var(--success)]" />
                    {t.explorerGrant}
                  </span>
                  <p className="text-xs text-[var(--muted)]">{t.explorerGrantDesc}</p>
                </div>
              </label>
            </div>

            {/* 結果統計 - 顯示符合篩選條件的學校數量 */}
            <div className="pt-4 border-t border-[var(--line)]">
              <div className="bg-[var(--brand)]/10 rounded-[12px] p-3 text-center">
                <p className="text-xs text-[var(--muted)] mb-1">{lang === 'zh' ? '符合篩選條件' : 'Matching Results'}</p>
                <p className="text-2xl font-bold text-[var(--brand)]">
                  {filteredSchools.length} <span className="text-sm font-normal text-[var(--muted)]">/ {schoolsData?.schools?.length ?? 0}</span>
                </p>
                <p className="text-xs text-[var(--muted)] mt-1">{lang === 'zh' ? '間學校' : 'schools'}</p>
              </div>
            </div>
          </aside>
        )}

        {/* 選校指南標題 */}
        {showCriteriaGuide && (
          <div className="mb-6 p-6 bg-[var(--card)] border border-[var(--line)] rounded-[24px] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-[var(--accent)]" />
                {lang === 'zh' ? '如何選擇合適的交流學校' : 'How to Choose the Right Exchange University?'}
              </h2>
              <button onClick={() => setShowCriteriaGuide(false)} className="p-2 hover:bg-[var(--bg)] rounded-full">
                <X className="w-5 h-5 text-[var(--muted)]" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: GraduationCap, title: lang === 'zh' ? '學術配適' : 'Academic Fit', desc: lang === 'zh' ? '確保課程是否符合你的專業興趣並符，學分能轉移回CityU' : 'Ensure courses align with your major and credits transfer back to CityU' },
                { icon: Languages, title: lang === 'zh' ? '語言要求' : 'Language', desc: lang === 'zh' ? '評估你的IELTS/TOEFL分數，考慮是否需要學習當地語言' : 'Evaluate your IELTS/TOEFL scores, consider local language needs' },
                { icon: DollarSign, title: lang === 'zh' ? '預算範圍' : 'Budget', desc: lang === 'zh' ? '考慮該城市的生活費用並尋找獲得學校資助的機會' : 'Consider city living costs, look for scholarships and grants' },
                { icon: MapPin, title: lang === 'zh' ? '地理位置' : 'Location', desc: lang === 'zh' ? '氣候、文化、安全、離家距離以及旅遊的機會' : 'Climate, culture, safety, distance from home, travel opportunities' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-[var(--bg)] rounded-[16px]">
                  <item.icon className="w-8 h-8 text-[var(--brand)] mb-2" />
                  <h3 className="font-semibold text-[var(--text)] mb-1">{item.title}</h3>
                  <p className="text-sm text-[var(--muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 學校列表 */}
        <main className="flex-1">
          {filteredSchools.length === 0 ? (
            <div className="glass-effect p-12 text-center">
              <p className="text-[var(--muted)] text-lg mb-4">{t.noResults}</p>
              <button
                onClick={clearFilters}
                className="btn-primary"
              >
                {t.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredSchools.map(school => (
                <div
                  key={school.id}
                  className={`school-card p-5 relative ${expandedSchool === school.id ? 'col-span-1 md:col-span-2 xl:col-span-2' : ''}`}
                >
                  {/* 收藏按鈕 */}
                  <button
                    onClick={() => toggleFavorite(school.id)}
                    className={`heart-btn absolute top-5 right-5 p-2 rounded-full ${
                      favorites.includes(school.id) 
                        ? 'text-[var(--danger)]' 
                        : 'text-[var(--muted)] hover:text-[var(--danger)]'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${favorites.includes(school.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* 徽標 */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap pr-10">
                    <span className="px-3 py-1 bg-[var(--brand)]/10 text-[var(--brand)] rounded-full text-sm font-medium">
                      {getSchoolField(school, 'country')}
                    </span>
                    {school.city && school.city !== 'N/A' && (
                      <span className="px-2 py-1 bg-[var(--bg)] text-[var(--muted)] rounded-full text-xs flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {getSchoolField(school, 'city')}
                      </span>
                    )}
                    {school.ranking && (
                      <span className="badge-ranking text-xs font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        QS #{school.ranking}
                      </span>
                    )}
                    {school.explorerGrant && (
                      <span className="badge-grant text-xs font-medium flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        HK$10K Grant
                      </span>
                    )}
                  </div>

                  {/* 學校名稱 */}
                  <h3 className="text-xl font-bold text-[var(--text)] mb-2 pr-10">{school.name}</h3>

                  {/* 位置和語言 - 簡化顯示 */}
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)] mb-3">
                    {school.region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {school.region}
                      </span>
                    )}
                    {getSchoolField(school, 'climate') && (
                      <span className="flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {getSchoolField(school, 'climate').split('，')[0]}
                      </span>
                    )}
                    {getSchoolField(school, 'languages') && (
                      <span className="flex items-center gap-1">
                        <Languages className="w-3 h-3" />
                        {getSchoolField(school, 'languages')[0]?.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {/* 核心信息 - 簡化版 */}
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    <span className="px-2 py-1 bg-[var(--bg)] rounded-md text-[var(--text)]">
                      HK${(school.budget/1000).toFixed(0)}K{lang === 'zh' ? '/月' : '/mo'}
                    </span>
                    <span className="px-2 py-1 bg-[var(--bg)] rounded-md text-[var(--text)]">
                      {lang === 'zh' ? '配額' : 'Quota'} {getSchoolField(school, 'quota')}
                    </span>
                    {school.cgpa > 0 && (
                      <span className="px-2 py-1 bg-[var(--bg)] rounded-md text-[var(--text)]">
                        CGPA ≥{school.cgpa}
                      </span>
                    )}
                    {school.ielts !== '-' && (
                      <span className="px-2 py-1 bg-[var(--bg)] rounded-md text-[var(--text)]">
                        IELTS {school.ielts}
                      </span>
                    )}
                  </div>

                  {/* 亮點特色 - 合併簡化 */}
                  {(getSchoolField(school, 'specialFeatures') || getSchoolField(school, 'foodCulture')) && (
                    <div className="mb-3 p-3 bg-[var(--soft)]/50 rounded-[12px]">
                      <p className="text-xs text-[var(--muted)] mb-1">{lang === 'zh' ? '亮點' : 'Highlights'}</p>
                      <ul className="space-y-1">
                        {getSchoolField(school, 'foodCulture') && (
                          <li className="text-xs text-[var(--text)] flex items-start gap-1">
                            <span className="text-[var(--accent)]">🍴</span>
                            <span>{getSchoolField(school, 'foodCulture').substring(0, 25)}...</span>
                          </li>
                        )}
                        {getSchoolField(school, 'specialFeatures')?.slice(0, 2).map((feature, i) => (
                          <li key={i} className="text-xs text-[var(--text)] flex items-start gap-1">
                            <span className="text-[var(--success)]">★</span>
                            <span>{feature.substring(0, 30)}{feature.length > 30 ? '...' : ''}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 學校特色 - 簡化版 */}
                  {getSchoolField(school, 'uniqueFeatures') && (
                    <div className="mb-3">
                      <ul className="space-y-1">
                        {getSchoolField(school, 'uniqueFeatures').slice(0, 2).map((feature, i) => (
                          <li key={i} className="text-xs text-[var(--text)] flex items-start gap-1">
                            <span className="text-[var(--brand)]">✓</span>
                            <span className="flex-1">{feature.substring(0, 35)}{feature.length > 35 ? '...' : ''}</span>
                          </li>
                        ))}
                      </ul>
                      {getSchoolField(school, 'uniqueFeatures').length > 2 && (
                        <button
                          onClick={() => openSchoolModal(school)}
                          className="mt-2 text-xs text-[var(--brand)] hover:underline"
                        >
                          {lang === 'zh' ? '查看更多...' : 'View more...'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* 選校標籤 */}
                  {(school.selectionFactors || school.selectionFactorsZh) && (
                    <div className="mb-4 p-3 bg-[var(--soft)]/50 rounded-[12px]">
                      <div className="text-xs text-[var(--muted)] mb-1">{lang === 'zh' ? '適合你如果：' : 'Good fit if you:'}</div>
                      <div className="text-sm text-[var(--text)]">{getSelectionFactor(school, 'academicFit')}</div>
                    </div>
                  )}

                  {/* 收藏按鈕 */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openSchoolModal(school)}
                      className="btn-primary text-sm flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {lang === 'zh' ? '查看詳情' : 'View Details'}
                    </button>
                    <button
                      onClick={() => toggleCompare(school.id)}
                      className={`px-4 py-2 rounded-[12px] text-sm font-medium flex items-center gap-1.5 transition-all ${
                        compareList.includes(school.id)
                          ? 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]'
                          : 'bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--brand)]'
                      }`}
                    >
                      {compareList.includes(school.id) ? (
                        <><Minus className="w-4 h-4" /> {lang === 'zh' ? '移出比較' : 'Remove'}</>
                      ) : (
                        <><Plus className="w-4 h-4" /> {lang === 'zh' ? '加入比較' : 'Compare'}</>
                      )}
                    </button>
                  </div>

                  {/* 展開詳細信息 */}
                  {expandedSchool === school.id && (
                    <div className="mt-4 pt-4 border-t border-[var(--line)]">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-[var(--muted)]">{t.semester}:</span>
                          <p className="font-medium text-[var(--text)]">{school.semester}</p>
                        </div>
                        <div>
                          <span className="text-[var(--muted)]">{t.budget}:</span>
                          <p className="font-medium text-[var(--text)]">HK${school.budget.toLocaleString()}{lang === 'zh' ? '/月' : '/month'}</p>
                        </div>
                        {school.toefl !== '-' && (
                          <div>
                            <span className="text-[var(--muted)]">TOEFL:</span>
                            <p className="font-medium text-[var(--text)]">{school.toefl}</p>
                          </div>
                        )}
                      </div>
                      {school.notes && (
                        <div className="mt-3 p-3 bg-[var(--warning)]/10 rounded-[12px] border border-[var(--warning)]/20">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-[var(--warning)] mt-0.5" />
                            <p className="text-sm text-[var(--warning)]">{school.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 比較面板 */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-48px)] bg-[var(--card)] border border-[var(--line)] rounded-[24px] shadow-[0_18px_38px_rgba(0,0,0,0.18)] p-5 z-20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-[var(--text)] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[var(--brand)]" />
              {lang === 'zh' ? '比較清單' : 'Compare'} ({compareList.length}/4)
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => setShowComparePanel(!showComparePanel)}
                className="text-sm px-3 py-1.5 bg-[var(--brand)] text-white rounded-full hover:bg-[var(--brand2)] transition-all"
              >
                {showComparePanel
                  ? (lang === 'zh' ? '隱藏' : 'Hide')
                  : (lang === 'zh' ? '展開' : 'Expand')}
              </button>
              <button
                onClick={clearCompare}
                className="text-sm px-3 py-1.5 border border-[var(--line)] rounded-full hover:bg-[var(--bg)] transition-all"
              >
                {lang === 'zh' ? '清除' : 'Clear'}
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {compareList.map(id => {
              const school = schoolsData?.schools?.find(s => s.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--line)] px-3 py-1.5 rounded-full text-sm">
                  {school?.name}
                  <button
                    onClick={() => toggleCompare(id)}
                    className="text-[var(--muted)] hover:text-[var(--danger)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              );
            })}
          </div>

          {showComparePanel && compareList.length >= 2 && (
            <div className="border-t border-[var(--line)] pt-4">
              <h5 className="font-semibold text-sm mb-3 text-[var(--text)]">
                {lang === 'zh' ? '比較表格' : 'Comparison Table'}
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)]">
                      <th className="text-left py-2 text-[var(--muted)] font-medium">{lang === 'zh' ? '項目' : 'Item'}</th>
                      {compareList.map(id => {
                        const school = schoolsData?.schools?.find(s => s.id === id);
                        return (
                          <th key={id} className="text-left py-2 px-3 font-semibold text-[var(--text)] min-w-[120px]">
                            {school?.name}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: lang === 'zh' ? '國家' : 'Country', key: 'country', useZhField: true },
                      { label: lang === 'zh' ? '城市' : 'City', key: 'city', useZhField: true },
                      { label: lang === 'zh' ? '配額' : 'Quota', key: 'quota' },
                      { label: lang === 'zh' ? 'CGPA' : 'CGPA', key: 'cgpa', format: (v) => v > 0 ? `≥${v}` : '-' },
                      { label: lang === 'zh' ? 'IELTS' : 'IELTS', key: 'ielts' },
                      { label: lang === 'zh' ? '學期' : 'Semester', key: 'semester' },
                      { label: lang === 'zh' ? '預算/月' : 'Budget/mo', key: 'budget', format: (v) => `HK$${v?.toLocaleString()}` },
                      { label: 'QS ' + (lang === 'zh' ? '排名' : 'Rank'), key: 'ranking', format: (v) => v ? `#${v}` : '-' },
                      { label: lang === 'zh' ? '資助' : 'Grant', key: 'explorerGrant', format: (v) => v ? (lang === 'zh' ? '有' : 'Yes') : (lang === 'zh' ? '無' : 'No') },
                    ].map((row, idx) => (
                      <tr key={row.key} className="border-b border-[var(--line)]/50">
                        <td className="py-2 text-[var(--muted)]">{row.label}</td>
                        {compareList.map(id => {
                          const school = schoolsData?.schools?.find(s => s.id === id);
                          const value = row.useZhField ? getSchoolField(school, row.key) : school?.[row.key];
                          return (
                            <td key={id} className="py-2 px-3 text-[var(--text)]">
                              {row.format ? row.format(value) : value || '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 詳情彈窗 */}
      {selectedSchool && (
        <div 
          className="fixed inset-0 bg-black/45 flex items-center justify-center p-4 md:p-8 z-30"
          onClick={closeSchoolModal}
        >
          <div 
            className="w-full max-w-[840px] max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-[28px] p-6 md:p-8 border border-[var(--line)] shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
            onClick={e => e.stopPropagation()}
          >
            {/* 彈窗頭部 */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text)] mb-2">{selectedSchool.name}</h2>
                <p className="text-[var(--muted)]">{getSchoolField(selectedSchool, 'city')} · {getSchoolField(selectedSchool, 'country')} · {selectedSchool.region}</p>
              </div>
              <button
                onClick={closeSchoolModal}
                className="p-2 border border-[var(--line)] rounded-full hover:bg-[var(--bg)] transition-all"
              >
                <X className="w-5 h-5 text-[var(--muted)]" />
              </button>
            </div>

            {/* 快速信息 */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="chip">{lang === 'zh' ? '配額' : 'Quota'}: {getSchoolField(selectedSchool, 'quota')}</span>
              <span className="chip">CGPA: {selectedSchool.cgpa > 0 ? `≥${selectedSchool.cgpa}` : '-'}</span>
              <span className="chip">IELTS: {selectedSchool.ielts}</span>
              <span className="chip">QS #{selectedSchool.ranking || '-'}</span>
              <span className="chip">{lang === 'zh' ? '預算' : 'Budget'}: HK${selectedSchool.budget?.toLocaleString()}{lang === 'zh' ? '/月' : '/mo'}</span>
              {selectedSchool.region && (
                <span className="chip bg-[var(--accent)]/10 text-[var(--accent)]">{selectedSchool.region}</span>
              )}
              {getSchoolField(selectedSchool, 'climate') && (
                <span className="chip bg-[var(--success)]/10 text-[var(--success)]">{getSchoolField(selectedSchool, 'climate')}</span>
              )}
              {selectedSchool.explorerGrant && (
                <span className="badge-grant text-xs">{lang === 'zh' ? 'HK$10K 資助' : 'HK$10K Grant'}</span>
              )}
            </div>

            {/* 詳細信息網格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 基本要求 */}
              <div className="p-4 bg-[var(--bg)] rounded-[18px] border border-[var(--line)]">
                <h5 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--brand)]" />
                  {lang === 'zh' ? '基本要求' : 'Core Requirements'}
                </h5>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-[var(--muted)]">{lang === 'zh' ? '語言要求' : 'Language'}:</span>
                    <span className="text-[var(--text)] font-medium">{selectedSchool.ielts !== '-' ? `IELTS ${selectedSchool.ielts}` : ''} {selectedSchool.toefl !== '-' ? `TOEFL ${selectedSchool.toefl}` : lang === 'zh' ? '無特定要求' : 'No specific'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-[var(--muted)]">{lang === 'zh' ? '學期' : 'Semester'}:</span>
                    <span className="text-[var(--text)] font-medium">{selectedSchool.semester}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-[var(--muted)]">{lang === 'zh' ? '校園語言' : 'Campus languages'}:</span>
                    <span className="text-[var(--text)] font-medium">{(getSchoolField(selectedSchool, 'languages') || []).join(lang === 'zh' ? '、' : ', ')}</span>
                  </li>
                </ul>
              </div>

              {/* 學術配適 */}
              <div className="p-4 bg-[var(--bg)] rounded-[18px] border border-[var(--line)]">
                <h5 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[var(--brand)]" />
                  {lang === 'zh' ? '學術配適' : 'Academic Fit'}
                </h5>
                <ul className="space-y-2 text-sm">
                  <li>
                    <span className="text-[var(--muted)]">{lang === 'zh' ? '適合專業: ' : 'Good for: '}</span>
                    <span className="text-[var(--text)]">{getSelectionFactor(selectedSchool, 'academicFit')}</span>
                  </li>
                  <li>
                    <span className="text-[var(--muted)]">{lang === 'zh' ? '支援服務: ' : 'Support: '}</span>
                    <span className="text-[var(--text)]">{getSelectionFactor(selectedSchool, 'supportServices')}</span>
                  </li>
                </ul>
              </div>

              {/* 學校特色 */}
              <div className="p-4 bg-[var(--bg)] rounded-[18px] border border-[var(--line)] md:col-span-2">
                <h5 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[var(--accent)]" />
                  {lang === 'zh' ? '學校特色' : 'University Highlights'}
                </h5>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(getSchoolField(selectedSchool, 'uniqueFeatures') || []).map((feature, i) => (
                    <li key={i} className="text-sm text-[var(--text)] flex items-start gap-2">
                      <span className="text-[var(--accent)] mt-1">✦</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 美食文化 */}
              {getSchoolField(selectedSchool, 'foodCulture') && (
                <div className="p-4 bg-[var(--bg)] rounded-[18px] border border-[var(--line)]">
                  <h5 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[var(--accent)]" />
                    {lang === 'zh' ? '美食文化' : 'Food & Culture'}
                  </h5>
                  <p className="text-sm text-[var(--text)]">{getSchoolField(selectedSchool, 'foodCulture')}</p>
                </div>
              )}

              {/* 特別特色 */}
              {getSchoolField(selectedSchool, 'specialFeatures') && (
                <div className="p-4 bg-[var(--bg)] rounded-[18px] border border-[var(--line)]">
                  <h5 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-[var(--success)]" />
                    {lang === 'zh' ? '特別之處' : 'Special Highlights'}
                  </h5>
                  <ul className="space-y-2">
                    {(getSchoolField(selectedSchool, 'specialFeatures') || []).map((feature, i) => (
                      <li key={i} className="text-sm text-[var(--text)] flex items-start gap-2">
                        <span className="text-[var(--success)] mt-1">★</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 文化體驗 */}
              <div className="p-4 bg-[var(--bg)] rounded-[18px] border border-[var(--line)]">
                <h5 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--brand)]" />
                  {lang === 'zh' ? '文化體驗' : 'Cultural Experience'}
                </h5>
                <p className="text-sm text-[var(--text)]">{getSelectionFactor(selectedSchool, 'culturalExperience')}</p>
                <p className="text-sm text-[var(--muted)] mt-2">{lang === 'zh' ? '預算水平: ' : 'Budget level: '}{getSelectionFactor(selectedSchool, 'budgetLevel')}</p>
              </div>

              {/* 重要備註 */}
              {(selectedSchool.notes || selectedSchool.notesZh) && (
                <div className="p-4 bg-[var(--warning)]/10 rounded-[18px] border border-[var(--warning)]/20">
                  <h5 className="font-semibold text-[var(--warning)] mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {lang === 'zh' ? '重要備註' : 'Important Notes'}
                  </h5>
                  <p className="text-sm text-[var(--warning)]">{getSchoolField(selectedSchool, 'notes') || (lang === 'zh' ? '無備註' : 'No notes')}</p>
                </div>
              )}
            </div>

            {/* 底部操作 */}
            <div className="flex gap-3 pt-4 border-t border-[var(--line)]">
              {selectedSchool.website && (
                <a
                  href={selectedSchool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {lang === 'zh' ? '訪問官網' : 'Visit Website'}
                </a>
              )}
              <button
                onClick={() => {
                  toggleCompare(selectedSchool.id);
                }}
                className={`px-5 py-2.5 rounded-[12px] font-medium flex items-center gap-2 transition-all ${
                  compareList.includes(selectedSchool.id)
                    ? 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]'
                    : 'bg-[var(--bg)] text-[var(--text)] border border-[var(--line)] hover:border-[var(--brand)]'
                }`}
              >
                {compareList.includes(selectedSchool.id) ? (
                  <><Minus className="w-4 h-4" /> {lang === 'zh' ? '移出比較' : 'Remove from compare'}</>
                ) : (
                  <><Plus className="w-4 h-4" /> {lang === 'zh' ? '加入比較' : 'Add to compare'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 載入中 */}
      {loading && (
        <div className="fixed inset-0 bg-[var(--bg)] flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[var(--brand)] animate-spin mx-auto mb-4" />
            <p className="text-[var(--muted)]">{lang === 'zh' ? '載入中...' : 'Loading data...'}</p>
          </div>
        </div>
      )}

      {/* 載入錯誤 */}
      {error && !loading && (
        <div className="fixed inset-0 bg-[var(--bg)] flex items-center justify-center z-50">
          <div className="text-center max-w-md p-6">
            <AlertCircle className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">
              {lang === 'zh' ? '載入失敗' : 'Failed to Load'}
            </h3>
            <p className="text-[var(--muted)] mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              {lang === 'zh' ? '重新載入' : 'Reload'}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-[var(--muted)] text-sm pb-6">
        <p>{t.footer}</p>
        <p className="mt-1">Created for Peter · {t.disclaimer}</p>
        <p className="mt-2 text-xs">{lang === 'zh' ? '預算估算於2026年數據，實際費用可能不同' : 'Budget estimates based on 2026 data, actual costs may vary'}</p>
      </footer>
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

