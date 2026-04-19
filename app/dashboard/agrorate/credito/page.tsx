'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CreditOffer {
  id: string;
  partner: string;
  partnerType: string;
  name: string;
  amount: number;
  rate: number;
  term: number;
  requirements: string[];
  featured?: boolean;
}

const mockOffers: CreditOffer[] = [
  {
    id: '1',
    partner: 'Sicredi',
    partnerType: 'Cooperativa',
    name: 'Crédito Rural Premium',
    amount: 200000,
    rate: 1.2,
    term: 12,
    requirements: ['Score AgroRate acima de 750', 'Propriedade documentada'],
    featured: true,
  },
  {
    id: '2',
    partner: 'Banco do Brasil',
    partnerType: 'Banco',
    name: 'Finagro Moderinfra',
    amount: 150000,
    rate: 1.4,
    term: 10,
    requirements: ['Score AgroRate acima de 600'],
  },
  {
    id: '3',
    partner: 'AgroCred',
    partnerType: 'Fintech',
    name: 'Antecipação de Recebíveis',
    amount: 50000,
    rate: 2.0,
    term: 3,
    requirements: ['Contratos firmados'],
  },
  {
    id: '4',
    partner: 'Sicoob',
    partnerType: 'Cooperativa',
    name: 'Crédito de Insumos',
    amount: 100000,
    rate: 1.5,
    term: 8,
    requirements: ['Score AgroRate acima de 650'],
  },
];

export default function CreditoPage() {
  const [selectedOffer, setSelectedOffer] = useState<CreditOffer | null>(null);
  const [amount, setAmount] = useState(50000);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateMonthlyPayment = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 100;
    const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                    (Math.pow(1 + monthlyRate, months) - 1);
    return payment;
  };

  const handleRequest = () => {
    setShowRequestModal(false);
    setRequestSent(true);
    setTimeout(() => setRequestSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/agrorate" className="text-gray-500 hover:text-gray-700">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Ofertas de Crédito</h1>
        </div>

        {requestSent && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
            Solicitação enviada com sucesso! Nossa equipe entrará em contato em breve.
          </div>
        )}

        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Simule seu crédito</h2>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-2">Valor desejado</label>
              <input
                type="range"
                min="10000"
                max="200000"
                step="5000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-2xl font-bold text-emerald-600 mt-2">
                {formatCurrency(amount)}
              </div>
            </div>
            <div className="w-px h-16 bg-gray-200" />
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Melhor taxa disponível</div>
              <div className="text-2xl font-bold text-gray-900">1.2% a.m.</div>
              <div className="text-sm text-gray-500">Sicredi</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {mockOffers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all cursor-pointer ${
                selectedOffer?.id === offer.id
                  ? 'border-emerald-500 ring-2 ring-emerald-200'
                  : 'border-gray-100 hover:border-gray-200'
              } ${offer.featured ? 'relative overflow-hidden' : ''}`}
              onClick={() => setSelectedOffer(offer)}
            >
              {offer.featured && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                  Recomendado
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{offer.partner}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {offer.partnerType}
                    </span>
                  </div>
                  <div className="text-gray-600 mb-3">{offer.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {offer.requirements.map((req, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right ml-6">
                  <div className="text-2xl font-bold text-emerald-600">{offer.rate}%</div>
                  <div className="text-sm text-gray-500">ao mês</div>
                  <div className="mt-2 text-gray-900">
                    até {formatCurrency(offer.amount)}
                  </div>
                  <div className="text-sm text-gray-500">em até {offer.term}x</div>
                </div>
              </div>

              {selectedOffer?.id === offer.id && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Valor</div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(Math.min(amount, offer.amount))}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Parcela</div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(
                          calculateMonthlyPayment(
                            Math.min(amount, offer.amount),
                            offer.rate,
                            offer.term
                          )
                        )}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="font-semibold text-emerald-600">
                        {formatCurrency(
                          calculateMonthlyPayment(
                            Math.min(amount, offer.amount),
                            offer.rate,
                            offer.term
                          ) * offer.term
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Solicitar este crédito
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showRequestModal && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Solicitação</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Instituição</span>
                <span className="font-medium text-gray-900">{selectedOffer.partner}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Valor</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(Math.min(amount, selectedOffer.amount))}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Taxa</span>
                <span className="font-medium text-emerald-600">{selectedOffer.rate}% a.m.</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Parcelas</span>
                <span className="font-medium text-gray-900">{selectedOffer.term}x</span>
              </div>
            </div>

            <div className="text-sm text-gray-500 mb-6">
              Ao confirmar, seus dados e score AgroRate serão compartilhados com {selectedOffer.partner} para análise.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequest}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
