export default function MercadoPage() {
  return (
    <div style={{ padding: 40, background: '#16a34a', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 900, marginBottom: 16 }}>
        ✅ MERCADO SERVER COMPONENT
      </h1>
      <p style={{ color: '#dcfce7', fontSize: 18, marginBottom: 12 }}>
        Esta página é um Server Component sem nenhum JS no cliente.
      </p>
      <p style={{ color: '#dcfce7', fontSize: 14 }}>
        Rendered at: {new Date().toISOString()}
      </p>
    </div>
  )
}
