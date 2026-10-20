import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Check, ExternalLink, Play, Radio, Video } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest, mediaUrl, safeExternalUrl } from '../lib/api';
import { fallbackProjects, fallbackSettings } from '../lib/fallbackProjects';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import ProjectArtwork from '../components/ProjectArtwork';
import MailLink from '../components/MailLink';

const categories = { 'printer-store': 'catPrinter', travel: 'catTravel', 'power-bi': 'catPower', sponsorship: 'catSponsorship', solar: 'catSolar', healthcare: 'catHealthcare', other: 'catOther' };
function getVideoEmbed(value) {
  const safe = safeExternalUrl(value);
  if (!safe) return null;
  try {
    const url = new URL(safe);
    if (url.hostname.includes('youtu.be')) return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
      if (id && /^[A-Za-z0-9_-]+$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (url.hostname.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      if (id && /^[A-Za-z0-9_-]+$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
  } catch { /* invalid URLs are ignored */ }
  return null;
}

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState(fallbackProjects);
  const [settings, setSettings] = useState(fallbackSettings);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.allSettled([apiRequest('/api/projects'), apiRequest('/api/settings')]).then(([pr, sr]) => {
      if (!active) return;
      if (pr.status === 'fulfilled' && Array.isArray(pr.value.projects)) setProjects(pr.value.projects);
      if (sr.status === 'fulfilled' && sr.value.settings) setSettings(sr.value.settings);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const project = projects.find(item => item.slug === slug);
  const copy = project?.content?.[language] || project?.content?.fr || {};
  if (loading && !project) return <><SiteHeader /><main className="detail-loading page-shell"><span className="loading-dot" />{t('loading')}</main><SiteFooter settings={settings} /></>;
  if (!project) return <><SiteHeader /><main className="not-found page-shell"><span className="section-kicker">404 / {t('notFound')}</span><h1>{t('notFound')}</h1><Link to="/#projects" className="button button-dark"><ArrowLeft size={16} />{t('backProjects')}</Link></main><SiteFooter settings={settings} /></>;
  const demoUrl = safeExternalUrl(project.demoUrl);
  const repositoryUrl = safeExternalUrl(project.repositoryUrl);
  const docsUrl = safeExternalUrl(project.documentationUrl);
  const videoUrl = safeExternalUrl(project.videoUrl);
  const videoEmbed = getVideoEmbed(videoUrl);
  const isMp4 = videoUrl && /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl);
  const cover = mediaUrl(project.coverImage);
  const quoteSubject = `${t('quoteSubject')}${copy.title || ''}`;
  return <>
    <SiteHeader />
    <main className="project-detail-page page-shell">
      <Link to="/#projects" className="back-link"><ArrowLeft size={15} /> {t('backProjects')}</Link>
      <div className="detail-hero-grid">
        <motion.div className="detail-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
          <span className="section-kicker"><span>PROJECT / {String((project.order || 1)).padStart(2, '0')}</span> / {t(categories[project.category] || 'catOther')}</span>
          {project.status === 'coming-soon' && <span className="coming-soon-tag detail-soon">{t('soon')}</span>}
          <h1>{copy.title}</h1>
          <p className="detail-tagline">{copy.tagline}</p>
          <p className="detail-description">{copy.description}</p>
          <div className="detail-hero-actions">
            {demoUrl ? <a href={demoUrl} target="_blank" rel="noreferrer" className="button button-dark">{t('liveDemo')} <ArrowUpRight size={16} /></a> : <button type="button" className="button button-disabled" title={t('noDemo')} disabled><Radio size={15} /> {t('liveDemo')}</button>}
            <MailLink email={settings.contactEmail || fallbackSettings.contactEmail} subject={quoteSubject} className="button button-quiet">{t('requestQuote')} <ArrowUpRight size={16} /></MailLink>
          </div>
          <div className="detail-links">
            {repositoryUrl ? <a href={repositoryUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {t('sourceCode')}</a> : <button type="button" className="detail-disabled-link" title={t('emptySetting')} disabled><ExternalLink size={14} /> {t('sourceCode')}</button>}
            {docsUrl && <a href={docsUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {t('documentation')}</a>}
          </div>
        </motion.div>
        <motion.div className="detail-cover" initial={{ opacity: 0, scale: .975 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .65, delay: .08 }}>
          {cover ? <img src={cover} alt={copy.title} /> : <ProjectArtwork project={project} />}
          <div className="detail-cover-caption"><span>WEB / DATA SOLUTIONS</span><span>LM—{String(project.order || 1).padStart(2, '0')}</span></div>
        </motion.div>
      </div>

      <div className="detail-body-grid">
        <section className="detail-main-column">
          <div className="detail-section-block"><span className="section-kicker"><span>01</span> / {t('details')}</span><h2>{t('details')}</h2><p className="detail-long-copy">{copy.details || copy.description}</p></div>
          <div className="detail-section-block feature-block"><span className="section-kicker"><span>02</span> / {t('keyFeatures')}</span><h2>{t('keyFeatures')}</h2><div className="feature-list">{(copy.features || []).map((feature, i) => <div key={`${feature}-${i}`} className="feature-row"><span className="feature-check"><Check size={14} /></span><span>{feature}</span><small>{String(i + 1).padStart(2, '0')}</small></div>)}</div></div>
          <div className="detail-section-block"><span className="section-kicker"><span>03</span> / {t('watchDemo')}</span><h2>{t('watchDemo')}</h2>
            {videoEmbed ? <div className="video-frame"><iframe src={videoEmbed} title={`${copy.title} demo`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div> : isMp4 ? <video className="video-frame video-native" src={videoUrl} controls preload="metadata" /> : videoUrl ? <a className="video-link-card" href={videoUrl} target="_blank" rel="noreferrer"><Video size={22} /><span>{t('watchDemo')}</span><ArrowUpRight size={17} /></a> : null}
            {!videoUrl && !project.galleryImages?.length && <div className="video-not-added"><Video size={22} /><span>{t('noVideoYet')}</span></div>}
            {project.galleryImages?.length > 0 && <div className="detail-gallery">{project.galleryImages.map((image, index) => <img key={`${image}-${index}`} src={mediaUrl(image)} alt={`${copy.title} — ${index + 1}`} loading="lazy" />)}</div>}
          </div>
        </section>
        <aside className="detail-sidebar">
          <div className="detail-info-card"><span className="section-kicker"><span>04</span> / {t('technologies')}</span><h3>{t('technologies')}</h3><div className="detail-tech-list">{(project.technologies || []).length ? project.technologies.map(tech => <span key={tech}>{tech}</span>) : <span>{t('emptySetting')}</span>}</div><div className="sidebar-divider" /><span className="sidebar-label">{t('pricing')}</span><p className="pricing-copy">{copy.pricingLabel || t('requestQuote')}</p><MailLink email={settings.contactEmail || fallbackSettings.contactEmail} subject={quoteSubject} className="button button-dark button-full">{t('requestQuote')} <ArrowUpRight size={15} /></MailLink></div>
          <div className="detail-contact-note"><span className="detail-contact-icon"><Play size={15} /></span><p>{t('contactText')}</p><MailLink email={settings.contactEmail || fallbackSettings.contactEmail}>{settings.contactEmail || fallbackSettings.contactEmail}<ArrowUpRight size={14} /></MailLink></div>
        </aside>
      </div>
    </main>
    <SiteFooter settings={settings} />
  </>;
}
