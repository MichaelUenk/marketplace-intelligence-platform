import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  Send,
  BarChart2,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Brain,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Header } from './Header';

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  href: string;
  badge?: number | string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

// Marketplace Intelligence Platform for Alpine - Simplified Navigation
const mainNavItemsConfig: NavItem[] = [
  { id: 'compliance', labelKey: 'navigation.compliance', icon: <Shield size={20} />, href: '/compliance' },
  { id: 'signals', labelKey: 'navigation.signals', icon: <Zap size={20} />, href: '/signals' },
  { id: 'sequences', labelKey: 'navigation.sequences', icon: <Send size={20} />, href: '/sequences' },
  { id: 'thought-leadership', labelKey: 'navigation.thoughtLeadership', icon: <Sparkles size={20} />, href: '/thought-leadership' },
  { id: 'deep-work', labelKey: 'navigation.deepWork', icon: <Brain size={20} />, href: '/deep-work' },
  { id: 'analytics', labelKey: 'navigation.analytics', icon: <BarChart2 size={20} />, href: '/analytics' },
];

const bottomNavItemsConfig: NavItem[] = [
  { id: 'settings', labelKey: 'navigation.settings', icon: <Settings size={20} />, href: '/settings' },
  { id: 'help', labelKey: 'navigation.help', icon: <HelpCircle size={20} />, href: '/help' },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children, currentPage = 'dashboard', onNavigate }) => {
  const { t } = useTranslation('common');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleNavClick = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(pageId);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        {t('sidebar.skipToMainContent')}
      </a>

      {/* Header */}
      <Header onMenuClick={toggleSidebar} />

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <nav className="sidebar-nav" aria-label={t('sidebar.mainNavigation')}>
          <ul className="nav-list">
            {mainNavItemsConfig.map((item) => {
              const label = t(item.labelKey);
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                    title={sidebarCollapsed ? label : undefined}
                    onClick={(e) => handleNavClick(e, item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="nav-label">{label}</span>
                        {item.badge && (
                          <span className="nav-badge">{item.badge}</span>
                        )}
                      </>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-bottom">
          <ul className="nav-list">
            {bottomNavItemsConfig.map((item) => {
              const label = t(item.labelKey);
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                    title={sidebarCollapsed ? label : undefined}
                    onClick={(e) => handleNavClick(e, item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!sidebarCollapsed && <span className="nav-label">{label}</span>}
                  </a>
                </li>
              );
            })}
          </ul>

          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="app-main">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
