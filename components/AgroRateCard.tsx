'use client';

import { useState, useEffect } from 'react';

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
  lastCalculated: string;
}

interface AgroRateCardProps {
  propertyId?: string;
  compact?: boolean;
}

const categoryConfig = {
  ELITE: { label: 'Elite', color: 'emerald', range: '900-1000' },
  HIGH: { label: 'Alto', color: 'blue', range: '750-899' },
  GOOD: { label: 'Bom', color: 'green', range: '600-749' },
  REGULAR: { label: 'Regular', color: 'yellow', range: '450-599' },
  LOW: { label: 'Baixo', color: 'orange', range: '300-449' },
  CRITICAL: { label: 'Crítico', color: 'red', range: '0-299' },
};

const colorClasses = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
};

const textClasses = {
  emerald: 'text-emerald-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
};

const bgClasses = {
  emerald: 'bg-emerald-50 border-emerald-200',
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  orange: 'bg-orange-50 border-orange-200',
  red: 'bg-red-50 border-red-200',
};

export default function AgroRateCard({ propertyId, compact = false }: AgroRateCardProps) {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScore() {
      if (!propertyId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/agrorate/score?propertyId=${propertyId}`);
        if (!res.ok) throw new Error('Erro ao carregar score');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchScore();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
        <div className="h-12 bg-gray-200 rounded w-20" />
      </div>
    );
  }

  if (!data && !propertyId) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6">
        <div className="text-sm text-gray-500 mb-2">AgroRate</div>
        <div className="text-gray-400 text-sm">
          Configure sua propriedade para ver seu score
        </div>
      </div>
    );
  }

  const category = data?.category?.toLowerCase() as keyof typeof categoryConfig || 'regular';
  const config = categoryConfig[category] || categoryConfig.REGULAR;

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-emerald-600';
    if (score >= 600) return 'text-blue-600';
    if (score >= 450) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (compact) {
    return (
      <div className={`rounded-xl border p-4 ${bgClasses[category]}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">AgroRate</div>
            <div className={`text-2xl font-bold ${getScoreColor(data?.score || 0)}`}>
              {data?.score || 0}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${textClasses[category]} bg-white`}>
            {config.label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${bgClasses[category]} p-6`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">AgroRate</div>
          <div className="text-xs text-gray-400 mt-1">
            Atualizado em {data?.lastCalculated ? new Date(data.lastCalculated).toLocaleDateString('pt-BR') : '-'}
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full font-semibold ${textClasses[category]} bg-white`}>
          {config.label}
        </div>
      </div>

      <div className="text-center mb-8">
        <div className={`text-7xl font-black ${getScoreColor(data?.score || 0)}`}>
          {data?.score || 0}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Faixa: {config.range}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <ScoreBar label="Produção" score={data?.productionScore || 0} weight={30} />
        <ScoreBar label="Eficiência" score={data?.efficiencyScore || 0} weight={25} />
        <ScoreBar label="Comportamento" score={data?.behaviorScore || 0} weight={25} />
        <ScoreBar label="Operacional" score={data?.operationalScore || 0} weight={20} />
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <MetricRow label="Receita Total" value={`R$ ${((data?.totalRevenue || 0) / 1000).toFixed(1)}k`} />
        <MetricRow label="Custos Totais" value={`R$ ${((data?.totalCosts || 0) / 1000).toFixed(1)}k`} />
        <MetricRow label="Margem" value={`${((data?.marginRate || 0) * 100).toFixed(1)}%`} />
        <MetricRow label="Serviços" value={data?.activityCount?.toString() || '0'} />
        <MetricRow label="Pontualidade" value={`${((data?.paymentOnTimeRate || 0) * 100).toFixed(0)}%`} />
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <a
          href="/dashboard/agrorate"
          className={`block text-center py-2.5 rounded-lg font-medium transition-colors ${textClasses[category]} hover:bg-white/50`}
        >
          Ver detalhes completos →
        </a>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{score}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-current rounded-full transition-all duration-500"
          style={{ width: `${(score / 1000) * 100}%`, opacity: 0.6 }}
        />
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{weight}% do peso</div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
