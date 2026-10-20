import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { fallbackSettings } from '../lib/fallbackProjects';
import { safeExternalUrl } from '../lib/api';

export default function SiteFooter({ settings }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const data = settings || fallbackSettings;
  const year = new Date().getFullYear();
  const email = data.contactEmail || fallbackSettings.contactEmail;
  const goContact = event => {
    event.preventDefault();
    if (pathname === '/') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else navigate('/#contact');
  };
  return <footer className="site-footer">
    <div className="page-shell footer-main">
      <div className="footer-brand-col">
        <a className="brand footer-brand" href="#top"><span className="brand-mark"><span>LM</span><i /></span><span className="brand-wordmark"><strong>LOBNA MAALEJ</strong><small>WEB DEVELOPER <em>&</em> DATA SOLUTIONS</small></span></a>
        <p>{t('footerLine')}</p>
      </div>
      <div className="footer-contact-col">
        <span className="tiny-label">{t('navContact')}</span>
        <a className="footer-email" href="/#contact" onClick={goContact}>{email}<ArrowUpRight size={16} /></a>
        <div className="footer-socials">
          {safeExternalUrl(data.linkedinUrl) && <a href={safeExternalUrl(data.linkedinUrl)} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={16} /></a>}
          {safeExternalUrl(data.githubUrl) && <a href={safeExternalUrl(data.githubUrl)} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={16} /></a>}
          <a href="/#contact" onClick={goContact} aria-label="Contact"><Mail size={16} /></a>
        </div>
      </div>
    </div>
    <div className="footer-bottom page-shell"><span>© {year} Lobna Maalej</span><span>{t('rights')}</span><span className="footer-location">{data.location || fallbackSettings.location}</span></div>
  </footer>;
}
