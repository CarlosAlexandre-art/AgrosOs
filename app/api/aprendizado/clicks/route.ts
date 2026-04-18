import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('module_clicks')
    .select('module_id')
    .gte('clicked_at', since)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.module_id] = (counts[row.module_id] || 0) + 1
  }
  return NextResponse.json(counts)
}

export async function POST(req: NextRequest) {
  const { moduleId } = await req.json()
  if (!moduleId) return NextResponse.json({ ok: false }, { status: 400 })
  await supabase.from('module_clicks').insert({ module_id: moduleId })
  return NextResponse.json({ ok: true })
}
