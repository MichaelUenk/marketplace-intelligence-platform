import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const paddingClass = padding !== 'md' ? `card-padding-${padding}` : '';
  const hoverClass = hover ? 'card-hover' : '';
  const clickableClass = onClick ? 'card-clickable' : '';

  return (
    <div
      className={`card ${paddingClass} ${hoverClass} ${clickableClass} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  action,
}) => {
  return (
    <div className={`card-header ${className}`.trim()}>
      <div className="card-header-content">{children}</div>
      {action && <div className="card-header-action">{action}</div>}
    </div>
  );
};

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = '',
  subtitle,
}) => {
  return (
    <div className={`card-title-wrapper ${className}`.trim()}>
      <h3 className="card-title">{children}</h3>
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
    </div>
  );
};

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`card-content ${className}`.trim()}>{children}</div>;
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  align = 'right',
}) => {
  return (
    <div className={`card-footer card-footer-${align} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default Card;
