import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { role: true },
    });
    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const minScore = parseInt(searchParams.get('minScore') || '0');
    const partnerId = searchParams.get('partnerId');

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (partnerId) {
      where.partnerId = partnerId;
    }

    const requests = await prisma.creditRequest.findMany({
      where,
      include: {
        property: {
          include: {
            agroRate: true,
            user: {
              select: { name: true, email: true }
            }
          }
        },
        partner: {
          select: { name: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const leads = requests
      .filter(r => (r.property.agroRate?.score || 0) >= minScore)
      .map(r => ({
        id: r.id,
        producerName: r.property.user.name,
        propertyName: r.property.name,
        score: r.property.agroRate?.score || 0,
        category: r.property.agroRate?.category || 'REGULAR',
        requestedAmount: r.requestedAmount,
        approvedAmount: r.approvedAmount,
        interestRate: r.interestRate,
        termMonths: r.termMonths,
        status: r.status,
        partnerName: r.partner?.name || null,
        createdAt: r.createdAt,
      }));

    return NextResponse.json(leads);

  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const { propertyId, requestedAmount, partnerId } = body;

    if (!propertyId || !requestedAmount) {
      return NextResponse.json(
        { error: 'propertyId e requestedAmount são obrigatórios' },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { role: true, properties: { select: { id: true } } },
    });
    const ownsProperty = dbUser?.properties.some(p => p.id === propertyId);
    if (dbUser?.role !== 'ADMIN' && !ownsProperty) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const creditRequest = await prisma.creditRequest.create({
      data: {
        propertyId,
        requestedAmount,
        partnerId,
        status: 'PENDING',
      },
      include: {
        property: {
          include: { agroRate: true }
        }
      }
    });

    return NextResponse.json(creditRequest, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar solicitação de crédito' },
      { status: 500 }
    );
  }
}
