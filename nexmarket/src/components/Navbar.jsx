import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Search, X, Menu, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(dataService.getCurrentUser());
    const cart = dataService.getCart();
    setCartCount(cart.reduce((acc, item) => acc + item.quantity, 0));

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const handleStateChange = () => {
      setUser(dataService.getCurrentUser());
      const c = dataService.getCart();
      setCartCount(c.reduce((acc, item) => acc + item.quantity, 0));
    };

    const handleOpenSearch = () => {
      setIsMobileMenuOpen(true);
    };

    window.addEventListener('app-state-change', handleStateChange);
    window.addEventListener('open-search-menu', handleOpenSearch);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('app-state-change', handleStateChange);
      window.removeEventListener('open-search-menu', handleOpenSearch);
    };
  }, []);

  useEffect(() => {
    const event = new CustomEvent('search-query-change', { detail: searchQuery });
    window.dispatchEvent(event);
  }, [searchQuery]);

  const handleLogout = () => {
    dataService.logout();
    window.dispatchEvent(new Event('app-state-change'));
    navigate('/');
  };

  return (
    <header 
      className={`fixed z-[100] transition-all duration-500 border-white/10 ${
        scrolled 
          ? 'top-0 left-0 right-0 rounded-none border-b py-3 bg-dark-950/95 backdrop-blur-xl shadow-2xl' 
          : 'top-0 left-0 right-0 rounded-none border-b py-3 bg-dark-950/95 backdrop-blur-xl sm:top-6 sm:left-6 sm:right-6 sm:rounded-2xl sm:border sm:py-4 sm:bg-dark-950/80'
      }`}
    >
      <div className="container-premium flex items-center justify-between gap-8">
        {/* Brand */}
        <Link to="/" className="group flex items-center gap-3 flex-shrink-0" aria-label="NexMarket Início">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-blue to-accent-blue-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <span className="text-dark-950 font-black text-xl">N</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-white hidden sm:block">
            NEX<span className="text-accent-blue">MARKET</span>
          </span>
        </Link>

        {/* Integrated Search Bar (SaaS Style) */}
        <div className="flex-1 max-w-xl relative hidden md:block">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <Search size={16} strokeWidth={2.5} />
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar produtos..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-10 text-xs font-semibold text-slate-200 focus:outline-none focus:border-accent-blue/30 focus:bg-white/[0.08] transition-all placeholder:text-slate-600"
            aria-label="Pesquisar produtos"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
              aria-label="Limpar pesquisa"
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Desktop Actions */}
        <nav className="flex items-center gap-2 flex-shrink-0">
          <Link to="/support" className="hidden lg:flex px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-all text-[11px] font-bold uppercase tracking-widest" aria-label="Centro de Suporte">
            Suporte
          </Link>

          <div className="h-4 w-px bg-white/10 mx-2 hidden lg:block" />

          <Link 
            to="/cart" 
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            aria-label={`Carrinho com ${cartCount} itens`}
          >
            <ShoppingCart size={20} strokeWidth={2} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1.5 right-1.5 bg-accent-blue text-dark-950 text-[9px] font-black w-4.5 h-4.5 rounded-lg flex items-center justify-center shadow-lg shadow-accent-blue/20"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {user ? (
            <div className="flex items-center gap-2 ml-1">
              <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-all" aria-label="Perfil do Usuário">
                <div className="w-6 h-6 rounded-lg bg-accent-blue flex items-center justify-center">
                  <User size={14} className="text-dark-950" strokeWidth={3} />
                </div>
                <span className="font-bold text-xs hidden xl:inline">{user.nome.split(' ')[0]}</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all"
                aria-label="Sair"
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-premium btn-premium-primary !py-2 !px-5 text-[11px] ml-2 uppercase tracking-widest flex items-center gap-2">
              <User size={14} strokeWidth={3} /> Perfil
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/5"
            aria-label="Alternar Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-4 right-4 mt-2 p-6 bg-dark-900 border-2 border-accent-blue/30 rounded-2xl z-[110] shadow-[0_20px_50px_rgba(0,0,0,0.9)] shadow-glow-blue"
          >
            <div className="flex flex-col gap-4">
              <div className="relative mb-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-blue" size={16} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar produtos..."
                  className="w-full bg-dark-950 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-accent-blue/50 focus:ring-2 focus:ring-accent-blue/10 transition-all placeholder:text-slate-500"
                />
              </div>
              
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="py-3.5 px-5 rounded-xl bg-dark-800/80 border border-white/10 text-white font-black uppercase text-[11px] tracking-widest flex items-center justify-between shadow-md active:bg-dark-700 transition-all"
              >
                <span>Início</span>
                <ChevronRight size={14} className="text-accent-blue" />
              </Link>
              
              <Link 
                to="/support" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="py-3.5 px-5 rounded-xl bg-dark-800/80 border border-white/10 text-white font-black uppercase text-[11px] tracking-widest flex items-center justify-between shadow-md active:bg-dark-700 transition-all"
              >
                <span>Suporte</span>
                <ChevronRight size={14} className="text-accent-blue" />
              </Link>
              
              <div className="h-px bg-white/10 my-2" />
              
              {user ? (
                <div className="flex flex-col gap-3">
                  <Link 
                    to="/profile" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="py-3.5 px-5 rounded-xl bg-accent-blue text-dark-950 font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20 transition-all active:scale-95"
                  >
                    <User size={14} strokeWidth={3} /> Perfil ({user.nome.split(' ')[0]})
                  </Link>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="py-3 px-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 transition-all active:bg-red-500/20"
                  >
                    Sair da Conta
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="py-3.5 px-5 rounded-xl bg-accent-blue text-dark-950 font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/20 transition-all active:scale-95"
                >
                  <User size={14} strokeWidth={3} /> Entrar / Registrar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
