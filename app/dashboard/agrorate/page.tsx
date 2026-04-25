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
  benchmarkComparison: {
    regional?: number;
    national?: number;
  };
  trendHistory?: Array<{ date: string; score: number }>;
}

type TabId = 'score' | 'history' | 'analytics' | 'credit'

const mockHistory = [
  { date: 'Jan', score: 620 },
  { date: 'Fev', score: 680 },
  { date: 'Mar', score: 695 },
  { date: 'Abr', score: 725 },
];

const categoryConfig = {
  ELITE: { 
    label: 'Elite', 
    color: '#10b981',
    bg: '#ecfdf5',
    gradient: 'from-emerald-500 to-green-400',
    description: 'Você está no topo! Produtor de altíssimo risco.'
  },
  HIGH: { 
    label: 'Alto Desempenho', 
    color: '#3b82f6',
    bg: '#eff6ff',
    gradient: 'from-blue-500 to-cyan-400',
    description: 'Excelente perfil. Bancos competem por você.'
  },
  GOOD: { 
    label: 'Bom', 
    color: '#22c55e',
    bg: '#f0fdf4',
    gradient: 'from-green-500 to-lime-400',
    description: 'Bom histórico. Continue assim!'
  },
  REGULAR: { 
    label: 'Regular', 
    color: '#eab308',
    bg: '#fefce8',
    gradient: 'from-yellow-500 to-amber-400',
    description: 'Perfil moderado. Há espaço para melhorar.'
  },
  LOW: { 
    label: 'Baixo', 
    color: '#f97316',
    bg: '#fff7ed',
    gradient: 'from-orange-500 to-red-400',
    description: 'Necessita atenção. Foque nos fundamentals.'
  },
  CRITICAL: { 
    label: 'Crítico', 
    color: '#ef4444',
    bg: '#fef2f2',
    gradient: 'from-red-500 to-pink-400',
    description: 'Revise seus processos urgentemente.'
  },
};

export default function AgroRateDashboard() {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('score');
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
        benchmarkComparison: { regional: 680, national: 720 },
        trendHistory: mockHistory,
      });
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (data && !loading) {
      const duration = 2000;
      const steps = 60;
      const increment = data.score / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= data.score) {
          setAnimatedScore(data.score);
          clearInterval(interval);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }
  }, [data, loading]);

  if (loading) {
    return <LoadingScreen />;
  }

  const config = categoryConfig[data?.category as keyof typeof categoryConfig] || categoryConfig.REGULAR;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Header />
        
        <MainScoreCard data={data!} config={config} animatedScore={animatedScore} />

        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <AnimatePresence mode="wait">
          {activeTab === 'score' && <ScoreOverview data={data!} config={config} />}
          {activeTab === 'history' && <HistoryTab data={data!} config={config} />}
          {activeTab === 'analytics' && <AnalyticsTab data={data!} config={config} />}
          {activeTab === 'credit' && <CreditTab data={data!} config={config} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          className="w-24 h-24 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#16a34a" strokeWidth="4" strokeDasharray="60 40" />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Calculando seu AgroRate</h2>
        <p className="text-slate-400">Analisando dados da sua propriedade...</p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          AgroRate
        </h1>
        <p className="text-slate-400 mt-1">Sua pontuação de crédito baseada em dados reais</p>
      </div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link href="/dashboard/agrorate/credito" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all">
          Solicitar Crédito
        </Link>
      </motion.div>
    </motion.div>
  );
}

function MainScoreCard({ data, config, animatedScore }: { data: ScoreData; config: typeof categoryConfig[keyof typeof categoryConfig]; animatedScore: number }) {
  const scorePercent = (animatedScore / 1000) * 100;
  const circumference = 2 * Math.PI * 90;
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-gradient-to-br rounded-3xl p-8 overflow-hidden"
      style={{ backgroundColor: config.bg }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
        <div className="relative">
          <motion.svg 
            className="w-56 h-56 transform -rotate-90"
            viewBox="0 0 200 200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e8f0" strokeWidth="12" />
            <motion.circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={config.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - scorePercent / 100) }}
              transition={{ duration: 2, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 12px ${config.color}40)` }}
            />
          </motion.svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-6xl font-black"
              style={{ color: config.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {animatedScore}
            </motion.span>
            <span className="text-slate-400 text-sm">/ 1000</span>
          </div>
        </div>

        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4`} style={{ backgroundColor: config.bg, color: config.color }}>
              {config.label}
            </span>
            <p className="text-slate-600 text-lg mb-6 max-w-xl">{config.description}</p>
          </motion.div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <BenchmarkItem label="Sua Nota" value={animatedScore} color={config.color} />
            <BenchmarkItem label="Regional" value={data.benchmarkComparison?.regional || 680} color="#64748b" />
            <BenchmarkItem label="Nacional" value={data.benchmarkComparison?.national || 720} color="#64748b" />
          </div>

          <button
            onClick={() => {
              const prompt = `Analise meu score AgroRate de ${data.score} pontos (categoria ${config.label}). Minha margem é ${(data.marginRate * 100).toFixed(0)}%, produtividade R$ ${data.productivity}/ha e completude de dados ${(data.dataCompleteness * 100).toFixed(0)}%. O que devo melhorar para subir de categoria?`
              window.dispatchEvent(new CustomEvent('ai-prefill', { detail: { prompt } }))
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border"
            style={{ borderColor: config.color + '40', color: config.color, backgroundColor: config.bg }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Perguntar à IA sobre meu score
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function BenchmarkItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function Tabs({ activeTab, setActiveTab }: { activeTab: TabId; setActiveTab: (tab: TabId) => void }) {
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'score', label: 'Score', icon: '📊' },
    { id: 'history', label: 'Histórico', icon: '📈' },
    { id: 'analytics', label: 'Analytics', icon: '🔍' },
    { id: 'credit', label: 'Crédito', icon: '💰' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as typeof activeTab)}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === tab.id 
              ? 'bg-white text-slate-900 shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </motion.button>
      ))}
    </div>
  )
}

function ScoreOverview({ data, config }: { data: ScoreData; config: typeof categoryConfig[keyof typeof categoryConfig] }) {
  const dimensions = [
    { label: 'Produção', score: data.productionScore, weight: 30, icon: '🌾' },
    { label: 'Eficiência', score: data.efficiencyScore, weight: 25, icon: '⚡' },
    { label: 'Comportamento', score: data.behaviorScore, weight: 25, icon: '💳' },
    { label: 'Operacional', score: data.operationalScore, weight: 20, icon: '📱' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {dimensions.map((dim, index) => (
        <motion.div
          key={dim.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">{dim.icon}</span>
            <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded-full">{dim.weight}%</span>
          </div>
          <div className="text-sm text-slate-400 mb-2">{dim.label}</div>
          <div className="text-3xl font-bold text-white mb-3">{dim.score}</div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full"
              style={{ backgroundColor: config.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(dim.score / 1000) * 100}%` }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      ))}

      <MetricCard label="Receita Total" value={`R$ ${(data.totalRevenue / 1000).toFixed(0)}k`} icon="💵" color="#22c55e" />
      <MetricCard label="Custos Totais" value={`R$ ${(data.totalCosts / 1000).toFixed(0)}k`} icon="📦" color="#ef4444" />
      <MetricCard label="Margem Bruta" value={`${(data.marginRate * 100).toFixed(0)}%`} icon="📈" color="#3b82f6" />
      <MetricCard label="Produtividade" value={`R$ ${data.productivity}/ha`} icon="🌱" color="#8b5cf6" />
    </motion.div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </motion.div>
  );
}

function HistoryTab({ data }: { data: ScoreData; config: typeof categoryConfig[keyof typeof categoryConfig] }) {
  const history = data.trendHistory || mockHistory;
  const maxScore = Math.max(...history.map(h => h.score));
  const minScore = Math.min(...history.map(h => h.score));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-6">Evolução do Score</h3>
        <div className="flex items-end justify-between gap-4 h-64">
          {history.map((item, index) => (
            <motion.div
              key={item.date}
              initial={{ height: 0 }}
              animate={{ height: `${((item.score - minScore) / (maxScore - minScore)) * 100}%` }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              className="flex-1 flex flex-col items-center"
            >
              <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg relative group">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-700 px-3 py-1 rounded-lg text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.score}
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2">{item.date}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBox label="Mesma faixa" value="3 meses" sublabel="na categoria GOOD" icon="📊" />
        <StatBox label="Melhoria" value={`+${history[history.length - 1].score - history[0].score}`} sublabel="pontos este ano" icon="📈" />
        <StatBox label="Tendência" value="Subindo" sublabel="8.2% de crescimento" icon="🚀" />
      </div>
    </motion.div>
  );
}

function StatBox({ label, value, sublabel, icon }: { label: string; value: string; sublabel: string; icon: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-white font-bold text-xl">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="text-slate-500 text-xs mt-1">{sublabel}</div>
    </motion.div>
  );
}

function AnalyticsTab({ data }: { data: ScoreData; config: typeof categoryConfig[keyof typeof categoryConfig] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-6">Score Distribution</h3>
        <div className="space-y-4">
          <BarChart label="Produção" value={data.productionScore} maxValue={1000} color="#22c55e" />
          <BarChart label="Eficiência" value={data.efficiencyScore} maxValue={1000} color="#3b82f6" />
          <BarChart label="Comportamento" value={data.behaviorScore} maxValue={1000} color="#8b5cf6" />
          <BarChart label="Operacional" value={data.operationalScore} maxValue={1000} color="#f59e0b" />
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-6">Dados Completude</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#334155" strokeWidth="12" />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#16a34a"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 70}
                initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - data.dataCompleteness) }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-white">{(data.dataCompleteness * 100).toFixed(0)}%</div>
              <div className="text-slate-400 text-sm">Completo</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <div className="text-xl font-bold text-emerald-400">92%</div>
            <div className="text-xs text-slate-400">Pontualidade</div>
          </div>
          <div className="text-center p-3 bg-slate-700/50 rounded-lg">
            <div className="text-xl font-bold text-blue-400">24</div>
            <div className="text-xs text-slate-400">Atividades</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BarChart({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <motion.div 
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / maxValue) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function CreditTab({ data }: { data: ScoreData; config: typeof categoryConfig[keyof typeof categoryConfig] }) {
  const offers = [
    { partner: 'Sicredi', type: 'Cooperativa', name: 'Crédito Rural Premium', rate: 1.2, amount: 200000, minScore: 750, featured: true },
    { partner: 'Banco do Brasil', type: 'Banco', name: 'Finagro', rate: 1.4, amount: 150000, minScore: 600, featured: false },
    { partner: 'Sicoob', type: 'Cooperativa', name: 'Crédito Insumos', rate: 1.5, amount: 100000, minScore: 650, featured: false },
    { partner: 'AgroCred', type: 'Fintech', name: 'Antecipação', rate: 2.0, amount: 50000, minScore: 500, featured: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Simule seu Crédito</h3>
        <input
          type="range"
          min="10000"
          max="200000"
          step="5000"
          className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="text-center text-3xl font-bold text-emerald-400 mt-4">R$ 50.000</div>
      </div>

      <div className="grid gap-4">
        {offers.map((offer) => (
          <motion.div
            key={offer.name}
            whileHover={{ scale: 1.01 }}
            className={`bg-slate-800/50 backdrop-blur rounded-xl p-5 border-2 border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer ${
              data.score >= offer.minScore ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{offer.partner}</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">{offer.type}</span>
                  {offer.featured && (
                    <span className="text-xs px-2 py-0.5 bg-emerald-500 text-white rounded">Recomendado</span>
                  )}
                </div>
                <div className="text-slate-400 text-sm">{offer.name}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-400">{offer.rate}%</div>
                <div className="text-xs text-slate-500">ao mês</div>
              </div>
            </div>
            <div className="flex justify-between mt-3 pt-3 border-t border-slate-700">
              <span className="text-slate-400 text-sm">até R$ {offer.amount.toLocaleString()}</span>
              <span className="text-slate-400 text-sm">Score mínimo: {offer.minScore}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}