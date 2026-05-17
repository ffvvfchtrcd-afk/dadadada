import React from 'react';
import { motion } from 'framer-motion';
import { Check, Package } from 'lucide-react';

export default function VariationSelector({ variations, selectedVariation, onSelect }) {
  if (!variations || variations.length === 0) return null;

  return (
    <div className="mt-8 mb-10">
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
        <Package size={18} className="text-accent-blue" /> Escolha sua bolha:
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {variations.map((variation) => {
          const isSelected = selectedVariation?.id === variation.id;
          const isOutOfStock = variation.quantidadeStock <= 0;
          const isActive = variation.status === 'ATIVO';

          if (!isActive) return null;

          return (
            <motion.div
              key={variation.id}
              whileHover={!isOutOfStock ? { scale: 1.05, y: -5 } : {}}
              whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
              onClick={() => !isOutOfStock && onSelect(variation)}
              className={`bubble-card p-6 cursor-pointer relative transition-all duration-500 !rounded-[2rem] border-2 ${isSelected 
                ? 'bg-accent-blue border-accent-blue-dark shadow-glow-blue' 
                : 'bg-dark-800 border-white/5 hover:border-white/10'}`}
              style={{
                opacity: isOutOfStock ? 0.3 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              }}
            >
              {isSelected && (
                <motion.div 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl border-4 border-dark-950 z-10"
                >
                  <Check size={20} className="text-dark-950" strokeWidth={4} />
                </motion.div>
              )}

              <div className={`font-black text-lg mb-2 ${isSelected ? 'text-dark-950' : 'text-white'}`}>
                {variation.nome}
              </div>
              
              <div className="flex justify-between items-end">
                <div className={`font-black text-2xl tracking-tighter ${isSelected ? 'text-dark-950' : 'text-accent-blue'}`}>
                  <span className="text-sm mr-0.5">R$</span>{variation.preco.toFixed(2)}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-dark-950/60' : 'text-slate-400'}`}>
                  {isOutOfStock ? 'Esgotado' : `${variation.quantidadeStock} Estoque`}
                </div>
              </div>

              {variation.duracao && (
                <div className={`text-[10px] mt-3 font-bold italic opacity-60 ${isSelected ? 'text-dark-950' : 'text-slate-300'}`}>
                  {variation.duracao}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
