import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Braces, CircleCheck, Code2, Database, Globe2, MessageCircle, MousePointer2, Sparkles, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';
import { fallbackProjects, fallbackSettings } from '../lib/fallbackProjects';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import ProjectCard from '../components/ProjectCard';
import GlitchText from '../components/GlitchText';
import MailLink from '../components/MailLink';

const reveal = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] } } };

export default function HomePage() {
  const { t, language } = useLanguage();
  const [projects, setProjects] = useState(fallbackProjects);
  const [settings, setSettings] = useState(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([apiRequest('/api/projects'), apiRequest('/api/settings')]).then(([projectResult, settingsResult]) => {
      if (!active) return;
      if (projectResult.status === 'fulfilled' && Array.isArray(projectResult.value.projects)) {
        setProjects(projectResult.value.projects);
        setApiAvailable(true);
      } else {
        setApiAvailable(false);
      }
      if (settingsResult.status === 'fulfilled' && settingsResult.value.settings) setSettings(settingsResult.value.settings);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 140);
    }
  }, []);

  const featuredProjects = useMemo(() => projects.filter(project => project.status === 'published').sort((a, b) => Number(a.order || 100) - Number(b.order || 100)), [projects]);
  const featuredCount = useMemo(() => featuredProjects.filter(project => project.featured).length, [featuredProjects]);
  const contactEmail = settings.contactEmail || fallbackSettings.contactEmail;
  const whatsappDigits = String(settings.whatsapp || '').replace(/[^0-9]/g, '');
  const updateContact = (field, value) => setContactForm(current => ({ ...current, [field]: value }));
  async function submitContact(event) {
    event.preventDefault();
    setSending(true); setSendError(''); setSent(false);
    try {
      await apiRequest('/api/messages', { method: 'POST', body: contactForm });
      setSent(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
      window.setTimeout(() => setSent(false), 6000);
    } catch (error) {
      setSendError(error.message);
    } finally { setSending(false); }
  }

  return <>
    <SiteHeader />
    <main id="top">
      <section className="hero-section page-shell">
        <div className="hero-copy">
          <motion.div className="eyebrow-pill" initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}><span className="status-dot" />{t('eyebrow')}</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .05, ease: [0.22, 1, 0.36, 1] }}><span><GlitchText>{t('heroTitleA')}</GlitchText></span><span><GlitchText>{t('heroTitleB')}</GlitchText></span><span className="hero-title-accent"><GlitchText>{t('heroTitleC')}</GlitchText></span></motion.h1>
          <motion.p className="hero-lead" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .18 }}>{t('heroLead')}</motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 13 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .24 }}>
            <a href="#projects" className="button button-dark">{t('exploreProjects')} <ArrowRight size={17} /></a>
            <MailLink email={contactEmail} subject={t('quoteSubject')} className="button button-quiet">{t('discussProject')} <ArrowUpRight size={17} /></MailLink>
          </motion.div>
          <motion.div className="hero-trust-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .48 }}>
            <div className="tiny-avatars"><span>L</span><span><Code2 size={12} /></span><span><BarChart3 size={12} /></span></div>
            <div><strong>{settings.availability === false ? t('basedIn') : t('availability')}</strong><small>{settings.location || t('basedIn')}</small></div>
          </motion.div>
        </div>
        <motion.div className="hero-visual" initial={{ opacity: 0, scale: .96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .8, delay: .12, ease: [0.22, 1, 0.36, 1] }}>
          <div className="hero-visual-grid" />
          <div className="hero-orb orb-lime" />
          <div className="hero-orb orb-lilac" />
          <div className="floating-note note-top"><span className="note-icon note-icon-lime"><Workflow size={15} /></span><span><small>BUILD / 01</small><strong>Web platforms</strong></span><CircleCheck size={16} className="note-check" /></div>
          <div className="hero-console">
            <div className="console-topbar"><span className="console-dot" /><span className="console-dot" /><span className="console-dot" /><span className="console-path">lobna / solutions</span><span className="console-live">LIVE</span></div>
            <div className="console-content">
              <div className="console-overline">DIGITAL ECOSYSTEM <span>↗</span></div>
              <div className="console-big-type">Ideas<span>.</span><br />into impact<span>.</span></div>
              <div className="console-divider" />
              <div className="console-rows"><div><span className="console-symbol"><Braces size={14} /></span><span>Web development</span><small>01</small></div><div><span className="console-symbol"><Database size={14} /></span><span>Data & intelligence</span><small>02</small></div><div><span className="console-symbol"><BarChart3 size={14} /></span><span>Business insights</span><small>03</small></div></div>
              <div className="console-bottom"><span>FR / EN / PT / ES</span><span className="console-wave">⌁⌁⌁⌁⌁⌁</span></div>
            </div>
          </div>
          <div className="floating-note note-bottom"><span className="note-icon note-icon-violet"><Sparkles size={15} /></span><span><small>DATA / 02</small><strong>Insights that matter</strong></span><ArrowUpRight size={16} className="note-check" /></div>
          <div className="hero-visual-caption"><span>01—{String(Math.max(featuredCount, 3)).padStart(2, '0')}</span><span>WEB · DATA · IMPACT</span></div>
        </motion.div>
        <a href="#projects" className="scroll-cue"><span><MousePointer2 size={14} /></span><small>{t('scrollToExplore')}</small><ArrowDown size={14} /></a>
      </section>

      <section className="about-section section-pad" id="about">
        <div className="page-shell about-panel">
          <div className="about-symbol"><div className="about-symbol-ring ring-a" /><div className="about-symbol-ring ring-b" /><div className="about-symbol-center">LM<span>✳</span></div><span className="about-symbol-label">WEB / DATA<br />SOLUTION STUDIO</span></div>
          <div className="about-copy"><span className="section-kicker"><span>02</span> / {t('aboutLabel')}</span><h2><GlitchText>{t('aboutTitle')}</GlitchText></h2><p>{t('aboutText')}</p><div className="about-capabilities"><span><Code2 size={14} /> Full-stack web</span><span><BarChart3 size={14} /> Business intelligence</span><span><Globe2 size={14} /> International delivery</span></div></div>
        </div>
      </section>

      <section className="projects-section section-pad" id="projects">
        <div className="page-shell">
          <motion.div className="section-heading section-heading-split" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .4 }}>
            <div><span className="section-kicker"><span>03</span> / {t('selectedWork')}</span><h2><GlitchText>{t('projectsTitle')}</GlitchText></h2></div>
            <div className="section-heading-aside"><p>{t('projectsLead')}</p><span className="live-counter"><i /> {String(featuredProjects.length).padStart(2, '0')} {t('project')}</span></div>
          </motion.div>
          {loading && <div className="loading-line"><span className="loading-dot" />{t('loading')}</div>}
          {!apiAvailable && <div className="preview-notice"><span className="notice-symbol">i</span><span>{language === 'fr' ? 'Aperçu local affiché. Connectez MongoDB pour activer la gestion persistante.' : language === 'pt' ? 'Pré-visualização local. Conecte o MongoDB para ativar a gestão persistente.' : language === 'es' ? 'Vista previa local. Conecta MongoDB para activar la gestión persistente.' : 'Showing local preview. Connect MongoDB to enable persistent management.'}</span></div>}
          {featuredProjects.length > 0 ? <div className="projects-grid">{featuredProjects.map((project, index) => <ProjectCard key={project._id || project.slug} project={project} index={index} />)}</div> : <div className="empty-state">{t('errorLoading')}</div>}
        </div>
      </section>

      <section className="approach-section section-pad" id="approach">
        <div className="page-shell approach-layout">
          <motion.div className="approach-intro" variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }}>
            <span className="section-kicker"><span>04</span> / {t('methodLabel')}</span><h2><GlitchText>{t('methodTitle')}</GlitchText></h2><p>{t('methodLead')}</p><MailLink email={contactEmail} subject={t('quoteSubject')} className="inline-arrow-link">{t('discussProject')} <ArrowUpRight size={16} /></MailLink>
          </motion.div>
          <div className="approach-cards">
            <motion.article variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} className="approach-card"><span className="approach-number">01</span><div className="approach-icon icon-emerald"><MousePointer2 size={19} /></div><h3>{t('method1Title')}</h3><p>{t('method1Text')}</p><div className="approach-bottom-line" /></motion.article>
            <motion.article variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} transition={{ delay: .08 }} className="approach-card"><span className="approach-number">02</span><div className="approach-icon icon-violet"><Braces size={19} /></div><h3>{t('method2Title')}</h3><p>{t('method2Text')}</p><div className="approach-bottom-line" /></motion.article>
            <motion.article variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .3 }} transition={{ delay: .16 }} className="approach-card"><span className="approach-number">03</span><div className="approach-icon icon-orange"><BarChart3 size={19} /></div><h3>{t('method3Title')}</h3><p>{t('method3Text')}</p><div className="approach-bottom-line" /></motion.article>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-grid-bg" />
        <div className="page-shell contact-layout">
          <motion.div className="contact-main" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .55 }}>
            <span className="section-kicker section-kicker-light"><span>05</span> / {t('contactLabel')}</span><h2><GlitchText>{t('contactTitle')}</GlitchText></h2><p>{t('contactText')}</p>
            <form className="contact-form" onSubmit={submitContact}>
              <div className="contact-form-row">
                <label>{t('formName')}<input required maxLength={120} value={contactForm.name} onChange={event => updateContact('name', event.target.value)} placeholder="Lobna Maalej" autoComplete="name" /></label>
                <label>{t('formEmail')}<input required type="email" value={contactForm.email} onChange={event => updateContact('email', event.target.value)} placeholder="vous@exemple.com" autoComplete="email" /></label>
              </div>
              <label>{t('formPhone')}<input type="tel" maxLength={40} value={contactForm.phone} onChange={event => updateContact('phone', event.target.value)} placeholder="+216 …" autoComplete="tel" /></label>
              <label>{t('formMessage')}<textarea required rows={4} maxLength={4000} value={contactForm.message} onChange={event => updateContact('message', event.target.value)} placeholder={t('contactText')} /></label>
              <button className="button button-lime" type="submit" disabled={sending}>{sending ? t('saving') : t('formSend')} <ArrowUpRight size={16} /></button>
              {sent && <p className="contact-form-success" role="status"><CircleCheck size={15} /> {t('formSent')}</p>}
              {sendError && <p className="contact-form-error" role="alert">{sendError}</p>}
            </form>
          </motion.div>
          <div className="contact-side"><div className="contact-mini-card"><span className="contact-mini-icon"><MessageCircle size={17} /></span><div><small>{t('navContact')}</small><MailLink email={contactEmail}>{contactEmail}</MailLink></div><ArrowUpRight size={16} /></div><div className="contact-mini-card"><span className="contact-mini-icon"><Globe2 size={17} /></span><div><small>{t('basedIn')}</small><strong>{settings.location || fallbackSettings.location}</strong></div></div>{whatsappDigits && <a className="contact-mini-card" href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer"><span className="contact-mini-icon"><MessageCircle size={17} /></span><div><small>WhatsApp</small><strong>{settings.whatsapp}</strong></div><ArrowUpRight size={16} /></a>}<span className="contact-response"><span className="status-dot" />{settings.responseNote || t('responseNote')}</span></div>
        </div>
      </section>
    </main>
    <SiteFooter settings={settings} />
  </>;
}
