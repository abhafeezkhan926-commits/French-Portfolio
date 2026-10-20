import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowDownUp, ArrowLeft, ArrowUpRight, BadgeCheck, Check, CirclePlus, Clock3, Edit3, ExternalLink, Globe2, LayoutDashboard, LogOut, PencilLine, Plus, Search, Settings2, ShieldCheck, Trash2, UploadCloud, X } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest, mediaUrl, safeExternalUrl } from '../lib/api';
import { fallbackSettings } from '../lib/fallbackProjects';
import NotificationBell from '../components/NotificationBell';

const locales = [
  { key: 'fr', label: 'FR', name: 'Français' },
  { key: 'en', label: 'EN', name: 'English' },
  { key: 'pt', label: 'PT-BR', name: 'Português (Brasil)' },
  { key: 'es', label: 'ES', name: 'Español' }
];
const blankContent = () => Object.fromEntries(locales.map(locale => [locale.key, { title: '', tagline: '', description: '', details: '', features: [], pricingLabel: '' }]));
const blankProject = () => ({ slug: '', category: 'other', status: 'published', featured: false, order: 10, content: blankContent(), technologies: [], repositoryUrl: '', documentationUrl: '', demoUrl: '', videoUrl: '', coverImage: '', galleryImages: [] });
function toSlug(value) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function statusText(status, t) { return status === 'published' ? t('publishedStatus') : status === 'coming-soon' ? t('comingStatus') : t('draftStatus'); }

function ProjectEditor({ initialProject, onClose, onSaved, token }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => ({ ...blankProject(), ...(initialProject || {}), content: { ...blankContent(), ...(initialProject?.content || {}) }, technologies: initialProject?.technologies || [], galleryImages: initialProject?.galleryImages || [] }));
  const [activeLocale, setActiveLocale] = useState('fr');
  const [coverFile, setCoverFile] = useState(null);
  const coverPreview = useMemo(() => coverFile ? URL.createObjectURL(coverFile) : '', [coverFile]);
  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(initialProject?._id);
  const localeContent = form.content?.[activeLocale] || {};

  const setField = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const setLocalized = (field, value) => setForm(current => ({ ...current, content: { ...current.content, [activeLocale]: { ...current.content[activeLocale], [field]: value } } }));

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('slug', form.slug || toSlug(form.content?.fr?.title || 'nouveau-projet'));
      fd.append('category', form.category);
      fd.append('status', form.status);
      fd.append('featured', String(form.featured));
      fd.append('order', String(Number(form.order || 100)));
      fd.append('content', JSON.stringify(form.content));
      fd.append('technologies', JSON.stringify(Array.isArray(form.technologies) ? form.technologies : []));
      fd.append('repositoryUrl', form.repositoryUrl || '');
      fd.append('documentationUrl', form.documentationUrl || '');
      fd.append('demoUrl', form.demoUrl || '');
      fd.append('videoUrl', form.videoUrl || '');
      fd.append('coverImage', form.coverImage || '');
      fd.append('galleryImages', JSON.stringify(form.galleryImages || []));
      if (coverFile) fd.append('coverImage', coverFile);
      const result = await apiRequest(isEditing ? `/api/projects/${initialProject._id}` : '/api/projects', { method: isEditing ? 'PUT' : 'POST', body: fd, isForm: true, token });
      onSaved(result.project);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <div className="modal-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.section className="editor-modal" initial={{ opacity: 0, y: 18, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14 }} transition={{ duration: .22 }} role="dialog" aria-modal="true" aria-labelledby="editor-heading">
      <div className="editor-header"><div><span className="admin-eyebrow">CONTENT STUDIO / PROJECT EDITOR</span><h2 id="editor-heading">{isEditing ? t('edit') : t('addProject')}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label={t('close')}><X size={19} /></button></div>
      <form onSubmit={submit} className="editor-form">
        <div className="editor-form-body">
          <section className="editor-section"><div className="editor-section-head"><span className="editor-step">01</span><div><h3>{t('translationFields')}</h3><p>Ajoutez les textes dans les quatre langues du portfolio.</p></div></div>
            <div className="locale-tabs">{locales.map(item => <button key={item.key} className={activeLocale === item.key ? 'active' : ''} type="button" onClick={() => setActiveLocale(item.key)}>{item.label}<small>{item.name}</small></button>)}</div>
            <div className="form-grid"><label className="field-wide">{t('title')} ({locales.find(item => item.key === activeLocale)?.label})<input required={activeLocale === 'fr'} value={localeContent.title || ''} onChange={event => { const value = event.target.value; setLocalized('title', value); if (activeLocale === 'fr' && !isEditing) setField('slug', toSlug(value)); }} placeholder={activeLocale === 'fr' ? 'Printer Store' : 'Project title'} /></label>
              <label className="field-wide">{t('description')}<textarea required={activeLocale === 'fr'} rows="3" value={localeContent.description || ''} onChange={event => setLocalized('description', event.target.value)} placeholder="Décrivez la solution en quelques phrases…" /></label>
            </div>
          </section>
          <section className="editor-section"><div className="editor-section-head"><span className="editor-step">02</span><div><h3>{t('projectLinks')}</h3><p>Les liens sont distincts : la démo ne s’affiche que si son URL est renseignée.</p></div></div>
            <div className="form-grid"><label className="field-wide">{t('demoUrl')}<input type="url" value={form.demoUrl || ''} onChange={event => setField('demoUrl', event.target.value)} placeholder="https://your-live-demo.com" /></label>
              <label className="field-wide">{t('repositoryUrl')}<input type="url" value={form.repositoryUrl || ''} onChange={event => setField('repositoryUrl', event.target.value)} placeholder="https://github.com/..." /></label>
            </div>
          </section>
          <section className="editor-section"><div className="editor-section-head"><span className="editor-step">03</span><div><h3>{t('media')}</h3><p>JPG, PNG, WEBP, AVIF ou GIF · 12 Mo max. par image.</p></div></div>
            <div className="upload-grid" style={{ gridTemplateColumns: '1fr' }}><label className="upload-tile"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={event => setCoverFile(event.target.files?.[0] || null)} /><span className="upload-preview">{coverFile ? <img src={coverPreview} alt="Preview" /> : form.coverImage ? <img src={mediaUrl(form.coverImage)} alt="Current cover" /> : <UploadCloud size={23} />}</span><strong>{t('coverImage')}</strong><small>{coverFile?.name || t('replaceCover')}</small></label></div>
            {(form.coverImage && !coverFile) && <button className="remove-media-link" type="button" onClick={() => setField('coverImage', '')}><X size={12} /> Retirer l’image principale actuelle</button>}
          </section>
          {error && <div className="form-error editor-error" role="alert">{error}</div>}
        </div>
        <div className="editor-footer"><span className="editor-foot-note"><ShieldCheck size={14} /> Modifications enregistrées dans MongoDB</span><div><button className="button button-quiet" type="button" onClick={onClose}>{t('cancel')}</button><button className="button button-dark" type="submit" disabled={busy}>{busy ? t('saving') : isEditing ? t('update') : t('create')} <ArrowUpRight size={15} /></button></div></div>
      </form>
    </motion.section>
  </div>;
}

function SettingsEditor({ settings, onSaved, token }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ ...fallbackSettings, ...(settings || {}) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await apiRequest('/api/settings', { method: 'PUT', body: form, token });
      onSaved(result.settings);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <motion.section className="settings-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <div className="admin-content-header"><div><span className="admin-eyebrow">SITE CONFIGURATION / 01</span><h2>{t('settingsTab')}</h2><p>Gérez les informations publiques et les canaux de contact du portfolio.</p></div><div className="settings-mark"><Settings2 size={22} /></div></div>
    <form className="settings-form" onSubmit={submit}>
      <div className="settings-group-head"><span><Globe2 size={16} /></span><div><strong>Présence & disponibilité</strong><small>Informations utilisées dans l’en-tête, le pied de page et la section contact.</small></div></div>
      <div className="form-grid"><label className="field-wide">{t('contactEmail')}<input type="email" required value={form.contactEmail || ''} onChange={event => set('contactEmail', event.target.value)} /></label><label className="field-wide">{t('whatsapp')}<input value={form.whatsapp || ''} onChange={event => set('whatsapp', event.target.value)} placeholder="+216…" /></label><label>{t('location')}<input value={form.location || ''} onChange={event => set('location', event.target.value)} /></label><label>{t('responseNoteField')}<input value={form.responseNote || ''} onChange={event => set('responseNote', event.target.value)} /></label><label>{t('linkedinUrl')}<input type="url" value={form.linkedinUrl || ''} onChange={event => set('linkedinUrl', event.target.value)} placeholder="https://linkedin.com/in/…" /></label><label>{t('githubUrl')}<input type="url" value={form.githubUrl || ''} onChange={event => set('githubUrl', event.target.value)} placeholder="https://github.com/…" /></label></div>
      <label className="check-control settings-availability"><input type="checkbox" checked={form.availability !== false} onChange={event => set('availability', event.target.checked)} /><span className="custom-check"><Check size={12} /></span>{t('availableForWork')}</label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="settings-save-row"><span><ShieldCheck size={15} /> {t('settingsSaved')}</span><button className="button button-dark" disabled={busy} type="submit">{busy ? t('saving') : t('saveSettings')} <ArrowUpRight size={15} /></button></div>
    </form>
  </motion.section>;
}

export default function AdminPage() {
  const { t, language, changeLanguage, languageNames } = useLanguage();
  const { isAuthenticated, token, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [settings, setSettings] = useState(fallbackSettings);
  const [activeTab, setActiveTab] = useState('projects');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const showToast = useCallback(message => { setToast(message); window.setTimeout(() => setToast(''), 2800); }, []);
  const handleIncoming = useCallback(() => showToast(t('newMessageToast')), [showToast, t]);
  const loadData = useCallback(async () => {
    setLoading(true); setPageError('');
    const [projectsResult, settingsResult] = await Promise.allSettled([
      apiRequest('/api/projects/admin/all', { token }), apiRequest('/api/settings')
    ]);
    if (projectsResult.status === 'fulfilled') setProjects(projectsResult.value.projects || []);
    else {
      setPageError(projectsResult.reason?.message || 'Chargement impossible.');
      if (/Authentification|Session expirée|401|403/i.test(projectsResult.reason?.message || '')) { logout(); navigate('/admin/login', { replace: true }); }
    }
    if (settingsResult.status === 'fulfilled' && settingsResult.value.settings) setSettings(settingsResult.value.settings);
    setLoading(false);
  }, [token, logout, navigate]);

  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated, loadData]);
  const filteredProjects = useMemo(() => projects.filter(project => {
    const copy = project.content?.[language] || project.content?.fr || {};
    const matchesSearch = `${copy.title || ''} ${project.slug || ''} ${(project.technologies || []).join(' ')}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === 'all' || project.status === statusFilter);
  }), [projects, search, statusFilter, language]);
  const publishedCount = useMemo(() => projects.filter(project => project.status === 'published').length, [projects]);
  const draftCount = useMemo(() => projects.filter(project => project.status !== 'published').length, [projects]);

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  const openCreate = () => { setEditingProject(null); setEditorOpen(true); };
  const openEdit = project => { setEditingProject(project); setEditorOpen(true); };
  async function deleteProject(project) {
    const title = project.content?.[language]?.title || project.content?.fr?.title || project.slug;
    if (!window.confirm(`${t('confirmDelete')}\n\n${title}`)) return;
    setDeletingId(project._id);
    try {
      await apiRequest(`/api/projects/${project._id}`, { method: 'DELETE', token });
      setProjects(current => current.filter(item => item._id !== project._id)); showToast(t('projectDeleted'));
    } catch (error) { showToast(error.message); }
    finally { setDeletingId(''); }
  }
  function handleSavedProject(saved) {
    setProjects(current => {
      const exists = current.some(item => item._id === saved._id);
      return exists ? current.map(item => item._id === saved._id ? saved : item).sort((a, b) => Number(a.order || 100) - Number(b.order || 100)) : [...current, saved].sort((a, b) => Number(a.order || 100) - Number(b.order || 100));
    });
    setEditorOpen(false); setEditingProject(null); showToast(t('projectSaved'));
  }
  function handleSavedSettings(saved) { setSettings(saved); showToast(t('settingsSaved')); }
  function signOut() { logout(); navigate('/admin/login', { replace: true }); }

  return <div className="admin-app">
    <aside className="admin-sidebar">
      <Link to="/" className="brand admin-brand"><span className="brand-mark"><span>LM</span><i /></span><span className="brand-wordmark"><strong>LOBNA MAALEJ</strong><small>CONTROL STUDIO</small></span></Link>
      <div className="admin-sidebar-label">WORKSPACE</div>
      <button className={`admin-side-link ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}><LayoutDashboard size={17} /><span>{t('projectsTab')}</span><span className="side-count">{projects.length}</span></button>
      <button className={`admin-side-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings2 size={17} /><span>{t('settingsTab')}</span></button>
      <div className="admin-sidebar-spacer" />
      <div className="admin-profile-card"><span className="admin-avatar">LM</span><div><strong>Administrator</strong><small>Private account</small></div><BadgeCheck size={15} /></div>
      <button className="admin-side-link admin-logout" onClick={signOut}><LogOut size={17} /><span>{t('logout')}</span></button>
      <Link to="/" className="view-site-link"><ArrowLeft size={15} /> {t('backSite')}</Link>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><div className="breadcrumb"><span>WORKSPACE</span><span>/</span><strong>{activeTab === 'projects' ? t('dashboard') : t('settingsTab')}</strong></div><div className="admin-top-actions"><NotificationBell token={token} onNewMessage={handleIncoming} /><span className="admin-system-status"><i /> API / MONGODB</span><label className="admin-lang-switch" title="Language"><Globe2 size={13} /><select value={language} onChange={event => changeLanguage(event.target.value)} aria-label="Language">{['fr','en','pt','es'].map(code => <option key={code} value={code}>{languageNames[code]}</option>)}</select></label><Link to="/" target="_blank" className="admin-view-link">VIEW SITE <ArrowUpRight size={14} /></Link></div></header>
      <div className="admin-content">
        {activeTab === 'projects' ? <>
          <div className="admin-content-header"><div><span className="admin-eyebrow">CONTENT MANAGEMENT / 01</span><h1>{t('dashboard')}<span className="admin-title-period">.</span></h1><p>Gérez les projets présentés sur le site public, leur contenu, leurs médias et leurs liens.</p></div><button className="button button-dark admin-add-button" onClick={openCreate}><CirclePlus size={16} /> {t('addProject')}</button></div>
          <div className="admin-stats-grid"><div className="admin-stat-card"><span className="admin-stat-icon"><LayoutDashboard size={17} /></span><small>{t('projectsManaged')}</small><strong>{String(projects.length).padStart(2, '0')}</strong><span className="stat-footer">TOTAL / CMS</span></div><div className="admin-stat-card"><span className="admin-stat-icon stat-green"><BadgeCheck size={17} /></span><small>{t('published')}</small><strong>{String(publishedCount).padStart(2, '0')}</strong><span className="stat-footer"><i className="green-indicator" /> PUBLIC VISIBILITY</span></div><div className="admin-stat-card"><span className="admin-stat-icon stat-orange"><Clock3 size={17} /></span><small>{t('drafts')}</small><strong>{String(draftCount).padStart(2, '0')}</strong><span className="stat-footer">DRAFT / PLANNED</span></div><div className="admin-stat-card"><span className="admin-stat-icon stat-blue"><Activity size={17} /></span><small>MEDIA & LINKS</small><strong>{String(projects.filter(p => p.demoUrl || p.coverImage || p.videoUrl).length).padStart(2, '0')}</strong><span className="stat-footer">ASSETS AVAILABLE</span></div></div>
          <section className="project-manager-panel"><div className="manager-panel-head"><div><span className="admin-eyebrow">COLLECTION / DATABASE</span><h2>{t('projectsManaged')} <span>{projects.length}</span></h2></div><button className="button button-outline admin-small-add" onClick={openCreate}><Plus size={15} /> {t('addProject')}</button></div>
            <div className="project-filters"><label className="admin-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('searchProjects')} /></label><label className="filter-select"><ArrowDownUp size={14} /><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">{t('allStatuses')}</option><option value="published">{t('publishedStatus')}</option><option value="draft">{t('draftStatus')}</option><option value="coming-soon">{t('comingStatus')}</option></select></label></div>
            {pageError && <div className="form-error admin-page-error">{pageError}<button onClick={loadData}>Réessayer</button></div>}
            {loading ? <div className="admin-loading"><span className="loading-dot" />Chargement de la base de données…</div> : filteredProjects.length ? <div className="admin-project-list">{filteredProjects.map((project, index) => {
              const copy = project.content?.[language] || project.content?.fr || {};
              return <motion.article key={project._id} className="admin-project-row" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(index * .025, .15) }}>
                <div className="admin-project-thumb">{project.coverImage ? <img src={mediaUrl(project.coverImage)} alt="" /> : <span className={`admin-thumb-placeholder thumb-${project.category}`}><PencilLine size={18} /></span>}</div>
                <div className="admin-project-info"><div className="admin-project-title-line"><h3>{copy.title || project.slug}</h3><span className={`status-chip status-${project.status}`}>{statusText(project.status, t)}</span>{project.featured && <span className="featured-chip">FEATURED</span>}</div><p>{copy.description || 'Aucune description renseignée.'}</p><div className="admin-project-meta"><span>/{project.slug}</span><span>{(project.technologies || []).slice(0, 3).join(' · ') || 'No tech tags'}</span></div></div>
                <div className="admin-project-links">{project.demoUrl && safeExternalUrl(project.demoUrl) && <a href={project.demoUrl} target="_blank" rel="noreferrer" title={t('liveDemo')}><ExternalLink size={15} /></a>}{project.repositoryUrl && safeExternalUrl(project.repositoryUrl) && <a href={project.repositoryUrl} target="_blank" rel="noreferrer" title={t('repo')}><Globe2 size={15} /></a>}</div>
                <div className="admin-project-actions"><button onClick={() => openEdit(project)} title={t('edit')} aria-label={t('edit')}><Edit3 size={16} /></button><button className="delete-action" onClick={() => deleteProject(project)} disabled={deletingId === project._id} title={t('delete')} aria-label={t('delete')}><Trash2 size={16} /></button></div>
              </motion.article>;
            })}</div> : <div className="admin-empty-state"><Search size={25} /><strong>{t('noProjects')}</strong><button className="button button-outline" onClick={openCreate}><Plus size={15} />{t('addProject')}</button></div>}
            <div className="manager-panel-footer"><span>SHOWING {filteredProjects.length} OF {projects.length} PROJECTS</span><span><span className="green-indicator" /> DATABASE SYNC READY</span></div>
          </section>
        </> : <SettingsEditor settings={settings} onSaved={handleSavedSettings} token={token} />}
      </div>
    </main>
    <AnimatePresence>{editorOpen && <ProjectEditor key={editingProject?._id || 'new'} initialProject={editingProject} onClose={() => { setEditorOpen(false); setEditingProject(null); }} onSaved={handleSavedProject} token={token} />}</AnimatePresence>
    <AnimatePresence>{toast && <motion.div className="admin-toast" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}><span><Check size={15} /></span>{toast}</motion.div>}</AnimatePresence>
  </div>;
}
