import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const price = (product.id * 15.99).toFixed(2);

  return (
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={() => navigate(`/product/${product.id}`)}
      className="card-premium card-premium-hover flex flex-col h-full group p-2.5 sm:p-3.5 cursor-pointer"
      aria-label={`Produto: ${product.nome}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/11] overflow-hidden rounded-xl mb-2.5 sm:mb-4 bg-dark-950">
        <img 
          src={product.icone} 
          alt={product.nome} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-dark-950/80 backdrop-blur-md text-white text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] border border-white/10 shadow-xl">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500 animate-pulse" />
            {product.status}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-1 px-0.5 sm:px-1">
        <header className="mb-2 sm:mb-3">
          <div className="flex items-center gap-0.5 mb-1 sm:mb-1.5 text-accent-blue/60 group-hover:text-accent-blue transition-colors">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={8} className="sm:w-[9px] sm:h-[9px]" fill={i < 4 ? "currentColor" : "none"} strokeWidth={3} />
            ))}
            <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold ml-1 uppercase tracking-widest">4.8</span>
          </div>
          <h3 className="text-[12px] sm:text-[15px] font-black leading-tight text-white group-hover:text-accent-blue transition-colors duration-300 line-clamp-1 tracking-tight">
            {product.nome}
          </h3>
        </header>
 
        <p className="text-slate-300 text-[9.5px] sm:text-[11px] mb-3 sm:mb-6 line-clamp-2 leading-relaxed flex-1 font-medium italic opacity-95">
          {product.miniDesc}
        </p>
        
        {/* Footer */}
        <footer className="flex items-center justify-between pt-2.5 sm:pt-4 border-t border-white/10">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
              <div className={`w-1 h-1 rounded-full ${product.variacoes?.[0]?.metodoEntrega === 'MANUAL' ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
              <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">
                {product.variacoes?.[0]?.metodoEntrega === 'MANUAL' ? 'Manual' : 'Automática'}
              </span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-accent-blue text-[8px] sm:text-[9px] font-black mr-0.5">R$</span>
              <span className="text-sm sm:text-lg font-black text-white tracking-tighter">
                {product.displayPrice?.toFixed(2) || '0.00'}
              </span>
              {product.variacoes?.length > 1 && <span className="text-[8px] text-slate-400 font-bold ml-1 uppercase">+</span>}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
             <div className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-[6px] sm:text-[7px] font-black text-slate-300 uppercase tracking-widest">
                {product.variacoes?.[0]?.metodoEntrega === 'AUTOMATICA' || product.variacoes?.[0]?.metodoEntrega === 'AGENTE' ? 'Alta Demanda' : 'Disponível'}
             </div>
             <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-dark-700 text-slate-300 flex items-center justify-center group-hover:bg-accent-blue group-hover:text-dark-950 group-hover:scale-110 transition-all duration-500 shadow-xl border border-white/10">
               <ArrowRight size={14} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
             </div>
          </div>
        </footer>
      </div>

      {/* Hover Background Glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-accent-blue/0 to-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.article>
  );
}
