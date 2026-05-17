import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, ArrowLeft, MessageSquare, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Support() {
  const navigate = useNavigate();

  return (
    <div className="container-premium min-h-[70vh] flex flex-col items-center justify-center py-10 sm:py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-premium p-6 sm:p-12 max-w-lg w-full text-center relative overflow-hidden"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-white/5 shadow-lg">
          <Wrench size={32} className="sm:w-[40px] sm:h-[40px] text-accent-blue" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4 tracking-tight">
          Central de <span className="text-gradient-blue">Suporte</span>
        </h1>
        
        <p className="text-slate-400 text-xs sm:text-sm mb-6 sm:mb-10 leading-relaxed font-medium max-w-sm mx-auto">
          Estamos aprimorando nossa plataforma de atendimento para oferecer a melhor experiência possível. Voltamos em breve!
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-12">
          <div className="card-premium p-3 sm:p-4 border-white/5 bg-white/[0.02] flex items-center gap-3 sm:gap-4 text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue flex-shrink-0">
              <MessageSquare size={16} className="sm:w-[20px] sm:h-[20px]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1">Chat</div>
              <div className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Breve</div>
            </div>
          </div>
          <div className="card-premium p-3 sm:p-4 border-white/5 bg-white/[0.02] flex items-center gap-3 sm:gap-4 text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 flex-shrink-0">
              <Clock size={16} className="sm:w-[20px] sm:h-[20px]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest leading-none mb-1">Status</div>
              <div className="text-[8px] sm:text-[9px] text-green-500 font-bold uppercase tracking-widest leading-none">Online</div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="btn-premium btn-premium-primary !py-2.5 !px-8 text-xs"
        >
          <ArrowLeft size={16} strokeWidth={3} /> Voltar ao Início
        </button>

        {/* Decorative Background */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent-blue/5 blur-[80px] rounded-full" />
      </motion.div>
    </div>
  );
}
