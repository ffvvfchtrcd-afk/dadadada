import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export { default as RichTextEditor } from './RichTextEditor.jsx';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef(({
  children, variant = 'primary', size = 'md', icon, iconPosition = 'left',
  loading = false, disabled = false, className, as: Component = 'button', ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30',
    secondary: 'bg-dark-700 hover:bg-dark-600 text-gray-200 border border-dark-600 hover:border-dark-500',
    ghost: 'text-gray-400 hover:text-gray-100 hover:bg-dark-700/50',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30',
    success: 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20',
    outline: 'bg-transparent border border-dark-600 text-gray-300 hover:border-brand-500/50 hover:text-brand-400',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1.5 gap-1.5',
    sm: 'text-sm px-3 py-2 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
    xl: 'text-lg px-8 py-3.5 gap-3',
    icon: 'p-2',
  };

  return (
    <Component
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && <span className={cn(size === 'xs' && 'w-3.5 h-3.5', size === 'sm' && 'w-4 h-4', size === 'md' && 'w-4 h-4', size === 'lg' && 'w-5 h-5')}>{icon}</span>}
      {children}
      {!loading && icon && iconPosition === 'right' && <span className={cn(size === 'xs' && 'w-3.5 h-3.5', size === 'sm' && 'w-4 h-4', size === 'md' && 'w-4 h-4', size === 'lg' && 'w-5 h-5')}>{icon}</span>}
    </Component>
  );
});

export const Input = React.forwardRef(({
  label, error, hint, icon, iconRight, className, containerClassName, ...props
}, ref) => (
  <div className={cn('space-y-1.5', containerClassName)}>
    {label && <label className="block text-sm font-medium text-gray-400">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>}
      <input
        ref={ref}
        className={cn(
          'w-full bg-dark-900/50 border rounded-xl py-2.5 text-sm text-gray-200 placeholder:text-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          icon ? 'pl-10' : 'pl-4',
          iconRight ? 'pr-10' : 'pr-4',
          error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-dark-600/50 focus:border-brand-500/50',
          className
        )}
        {...props}
      />
      {iconRight && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{iconRight}</span>}
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
    {hint && !error && <p className="text-xs text-gray-600">{hint}</p>}
  </div>
));

export const Textarea = React.forwardRef(({ label, error, hint, className, containerClassName, ...props }, ref) => (
  <div className={cn('space-y-1.5', containerClassName)}>
    {label && <label className="block text-sm font-medium text-gray-400">{label}</label>}
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-dark-900/50 border border-dark-600/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 placeholder:text-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 custom-scrollbar resize-none',
        error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
    {hint && !error && <p className="text-xs text-gray-600">{hint}</p>}
  </div>
));

export const Select = React.forwardRef(({ label, error, options, className, containerClassName, ...props }, ref) => (
  <div className={cn('space-y-1.5', containerClassName)}>
    {label && <label className="block text-sm font-medium text-gray-400">{label}</label>}
    <select
      ref={ref}
      className={cn(
        'w-full bg-dark-900/50 border border-dark-600/50 rounded-xl py-2.5 px-4 text-sm text-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 appearance-none cursor-pointer',
        error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
        className
      )}
      {...props}
    >
      {options?.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));

export const Badge = ({ children, variant = 'default', size = 'sm', className, dot = false }) => {
  const variants = {
    default: 'bg-dark-600/50 text-gray-400 border-dark-600',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-medium rounded-full border', variants[variant], sizes[size], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', variant === 'success' && 'bg-green-400', variant === 'warning' && 'bg-yellow-400', variant === 'danger' && 'bg-red-400', variant === 'info' && 'bg-brand-400', variant === 'purple' && 'bg-purple-400', variant === 'default' && 'bg-gray-400')} />}
      {children}
    </span>
  );
};

export const Card = ({ children, className, hover = true, ...props }) => (
  <div className={cn('bg-dark-700/40 backdrop-blur-sm border border-dark-600/30 rounded-2xl', className)} style={hover ? {} : {}} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-b border-dark-600/30 flex items-center justify-between', className)}>
    {children}
  </div>
);

export const CardContent = ({ children, className }) => (
  <div className={cn('p-6', className)}>{children}</div>
);

export const CardFooter = ({ children, className }) => (
  <div className={cn('px-6 py-4 border-t border-dark-600/30 flex items-center justify-between', className)}>{children}</div>
);

export const Modal = ({ isOpen, onClose, title, description, children, size = 'md', className }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-6xl', full: 'max-w-[95vw]' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={cn('relative bg-dark-800 border border-dark-600/50 rounded-2xl shadow-2xl w-full overflow-hidden animate-in', sizes[size], className)}
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalIn 0.2s ease-out' }}
      >
        {(title || description) && (
          <div className="px-6 py-4 border-b border-dark-600/30">
            {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
            {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

export const Skeleton = ({ className, lines = 1 }) => {
  if (lines > 1) return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('h-4 bg-dark-600/50 rounded-lg animate-pulse', className, i === lines - 1 && 'w-2/3')} />
      ))}
    </div>
  );
  return <div className={cn('h-4 bg-dark-600/50 rounded-lg animate-pulse', className)} />;
};

export const EmptyState = ({ icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
    {icon && <div className="mb-4 text-gray-600">{icon}</div>}
    <h3 className="text-lg font-medium text-gray-300">{title}</h3>
    {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const Breadcrumb = ({ items, className }) => (
  <nav className={cn('flex items-center gap-2 text-sm', className)}>
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="text-gray-600">/</span>}
        {item.href ? (
          <a href={item.href} className="text-gray-500 hover:text-brand-400 transition-colors">{item.label}</a>
        ) : (
          <span className="text-gray-200 font-medium">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export const Pagination = ({ currentPage, totalPages, onPageChange, className }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-sm rounded-lg text-gray-400 hover:text-gray-200 hover:bg-dark-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Anterior</button>
      {start > 1 && (<><button onClick={() => onPageChange(1)} className="w-9 h-9 text-sm rounded-lg text-gray-400 hover:bg-dark-700/50 transition-colors">1</button>{start > 2 && <span className="text-gray-600 px-1">...</span>}</>)}
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={cn('w-9 h-9 text-sm rounded-lg transition-colors', p === currentPage ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-dark-700/50 hover:text-gray-200')}>{p}</button>
      ))}
      {end < totalPages && (<>{end < totalPages - 1 && <span className="text-gray-600 px-1">...</span>}<button onClick={() => onPageChange(totalPages)} className="w-9 h-9 text-sm rounded-lg text-gray-400 hover:bg-dark-700/50 transition-colors">{totalPages}</button></>)}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm rounded-lg text-gray-400 hover:text-gray-200 hover:bg-dark-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">Próximo</button>
    </div>
  );
};

export const StatCard = ({ title, value, icon, trend, trendValue, color = 'brand', className }) => {
  const colors = {
    brand: { bg: 'bg-brand-500/10', text: 'text-brand-400', icon: 'text-brand-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', icon: 'text-green-500' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'text-red-500' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: 'text-yellow-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'text-purple-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: 'text-orange-500' },
  };
  const c = colors[color] || colors.brand;
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400')}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </div>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl', c.bg)}>
          <span className={c.icon}>{icon}</span>
        </div>
      </div>
    </Card>
  );
};

export const Tabs = ({ tabs, activeTab, onChange, className }) => (
  <div className={cn('flex gap-1 p-1 bg-dark-800/50 rounded-xl border border-dark-600/30 w-fit', className)}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          activeTab === tab.id ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700/30'
        )}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span className={cn('ml-2 text-xs px-1.5 py-0.5 rounded-full', activeTab === tab.id ? 'bg-dark-600 text-gray-300' : 'bg-dark-700 text-gray-500')}>{tab.count}</span>
        )}
      </button>
    ))}
  </div>
);

export const Toggle = ({ enabled, onChange, label, className }) => (
  <label className={cn('flex items-center gap-3 cursor-pointer', className)}>
    <div className="relative" onClick={() => onChange(!enabled)}>
      <div className={cn('w-10 h-6 rounded-full transition-colors duration-200', enabled ? 'bg-brand-500' : 'bg-dark-600')} />
      <div className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200', enabled && 'translate-x-4')} />
    </div>
    {label && <span className="text-sm text-gray-300">{label}</span>}
  </label>
);

export const Avatar = ({ src, name, size = 'md', className }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
  return (
    <div className={cn('relative rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center text-white font-medium overflow-hidden flex-shrink-0', sizes[size], className)}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials}
    </div>
  );
};

export const Divider = ({ className }) => <div className={cn('h-px bg-dark-600/30', className)} />;

export const ProgressBar = ({ value, max = 100, color = 'brand', className, showLabel = false }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = { brand: 'bg-brand-500', green: 'bg-green-500', red: 'bg-red-500', yellow: 'bg-yellow-500', purple: 'bg-purple-500' };
  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && <div className="flex justify-between text-xs"><span className="text-gray-400">{value}/{max}</span><span className="text-gray-500">{pct.toFixed(0)}%</span></div>}
      <div className="h-2 bg-dark-600/50 rounded-full overflow-hidden"><div className={cn('h-full rounded-full transition-all duration-300', colors[color] || colors.brand)} style={{ width: `${pct}%` }} /></div>
    </div>
  );
};
