import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Fingerprint, Globe2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AdminLoginPage() {
  const { t, language, languageNames, changeLanguage } = useLanguage();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await login({ email, password }); navigate('/admin', { replace: true }); }
    catch (err) { setError(err.message || 'Connexion impossible.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" />
    <div className="auth-topbar"><Link to="/" className="brand"><span className="brand-mark"><span>LM</span><i /></span><span className="brand-wordmark"><strong>LOBNA MAALEJ</strong><small>WEB DEVELOPER <em>&</em> DATA SOLUTIONS</small></span></Link><div className="auth-top-actions"><label className="auth-language" title="Language"><Globe2 size={13} /><select value={language} onChange={event => changeLanguage(event.target.value)} aria-label="Language">{['fr','en','pt','es'].map(code => <option key={code} value={code}>{languageNames[code]}</option>)}</select></label><Link to="/" className="auth-back"><ArrowLeft size={15} />{t('backSite')}</Link></div></div>
    <div className="auth-main">
      <motion.div className="auth-visual" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .55 }}>
        <span className="section-kicker section-kicker-light"><span>{t('authPrivateArea')}</span> / LM STUDIO</span>
        <div className="auth-shield"><ShieldCheck size={34} strokeWidth={1.2} /><span /></div>
        <h1>{t('authHeadlineA')}<br /><span>{t('authHeadlineB')}</span></h1>
        <p>{t('authVisualLead')}</p>
        <div className="auth-visual-foot"><span><Fingerprint size={15} /> {t('authAdminOnly')}</span><span>{t('authSession')}</span></div>
      </motion.div>
      <motion.section className="auth-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .08 }}>
        <div className="auth-card-icon"><LockKeyhole size={20} /></div><span className="auth-overline">{t('authControlPanel')}</span><h2>{t('loginTitle')}</h2><p>{t('loginLead')}</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>{t('email')}<input autoComplete="username" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="admin@example.com" /></label>
          <label>{t('password')}<span className="password-field"><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••••••" /><button type="button" className="show-password" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-dark button-full auth-submit" type="submit" disabled={busy}>{busy ? t('loggingIn') : t('login')} <ArrowUpRight size={17} /></button>
        </form>
        <div className="auth-security-note"><ShieldCheck size={15} /><span>{t('authPrivateMessage')}</span></div>
      </motion.section>
    </div>
    <div className="auth-bottom"><span>© {new Date().getFullYear()} LOBNA MAALEJ</span><span>DESIGNED FOR CLARITY <i>✳</i></span></div>
  </main>;
}
