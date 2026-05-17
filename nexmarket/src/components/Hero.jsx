import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative py-20 overflow-hidden bg-anime-pattern">
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-sm font-bold mb-6">
              <Sparkles size={14} />
              <span>Plataforma Premium de Produtos Digitais</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Eleve sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-blue">Experiência Digital</span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 max-w-lg leading-relaxed">
              Descubra uma curadoria exclusiva de contas premium, gift cards e serviços digitais com a melhor experiência visual e segurança garantida.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/" className="btn-premium btn-premium-primary text-lg px-8">
                Explorar Agora <ArrowRight size={20} />
              </Link>
              <button className="btn-premium btn-premium-secondary text-lg px-8">
                Saiba Mais
              </button>
            </div>

            <div className="mt-12 flex items-center gap-8">
              <div>
                <div className="text-2xl font-bold text-white">10k+</div>
                <div className="text-sm text-slate-500">Clientes Ativos</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-white">50k+</div>
                <div className="text-sm text-slate-500">Vendas Realizadas</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-white">4.9/5</div>
                <div className="text-sm text-slate-500">Avaliação Média</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-accent-purple/20">
              <img 
                src="/hero-banner.png" 
                alt="NexMarket Premium Anime Banner" 
                className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-purple/20 blur-3xl rounded-full animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-accent-blue/20 blur-3xl rounded-full animate-pulse" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
