import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Store, FolderTree,
  Settings, ChevronDown, ChevronRight, BarChart3, Wallet, Tag, Image,
  Menu, X, LogOut, TrendingUp, AlertTriangle, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      { name: 'IA Copiloto', path: '/admin/copilot', icon: Sparkles },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { name: 'Produtos', path: '/admin/products', icon: Package },
      { name: 'Categorias', path: '/admin/categories', icon: FolderTree },
      { name: 'Estoque', path: '/admin/stock', icon: AlertTriangle },
    ],
  },
  {
    label: 'Vendas',
    items: [
      { name: 'Pedidos', path: '/admin/sales', icon: ShoppingCart },
      { name: 'Clientes', path: '/admin/users', icon: Users },
      { name: 'Cupons', path: '/admin/coupons', icon: Tag },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { name: 'Banners', path: '/admin/banners', icon: Image },
      { name: 'Vitrine', path: '/admin/preview', icon: Store },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { name: 'Configurações', path: '/admin/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen, onToggle }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const location = useLocation();

  const toggleGroup = (label) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  React.useEffect(() => {
    navGroups.forEach(group => {
      const hasActive = group.items.some(item => location.pathname === item.path);
      if (hasActive) {
        setExpandedGroups(prev => ({ ...prev, [group.label]: true }));
      }
    });
  }, [location.pathname]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />
      )}

      <aside className={clsx(
        'fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto bg-dark-800/95 lg:bg-dark-800/50 backdrop-blur-xl border-r border-dark-600/30 flex flex-col transition-all duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'lg:w-[72px]' : 'lg:w-64',
        'w-64'
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-dark-600/30">
          {!collapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">
              NexMarket
            </span>
          )}
          <button
            onClick={() => { if (window.innerWidth < 1024) onToggle?.(); else setCollapsed(!collapsed); }}
            className="p-2 rounded-lg hover:bg-dark-700/50 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : window.innerWidth < 1024 ? <X className="w-5 h-5" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {navGroups.map(group => {
            const isExpanded = expandedGroups[group.label] || false;
            const hasActive = group.items.some(item => location.pathname === item.path);
            return (
              <div key={group.label}>
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {group.label}
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                <AnimatePresence initial={false}>
                  {(isExpanded || collapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-0.5"
                    >
                      {group.items.map(item => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          end={item.path === '/admin'}
                          className={({ isActive }) => clsx(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm',
                            collapsed && 'justify-center px-0',
                            isActive
                              ? 'bg-brand-500/10 text-brand-400'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700/30'
                          )}
                          title={collapsed ? item.name : undefined}
                        >
                          <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                          {!collapsed && <span className="font-medium">{item.name}</span>}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-dark-600/30">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-700/30 border border-dark-600/20">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">Admin</p>
                <p className="text-xs text-gray-500 truncate">admin@nexmarket.com</p>
              </div>
              <button className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
