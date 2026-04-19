'use client';

import { useState, useEffect } from 'react';

interface Partner {
  id: string;
  name: string;
  type: string;
  logoUrl: string | null;
  isActive: boolean;
  priority: number;
  requestCount: number;
  approvalRate: number;
  totalVolume: number;
}

interface Lead {
  id: string;
  producerName: string;
  propertyName: string;
  score: number;
  category: string;
  requestedAmount: number;
  status: string;
  createdAt: string;
}

const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'Sicredi',
    type: 'COOPERATIVE',
    logoUrl: null,
    isActive: true,
    priority: 1,
    requestCount: 45,
    approvalRate: 82,
    totalVolume: 2500000,
  },
  {
    id: '2',
    name: 'Sicoob',
    type: 'COOPERATIVE',
    logoUrl: null,
    isActive: true,
    priority: 2,
    requestCount: 38,
    approvalRate: 78,
    totalVolume: 1850000,
  },
  {
    id: '3',
    name: 'Banco do Brasil',
    type: 'BANK',
    logoUrl: null,
    isActive: true,
    priority: 3,
    requestCount: 52,
    approvalRate: 75,
    totalVolume: 4200000,
  },
];

const mockLeads: Lead[] = [
  {
    id: '1',
    producerName: 'João Silva',
    propertyName: 'Fazenda Boa Vista',
    score: 890,
    category: 'HIGH',
    requestedAmount: 150000,
    status: 'PENDING',
    createdAt: '2026-04-15T10:30:00Z',
  },
  {
    id: '2',
    producerName: 'Maria Santos',
    propertyName: 'Sítio Esperança',
    score: 780,
    category: 'HIGH',
    requestedAmount: 80000,
    status: 'APPROVED',
    createdAt: '2026-04-14T14:20:00Z',
  },
  {
    id: '3',
    producerName: 'Pedro Oliveira',
    propertyName: 'Fazenda Três Irmãos',
    score: 650,
    category: 'GOOD',
    requestedAmount: 200000,
    status: 'ANALYZING',
    createdAt: '2026-04-14T09:15:00Z',
  },
  {
    id: '4',
    producerName: 'Carlos Ferreira',
    propertyName: 'Chácara Nova Vida',
    score: 520,
    category: 'REGULAR',
    requestedAmount: 50000,
    status: 'REJECTED',
    createdAt: '2026-04-13T16:45:00Z',
  },
];

export default function ParceirosPage() {
  const [partners, setPartners] = useState<Partner[]>(mockPartners);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [activeTab, setActiveTab] = useState<'leads' | 'partners' | 'analytics'>('leads');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [minScore, setMinScore] = useState(0);

  const filteredLeads = leads.filter(lead => {
    if (filter !== 'all' && lead.status.toLowerCase() !== filter) return false;
    if (lead.score < minScore) return false;
    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' };
      case 'ANALYZING':
        return { label: 'Em Análise', color: 'bg-blue-100 text-blue-700', icon: '🔍' };
      case 'APPROVED':
        return { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700', icon: '✅' };
      case 'REJECTED':
        return { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: '❌' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: '📋' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-emerald-600';
    if (score >= 600) return 'text-blue-600';
    if (score >= 450) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel de Parceiros</h1>
            <p className="text-gray-500 mt-1">Gerencie parceiros financeiros e leads qualificados</p>
          </div>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            + Novo Parceiro
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total de Leads"
            value={leads.length.toString()}
            icon="👥"
            trend="+12%"
          />
          <StatCard
            label="Taxa de Aprovação"
            value="78%"
            icon="✅"
            trend="+5%"
          />
          <StatCard
            label="Volume Total"
            value={formatCurrency(8550000)}
            icon="💰"
            trend="+23%"
          />
          <StatCard
            label="Parceiros Ativos"
            value={partners.filter(p => p.isActive).length.toString()}
            icon="🏦"
            trend=""
          />
        </div>

        <div className="flex space-x-1 bg-white rounded-xl p-1 border border-gray-200">
          {(['leads', 'partners', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'leads' ? 'Leads' : tab === 'partners' ? 'Parceiros' : 'Análises'}
            </button>
          ))}
        </div>

        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-wrap gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendentes</option>
                  <option value="approved">Aprovados</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Score mínimo</label>
                <select
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>Qualquer</option>
                  <option value={600}>600+</option>
                  <option value={700}>700+</option>
                  <option value={750}>750+</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Produtor
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Valor Solicitado
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map((lead) => {
                    const status = getStatusConfig(lead.status);
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{lead.producerName}</div>
                          <div className="text-sm text-gray-500">{lead.propertyName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${getScoreColor(lead.score)}`}>
                            {lead.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatCurrency(lead.requestedAmount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((partner) => (
              <div key={partner.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                      {partner.type === 'BANK' ? '🏦' : '🌾'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{partner.name}</div>
                      <div className="text-sm text-gray-500">{partner.type}</div>
                    </div>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${partner.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{partner.requestCount}</div>
                    <div className="text-xs text-gray-500">Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-600">{partner.approvalRate}%</div>
                    <div className="text-xs text-gray-500">Aprovação</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {(partner.totalVolume / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-500">Volume</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    Editar
                  </button>
                  <button className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                    Ver Leads
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Leads por Score</h3>
              <div className="space-y-3">
                <ScoreBar label="Elite (900+)" count={12} color="emerald" />
                <ScoreBar label="Alto (750-899)" count={28} color="blue" />
                <ScoreBar label="Bom (600-749)" count={35} color="green" />
                <ScoreBar label="Regular (450-599)" count={18} color="yellow" />
                <ScoreBar label="Baixo (<450)" count={7} color="red" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Volume por Parceiro</h3>
              <div className="space-y-4">
                {partners.map((partner) => (
                  <div key={partner.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{partner.name}</span>
                      <span className="text-gray-500">{formatCurrency(partner.totalVolume)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(partner.totalVolume / 4200000) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Taxa de Conversão</h3>
              <div className="text-center py-6">
                <div className="text-5xl font-bold text-emerald-600">78%</div>
                <div className="text-gray-500 mt-2">dos leads são convertidos</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Ticket Médio</h3>
              <div className="text-center py-6">
                <div className="text-5xl font-bold text-gray-900">R$ 87k</div>
                <div className="text-gray-500 mt-2">valor médio por operação</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string; value: string; icon: string; trend: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function ScoreBar({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{count}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color as keyof typeof colorClasses]} rounded-full`}
          style={{ width: `${(count / 100) * 100}%` }}
        />
      </div>
    </div>
  );
}
