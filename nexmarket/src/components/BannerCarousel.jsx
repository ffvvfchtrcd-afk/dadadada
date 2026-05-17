import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dataService } from '../services/dataService';
import { formatImageUrl } from '../utils/imageUtils';

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await dataService.getBanners();
        const activeBanners = data
          .filter(b => b.status === 'ATIVO' && b.position === 'home-top')
          .sort((a, b) => a.order - b.order);
        setBanners(activeBanners);
      } catch (err) {
        console.error('Erro ao buscar banners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners]);

  const next = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prev = () => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));

  if (loading) {
    return (
      <div className="relative w-full h-[160px] sm:h-[220px] md:h-[280px] px-4 sm:px-6 lg:px-8 mt-2 animate-pulse">
        <div className="w-full h-full rounded-[1.5rem] bg-dark-800 border-2 border-white/10" />
      </div>
    );
  }

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden group px-4 sm:px-6 lg:px-8 mt-2">
      <div className="w-full h-full relative rounded-[1.5rem] overflow-hidden bubble-card border-2 border-white/15 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 w-full h-full cursor-pointer"
            onClick={() => {
              if (currentBanner.link) {
                window.location.href = currentBanner.link;
              }
            }}
          >
            <img 
              src={formatImageUrl(currentBanner.imageUrl, "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop")} 
              className="w-full h-full object-cover"
              alt={currentBanner.title || `Banner ${currentIndex + 1}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-transparent" />
            {currentBanner.title && (
              <div className="absolute bottom-4 left-6 z-10 text-white drop-shadow-md">
                <h3 className="font-black text-xs sm:text-sm md:text-base uppercase tracking-widest text-shadow-sm">{currentBanner.title}</h3>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Compact Controls */}
        {banners.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border-b-2 border-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 hover:bg-accent-blue hover:text-dark-950 active:scale-90"
            >
              <ChevronLeft size={18} strokeWidth={3} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border-b-2 border-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 hover:bg-accent-blue hover:text-dark-950 active:scale-90"
            >
              <ChevronRight size={18} strokeWidth={3} />
            </button>

            {/* Small Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`h-1.5 rounded-full transition-all duration-500 border border-black/20 ${currentIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
