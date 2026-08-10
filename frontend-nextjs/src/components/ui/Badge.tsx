import React from 'react';

type BadgeVariant = 'active' | 'hidden' | 'alert' | 'rupture' | 'draft' | 'info' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  active: 'badge-active',
  hidden: 'badge-hidden',
  alert: 'badge-alert',
  rupture: 'badge-rupture',
  draft: 'badge-draft',
  info: 'bg-blue-100 text-blue-700 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
  default: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground',
};

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}