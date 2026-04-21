'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface ScoreData {
  score: number;
  category: string;
  productionScore: number;
  efficiencyScore: number;
  behaviorScore: number;
  operationalScore: number;
  totalRevenue: number;
  totalCosts: number;
  productivity: number;
  marginRate: number;
  activityCount: number;
  paymentOnTimeRate: number;
  dataCompleteness: number;
  lastCalculated: string;
}

const mockHistory = [
  { date: 'Jan', score: 620 },
  { date: 'Fev', score: 680 },
  { date: 'Mar', score: 695 },
  { date: 'Abr', score: 725 },
];

const categoryConfig = {
  ELITE: { label: 'Elite', color: '#10b981', bg: '#ecfdf5', description: 'Você está no topo!' },
  HIGH: { label: 'Alto Desempenho', color: '#3b82f6', bg: '#eff6ff', description: 'Excelente perfil.' },
  GOOD: { label: 'Bom', color: '#22c55e', bg: '#f0fdf4', description: 'Bom histórico.' },
  REGULAR: { label: 'Regular', color: '#eab308', bg: '#fefce8', description: 'Perfil moderado.' },
  LOW: { label: 'Baixo', color: '#f97316', bg: '#fff7ed', description: 'Necessita atenção.' },
  CRITICAL: { label: 'Crítico', color: '#ef4444', bg: '#fef2f2', description: 'Revise processos.' },
};

export default function AgroRateDemo() {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'score' | 'history' | 'credit'>('score');
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        score: 725,
        category: 'GOOD',
        productionScore: 780,
        efficiencyScore: 650,
        behaviorScore: 720,
        operationalScore: 750,
        totalRevenue: 450000,
        totalCosts: 280000,
        productivity: 5200,
        marginRate: 0.38,
        activityCount: 24,
        paymentOnTimeRate: 0.92,
        dataCompleteness: 0.85,
        lastCalculated: new Date().toISOString(),
      });
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (data && !loading) {
      let current = 0;
      const interval = setInterval(() => {
        current += data.score / 60;
        if (current >= data.score) {
          setAnimatedScore(data.score);
          clearInterval(interval);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, 2000 / 60);
      return () => clearInterval(interval);
    }
  }, [data, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-20 h-20 mx-auto mb-6 border-4 border-t-emerald-500 border-slate-700 rounded-full" />
          <h2 className="text-2xl font-bold text-white">Calculando AgroRate...</h2>
        </div>
      </div>
    );
  }

  const config = categoryConfig[data?.category as keyof typeof categoryConfig] || categoryConfig.REGULAR;
  const circumference = 2 * Math.PI * 85;
  const progress = (animatedScore / 1000) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AgroRate</h1>
          <p className="text-slate-400">Demonstração - Dados Mockados</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-3xl blur-3xl" />
          <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <svg className="w-44 h-44 transform -rotate-90">
                  <circle cx="88" cy="88" r="85" fill="none" stroke="#334155" strokeWidth="10" />
                  <motion.circle cx="88" cy="88" r="85" fill="none" stroke={config.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference - progress }} transition={{ duration: 2, ease: 'easeOut' }} style={{ filter: `drop-shadow(0 0 15px ${config.color}50)` }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-5xl font-black" style={{ color: config.color }}>{animatedScore}</motion.span>
                  <span className="text-slate-500 text-sm">/ 1000</span>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4" style={{ backgroundColor: config.bg, color: config.color }}>
                    {config.label}
                  </span>
                  <p className="text-slate-300 text-lg mb-4">{config.description}</p>
                  <p className="text-slate-500">Atualizado: {new Date(data.lastCalculated).toLocaleDateString('pt-BR')}</p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'score', label: 'Score', icon: '📊' },
            { id: 'history', label: 'Histórico', icon: '📈' },
            { id: 'credit', label: 'Crédito', icon: '💰' },
          ].map((tab) => (
            <motion.button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`} whileTap={{ scale: 0.95 }}>
              <span className="mr-2">{tab.icon}</span>{tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'score' && (
            <motion.div key="score" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Produção', score: data.productionScore, weight: 30, icon: '🌾' },
                { label: 'Eficiência', score: data.efficiencyScore, weight: 25, icon: '⚡' },
                { label: 'Comportamento', score: data.behaviorScore, weight: 25, icon: '💳' },
                { label: 'Operacional', score: data.operationalScore, weight: 20, icon: '📱' },
              ].map((dim, i) => (
                <motion.div key={dim.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
                  <div className="flex justify-between mb-3"><span className="text-2xl">{dim.icon}</span><span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">{dim.weight}%</span></div>
                  <div className="text-sm text-slate-400 mb-1">{dim.label}</div>
                  <div className="text-2xl font-bold text-white mb-2">{dim.score}</div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: config.color }} initial={{ width: 0 }} animate={{ width: `${(dim.score / 1000) * 100}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }} />
                  </div>
                </motion.div>
              ))}
              <MetricCard label="Receita" value={`R$ ${(data.totalRevenue / 1000).toFixed(0)}k`} icon="💵" color="#22c55e" />
              <MetricCard label="Custos" value={`R$ ${(data.totalCosts / 1000).toFixed(0)}k`} icon="📦" color="#ef4444" />
              <MetricCard label="Margem" value={`${(data.marginRate * 100).toFixed(0)}%`} icon="📈" color="#3b82f6" />
              <MetricCard label="Produtividade" value={`R$ ${data.productivity}`} icon="🌱" color="#8b5cf6" />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-6">Evolução do Score</h3>
              <div className="flex items-end justify-between gap-2 h-48">
                {mockHistory.map((item, i) => (
                  <motion.div key={item.date} initial={{ height: 0 }} animate={{ height: `${((item.score - 600) / 400) * 100}%` }} transition={{ delay: i * 0.2, duration: 0.5 }} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg" />
                    <div className="text-xs text-slate-500 mt-2">{item.date}</div>
                    <div className="text-xs font-medium text-emerald-400">{item.score}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'credit' && (
            <motion.div key="credit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid gap-4">
              {[
                { partner: 'Sicredi', type: 'Cooperativa', name: 'Crédito Rural Premium', rate: 1.2, amount: 200000, minScore: 750, featured: true },
                { partner: 'Banco do Brasil', type: 'Banco', name: 'Finagro', rate: 1.4, amount: 150000, minScore: 600, featured: false },
                { partner: 'Sicoob', type: 'Cooperativa', name: 'Crédito Insumos', rate: 1.5, amount: 100000, minScore: 650, featured: false },
              ].map((offer) => (
                <motion.div key={offer.name} whileHover={{ scale: 1.01 }} className={`bg-slate-800/60 backdrop-blur rounded-xl p-5 border-2 border-slate-700/50 hover:border-emerald-500/50 transition-all ${data.score >= offer.minScore ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{offer.partner}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{offer.type}</span>
                        {offer.featured && <span className="text-xs px-2 py-0.5 bg-emerald-500 text-white rounded">Rec.</span>}
                      </div>
                      <div className="text-slate-400 text-sm">{offer.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">{offer.rate}%</div>
                      <div className="text-xs text-slate-500">ao mês</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="text-center mt-8">
          <p className="text-slate-500 text-sm">Versão de demonstração - Dados mockados</p>
          <p className="text-slate-600 text-xs mt-1">Acesse via app para dados reais</p>
        </motion.div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2"><span className="text-xl">{icon}</span><div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /></div>
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </motion.div>
  );
}