import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Check, Shield, AlertCircle, Star, Share2, Heart } from 'lucide-react';
import { dataService } from '../services/dataService';
import VariationSelector from '../components/VariationSelector';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductAndVariations = async () => {
      setLoading(true);
      try {
        const [productData, variationsData] = await Promise.all([
          dataService.getProductById(id),
          dataService.getVariationsByProductId(id)
        ]);
        
        setProduct(productData);
        setVariations(variationsData);
        
        if (variationsData.length > 0) {
          const available = variationsData.find(v => v.status === 'ATIVO' && v.quantidadeStock > 0);
          if (available) setSelectedVariation(available);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do produto:", err);
        setError("Ocorreu um erro ao carregar os dados do produto.");
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndVariations();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="container py-48 flex justify-center">
        <div className="w-16 h-16 border-4 border-white/5 border-t-accent-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-48 text-center">
        <h2 className="premium-title !mb-10 text-5xl">Ops! Produto não encontrado.</h2>
        <button onClick={() => navigate('/')} className="btn-premium btn-premium-secondary">
          <ArrowLeft size={18} strokeWidth={3} /> Voltar à Loja
        </button>
      </div>
    );
  }

  const currentPrice = selectedVariation 
    ? selectedVariation.preco.toFixed(2) 
    : (variations.length > 0 
        ? Math.min(...variations.filter(v => v.status === 'ATIVO').map(v => v.preco)).toFixed(2) 
        : "0.00");

  // Main display image prioritizing selected variation
  const mainImage = selectedVariation?.icone || product.icone;
  
  // Gallery images: Product cover + all variation icons (unique)
  const galleryItems = [
    { type: 'product', url: product.icone, variation: null },
    ...variations.filter(v => v.icone).map(v => ({ type: 'variation', url: v.icone, variation: v }))
  ];

  // Function to handle clicking an image in the gallery
  const handleImageClick = (item) => {
    if (item.type === 'variation' && item.variation) {
      setSelectedVariation(item.variation);
      setError(null);
    }
  };

  const handleAddToCart = () => {
    const currentUser = dataService.getCurrentUser();
    if (!currentUser) {
      setError("Você precisa entrar em uma conta para adicionar itens ao carrinho.");
      return;
    }

    if (variations.length > 0 && !selectedVariation) {
      setError("Por favor, selecione uma opção.");
      return;
    }
    
    dataService.addToCart(product, selectedVariation);
    window.dispatchEvent(new Event('app-state-change'));
    setAdded(true);
    setError(null);
    setTimeout(() => {
      navigate('/cart');
    }, 800);
  };

  return (
    <div className="container-premium pt-[88px] sm:pt-32 pb-32">
      <motion.button 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 text-[10px] font-black uppercase tracking-[0.2em]"
      >
        <ArrowLeft size={14} strokeWidth={3} /> Voltar para a Vitrine
      </motion.button>

      <div className="grid lg:grid-cols-2 gap-16 items-start">
        {/* Gallery */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 lg:max-w-md"
        >
          <div className="aspect-[4/3] rounded-3xl overflow-hidden glass-panel border-white/5 relative group p-2">
            <AnimatePresence mode="wait">
              <motion.img 
                key={mainImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={mainImage} 
                alt={product.nome} 
                className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-110" 
              />
            </AnimatePresence>
            
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              <button className="w-10 h-10 rounded-xl bg-dark-950/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:text-red-500 transition-all">
                <Heart size={18} strokeWidth={2.5} />
              </button>
              <button className="w-10 h-10 rounded-xl bg-dark-950/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:text-accent-blue transition-all">
                <Share2 size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar justify-center">
            {galleryItems.map((item, idx) => (
              <button 
                key={idx} 
                onClick={() => handleImageClick(item)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${mainImage === item.url ? 'border-accent-blue shadow-glow-blue' : 'border-white/5 opacity-40 hover:opacity-100'}`}
              >
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="px-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white text-dark-950 text-[9px] font-black uppercase tracking-widest mb-8 border border-dark-950 shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" /> {product.status}
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 tracking-tight leading-tight">
            {product.nome}
          </h1>

          <div className="flex items-center gap-4 mb-6 sm:mb-10">
            <div className="flex items-center gap-0.5 text-accent-blue">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="sm:w-[16px] sm:h-[16px]" fill={i < 4 ? "currentColor" : "none"} strokeWidth={3} />
              ))}
            </div>
            <span className="text-slate-400 font-bold text-[9px] sm:text-[11px] uppercase tracking-widest">4.8 (128 Avaliações)</span>
          </div>
          
          <div className="card-premium p-5 sm:p-8 mb-6 sm:mb-10 border-accent-blue/10 bg-accent-blue/[0.02] relative overflow-hidden">
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-sm sm:text-lg font-black text-accent-blue">R$</span>
              <span className="text-4xl sm:text-6xl font-black text-white tracking-tighter">
                {currentPrice}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em]">
                {selectedVariation?.metodoEntrega === 'MANUAL' ? 'Entrega Manual Assistida' : 'Entrega Digital Instantânea'}
              </p>
              {selectedVariation?.metodoEntrega !== 'MANUAL' && (
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${dataService.getDisplayStock(selectedVariation) > 5 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest">
                    Restam {dataService.getDisplayStock(selectedVariation)} un
                  </span>
                </div>
              )}
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-accent-blue/5 blur-[80px] rounded-full" />
          </div>
          
          <div className="mb-10">
            <VariationSelector 
              variations={variations} 
              selectedVariation={selectedVariation} 
              onSelect={(v) => {
                setSelectedVariation(v);
                setError(null);
              }} 
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-500/5 border border-red-500/20 text-red-500 px-5 py-3 rounded-2xl mb-8 flex items-center gap-3 text-[11px] font-black uppercase tracking-wider"
              >
                <AlertCircle size={18} strokeWidth={3} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 mb-8 sm:mb-12">
            <button 
              onClick={handleAddToCart} 
              disabled={added}
              className={`flex-1 btn-premium ${added ? 'bg-green-500 text-white' : 'btn-premium-primary'} !py-3 sm:!py-4 !text-sm sm:!text-xl shadow-glow-blue`}
            >
              {added ? (
                <div className="flex items-center gap-2">
                  <Check size={18} className="sm:w-[24px] sm:h-[24px]" strokeWidth={4} /> Adicionado!
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="sm:w-[24px] sm:h-[24px]" strokeWidth={2.5} /> Garantir Agora
                </div>
              )}
            </button>
          </div>

          <div className="space-y-6">
            <div className="card-premium p-5 sm:p-8 border-white/5 bg-dark-900/40">
              <h3 className="text-base sm:text-lg font-black mb-3 sm:mb-4 flex items-center gap-2">
                <div className="w-1 h-5 sm:h-6 bg-accent-blue rounded-full" />
                Descrição da Opção
              </h3>
              <div 
                className="text-slate-300 text-xs sm:text-sm leading-relaxed space-y-3 sm:space-y-4 font-medium" 
                dangerouslySetInnerHTML={{ 
                  __html: selectedVariation?.descricao || variations[0]?.descricao || "Nenhuma descrição disponível para esta variação." 
                }} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="card-premium p-3.5 sm:p-5 flex items-center gap-2.5 sm:gap-4 border-white/5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue border border-accent-blue/20 flex-shrink-0">
                  <Shield size={16} className="sm:w-[20px] sm:h-[20px]" strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Seguro</div>
                  <div className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase leading-none">100% Protegido</div>
                </div>
              </div>
              <div className="card-premium p-3.5 sm:p-5 flex items-center gap-2.5 sm:gap-4 border-white/5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 flex-shrink-0">
                  <Check size={16} className="sm:w-[20px] sm:h-[20px]" strokeWidth={3} />
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Entrega</div>
                  <div className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase leading-none">Via E-mail</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
