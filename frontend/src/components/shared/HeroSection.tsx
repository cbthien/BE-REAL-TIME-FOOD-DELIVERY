'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { MOCK_HERO_SLIDES } from '@/mocks';
import { HERO_SLIDE_COLORS } from '@/lib/constants';

/**
 * HeroSection Component
 * Auto-rotating promotional banner with manual navigation
 * Data source: MOCK_HERO_SLIDES → replace with API call: GET /api/promotions/banners
 */
export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // TODO: replace with API call GET /api/promotions/banners
  const slides = MOCK_HERO_SLIDES;

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Navigate to previous slide
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Navigate to next slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative w-full h-[500px] lg:h-[600px] overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background Gradient — colors defined in lib/constants.ts HERO_SLIDE_COLORS */}
          <div className={`absolute inset-0 bg-gradient-to-r ${HERO_SLIDE_COLORS[currentSlide % HERO_SLIDE_COLORS.length]} opacity-90`} />

          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40"
            style={{ backgroundImage: `url(${slides[currentSlide].imageUrl})` }}
          />

          {/* Content Container */}
          <div className="absolute inset-0 container mx-auto px-4 lg:px-8 flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
              {/* Text Content - Left Side */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-white z-10"
              >
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-sm font-semibold uppercase tracking-wider mb-4 text-yellow-300"
                >
                  Limited Time Offer
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-5xl lg:text-7xl font-black mb-4 leading-tight"
                >
                  {slides[currentSlide].title}
                </motion.h1>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-4xl lg:text-6xl font-bold mb-6"
                >
                  {slides[currentSlide].subtitle}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-xl lg:text-2xl mb-8 text-gray-100"
                >
                  {slides[currentSlide].description}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-red-600 hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-full shadow-xl"
                  >
                    <a href={slides[currentSlide].ctaLink}>
                      {slides[currentSlide].ctaText}
                    </a>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Image - Right Side (Hidden on mobile) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="hidden lg:flex justify-center items-center z-10"
              >
                <div className="relative w-full h-96">
                  <Image
                    src={slides[currentSlide].imageUrl}
                    alt={slides[currentSlide].title}
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white/50 w-2'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
