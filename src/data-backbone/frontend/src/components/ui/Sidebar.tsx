import React, { useState, createContext, useContext } from 'react';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export interface SidebarProviderProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
};

export interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, className = '' }) => {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''} ${className}`.trim()}
      aria-label="Main navigation"
    >
      {children}
    </aside>
  );
};

export interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  children,
  className = '',
}) => {
  return <div className={`sidebar-header ${className}`.trim()}>{children}</div>;
};

export interface SidebarLogoProps {
  icon: React.ReactNode;
  text: string;
  className?: string;
}

export const SidebarLogo: React.FC<SidebarLogoProps> = ({
  icon,
  text,
  className = '',
}) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className={`sidebar-logo ${className}`.trim()}>
      <span className="sidebar-logo-icon">{icon}</span>
      {!isCollapsed && <span className="sidebar-logo-text">{text}</span>}
    </div>
  );
};

export interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  children,
  className = '',
}) => {
  return <nav className={`sidebar-content ${className}`.trim()}>{children}</nav>;
};

export interface SidebarGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  children,
  label,
  className = '',
}) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className={`sidebar-group ${className}`.trim()}>
      {label && !isCollapsed && (
        <div className="sidebar-group-label">{label}</div>
      )}
      <ul className="sidebar-group-items">{children}</ul>
    </div>
  );
};

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: React.ReactNode;
  className?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  href,
  onClick,
  active = false,
  badge,
  className = '',
}) => {
  const { isCollapsed } = useSidebar();

  const content = (
    <>
      <span className="sidebar-item-icon">{icon}</span>
      {!isCollapsed && (
        <>
          <span className="sidebar-item-label">{label}</span>
          {badge && <span className="sidebar-item-badge">{badge}</span>}
        </>
      )}
    </>
  );

  const commonProps = {
    className: `sidebar-item ${active ? 'sidebar-item-active' : ''} ${className}`.trim(),
    title: isCollapsed ? label : undefined,
  };

  if (href) {
    return (
      <li>
        <a href={href} {...commonProps}>
          {content}
        </a>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={onClick} {...commonProps}>
        {content}
      </button>
    </li>
  );
};

export interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  children,
  className = '',
}) => {
  return <div className={`sidebar-footer ${className}`.trim()}>{children}</div>;
};

export interface SidebarToggleProps {
  className?: string;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ className = '' }) => {
  const { isCollapsed, toggleCollapse } = useSidebar();

  return (
    <button
      type="button"
      className={`sidebar-toggle ${className}`.trim()}
      onClick={toggleCollapse}
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <span className="sidebar-toggle-icon">
        {isCollapsed ? '→' : '←'}
      </span>
    </button>
  );
};

// Icon components for common navigation items
export const NavIcons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </svg>
  ),
  Pipeline: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 10h16M2 10l4-4M2 10l4 4M18 10l-4-4M18 10l-4 4" />
    </svg>
  ),
  Signals: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2v16M6 6v8M14 6v8M2 8v4M18 8v4" />
    </svg>
  ),
  Accounts: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <path d="M6 12h8M6 9h4" />
    </svg>
  ),
  Contacts: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
    </svg>
  ),
  Sequences: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="4" cy="10" r="2" />
      <circle cx="10" cy="10" r="2" />
      <circle cx="16" cy="10" r="2" />
      <path d="M6 10h2M12 10h2" />
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
    </svg>
  ),
};

export default Sidebar;
