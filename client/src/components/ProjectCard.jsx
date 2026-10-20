import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Code2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { mediaUrl, safeExternalUrl } from '../lib/api';
import ProjectArtwork from './ProjectArtwork';
import GlitchText from './GlitchText';

const categoryLabels = {
  'printer-store': 'catPrinter', travel: 'catTravel', 'power-bi': 'catPower', sponsorship: 'catSponsorship', solar: 'catSolar', healthcare: 'catHealthcare', other: 'catOther'
};

export default function ProjectCard({ project, index = 0, isUpcoming = false }) {
  const { t, language } = useLanguage();
  const copy = project.content?.[language] || project.content?.fr || {};
  const demoUrl = safeExternalUrl(project.demoUrl);
  const cover = mediaUrl(project.coverImage);
  const repositoryUrl = safeExternalUrl(project.repositoryUrl);
  return <motion.article className={`project-card ${isUpcoming ? 'upcoming-card' : ''}`} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.16 }} transition={{ duration: 0.48, delay: Math.min(index * 0.08, 0.24), ease: [0.22, 1, 0.36, 1] }}>
    <div className="project-card-visual">
      {cover ? <img src={cover} alt={copy.title || 'Project cover'} loading="lazy" /> : <ProjectArtwork project={project} />}
      <div className="visual-top-line"><span className="category-tag">{t(categoryLabels[project.category] || 'catOther')}</span>{project.featured && <span className="featured-tag">✳ {t('featured')}</span>}</div>
      {isUpcoming && <span className="coming-soon-tag">{t('soon')}</span>}
      <Link to={`/projects/${project.slug}`} className="project-quick-open" aria-label={`${t('viewProject')}: ${copy.title}`}><ArrowUpRight size={21} /></Link>
    </div>
    <div className="project-card-copy">
      <div className="project-card-heading"><div><span className="project-number">PROJECT / {String(index + 1).padStart(2, '0')}</span><h3><GlitchText>{copy.title || 'Untitled project'}</GlitchText></h3></div><Link to={`/projects/${project.slug}`} className="circle-arrow" aria-label={t('viewProject')}><ArrowDownRight size={19} /></Link></div>
      <p className="project-tagline">{copy.tagline}</p>
      <p className="project-description">{copy.description}</p>
      <div className="tech-list">{(project.technologies || []).slice(0, 4).map(tech => <span key={tech}>{tech}</span>)}{(project.technologies || []).length > 4 && <span>+{project.technologies.length - 4}</span>}</div>
      <div className="project-card-bottom">
        <div className="project-quick-actions">
          {demoUrl ? <a href={demoUrl} className="button project-action-button project-action-live" target="_blank" rel="noreferrer"><Play size={12} /> {t('liveDemo')} <ArrowUpRight size={12} /></a> : <button type="button" className="button button-disabled project-action-button" title={t('noDemo')} disabled><Play size={12} /> {t('liveDemo')}</button>}
          {repositoryUrl ? <a href={repositoryUrl} className="button project-action-button project-action-source" target="_blank" rel="noreferrer"><Code2 size={12} /> {t('sourceCode')} <ArrowUpRight size={12} /></a> : <button type="button" className="button button-disabled project-action-button" title={t('sourceCode')} disabled><Code2 size={12} /> {t('sourceCode')}</button>}
        </div>
        <Link to={`/projects/${project.slug}`} className="text-link">{t('viewProject')} <ArrowUpRight size={15} /></Link>
      </div>
    </div>
  </motion.article>;
}
