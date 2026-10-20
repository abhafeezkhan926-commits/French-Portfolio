import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

function copyText(text) {
  const legacy = () => new Promise((resolve, reject) => {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy') ? resolve() : reject(new Error('copy refused')); } catch (error) { reject(error); } finally { area.remove(); }
  });
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).catch(legacy);
  return legacy();
}

export default function MailLink({ email, subject, className, children, ...rest }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const href = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  const handleClick = () => {
    copyText(email).then(() => {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2600);
    }).catch(() => { });
  };
  return <>
    <a href={href} className={className} onClick={handleClick} {...rest}>{children}</a>
    {copied && <div className="copy-toast" role="status"><span>✓</span>{t('emailCopied')}<strong>{email}</strong></div>}
  </>;
}
