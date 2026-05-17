import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/admin/StorePreview/ProductCard';
import { api } from '@/services/api';

export default function StorePreview() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodsData, catsData] = await Promise.all([
          api.get('products'),
          api.get('categories')
        ]);
        setProducts(prodsData);
        setCategories(catsData);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.categoriaId === selectedCategory);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Vitrine da Loja</h1>
        <p className="text-gray-400 mt-1">Preview de como os clientes verão os seus produtos na loja principal.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-brand-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-gray-200 border border-dark-600'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-gray-200 border border-dark-600'
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </div>

          {selectedCategory === 'all' ? (
            <div className="space-y-10">
              {categories.map(cat => {
                const catProducts = products.filter(p => p.categoriaId === cat.id);
                if (catProducts.length === 0) return null;
                
                return (
                  <div key={cat.id} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-100 px-1 border-l-4 border-brand-500 pl-3">
                      {cat.nome}
                    </h2>
                    <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-6 pt-2 px-1 snap-x">
                      {catProducts.map((product, i) => (
                        <div key={product.id} className="min-w-[280px] w-[300px] flex-shrink-0 snap-start">
                          <ProductCard product={product} index={i} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && (
                <div className="py-12 text-center text-gray-500 glass-card rounded-2xl">
                  Nenhum produto encontrado.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 glass-card rounded-2xl">
                  Nenhum produto encontrado nesta categoria.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
