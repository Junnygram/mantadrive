'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  Shield,
  Zap,
  Users,
  ArrowRight,
  Play,
  Sparkles,
  Star,
  Heart,
} from 'lucide-react';

export default function GenZLandingPage() {
  const [currentEmoji, setCurrentEmoji] = useState(0);
  const [isVibing, setIsVibing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  const vibeEmojis = ['✨', '🔥', '💫', '⚡', '🌟', '💎', '🚀', '💜'];
  const reactions = ['slay', 'fire', 'iconic', 'periodt', 'no cap'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji((prev) => (prev + 1) % vibeEmojis.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Cloud,
      title: 'Smart File Storage',
      desc: 'AI-powered organization that keeps your files perfectly sorted 🌙',
      color: 'from-purple-400 to-pink-400',
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      desc: 'Military-grade encryption with AI threat detection 🛡️',
      color: 'from-blue-400 to-cyan-400',
    },
    {
      icon: Zap,
      title: 'Lightning Processing',
      desc: 'Instant file conversion, background removal & text extraction ⚡',
      color: 'from-yellow-400 to-orange-400',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      desc: 'Share files with QR codes and secure links instantly 👥',
      color: 'from-green-400 to-emerald-400',
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const glowAnimation = {
    animate: {
      boxShadow: [
        '0 0 20px rgba(139, 92, 246, 0.3)',
        '0 0 60px rgba(139, 92, 246, 0.5)',
        '0 0 20px rgba(139, 92, 246, 0.3)',
      ],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Floating cursor effect */}
      <motion.div
        className="fixed pointer-events-none z-50 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-sm"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [null, -100],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 px-6 py-4 flex justify-between items-center backdrop-blur-sm"
      >
        <motion.div
          className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          whileHover={{ scale: 1.05 }}
        >
          MantaDrive {vibeEmojis[currentEmoji]}
        </motion.div>
        <div className="space-x-4">
          <motion.button
            onClick={() => router.push('/login')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Login
          </motion.button>
          <motion.button
            onClick={() => router.push('/signup')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 font-semibold"
          >
            Sign Up
          </motion.button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 text-center">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto"
        >
          <motion.div
            variants={fadeInUp}
            className="text-8xl font-black mb-6 leading-none"
          >
            <span className="block">Your Files</span>
            <motion.span
              className="block bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                backgroundSize: '200% 200%',
              }}
            >
              Supercharged
            </motion.span>
            <motion.span
              className="block text-6xl"
              animate={{
                textShadow: [
                  '0 0 20px rgba(139, 92, 246, 0.5)',
                  '0 0 40px rgba(139, 92, 246, 0.8)',
                  '0 0 20px rgba(139, 92, 246, 0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨ With AI ✨
            </motion.span>
          </motion.div>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-light"
          >
            Smart cloud storage with AI-powered file organization, instant
            processing, and military-grade security. Your files deserve better.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="flex justify-center space-x-4 flex-wrap gap-4"
          >
            <motion.button
              onClick={() => router.push('/signup')}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              variants={glowAnimation}
              animate="animate"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold flex items-center space-x-2 hover:from-purple-600 hover:to-pink-600 shadow-lg"
            >
              <Sparkles className="h-5 w-5" />
              <span>Get Started Free</span>
              <ArrowRight className="h-5 w-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border-2 border-purple-400 text-purple-400 rounded-full font-bold flex items-center space-x-2 hover:bg-purple-400 hover:text-white transition-all backdrop-blur-sm"
            >
              <Play className="h-5 w-5" />
              <span>Watch the Vibe</span>
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {isVibing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mt-8 text-2xl"
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block"
                >
                  🔥
                </motion.span>
                <span className="ml-2 text-purple-400 font-bold">
                  {reactions[Math.floor(Math.random() * reactions.length)]}!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">
              Features That <span className="text-purple-400">Transform</span>
            </h2>
            <p className="text-xl text-gray-300 font-light">
              Everything you need to manage files like a pro it 💅
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10, scale: 1.02, rotateY: 5 }}
                className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-purple-400 transition-all duration-300"
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full mb-4 shadow-lg`}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social proof section */}
      <section className="relative z-10 px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl font-black text-white mb-8">
            The Reviews Are In 📱
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                text: 'literally changed my life no cap',
                user: '@techbestie',
                rating: 5,
              },
              {
                text: 'finally a cloud storage that gets it',
                user: '@digitalqueen',
                rating: 5,
              },
              {
                text: 'this is actually so clean periodt',
                user: '@vibecheck',
                rating: 5,
              },
            ].map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700"
              >
                <div className="flex justify-center mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-300 mb-3 italic">"{review.text}"</p>
                <p className="text-purple-400 font-semibold">{review.user}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl p-12 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 animate-pulse"></div>

            <div className="relative z-10">
              <motion.h2
                className="text-5xl font-black mb-4"
                animate={{
                  textShadow: [
                    '0 0 20px rgba(255, 255, 255, 0.5)',
                    '0 0 40px rgba(255, 255, 255, 0.8)',
                    '0 0 20px rgba(255, 255, 255, 0.5)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Ready to Serve Main Character Energy?
              </motion.h2>
              <p className="text-xl mb-8 opacity-90 font-light">
                Join the thousands who are already living their best digital
                life ✨
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-4 bg-white text-purple-600 rounded-full font-black text-lg hover:bg-gray-100 shadow-2xl"
              >
                Start Your Glow Up Journey
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-gray-800 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center items-center space-x-4 mb-4"
        >
          <Heart className="h-5 w-5 text-pink-400" />
          <span className="text-gray-400">
            Made with love for the digital generation
          </span>
          <Heart className="h-5 w-5 text-pink-400" />
        </motion.div>
        <p className="text-gray-500">
          © 2024 MantaDrive. All rights reserved. No cap.
        </p>
      </footer>
    </div>
  );
}
