const STATIC_CACHE_NAME = 'nepsis-static-v1'
const DYNAMIC_CACHE_NAME = 'nepsis-dynamic-v1'

// Regex definido no escopo global para melhor performance
const IMAGE_REGEX = /\.(png|jpg|jpeg|svg|gif|ico|webp)$/

// Recursos estáticos para cache imediato
const STATIC_ASSETS = [
  '/',
  '/home',
  '/journal',
  '/meditation',
  '/profile',
  '/routine',
  '/rewards',
  '/manifest.json',
  '/android/android-launchericon-192-192.png',
  '/android/android-launchericon-512-512.png',
  '/ios/180.png',
  '/ios/192.png',
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('Nepsis: Cache estático aberto')
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.log('Nepsis: Erro ao cachear alguns recursos estáticos:', error)
      })
    })
  )
  self.skipWaiting()
})

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith('nepsis-') &&
                name !== STATIC_CACHE_NAME &&
                name !== DYNAMIC_CACHE_NAME
            )
            .map((name) => caches.delete(name))
        )
      )
  )
  self.clients.claim()
})

// Estratégia de fetch: Network First com fallback para cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições que não são GET
  if (request.method !== 'GET') {
    return
  }

  // Ignorar requisições para API (tRPC, auth, etc)
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('trpc')
  ) {
    return
  }

  // Para requisições de navegação (páginas HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear a resposta bem sucedida
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() =>
          // Fallback para cache se offline
          caches
            .match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // Retornar página offline ou home como fallback
              return caches.match('/home') || caches.match('/')
            })
        )
    )
    return
  }

  // Para recursos de imagem - Cache First
  if (
    IMAGE_REGEX.test(url.pathname) ||
    url.pathname.startsWith('/android/') ||
    url.pathname.startsWith('/ios/') ||
    url.pathname.startsWith('/windows11/') ||
    url.pathname.startsWith('/mascote/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Para outros recursos - Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// Push notifications (preparado para futuro uso)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body || 'Nova notificação do Nepsis',
      icon: '/android/android-launchericon-192-192.png',
      badge: '/ios/72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
        url: data.url || '/home',
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir',
        },
        {
          action: 'close',
          title: 'Fechar',
        },
      ],
    }
    event.waitUntil(self.registration.showNotification(data.title || 'Nepsis', options))
  }
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/home'
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
    )
  }
})
