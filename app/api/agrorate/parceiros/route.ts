import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const partners = await prisma.creditPartner.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { requests: true }
        }
      },
      orderBy: { priority: 'asc' }
    });

    const partnersWithStats = await Promise.all(
      partners.map(async (partner) => {
        const requests = await prisma.creditRequest.findMany({
          where: { partnerId: partner.id },
          select: { 
            requestedAmount: true,
            approvedAmount: true,
            status: true
          }
        });

        const totalVolume = requests.reduce((sum, r) => sum + Number(r.requestedAmount), 0);
        const approvedCount = requests.filter(r => r.status === 'APPROVED' || r.status === 'CONTRACTED').length;
        const approvalRate = requests.length > 0 ? (approvedCount / requests.length) * 100 : 0;

        return {
          ...partner,
          requestCount: partner._count.requests,
          totalVolume,
          approvalRate: Math.round(approvalRate),
        };
      })
    );

    return NextResponse.json(partnersWithStats);

  } catch (error) {
    console.error('Erro ao buscar parceiros:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar parceiros' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, apiEndpoint, logoUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    const maxPriority = await prisma.creditPartner.aggregate({
      _max: { priority: true }
    });

    const partner = await prisma.creditPartner.create({
      data: {
        name,
        type: type || 'BANK',
        apiEndpoint,
        logoUrl,
        priority: (maxPriority._max.priority || 0) + 1,
      }
    });

    return NextResponse.json(partner, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar parceiro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar parceiro' },
      { status: 500 }
    );
  }
}
