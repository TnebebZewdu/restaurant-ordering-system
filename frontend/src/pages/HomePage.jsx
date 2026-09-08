import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <section
      id="home"
      className="relative h-[330px] md:h-[380px] rounded-3xl overflow-hidden shadow-xl border border-orange-100 group"
    >
      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1600&q=85"
        alt="Delicious burger"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Warm Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-950/90 via-orange-900/65 to-black/30" />

      {/* Orange Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/30 rounded-full blur-3xl animate-pulse" />

      {/* Floating Circle */}
      <div className="absolute top-8 right-16 w-20 h-20 border border-orange-300/30 rounded-full animate-[spin_12s_linear_infinite]" />

      {/* Small Glow */}
      <div className="absolute bottom-8 left-1/2 w-12 h-12 bg-orange-400/20 rounded-full blur-xl animate-pulse" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-10 text-white">
        {/* Small Badge */}
        <div className="inline-flex items-center w-fit px-3 py-1 mb-3 rounded-full bg-orange-500/20 border border-orange-300/30 backdrop-blur-sm text-orange-100 text-xs font-semibold">
          Fresh • Delicious • Made For You
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
          Restaurant Menu
        </h1>

        {/* Description */}
        <p className="mt-2 text-sm md:text-base text-orange-50/90 max-w-xl">
          Explore our delicious meals and place your order with just a few
          clicks.
        </p>

        {/* Decorative Line */}
        <div className="mt-4 h-1 w-20 rounded-full bg-orange-400" />

        {/* View Menu Button */}
        <button
          onClick={() => navigate('/menu')}
          className="mt-5 w-fit px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
        >
          View Menu →
        </button>
      </div>

      {/* Floating Badge */}
      <div className="absolute right-5 bottom-5 md:right-8 md:bottom-8 bg-white/95 backdrop-blur-md text-orange-700 px-4 py-3 rounded-2xl shadow-xl border border-orange-100 z-10">
        <div className="text-xs font-semibold">
          Made for You
        </div>

        <div className="text-[10px] text-orange-500 mt-1">
          Freshly prepared
        </div>
      </div>

      {/* Left → Right Shine Animation */}
      <div className="shine-animation" />
    </section>
  );
};

export default HomePage;