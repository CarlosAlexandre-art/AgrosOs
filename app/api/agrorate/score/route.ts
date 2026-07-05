import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface ScoreWeights {
  production: number;
  efficiency: number;
  behavior: number;
  operational: number;
}

interface PropertyWithRelations {
  id: string;
  name: string;
  sizeHectares: number;
  revenues: Array<{ amount: number }>;
  costs: Array<{ amount: number }>;
  fields: Array<{ id: string }>;
  activities: Array<{ id: string; status: string }>;
  teamMembers: Array<{ id: string }>;
}

const WEIGHTS: ScoreWeights = {
  production: 0.60,    // 60% fazenda (produção)
  efficiency: 0.10,     // 10% eficiência (remanescente)
  behavior: 0.10,       // 10% comportamento
  operational: 0.20,    // 20% perfil (operacional + docs)
};

const BENCHMARKS = {
  productivityPerHectare: 50,
  marginRate: 0.30,
  activityFrequency: 4,
  paymentOnTimeRate: 0.95,
};

async function calculateProductionScore(propertyId: string): Promise<number> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      revenues: {
        where: {
          date: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        }
      },
      fields: true,
      activities: {
        where: {
          status: 'DONE',
          endDate: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        }
      }
    }
  });

  if (!property) return 0;

  const totalRevenue = property.revenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalArea = Number(property.sizeHectares) || 1;
  const productivity = totalRevenue / totalArea;

  const productivityScore = Math.min(1000, (productivity / BENCHMARKS.productivityPerHectare) * 1000);
  const activityScore = Math.min(1000, (property.activities.length / 12) * 1000);
  const areaScore = totalArea > 50 ? 800 : totalArea > 20 ? 600 : 400;

  return Math.round((productivityScore * 0.5 + activityScore * 0.3 + areaScore * 0.2));
}

async function calculateEfficiencyScore(propertyId: string): Promise<number> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      revenues: {
        where: {
          date: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        }
      },
      costs: {
        where: {
          date: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        }
      }
    }
  });

  if (!property) return 0;

  const totalRevenue = property.revenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalCosts = property.costs.reduce((sum, c) => sum + Number(c.amount), 0);
  const marginRate = totalRevenue > 0 ? (totalRevenue - totalCosts) / totalRevenue : 0;

  const marginScore = Math.min(1000, (marginRate / BENCHMARKS.marginRate) * 1000);
  const costRatioScore = totalRevenue > 0 
    ? Math.min(1000, (totalRevenue / (totalCosts || 1)) * 500)
    : 0;

  return Math.round(marginScore * 0.6 + costRatioScore * 0.4);
}

async function calculateBehaviorScore(propertyId: string): Promise<number> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      costs: {
        orderBy: { date: 'asc' },
        take: 12
      }
    }
  });

  if (!property || property.costs.length === 0) return 500;

  const paymentRates: number[] = [];
  for (let i = 1; i < property.costs.length; i++) {
    const daysDiff = Math.abs(
      new Date(property.costs[i].date).getTime() - 
      new Date(property.costs[i-1].date).getTime()
    ) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 35) {
      paymentRates.push(1);
    } else if (daysDiff <= 45) {
      paymentRates.push(0.8);
    } else {
      paymentRates.push(0.5);
    }
  }

  const avgPaymentRate = paymentRates.length > 0 
    ? paymentRates.reduce((a, b) => a + b, 0) / paymentRates.length 
    : 0.7;

  const regularityScore = Math.min(1000, (property.costs.length / 12) * 1000);
  const paymentScore = avgPaymentRate * 1000;

  return Math.round(regularityScore * 0.3 + paymentScore * 0.7);
}

async function calculateOperationalScore(propertyId: string): Promise<number> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      activities: {
        where: {
          createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) }
        }
      },
      costs: true,
      revenues: true,
      fields: true,
      teamMembers: true
    }
  });

  if (!property) return 0;

  // Score de perfil (10% do total): baseado em atividades e equipe
  const profileScore = Math.min(1000, (property.activities.length / 6) * 1000) * 0.7 + 
                      (property.teamMembers.length > 0 ? 300 : 0);

  // Score de documentos (10% do total): baseado na completude de dados
  const dataCompletenessScore = 
    (property.fields.length > 0 ? 250 : 0) +
    (property.teamMembers.length > 0 ? 250 : 0) +
    (property.costs.length > 0 ? 250 : 0) +
    (property.revenues.length > 0 ? 250 : 0);

  // Combinar perfil (50%) + documentos (50%) = score operacional (20% do total)
  return Math.round(profileScore * 0.5 + dataCompletenessScore * 0.5);
}

function getCategory(score: number): 'ELITE' | 'HIGH' | 'GOOD' | 'REGULAR' | 'LOW' | 'CRITICAL' {
  if (score >= 900) return 'ELITE';
  if (score >= 750) return 'HIGH';
  if (score >= 600) return 'GOOD';
  if (score >= 450) return 'REGULAR';
  if (score >= 300) return 'LOW';
  return 'CRITICAL';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const caller = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      include: { properties: { select: { id: true } } },
    });
    if (!caller || caller.properties.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma propriedade encontrada' },
        { status: 404 }
      );
    }

    // Por padrão, usa a propriedade do próprio usuário autenticado.
    // Um propertyId explícito só é aceito se pertencer ao usuário ou se for ADMIN.
    let targetPropertyId = caller.properties[0].id;
    if (propertyId) {
      const owns = caller.properties.some(p => p.id === propertyId);
      if (!owns && caller.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
      targetPropertyId = propertyId;
    }

    const [
      productionScore,
      efficiencyScore,
      behaviorScore,
      operationalScore
    ] = await Promise.all([
      calculateProductionScore(targetPropertyId!),
      calculateEfficiencyScore(targetPropertyId!),
      calculateBehaviorScore(targetPropertyId!),
      calculateOperationalScore(targetPropertyId!)
    ]);

    const totalScore = Math.round(
      productionScore * WEIGHTS.production +
      efficiencyScore * WEIGHTS.efficiency +
      behaviorScore * WEIGHTS.behavior +
      operationalScore * WEIGHTS.operational
    );

    const property = await prisma.property.findUnique({
      where: { id: targetPropertyId },
      include: {
        revenues: true,
        costs: true,
        fields: true,
        activities: { where: { status: 'DONE' } }
      }
    });

    const totalRevenue = property?.revenues?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
    const totalCosts = property?.costs?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;
    const productivity = totalRevenue / (Number(property?.sizeHectares) || 1);
    const marginRate = totalRevenue > 0 ? (totalRevenue - totalCosts) / totalRevenue : 0;

    const agroRate = await prisma.agroRate.upsert({
      where: { propertyId: targetPropertyId! },
      update: {
        score: totalScore,
        category: getCategory(totalScore),
        productionScore,
        efficiencyScore,
        behaviorScore,
        operationalScore,
        totalRevenue,
        totalCosts,
        productivity,
        marginRate,
        activityCount: property?.activities?.length || 0,
        dataCompleteness: (Number(property?.sizeHectares) > 0 ? 20 : 0) +
                          (property?.fields?.length > 0 ? 20 : 0) +
                          (property?.costs?.length > 0 ? 30 : 0) +
                          (property?.revenues?.length > 0 ? 30 : 0),
        lastCalculated: new Date(),
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      create: {
        propertyId: targetPropertyId!,
        score: totalScore,
        category: getCategory(totalScore),
        productionScore,
        efficiencyScore,
        behaviorScore,
        operationalScore,
        totalRevenue,
        totalCosts,
        productivity,
        marginRate,
        activityCount: property?.activities?.length || 0,
        dataCompleteness: 0.5,
        lastCalculated: new Date(),
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json(agroRate);

  } catch (error) {
    console.error('Erro ao calcular AgroRate:', error);
    return NextResponse.json(
      { error: 'Erro interno ao calcular score' },
      { status: 500 }
    );
  }
}
