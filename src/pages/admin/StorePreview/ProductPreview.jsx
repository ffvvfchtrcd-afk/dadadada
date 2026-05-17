import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, ShieldCheck, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';

export default function ProductPreview() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [allProducts, allVariations] = await Promise.all([
          api.get('products'),
          api.get('variacoes')
        ]);
        const prod = allProducts.find(p => p.id === Number(id));
        const vars = allVariations.filter(v => v.produtoId === Number(id));
        
        setProduct(prod);
        setVariations(vars);
        if (vars.length > 0) {
          setSelectedVariation(vars[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-brand-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-gray-400 text-center py-12">Produto não encontrado.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-6">
        <Link to="/admin/preview" className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Voltar para a Vitrine
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Lado Esquerdo: Imagens */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="aspect-[4/3] rounded-3xl overflow-hidden glass border border-dark-600 shadow-2xl relative group">
            <img 
              src={selectedVariation?.icone || product.icone || 'https://via.placeholder.com/800x600'} 
              alt={product.nome} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              {product.tags?.map((tag, i) => (
                <span key={i} className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-dark-900/80 backdrop-blur-md rounded-lg border border-dark-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Lado Direito: Informações */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <span className="text-sm text-gray-400">(4.9/5 - 128 avaliações)</span>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            {product.nome}
          </h1>
          
          <p className="text-lg text-gray-400 mb-8">
            {product.miniDesc}
          </p>

          <div className="glass-card p-6 rounded-2xl mb-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Escolha a variação</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {variations.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariation(v)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selectedVariation?.id === v.id
                        ? 'bg-brand-500/10 border-brand-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-brand-500/50'
                        : 'bg-dark-800/50 border-dark-600 hover:border-brand-500/50'
                    }`}
                  >
                    <p className={`font-medium ${selectedVariation?.id === v.id ? 'text-brand-400' : 'text-gray-200'}`}>
                      {v.nome}
                    </p>
                    <p className="text-xl font-bold text-white mt-2">
                      R$ {Number(v.preco).toFixed(2)}
                    </p>
                    {v.descricao_extra && (
                      <p className="text-xs text-gray-400 mt-2 border-t border-dark-600/50 pt-2">
                        {v.descricao_extra}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              {variations.length === 0 && (
                <p className="text-sm text-gray-500">Nenhuma variação disponível.</p>
              )}
            </div>

            <div className="pt-6 border-t border-dark-600/50 flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <button className="w-full bg-brand-500 hover:bg-brand-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.02]">
                  <ShoppingCart className="w-5 h-5" />
                  Comprar Agora
                </button>
              </div>
              <p className="text-sm text-gray-400 font-medium text-center">
                Total: <span className="text-white text-xl font-black ml-1">R$ {selectedVariation ? Number(selectedVariation.preco).toFixed(2) : '0.00'}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 glass-card rounded-xl">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {selectedVariation?.metodoEntrega === 'Manual' ? 'Entrega Manual' : 
                   selectedVariation?.metodoEntrega === 'Imediata' ? 'Chave na Tela' : 
                   'Entrega Automática'}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedVariation?.metodoEntrega === 'Manual' ? 'Acesso liberado via Chat/WhatsApp' : 
                   selectedVariation?.metodoEntrega === 'Imediata' ? 'Receba o código imediatamente' : 
                   'Envio automático no Email e Painel'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 glass-card rounded-xl">
              <div className="p-2 bg-brand-500/10 rounded-lg text-brand-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Garantia Ativa</p>
                <p className="text-xs text-gray-400">Compra 100% segura</p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-dark-600/50 pb-4">
              Descrição do Produto
            </h3>
            <div 
              className="prose prose-invert prose-brand max-w-none text-gray-400 marker:text-brand-500"
              dangerouslySetInnerHTML={{ __html: selectedVariation?.descricao || product.descricao || '<p>Sem descrição detalhada.</p>' }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
