import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ScoreWeights {
  production: number;
  efficiency: number;
  behavior: number;
  operational: number;
}

const WEIGHTS: ScoreWeights = {
  production: 0.30,
  efficiency: 0.25,
  behavior: 0.25,
  operational: 0.20,
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

  const dataCompleteness =
    (property.fields.length > 0 ? 20 : 0) +
    (property.teamMembers.length > 0 ? 20 : 0) +
    (property.costs.length > 0 ? 30 : 0) +
    (property.revenues.length > 0 ? 30 : 0);

  const activityScore = Math.min(1000, (property.activities.length / 6) * 1000);
  const completenessScore = dataCompleteness * 10;

  return Math.round(activityScore * 0.4 + completenessScore * 0.6);
}

function getCategory(score: number): string {
  if (score >= 900) return 'ELITE';
  if (score >= 750) return 'HIGH';
  if (score >= 600) return 'GOOD';
  if (score >= 450) return 'REGULAR';
  if (score >= 300) return 'LOW';
  return 'CRITICAL';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');

    if (!propertyId && !userId) {
      return NextResponse.json(
        { error: 'propertyId ou userId é obrigatório' },
        { status: 400 }
      );
    }

    let targetPropertyId = propertyId;

    if (!propertyId && userId) {
      const user = await prisma.user.findUnique({
        where: { supabaseId: userId },
        include: { properties: { take: 1 } }
      });
      
      if (!user || user.properties.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma propriedade encontrada' },
          { status: 404 }
        );
      }
      
      targetPropertyId = user.properties[0].id;
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
        activities: { where: { status: 'DONE' } }
      }
    });

    const totalRevenue = property?.revenues.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
    const totalCosts = property?.costs.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
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
        activityCount: property?.activities.length || 0,
        dataCompleteness: (Number(property?.sizeHectares) > 0 ? 20 : 0) +
                          (property?.fields.length > 0 ? 20 : 0) +
                          (property?.costs.length > 0 ? 30 : 0) +
                          (property?.revenues.length > 0 ? 30 : 0),
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
        activityCount: property?.activities.length || 0,
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
