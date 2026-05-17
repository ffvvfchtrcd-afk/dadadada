import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import React, { Suspense, useEffect } from 'react';
import Navbar from './components/Navbar';
import MobileMenu from './components/MobileMenu';
import Home from './pages/Home';

// Componente para rolar a página automaticamente para o topo ao trocar de rota
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Lazy-load de páginas secundárias para reduzir bundle inicial
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Support = React.lazy(() => import('./pages/Support'));

// Fallback de loading rápido e elegante
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-dark-950 overflow-x-hidden selection:bg-accent-blue selection:text-dark-950">
        <Navbar />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<Suspense fallback={<PageLoader />}><ProductDetail /></Suspense>} />
            <Route path="/cart" element={<Suspense fallback={<PageLoader />}><Cart /></Suspense>} />
            <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
            <Route path="/register" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
            <Route path="/support" element={<Suspense fallback={<PageLoader />}><Support /></Suspense>} />
          </Routes>
        </main>
        
        <footer className="py-20 border-t border-white/5 relative overflow-hidden bg-dark-900/50">
          <div className="container-premium relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-blue to-accent-blue-dark flex items-center justify-center">
                    <span className="text-dark-950 font-black text-xl">N</span>
                  </div>
                  <span className="text-2xl font-black tracking-tighter text-white">
                    NEX<span className="text-accent-blue">MARKET</span>
                  </span>
                </div>
                <p className="text-slate-400 max-w-sm leading-relaxed font-medium text-sm">
                  A experiência definitiva em produtos digitais premium. Tecnologia, segurança e o melhor do design moderno em um só lugar.
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-black mb-6 uppercase text-[10px] tracking-[0.2em]">Navegação</h4>
                <ul className="space-y-4">
                  <li><a href="/" className="text-slate-500 hover:text-accent-blue transition-colors font-bold text-xs uppercase tracking-widest">Início</a></li>
                  <li><a href="/" className="text-slate-500 hover:text-accent-blue transition-colors font-bold text-xs uppercase tracking-widest">Produtos</a></li>
                  <li><a href="/support" className="text-slate-500 hover:text-accent-blue transition-colors font-bold text-xs uppercase tracking-widest">Suporte</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-black mb-6 uppercase text-[10px] tracking-[0.2em]">Legal</h4>
                <ul className="space-y-4">
                  <li><a href="/" className="text-slate-500 hover:text-accent-blue transition-colors font-bold text-xs uppercase tracking-widest">Privacidade</a></li>
                  <li><a href="/" className="text-slate-500 hover:text-accent-blue transition-colors font-bold text-xs uppercase tracking-widest">Termos</a></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-white/5 gap-6">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">© 2026 NexMarket. Crafted with Premium aesthetics.</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-700 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue/30" /> Pago & Seguro
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-700 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue/30" /> Entrega Digital
                </div>
              </div>
            </div>
          </div>
        </footer>

        <MobileMenu />
      </div>
    </Router>
  );
}

export default App;
