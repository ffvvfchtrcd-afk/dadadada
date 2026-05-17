import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../services/dataService';
import ProductCard from '../components/ProductCard';
import BannerCarousel from '../components/BannerCarousel';
import { LayoutGrid, SearchX, Sparkles, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

import { formatImageUrl } from '../utils/imageUtils';

const DEFAULT_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prods, cats] = await Promise.all([
          dataService.getProducts(),
          dataService.getCategories()
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleSearch = (e) => setSearchQuery(e.detail);
    window.addEventListener('search-query-change', handleSearch);
    return () => window.removeEventListener('search-query-change', handleSearch);
  }, []);

  const getFilteredProducts = (categoryId) => {
    return products.filter(p => {
      const matchesCategory = categoryId ? p.categoriaId === categoryId : true;
      const matchesSearch = searchQuery 
        ? p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
          p.miniDesc?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesCategory && matchesSearch;
    });
  };

  const filteredProducts = getFilteredProducts(activeCategory);

  return (
    <div className="pb-32 pt-[76px] sm:pt-[130px] bg-dark-950 min-h-screen">
      {/* Hero Section */}
      {!searchQuery && (
        <section className="mb-12">
          <BannerCarousel />
          
          <div className="container-premium mt-8">
            <div className="flex flex-wrap items-center justify-center gap-12 py-4 border-y border-white/5 opacity-50">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck size={14} className="text-accent-blue" /> Ativos Seguros
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em]">
                <Sparkles size={14} className="text-accent-blue" /> Qualidade Premium
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em]">
                <TrendingUp size={14} className="text-accent-blue" /> Escala Instantânea
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="container-premium">
        {/* Categorias com Rolagem Lateral */}
        {!searchQuery && (
          <section className="mb-16">
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="premium-title !mb-1 text-2xl">Explorar <span className="text-gradient-blue">Categorias</span></h2>
                <p className="premium-subtitle">Navegue por nossas coleções especializadas</p>
              </div>
            </header>

            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x">
              {/* Card "Todas" */}
              <motion.button 
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(null)}
                className={`relative group h-28 w-28 sm:h-44 sm:w-40 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-500 snap-start ${
                  activeCategory === null ? 'border-accent-blue shadow-lg shadow-accent-blue/10' : 'border-white/5'
                }`}
              >
                <div className="absolute inset-0 bg-dark-800">
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                    <LayoutGrid className="w-10 h-10 sm:w-[60px] sm:h-[60px]" strokeWidth={1} />
                  </div>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-t from-dark-950/90 to-transparent flex flex-col justify-end p-2 sm:p-4 transition-colors ${
                  activeCategory === null ? 'from-accent-blue/40' : ''
                }`}>
                  <span className={`font-black uppercase text-[8px] sm:text-[10px] tracking-widest ${
                    activeCategory === null ? 'text-dark-950' : 'text-white'
                  }`}>Todos Produtos</span>
                  <span className={`text-[6px] sm:text-[8px] font-bold uppercase opacity-60 ${
                    activeCategory === null ? 'text-dark-950' : 'text-slate-400'
                  }`}>Explorar Tudo</span>
                </div>
              </motion.button>

              {/* Cards de Categoria Dinâmicos */}
              {categories.map((cat) => (
                <motion.button 
                  key={cat.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative group h-28 w-28 sm:h-44 sm:w-40 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-500 snap-start ${
                    activeCategory === cat.id ? 'border-accent-blue shadow-lg shadow-accent-blue/10' : 'border-white/5'
                  }`}
                >
                  <img 
                    src={formatImageUrl(cat.imageUrl, DEFAULT_CATEGORY_IMAGE)} 
                    alt={cat.nome} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent flex flex-col justify-end p-2 sm:p-4 transition-colors ${
                    activeCategory === cat.id ? 'from-accent-blue/40' : ''
                  }`}>
                    <span className={`font-black uppercase text-[8px] sm:text-[10px] tracking-widest ${
                      activeCategory === cat.id ? 'text-dark-950' : 'text-white'
                    }`}>{cat.nome}</span>
                    <span className={`text-[6px] sm:text-[8px] font-bold uppercase opacity-60 ${
                      activeCategory === cat.id ? 'text-dark-950' : 'text-slate-400'
                    }`}>Ver Itens</span>
                  </div>
                  <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Listagem de Produtos */}
        <div className="space-y-20">
          {searchQuery || activeCategory ? (
            // Grid Normal quando há filtro ou busca
            <section>
              <header className="mb-8">
                <h2 className="premium-title !mb-1 text-2xl">
                  {searchQuery ? (
                    <>Resultados para "<span className="text-gradient-blue">{searchQuery}</span>"</>
                  ) : (
                    <><span className="text-gradient-blue">{categories.find(c => c.id === activeCategory)?.nome}</span></>
                  )}
                </h2>
                <p className="premium-subtitle">
                  {searchQuery 
                    ? `Encontramos ${filteredProducts.length} itens`
                    : `Mostrando produtos em ${categories.find(c => c.id === activeCategory)?.nome}`
                  }
                </p>
              </header>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="card-premium h-64 animate-pulse p-4" />
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="card-premium border-dashed border-2 border-white/5 py-32 text-center">
                  <SearchX size={32} className="mx-auto mb-6 text-slate-600" />
                  <h3 className="text-xl font-black mb-4">Nada encontrado</h3>
                  <button onClick={() => {setSearchQuery(''); setActiveCategory(null)}} className="btn-premium btn-premium-secondary !text-[11px]">Resetar Filtros</button>
                </div>
              )}
            </section>
          ) : (
            // Layout "Todas": Produtos separados por categoria com rolagem lateral
            categories.map(category => {
              const categoryProducts = getFilteredProducts(category.id);
              if (categoryProducts.length === 0) return null;

              return (
                <section key={category.id} className="relative">
                  <header className="mb-6 flex items-center justify-between pr-4">
                    <div>
                      <h3 className="text-xl font-black flex items-center gap-2 group cursor-pointer" onClick={() => setActiveCategory(category.id)}>
                        {category.nome} 
                        <ArrowRight size={18} className="text-accent-blue opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveCategory(category.id)}
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-accent-blue transition-colors"
                    >
                      Ver Tudo
                    </button>
                  </header>

                  <div className="flex gap-3 sm:gap-5 overflow-x-auto pb-8 no-scrollbar snap-x">
                    {categoryProducts.map(product => (
                      <div key={product.id} className="w-[145px] sm:w-[220px] flex-shrink-0 snap-start">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
