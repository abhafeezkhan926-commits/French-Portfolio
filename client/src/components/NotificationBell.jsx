import { useEffect, useRef, useState } from 'react';
import { Bell, MessageCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';

export default function NotificationBell({ token, onNewMessage }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [live, setLive] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    apiRequest('/api/messages', { token }).then(data => {
      if (!active) return;
      setMessages(data.messages || []);
      setUnread(data.unread || 0);
    }).catch(() => { });

    const socket = io({ auth: { token } });
    socketRef.current = socket;
    socket.on('connect', () => setLive(true));
    socket.on('disconnect', () => setLive(false));
    socket.on('connect_error', () => setLive(false));
    socket.on('message:new', message => {
      setMessages(current => [message, ...current].slice(0, 100));
      setUnread(count => count + 1);
      onNewMessage?.();
    });
    return () => { active = false; socket.disconnect(); socketRef.current = null; };
  }, [token, onNewMessage]);

  const toggle = () => {
    setOpen(current => {
      const next = !current;
      if (next && unread > 0) {
        apiRequest('/api/messages/read-all', { method: 'PATCH', token }).then(() => setUnread(0)).catch(() => { });
      }
      return next;
    });
  };

  return <div className="notif-wrap">
    <button className="notif-bell" type="button" onClick={toggle} aria-label={t('notifications')} aria-expanded={open} title={t('notifications')}>
      <Bell size={17} />
      {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      <i className={`notif-dot ${live ? 'on' : ''}`} />
    </button>
    {open && <div className="notif-panel" role="dialog" aria-label={t('notifications')}>
      <div className="notif-head"><strong>{t('notifications')}</strong><span className={`notif-live ${live ? 'on' : ''}`}>{live ? 'LIVE' : '—'}</span></div>
      {messages.length === 0 ? <p className="notif-empty">{t('noMessages')}</p> : <ul className="notif-list">
        {messages.map(item => <li key={item._id} className={item.read ? '' : 'unread'}>
          <span className="notif-icon"><MessageCircle size={13} /></span>
          <div>
            <strong>{item.name}</strong>
            <a href={`mailto:${item.email}`}>{item.email}</a>
            {item.phone && <span className="notif-phone">{item.phone}</span>}
            <small>{new Date(item.createdAt).toLocaleString()}</small>
            <p>{item.message}</p>
          </div>
        </li>)}
      </ul>}
    </div>}
  </div>;
}
