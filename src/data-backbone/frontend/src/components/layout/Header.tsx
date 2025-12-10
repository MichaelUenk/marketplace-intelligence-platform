import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { LanguageSelector } from '../ui/LanguageSelector';

interface HeaderProps {
  onMenuClick?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  user = { name: 'Daan', email: 'daan@ibood.com' },
}) => {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-logo">
          <span className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 2L2 8v12l12 6 12-6V8L14 2z"
                fill="url(#logo-gradient)"
              />
              <defs>
                <linearGradient id="logo-gradient" x1="2" y1="2" x2="26" y2="26">
                  <stop stopColor="#0A84FF" />
                  <stop offset="1" stopColor="#00B4B4" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="logo-text">iBood</span>
        </div>
      </div>

      <div className="header-center">
        <div className="header-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('actions.search')}
          />
          <kbd className="search-shortcut">
            <span>Cmd</span>K
          </kbd>
        </div>
      </div>

      <div className="header-right">
        <LanguageSelector variant="compact" />

        <button
          className="header-icon-btn"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label={t('header.notifications')}
        >
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <button className="header-icon-btn" aria-label={t('navigation.settings')}>
          <Settings size={20} />
        </button>

        <div className="header-user">
          <button
            className="user-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <User size={18} />
              )}
            </div>
            <span className="user-name">{user.name}</span>
            <ChevronDown size={16} className={`user-chevron ${showUserMenu ? 'open' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-menu-name">{user.name}</div>
                <div className="user-menu-email">{user.email}</div>
              </div>
              <div className="user-menu-divider" />
              <a href="#profile" className="user-menu-item">{t('header.profile')}</a>
              <a href="#preferences" className="user-menu-item">{t('header.preferences')}</a>
              <div className="user-menu-divider" />
              <button className="user-menu-item user-menu-logout">{t('auth.signOut')}</button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications dropdown */}
      {showNotifications && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>{t('header.notifications')}</h3>
            <button className="mark-all-read">{t('header.markAllRead')}</button>
          </div>
          <div className="notifications-list">
            <div className="notification-item unread">
              <div className="notification-icon hot">
                <span>🔥</span>
              </div>
              <div className="notification-content">
                <div className="notification-title">ACME Corp reached Hot status</div>
                <div className="notification-time">{t('time.minutesAgo', { count: 2 })}</div>
              </div>
            </div>
            <div className="notification-item unread">
              <div className="notification-icon signal">
                <span>📰</span>
              </div>
              <div className="notification-content">
                <div className="notification-title">New signal: TechFlow sustainability initiative</div>
                <div className="notification-time">{t('time.minutesAgo', { count: 15 })}</div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-icon deal">
                <span>💼</span>
              </div>
              <div className="notification-content">
                <div className="notification-title">Deal moved to SAL: Nordic Hotels</div>
                <div className="notification-time">{t('time.hoursAgo', { count: 1 })}</div>
              </div>
            </div>
          </div>
          <a href="#all-notifications" className="notifications-view-all">
            {t('header.viewAllNotifications')}
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
