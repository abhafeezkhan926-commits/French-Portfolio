import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, Globe2, Menu, Moon, Sparkles, Sun, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function SiteHeader() {
  const { t, language, languageNames, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const home = location.pathname === '/';
  const navLink = section => home ? `#${section}` : `/#${section}`;
  const languages = ['fr', 'en', 'pt', 'es'];

  return <header className="site-header">
    <div className="header-inner page-shell">
      <Link to="/" className="brand" aria-label="Lobna Maalej — accueil" onClick={() => setMenuOpen(false)}>
        <span className="brand-mark"><span>LM</span><i /></span>
        <span className="brand-wordmark"><strong>LOBNA MAALEJ</strong><small>WEB DEVELOPER <em>&</em> DATA SOLUTIONS</small></span>
      </Link>
      <nav className={`desktop-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Navigation principale">
        <a href={navLink('projects')} onClick={() => setMenuOpen(false)}>{t('navProjects')}</a>
        <a href={navLink('approach')} onClick={() => setMenuOpen(false)}>{t('navApproach')}</a>
        <a href={navLink('about')} onClick={() => setMenuOpen(false)}>{t('navAbout')}</a>
        <a href={navLink('contact')} onClick={() => setMenuOpen(false)}>{t('navContact')}</a>
      </nav>
      <div className="header-actions">
        <div className="language-wrap">
          <button className="language-trigger" onClick={() => setLanguageOpen(v => !v)} aria-expanded={languageOpen} aria-label="Change language">
            <Globe2 size={15} strokeWidth={1.8} /><span>{languageNames[language]}</span><ChevronDown size={13} className={languageOpen ? 'rotate-180' : ''} />
          </button>
          {languageOpen && <div className="language-menu" role="menu">
            {languages.map(code => <button key={code} role="menuitem" className={language === code ? 'active' : ''} onClick={() => { changeLanguage(code); setLanguageOpen(false); }}><span>{languageNames[code]}</span><span className="language-full">{{ fr: 'Français', en: 'English', pt: 'Português (BR)', es: 'Español' }[code]}</span>{language === code && <Sparkles size={13} />}</button>)}
          </div>}
        </div>
        <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
          {theme === 'dark' ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
        </button>
        <Link to="/admin/login" className="admin-link"><span>{t('admin')}</span><ArrowUpRight size={14} /></Link>
        <button className="mobile-menu-button" onClick={() => setMenuOpen(v => !v)} aria-label={menuOpen ? t('close') : t('openMenu')}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </div>
  </header>;
}
