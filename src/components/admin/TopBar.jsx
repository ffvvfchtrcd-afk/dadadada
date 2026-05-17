import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search, Bell, Menu, ChevronDown, User, Settings, LogOut,
  Package, ShoppingCart, Users, FolderTree,
} from 'lucide-react';
import { useClickOutside } from '@/hooks';
import { api } from '@/services/api';

const routeBreadcrumbs = {
  '/admin': [{ label: 'Dashboard' }],
  '/admin/products': [{ label: 'Dashboard', href: '/admin' }, { label: 'Produtos' }],
  '/admin/products/new': [{ label: 'Dashboard', href: '/admin' }, { label: 'Produtos', href: '/admin/products' }, { label: 'Novo Produto' }],
  '/admin/categories': [{ label: 'Dashboard', href: '/admin' }, { label: 'Categorias' }],
  '/admin/sales': [{ label: 'Dashboard', href: '/admin' }, { label: 'Pedidos' }],
  '/admin/users': [{ label: 'Dashboard', href: '/admin' }, { label: 'Clientes' }],
  '/admin/stock': [{ label: 'Dashboard', href: '/admin' }, { label: 'Estoque' }],
  '/admin/coupons': [{ label: 'Dashboard', href: '/admin' }, { label: 'Cupons' }],
  '/admin/banners': [{ label: 'Dashboard', href: '/admin' }, { label: 'Banners' }],
  '/admin/settings': [{ label: 'Dashboard', href: '/admin' }, { label: 'Configurações' }],
  '/admin/preview': [{ label: 'Dashboard', href: '/admin' }, { label: 'Vitrine' }],
  '/admin/analytics': [{ label: 'Dashboard', href: '/admin' }, { label: 'Analytics' }],
};

const quickActions = [
  { label: 'Novo Produto', path: '/admin/products/new', icon: Package },
  { label: 'Ver Pedidos', path: '/admin/sales', icon: ShoppingCart },
  { label: 'Gerenciar Categorias', path: '/admin/categories', icon: FolderTree },
  { label: 'Ver Clientes', path: '/admin/users', icon: Users },
];

export default function TopBar({ onMenuToggle }) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [quickOpen, setQuickOpen] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(searchRef, () => setSearchOpen(false));
  useClickOutside(notifRef, () => setNotificationsOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const breadcrumbs = routeBreadcrumbs[location.pathname] || [{ label: 'Página' }];

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
      if (e.key === 'Escape') { setSearchOpen(false); setNotificationsOpen(false); setProfileOpen(false); setQuickOpen(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const search = async () => {
      try {
        const [products, categories, users, sales] = await Promise.all([
          api.get('products').catch(() => []),
          api.get('categories').catch(() => []),
          api.get('users').catch(() => []),
          api.get('compras').catch(() => []),
        ]);
        const q = searchQuery.toLowerCase();
        const results = [
          ...products.filter(p => p.nome?.toLowerCase().includes(q)).map(p => ({ type: 'Produto', label: p.nome, path: `/admin/products/${p.id}`, icon: Package })),
          ...categories.filter(c => c.nome?.toLowerCase().includes(q)).map(c => ({ type: 'Categoria', label: c.nome, path: '/admin/categories', icon: FolderTree })),
          ...users.filter(u => u.nome?.toLowerCase().includes(q)).map(u => ({ type: 'Cliente', label: u.nome, path: '/admin/users', icon: Users })),
          ...sales.filter(s => s.id?.toLowerCase().includes(q)).map(s => ({ type: 'Pedido', label: s.id, path: '/admin/sales', icon: ShoppingCart })),
        ];
        setSearchResults(results.slice(0, 8));
      } catch { setSearchResults([]); }
    };
    const t = setTimeout(search, 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  return (
    <header className="h-16 border-b border-dark-600/20 bg-dark-800/30 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-dark-700/50 text-gray-400">
          <Menu className="w-5 h-5" />
        </button>
        <nav className="hidden sm:flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-gray-700">/</span>}
              {item.href ? (
                <Link to={item.href} className="text-gray-500 hover:text-brand-400 transition-colors">{item.label}</Link>
              ) : (
                <span className="text-gray-200 font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div ref={searchRef} className="relative hidden md:block">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-700/40 border border-dark-600/30 rounded-xl text-sm text-gray-500 hover:border-dark-500/50 transition-colors w-64"
          >
            <Search className="w-4 h-4" />
            <span>Buscar...</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 bg-dark-600/50 rounded border border-dark-500/30 text-gray-500">⌘K</kbd>
          </button>

          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-dark-600/50 rounded-xl shadow-2xl overflow-hidden w-96" style={{ animation: 'modalIn 0.15s ease-out' }}>
              <div className="p-3 border-b border-dark-600/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar produtos, pedidos, clientes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-900/50 border border-dark-600/50 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 placeholder:text-gray-600"
                  />
                </div>
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                  {searchResults.map((r, i) => (
                    <Link key={i} to={r.path} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700/50 transition-colors">
                      <r.icon className="w-4 h-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{r.label}</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-dark-600/50 rounded text-gray-500">{r.type}</span>
                    </Link>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">Nenhum resultado para "{searchQuery}"</div>
              )}
              <div className="px-3 py-2 border-t border-dark-600/30 flex gap-2">
                {quickActions.map((a, i) => (
                  <Link key={i} to={a.path} onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 text-xs text-gray-400 hover:text-gray-200 transition-colors">
                    <a.icon className="w-3 h-3" /> {a.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={notifRef} className="relative">
          <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 rounded-lg hover:bg-dark-700/50 text-gray-400 hover:text-gray-200 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-dark-800" />
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-600/50 rounded-xl shadow-2xl overflow-hidden" style={{ animation: 'modalIn 0.15s ease-out' }}>
              <div className="px-4 py-3 border-b border-dark-600/30">
                <h3 className="text-sm font-semibold text-white">Notificações</h3>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {[
                  { text: 'Novo pedido recebido', time: '2 min atrás', unread: true },
                  { text: 'Estoque baixo: Netflix Premium', time: '1h atrás', unread: true },
                  { text: 'Pagamento aprovado #ord_7f8e', time: '3h atrás', unread: false },
                ].map((n, i) => (
                  <div key={i} className={`px-4 py-3 border-b border-dark-600/20 hover:bg-dark-700/30 transition-colors cursor-pointer ${n.unread && 'bg-brand-500/5'}`}>
                    <p className="text-sm text-gray-200">{n.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-dark-700/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">A</div>
            <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800 border border-dark-600/50 rounded-xl shadow-2xl overflow-hidden" style={{ animation: 'modalIn 0.15s ease-out' }}>
              <div className="px-4 py-3 border-b border-dark-600/30">
                <p className="text-sm font-medium text-white">Admin</p>
                <p className="text-xs text-gray-500">admin@nexmarket.com</p>
              </div>
              <div className="p-2">
                <Link to="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-dark-700/50 transition-colors">
                  <Settings className="w-4 h-4" /> Configurações
                </Link>
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
