import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, MessageSquare, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileMenu() {
  const location = useLocation();
  const isActive = (item) => {
    if (item.label === 'Busca') return false;
    return location.pathname === item.path;
  };

  const menuItems = [
    { icon: Home, path: '/', label: 'Início' },
    { icon: Search, path: '/', label: 'Busca' },
    { icon: ShoppingCart, path: '/cart', label: 'Carrinho' },
    { icon: User, path: '/profile', label: 'Conta' },
    { icon: MessageSquare, path: '/support', label: 'Ajuda' },
  ];

  return (
    <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-md">
      <div className="bg-dark-900/95 backdrop-blur-2xl border-2 border-accent-blue/30 p-2 flex items-center justify-around shadow-[0_15px_50px_rgba(0,0,0,0.85)] shadow-glow-blue rounded-[2.5rem]">
        {menuItems.map((item, idx) => {
          const active = isActive(item);
          return (
            <Link 
              key={idx} 
              to={item.path}
              onClick={(e) => {
                if (item.label === 'Busca') {
                  e.preventDefault();
                  window.dispatchEvent(new Event('open-search-menu'));
                }
              }}
              className="relative flex flex-col items-center justify-center py-3.5 px-4.5 transition-all duration-500 rounded-full"
            >
              {active && (
                <motion.div 
                  layoutId="activeBubbleTab"
                  className="absolute inset-0 bg-accent-blue rounded-full border-b-4 border-black/20"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
              <item.icon 
                size={20} 
                strokeWidth={active ? 3 : 2.5}
                className={`relative z-10 transition-all duration-300 ${active ? 'text-dark-950 scale-110' : 'text-slate-400'}`} 
              />
              <span className={`text-[8.5px] font-black uppercase tracking-tighter mt-1 relative z-10 transition-colors duration-300 ${active ? 'text-dark-950' : 'text-slate-300'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
