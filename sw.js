// ═══════════════════════════════════════════════════════════════
// DailyRealm — Service Worker
// ─────────────────────────────────────────────────────────────
// Versão.....: v27
// Estratégia.: Network-First para HTML | Cache-First para assets
// Fallback...: index.html para navegação offline
// Atualização: Toast no app → postMessage('SKIP_WAITING')
// Push.......: v16 adiciona listener de push real (app fechado)
// v23........: bump forçado pra invalidar cache antigo e puxar o
//              app.js/index.html/style.css v17.0 (foto de prova +
//              recompensas) que ficaram presos no cache-first
// v24........: bump forçado pra puxar app.js v17.1/style.css v16
//              (foto de prova no fluxo OCR + redesign das recompensas)
// v25........: bump forçado pra puxar style.css v17 (fix do ícone
//              de foto na revisão que virava quadrado branco)
// v26........: bump forçado pra puxar app.js v18.0/index.html/style.css
//              v18 (tutorial completo + quests agrupadas + 2 lembretes
//              por período)
// v27........: bump forçado pra puxar style.css v18.1 (fix do toggle
//              Pendentes/Concluídas que não ocupava a largura toda)
// v28........: bump forçado pra puxar app.js/style.css v18.1 (recompensa
//              deixa de ser campo editável — vira texto fixo)
// v29........: bump forçado pra puxar app.js v18.2 (Maga da Câmera no
//              topo da lista de troféus)
// v30........: bump forçado pra puxar app.js/index.html v18.3 (checagem
//              de update mais agressiva + botão de WhatsApp)
// v31........: bump forçado pra puxar app.js/index.html/style.css v18.4
//              (remove tela de recompensas e toggle "perguntar horários",
//              resgatar recompensa direto no troféu, botão tutorial 1 linha)
// v32........: bump forçado pra puxar app.js/index.html/style.css v18.5
//              (corte de foto antes do OCR)
// v33........: bump forçado pra puxar app.js/style.css v18.6 (parsing
//              de OCR por parágrafo + botão "unir com a próxima")
// v34........: bump forçado pra puxar app.js/index.html/style.css v18.7
//              (XP por item + ações em massa na revisão do OCR)
// v35........: bump forçado pra puxar app.js/index.html/style.css v18.8
//              (prévia de descrição + edição de quests existentes)
// v36........: bump forçado pra puxar app.js v18.9 (troféus repaginados
//              + novas recompensas)
// v37........: bump forçado pra puxar app.js/index.html v18.10 (botão
//              "Atualizar recompensas" em Config)
// v38........: bump forçado pra puxar app.js/index.html v18.11 (IA define
//              teto de XP anti-inflação, na quest digitada e no OCR)
// v39........: bump forçado pra puxar app.js/index.html v18.12 (foto da
//              galeria, troféus secretos temáticos, backup+sincronização)
// v40........: bump forçado pra puxar app.js/index.html v18.13 (fix do
//              teto de XP falhando aberto sem IA + Config reorganizada)
// v41........: bump forçado pra puxar app.js v18.14 (12 novos troféus +
//              recompensa em todos os troféus secretos + categoria Casal)
// v42........: bump forçado pra puxar app.js/index.html v18.15 (Bloco 2:
//              anti-farm por repetição, streak com "perdão", quests
//              recorrentes)
// v43........: bump forçado pra puxar app.js v18.16 (tutorial reescrito
//              com todas as novidades, reabre sozinho 1x)
// v44........: bump forçado pra puxar app.js/index.html/style.css v18.17
//              (seção "Prontas pra resgatar" na tela de Troféus)
// v45........: bump forçado pra puxar app.js/index.html v18.18 (fix:
//              troféu duplicado entre "Prontas pra resgatar" e a grade)
// v46........: bump forçado pra puxar app.js/index.html/style.css v18.19
//              (3 troféus novos: Além da Lenda 200, Imparável 2.0 60,
//              Data Especial + 4 datas em Config; compartilhar troféu
//              via menu nativo do celular, no toast de desbloqueio e
//              no quadro de troféus)
// v47........: bump forçado pra puxar app.js/index.html v18.20 (remove as
//              4 datas especiais da tela de Config — ficam fixas só no
//              código, pra não entregar a surpresa do troféu)
// v48........: bump forçado pra puxar app.js/index.html v18.21 (fix: os
//              2 fluxos de foto perguntam Câmera ou Galeria explicitamente
//              — Android/Chrome mais novos abriam só a galeria)
// v49........: bump forçado pra puxar app.js/index.html v18.22 (a escolha
//              Câmera/Galeria vira popup separado, estilo WhatsApp, em vez
//              de aparecer direto na tela "Como criar?")
// v50........: bump forçado pra puxar app.js v18.23 (tutorial ganha slide
//              sobre o botão de compartilhar troféu — estava desatualizado
//              desde a v18.16)
// v51........: bump forçado pra puxar app.js v18.24 + style.css (FIX: botão
//              "📤 Compartilhar" / "Desfazer" no toast aparecia sem ação —
//              pointer-events:none do .toast bloqueava o clique nos botões)
// ═══════════════════════════════════════════════════════════════

const VERSAO = 'v51';
const CACHE_VERSAO = `dailyrealm-${VERSAO}`;
const TIMEOUT_REDE = 3000;       // ms para considerar rede lenta
const TIMEOUT_REDE_HARD = 10000; // ms para abandonar fetch pendurado

const ARQUIVOS_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ─── 1. INSTALAÇÃO ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log(`[SW ${VERSAO}] 📦 Instalando...`);
  event.waitUntil(
    caches.open(CACHE_VERSAO)
      .then(cache =>
        Promise.all(
          ARQUIVOS_CACHE.map(url =>
            cache.add(url).catch(err =>
              console.warn(`[SW ${VERSAO}] ⚠️ Falha ao cachear ${url}:`, err.message)
            )
          )
        )
      )
      .then(() => {
        console.log(`[SW ${VERSAO}] ✅ Cache populado, aguardando ativação...`);
      })
  );
});

// ─── 2. ATIVAÇÃO ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log(`[SW ${VERSAO}] 🚀 Ativando...`);
  event.waitUntil(
    caches.keys()
      .then(chaves =>
        Promise.all(
          chaves
            .filter(c => c !== CACHE_VERSAO)
            .map(c => {
              console.log(`[SW ${VERSAO}] 🗑️ Removendo cache antigo: ${c}`);
              return caches.delete(c);
            })
        )
      )
      .then(() => self.clients.claim())
      .then(() => console.log(`[SW ${VERSAO}] ✅ Ativo e controlando clients!`))
  );
});

// ─── 3. ESTRATÉGIAS DE FETCH ───────────────────────────────────

/**
 * Network-First com timeout duplo:
 *  - TIMEOUT_REDE: serve cache se rede demorar
 *  - TIMEOUT_REDE_HARD: aborta fetch se ficar pendurado
 */
async function networkFirst(req) {
  const cachePromise = caches.match(req);

  // Fetch com timeout duro (evita Promise pendurada para sempre)
  const fetchComTimeout = new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('fetch-timeout-hard'));
    }, TIMEOUT_REDE_HARD);

    fetch(req, { signal: controller.signal })
      .then(resp => {
        clearTimeout(timeoutId);
        resolve(resp);
      })
      .catch(err => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });

  // Race: rede vs timeout suave
  return new Promise((resolve) => {
    let respondido = false;

    const timerSuave = setTimeout(async () => {
      if (respondido) return;
      const cached = await cachePromise;
      if (cached && !respondido) {
        respondido = true;
        resolve(cached);
      }
    }, TIMEOUT_REDE);

    fetchComTimeout
      .then(resp => {
        if (respondido) return;
        respondido = true;
        clearTimeout(timerSuave);

        // Atualiza cache em background com a versão fresca
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_VERSAO).then(c => c.put(req, clone)).catch(() => {});
        }
        resolve(resp);
      })
      .catch(async () => {
        if (respondido) return;
        respondido = true;
        clearTimeout(timerSuave);

        const cached = await cachePromise;
        if (cached) return resolve(cached);

        // Última cartada: serve index.html se for navegação
        if (req.mode === 'navigate') {
          const idx = await caches.match('./index.html');
          return resolve(idx || new Response('Offline', { status: 503, statusText: 'Offline' }));
        }
        resolve(new Response('Offline', { status: 503, statusText: 'Offline' }));
      });
  });
}

/**
 * Cache-First: serve cache, atualiza em background.
 */
function cacheFirst(req) {
  return caches.match(req).then(cached => {
    if (cached) {
      fetch(req).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          caches.open(CACHE_VERSAO).then(c => c.put(req, resp)).catch(() => {});
        }
      }).catch(() => {});
      return cached;
    }
    return fetch(req).then(resp => {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        const clone = resp.clone();
        caches.open(CACHE_VERSAO).then(c => c.put(req, clone)).catch(() => {});
      }
      return resp;
    }).catch(() => new Response('Offline', { status: 503, statusText: 'Offline' }));
  });
}

// ─── 4. INTERCEPTAÇÃO DE REQUISIÇÕES ───────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  // Ignora chamadas pro worker OCR (sempre online, sem cache)
  if (req.url.includes('workers.dev')) return;

  const ehNavegacao = req.mode === 'navigate' ||
                       (req.headers.get('accept') || '').includes('text/html');

  if (ehNavegacao) {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(cacheFirst(req));
  }
});

// ─── 4.5. PUSH REAL (funciona com o app/navegador fechado) ─────
// Chave pública VAPID — igual à do app.js e do worker-push.js
const VAPID_PUBLIC_KEY_SW = 'BKyo3wLevTeip7QqGs5A40iombFOXYkShF4HE76kmQEXtjnHjb_gG6uaocP0PhZrXXZ7bl0f8E-FmQMBNCdueYU';
const PUSH_WORKER_URL = 'https://dailyrealm-push.dailyrealm.workers.dev/';

function urlBase64ParaUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

self.addEventListener('push', (event) => {
  let dados = { titulo: '👑 DailyRealm', corpo: 'Você tem novidades! ✨' };
  try {
    if (event.data) dados = event.data.json();
  } catch (e) {
    console.warn(`[SW ${VERSAO}] ⚠️ Push sem JSON válido:`, e);
  }
  const opts = {
    body: dados.corpo,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'dailyrealm-lembrete',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(dados.titulo, opts));
});

// Se o navegador invalidar a inscrição (raro, mas acontece), tenta renovar sozinho
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ParaUint8Array(VAPID_PUBLIC_KEY_SW)
    }).then(novaSubscription => {
      // Reenvia pro Worker junto com os horários já salvos localmente
      return self.clients.matchAll().then(clientes => {
        if (clientes.length > 0) {
          clientes[0].postMessage({ type: 'RESUBSCRIBE_PUSH', subscription: novaSubscription.toJSON() });
        }
      });
    }).catch(err => console.warn(`[SW ${VERSAO}] ⚠️ Falha ao renovar push:`, err))
  );
});

// ─── 5. CLIQUE EM NOTIFICAÇÃO ──────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(lista => {
        if (lista.length > 0) {
          const cliente = lista[0];
          if ('focus' in cliente) return cliente.focus();
        }
        return self.clients.openWindow
          ? self.clients.openWindow('./')
          : Promise.resolve();
      })
  );
});

// ─── 6. MENSAGEM DO APP ────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    console.log(`[SW ${VERSAO}] 🔄 Recebido SKIP_WAITING — assumindo controle...`);
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ versao: VERSAO });
  }
});

console.log(`[SW ${VERSAO}] 📜 Script carregado.`);
