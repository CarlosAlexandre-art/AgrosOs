const CACHE_VERSION = 'agroos-v2'
const CACHE_STATIC = 'agroos-static-v2'
const CACHE_DYNAMIC = 'agroos-dynamic-v2'

// Páginas e assets que sempre ficam disponíveis offline
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/operacoes',
  '/dashboard/financeiro',
  '/dashboard/estoque',
  '/dashboard/clima',
  '/dashboard/agronav',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Instala e faz cache dos assets estáticos
self.addEventListener('install', function (event) {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_STATIC).then(function (cache) {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' }))).catch(() => {})
    })
  )
})

// Remove caches antigos na ativação
self.addEventListener('activate', function (event) {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then(function (keys) {
        return Promise.all(
          keys.filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
              .map(k => caches.delete(k))
        )
      })
    ])
  )
})

// Estratégia: Network First com fallback para cache
self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url)

  // Ignora requisições externas e de API de dados em tempo real
  if (!url.origin.includes(self.location.hostname)) return
  if (event.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) {
    // APIs: tenta rede, se falhar retorna cache com aviso offline
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          const clone = response.clone()
          caches.open(CACHE_DYNAMIC).then(cache => cache.put(event.request, clone))
          return response
        })
        .catch(function () {
          return caches.match(event.request).then(cached => {
            if (cached) return cached
            return new Response(
              JSON.stringify({ error: 'offline', message: 'Sem conexão. Dados podem estar desatualizados.' }),
              { headers: { 'Content-Type': 'application/json' } }
            )
          })
        })
    )
    return
  }

  // Páginas: Network First, fallback cache, fallback /offline
  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_DYNAMIC).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          if (cached) return cached
          if (event.request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/offline')
          }
        })
      })
  )
})

// Sincronização em background quando internet voltar
self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-pendentes') {
    event.waitUntil(sincronizarPendentes())
  }
})

async function sincronizarPendentes() {
  try {
    const db = await abrirDB()
    const pendentes = await lerPendentes(db)
    for (const item of pendentes) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: item.body,
        })
        await removerPendente(db, item.id)
      } catch {}
    }
  } catch {}
}

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('agroos-offline', 1)
    req.onupgradeneeded = e => e.target.result.createObjectStore('pendentes', { keyPath: 'id', autoIncrement: true })
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = reject
  })
}

function lerPendentes(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendentes', 'readonly')
    const req = tx.objectStore('pendentes').getAll()
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = reject
  })
}

function removerPendente(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pendentes', 'readwrite')
    tx.objectStore('pendentes').delete(id)
    tx.oncomplete = resolve
    tx.onerror = reject
  })
}

// Push notifications
self.addEventListener('push', function (event) {
  const data = event.data?.json() || {}
  const title = data.title || 'SmartAgroOS'
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/dashboard' },
    vibrate: [200, 100, 200],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(clients.openWindow(url))
})
