import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product, index }) {
  // Mock lowest price from variations if needed, or static if not provided
  const price = 29.90; // For preview purposes

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group relative bg-dark-800 border border-dark-600/50 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:border-brand-500/50 transition-all duration-300 flex flex-col"
    >
      <Link to={`/admin/preview/${product.id}`} className="absolute inset-0 z-10">
        <span className="sr-only">Ver produto</span>
      </Link>
      
      <div className="aspect-[4/3] relative overflow-hidden bg-dark-900">
        <img 
          src={product.icone || 'https://via.placeholder.com/400x300'} 
          alt={product.nome}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2 z-20">
          {product.tags?.slice(0, 2).map((tag, i) => (
            <span key={i} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-dark-900/80 backdrop-blur-md rounded-md border border-dark-600">
              {tag}
            </span>
          ))}
        </div>
        {product.status === 'ATIVO' ? (
           <div className="absolute top-3 right-3 px-2 py-1 text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded-md backdrop-blur-md z-20">
             Em Estoque
           </div>
        ) : (
           <div className="absolute top-3 right-3 px-2 py-1 text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded-md backdrop-blur-md z-20">
             Esgotado
           </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-100 group-hover:text-brand-500 transition-colors line-clamp-1">
          {product.nome}
        </h3>
        <p className="text-sm text-gray-400 mt-2 line-clamp-2 min-h-[40px]">
          {product.miniDesc}
        </p>
        
        <div className="mt-auto pt-5 flex items-center justify-between z-20 relative">
          <div>
            <p className="text-xs text-gray-500">A partir de</p>
            <p className="text-xl font-black text-white">R$ {price.toFixed(2)}</p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all">
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
