// ═══════════════════════════════════════════════════════════════
// DailyRealm — Lógica Principal
// ─────────────────────────────────────────────────────────────
// Versão.....: v15.2
// Recursos...: Quests, XP, Categorias, OCR, Notificações, PWA
// Changelog..: B1 (revert nível) | B3/B4 (criadoEm/ultimoAcesso)
//              B5 (reset progresso) | B6 (versão hardcoded HTML)
//              B7 (ordem init) | N5 (debounce OCR)
//              v15.2: R1 (storage seguro) | R2 (timeout OCR)
//              R3 (compressão foto) | L1-L3 (refatorações)
//              U1 (streak) | U2 (barra XP) | U4 (desfazer) | U5 (ordem)
//              v15.3: Sons WebAudio (concluir, level up, streak)
//              v15.4: Sistema de Conquistas/Troféus (13 troféus)
//              v15.5: Lembretes MVP (períodos + insistência)
//              v15.6: Fix câmera em celular (click síncrono, sem setTimeout)
//              v15.7: Toast de erro do OCR visível por 10s (debug em celular)
//              v15.8: Fix real da câmera — input não pode usar display:none
//                     em celulares (troca pra técnica "visually hidden")
//              v16.0: Push real (funciona com app/navegador fechado) via
//                     Worker dailyrealm-push + VAPID + Web Push criptografado
//              v17.0: Foto de prova obrigatória (+5 XP bônus) com botão de
//                     compartilhar | Recompensas reais editáveis por troféu
//              v17.1: Foto de prova também pode ser exigida em quests
//                     criadas por OCR (marcação item a item na revisão) |
//                     redesign das recompensas com switch padrão do app
//              v18.0: Tutorial completo (automático na 1ª vez + botão de
//                     ajuda permanente) | Quests concluídas agrupadas por
//                     semana/mês (evita lista poluída) | 2 lembretes fixos
//                     por período (manhã/tarde/noite) em vez de 1
// ═══════════════════════════════════════════════════════════════

const APP_VERSAO = 'v18.0';
console.log(`👑 DailyRealm ${APP_VERSAO} iniciado!`);

if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('✅ Rodando como app instalado!');
}

// ═══════════════════════════════════════════════
// CONFIGURAÇÃO OCR
// ═══════════════════════════════════════════════
const OCR_WORKER_URL = 'https://dailyrealm-ocr.dailyrealm.workers.dev/';
let _ocrEmAndamento = false; // N5: proteção contra duplo clique

// ═══════════════════════════════════════════════
// FOTO DE PROVA (conclusão de quests marcadas como "requerFoto")
// ═══════════════════════════════════════════════
const XP_BONUS_FOTO_PROVA = 5; // bônus fixo ao concluir com prova, conforme doc mestre

// ═══════════════════════════════════════════════
// CONFIGURAÇÃO PUSH REAL (funciona com app fechado)
// ═══════════════════════════════════════════════
const PUSH_WORKER_URL = 'https://dailyrealm-push.dailyrealm.workers.dev/';
const VAPID_PUBLIC_KEY = 'BKyo3wLevTeip7QqGs5A40iombFOXYkShF4HE76kmQEXtjnHjb_gG6uaocP0PhZrXXZ7bl0f8E-FmQMBNCdueYU';

function urlBase64ParaUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// Garante inscrição de push ativa e manda os horários atuais pro Worker.
// Chamar sempre que: permissão for concedida, ou horários/insistência mudarem.
async function sincronizarPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      if (!STATE.config.notificacoes) return; // nada pra sincronizar se nunca assinou e está desligado
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ParaUint8Array(VAPID_PUBLIC_KEY)
      });
    }
    await fetch(PUSH_WORKER_URL + 'subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        // Manda horários vazios quando desligado — silencia sem precisar desinscrever
        horarios: STATE.config.notificacoes ? STATE.config.horarios : {},
        insistirHoras: STATE.config.notificacoes ? STATE.config.insistirHoras : 0
      })
    });
  } catch (e) {
    console.warn('[Push] ⚠️ Falha ao sincronizar inscrição:', e);
  }
}

// Reage à renovação automática de inscrição feita pelo Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'RESUBSCRIBE_PUSH') {
      fetch(PUSH_WORKER_URL + 'subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: event.data.subscription,
          horarios: STATE.config.notificacoes ? STATE.config.horarios : {},
          insistirHoras: STATE.config.notificacoes ? STATE.config.insistirHoras : 0
        })
      }).catch(() => {});
    }
  });
}

// ═══════════════════════════════════════════════
// CATEGORIAS PADRÃO
// ═══════════════════════════════════════════════
const CATEGORIAS_PADRAO = [
  { id: 'casa',     nome: 'Casa',     emoji: '🏠', ativa: true, fixa: true },
  { id: 'trabalho', nome: 'Trabalho', emoji: '💼', ativa: true, fixa: true },
  { id: 'compras',  nome: 'Compras',  emoji: '🛒', ativa: true, fixa: true },
  { id: 'pet',      nome: 'Pet',      emoji: '🐱', ativa: true, fixa: true }
];

const SUGESTOES_CATEGORIAS = [
  { id: 'estudos',     nome: 'Estudos',     emoji: '📚' },
  { id: 'saude',       nome: 'Saúde',       emoji: '💪' },
  { id: 'financas',    nome: 'Finanças',    emoji: '💰' },
  { id: 'academia',    nome: 'Academia',    emoji: '🏋️' },
  { id: 'autocuidado', nome: 'Autocuidado', emoji: '🧘' },
  { id: 'familia',     nome: 'Família',     emoji: '👨‍👩‍👧' },
  { id: 'hobbies',     nome: 'Hobbies',     emoji: '🎨' },
  { id: 'viagem',      nome: 'Viagem',      emoji: '✈️' },
  { id: 'ligacoes',    nome: 'Ligações',    emoji: '📞' },
  { id: 'carro',       nome: 'Carro',       emoji: '🚗' },
  { id: 'agenda',      nome: 'Agenda',      emoji: '📅' },
  { id: 'pessoal',     nome: 'Pessoal',     emoji: '🌱' }
];

// ═══════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════
const PLAYER_PADRAO = {
  nome: '',
  nivel: 1,
  xp: 0,
  streak: 0,
  criadoEm: null,           // B3: marca criação do perfil
  ultimoAcesso: null,       // B4: marca último acesso
  ultimoDiaComQuest: null,  // U1: último dia com quest concluída (base do streak)
  totalConcluidas: 0,       // T: total histórico de quests concluídas
  epicasConcluidas: 0,      // T: quests de 100 XP concluídas
  fotosLidas: 0,            // T: listas criadas por foto (OCR)
  conquistas: {}            // T: { idConquista: timestampDesbloqueio }
};

// v18: recompensas reais definidas pela Roberta — servem de valor inicial em
// qualquer instalação nova (ex.: celular da Aline), mas continuam editáveis
// depois pela tela de Config → Recompensas. Chaves batem com os ids de CONQUISTAS.
const RECOMPENSAS_PADRAO = {
  primeira:  { texto: 'Purê de Batata pro Jantar!', resgatado: false },
  cinco:     { texto: 'Sairemos para Jantar em um Restaurante da MINHA escolha!', resgatado: false },
  dez:       { texto: 'Sairemos para jantar em um Restaurante da SUA escolha!', resgatado: false },
  cinquenta: { texto: 'Programo um dia inteiro de lazer fora de casa!', resgatado: false },
  cem:       { texto: 'Começo uma série que tu escolher!', resgatado: false },
  nivel3:    { texto: 'TV da sala e vídeo game são todos teus por 1 dia inteiro!', resgatado: false },
  nivel5:    { texto: 'Me envia um link da Shopee e eu concluo a compra!', resgatado: false },
  nivel10:   { texto: 'Me envia um link do Mercado Livre e eu concluo a compra!', resgatado: false },
  streak3:   { texto: 'Pernoite no 2001!!!', resgatado: false },
  streak7:   { texto: 'Planejaremos definitivamente uma viagem longa!', resgatado: false },
  streak30:  { texto: 'Tua pede, eu faço! (modo HOT!)', resgatado: false },
  foto:      { texto: 'Cozinharei o que você quiser!', resgatado: false },
  epica:     { texto: 'Sairemos para jantar em um Restaurante da SUA escolha!', resgatado: false }
};

const CONFIG_PADRAO = {
  sons: true,
  modoEscuro: true,
  notificacoes: false,
  // v18: 2 horários fixos por período (em vez de 1) — reduz risco de perder o aviso
  horarios: {
    manha1: '08:00', manha2: '10:30',
    tarde1: '13:00', tarde2: '16:00',
    noite1: '19:00', noite2: '21:00'
  },
  insistirHoras: 2,
  perguntarHorariosAoAbrir: false,
  moverDiaSeguinte: true,
  tutorialVisto: false // v18: controla se já mostrou o tutorial automático
};

// R1: leitura segura do localStorage — dado corrompido nunca derruba o app
function lerStorage(chave, padrao) {
  try {
    const raw = localStorage.getItem(chave);
    return raw ? JSON.parse(raw) : padrao;
  } catch (e) {
    console.warn(`[Storage] ⚠️ ${chave} corrompido — usando padrão`, e);
    return padrao;
  }
}

const _cfgSalvo = lerStorage('dr_config', {});
const _playerSalvo = lerStorage('dr_player', {});
const STATE = {
  quests: lerStorage('dr_quests', []),
  player: { ...PLAYER_PADRAO, ..._playerSalvo },
  // R1: merge com defaults — config antigo sem chaves novas não quebra renderConfig
  config: {
    ...CONFIG_PADRAO,
    ..._cfgSalvo,
    horarios: { ...CONFIG_PADRAO.horarios, ...(_cfgSalvo.horarios || {}) }
  },
  categorias: lerStorage('dr_categorias', CATEGORIAS_PADRAO),
  // T2: recompensas reais definidas pela Roberta por troféu — { [conquistaId]: { texto, resgatado } }
  recompensas: lerStorage('dr_recompensas', { ...RECOMPENSAS_PADRAO }),
  filtroAtivo: 'todas',
  filtroStatus: 'pendentes', // v18: 'pendentes' ou 'concluidas' (não persiste, reseta ao abrir)
  modal: { categoria: 'casa', xp: 10, requerFoto: false },
  fotoAtual: null,
  categoriaParaDesativar: null,
  // T1: foto de prova — quest aguardando confirmação com foto
  provaFotoAtual: null,
  provaQuestId: null
};

// v18: migração — remove chaves antigas de 1 horário por período
// (manha/tarde/noite) que ficaram órfãs em configs salvos antes do v18
['manha', 'tarde', 'noite'].forEach(k => delete STATE.config.horarios[k]);

// Sanidade: se categorias vier vazio/inválido, restaura padrão
if (!Array.isArray(STATE.categorias) || STATE.categorias.length === 0) {
  STATE.categorias = [...CATEGORIAS_PADRAO];
}
if (!Array.isArray(STATE.quests)) STATE.quests = [];

// T: backfill — perfil antigo sem contadores herda o que já foi concluído
if (_playerSalvo.totalConcluidas === undefined) {
  STATE.player.totalConcluidas = STATE.quests.filter(q => q.done).length;
  STATE.player.epicasConcluidas = STATE.quests.filter(q => q.done && q.xp >= 100).length;
}
// T: cópia própria do objeto de conquistas (nunca compartilhar referência com PLAYER_PADRAO)
STATE.player.conquistas = { ...(STATE.player.conquistas || {}) };

// B4: registra último acesso a cada abertura
STATE.player.ultimoAcesso = Date.now();

let QUESTS_REVISAO = [];

// ═══════════════════════════════════════════════
// PERSISTÊNCIA (com debounce)
// ═══════════════════════════════════════════════
let _salvarTimer = null;
function salvar() {
  if (_salvarTimer) clearTimeout(_salvarTimer);
  _salvarTimer = setTimeout(_salvarImediato, 120);
}
function _salvarImediato() {
  try {
    localStorage.setItem('dr_quests', JSON.stringify(STATE.quests));
    localStorage.setItem('dr_player', JSON.stringify(STATE.player));
    localStorage.setItem('dr_config', JSON.stringify(STATE.config));
    localStorage.setItem('dr_categorias', JSON.stringify(STATE.categorias));
    localStorage.setItem('dr_recompensas', JSON.stringify(STATE.recompensas));
  } catch (e) {
    console.error('[Storage] ❌ Falha ao salvar:', e);
    mostrarToast('⚠️ Erro ao salvar dados');
  }
}
window.addEventListener('beforeunload', () => {
  if (_salvarTimer) {
    clearTimeout(_salvarTimer);
    _salvarImediato();
  }
});

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function xpProximoNivel(nivel) {
  return nivel * 100;
}

// ═══════════════════════════════════════════════
// HELPERS DE CATEGORIA
// ═══════════════════════════════════════════════
function getCategoria(id) {
  return STATE.categorias.find(c => c.id === id);
}

function getCategoriasAtivas() {
  return STATE.categorias.filter(c => c.ativa);
}

function getEmojiCategoria(id) {
  const cat = getCategoria(id);
  return cat ? cat.emoji : '✨';
}

function getNomeCategoria(id) {
  const cat = getCategoria(id);
  return cat ? cat.nome : id;
}

function gerarIdCategoria(nome) {
  const base = nome.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  let id = base || 'cat';
  let n = 1;
  while (STATE.categorias.some(c => c.id === id)) {
    id = `${base}_${n++}`;
  }
  return id;
}

// ═══════════════════════════════════════════════
// ESCAPES (XSS-safe)
// ═══════════════════════════════════════════════
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHTML(str);
}

// ═══════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════
function verificarOnboarding() {
  if (!STATE.player.nome || STATE.player.nome.trim() === '') {
    document.getElementById('tela-onboarding').classList.add('active');
    return true;
  } else {
    aplicarNomeNaUI();
    return false;
  }
}

function salvarNomeOnboarding(event) {
  event.preventDefault();
  const input = document.getElementById('onboarding-nome');
  const nome = input.value.trim();
  if (!nome) {
    mostrarToast('⚠️ Digite um nome pra continuar');
    return;
  }
  STATE.player.nome = nome;
  // B3: registra criação do perfil no 1º acesso
  if (!STATE.player.criadoEm) {
    STATE.player.criadoEm = Date.now();
  }
  _salvarImediato();
  aplicarNomeNaUI();
  document.getElementById('tela-onboarding').classList.remove('active');
  mostrarToast(`👑 Bem-vinda, ${nome}!`);
  // v18: tutorial completo antes de pedir permissão de notificação
  setTimeout(() => abrirTutorial(true), 900);
}

function aplicarNomeNaUI() {
  document.querySelectorAll('.user-name').forEach(el => {
    el.textContent = STATE.player.nome || 'Guerreira';
  });
  const inputConfigNome = document.getElementById('config-nome');
  if (inputConfigNome) inputConfigNome.value = STATE.player.nome || '';
}

// ═══════════════════════════════════════════════
// TUTORIAL (v18) — carrossel explicando o app.
// Mostra sozinho 1x (onboarding novo ou upgrade de quem já usava),
// e fica sempre disponível via botão "❓ Como funciona" na Config.
// ═══════════════════════════════════════════════
const TUTORIAL_SLIDES = [
  { emoji: '👑', titulo: 'Bem-vinda ao DailyRealm',
    texto: 'Transforme sua rotina em uma jornada épica! Cada tarefa do dia vira uma "quest" que te dá XP, sobe seu nível e desbloqueia troféus.' },
  { emoji: '⚔️', titulo: 'Criando suas Quests',
    texto: 'Toque no botão + na tela de Quests. Você pode criar uma quest manualmente, ou tocar em "Por Foto" e fotografar sua agenda/planner — o app lê e cria as quests sozinho.' },
  { emoji: '📸', titulo: 'Foto de Prova',
    texto: 'Algumas quests pedem uma foto pra confirmar que foram feitas de verdade. Ao concluir, a câmera abre; depois é só compartilhar a foto com quem acompanha. Vale +5 XP bônus!' },
  { emoji: '🔥', titulo: 'XP, Nível e Streak',
    texto: 'Cada quest concluída dá XP. Ao encher a barra, você sobe de nível. Completar pelo menos 1 quest por dia mantém sua sequência (streak) 🔥.' },
  { emoji: '🏆', titulo: 'Troféus e Recompensas',
    texto: 'Na aba Troféus você vê suas conquistas e a recompensa real de cada uma. Ao desbloquear, marque como "Resgatado" quando aproveitar o prêmio de verdade.' },
  { emoji: '🔔', titulo: 'Lembretes',
    texto: 'Em Config você define 2 horários por período (manhã/tarde/noite) pra receber lembretes das quests pendentes — funciona até com o app fechado.' },
  { emoji: '❓', titulo: 'Precisa rever isso depois?',
    texto: 'Sem problema! Esse tutorial fica sempre disponível em Config → "Como funciona o DailyRealm". Toque em Concluir e bora começar sua jornada! ✨' }
];

let _tutorialSlideAtual = 0;
let _tutorialPrimeiraVez = false;

function abrirTutorial(primeiraVez = false) {
  _tutorialSlideAtual = 0;
  _tutorialPrimeiraVez = primeiraVez;
  renderTutorialSlide();
  document.getElementById('modal-tutorial')?.classList.add('active');
}

function renderTutorialSlide() {
  const wrap = document.getElementById('tutorial-slides');
  const dots = document.getElementById('tutorial-dots');
  if (!wrap || !dots) return;

  const s = TUTORIAL_SLIDES[_tutorialSlideAtual];
  wrap.innerHTML = `
    <div class="tutorial-slide">
      <div class="tutorial-emoji">${s.emoji}</div>
      <h3 class="tutorial-titulo">${escapeHTML(s.titulo)}</h3>
      <p class="tutorial-texto">${escapeHTML(s.texto)}</p>
    </div>`;

  dots.innerHTML = TUTORIAL_SLIDES.map((_, i) =>
    `<span class="tutorial-dot ${i === _tutorialSlideAtual ? 'active' : ''}"></span>`
  ).join('');

  const btnVoltar = document.getElementById('tutorial-btn-voltar');
  const btnAvancar = document.getElementById('tutorial-btn-avancar');
  if (btnVoltar) btnVoltar.style.visibility = _tutorialSlideAtual === 0 ? 'hidden' : 'visible';
  if (btnAvancar) {
    btnAvancar.textContent = _tutorialSlideAtual === TUTORIAL_SLIDES.length - 1 ? '✅ Concluir' : 'Avançar →';
  }
}

function tutorialAvancar() {
  if (_tutorialSlideAtual < TUTORIAL_SLIDES.length - 1) {
    _tutorialSlideAtual++;
    renderTutorialSlide();
  } else {
    fecharTutorial();
  }
}

function tutorialVoltar() {
  if (_tutorialSlideAtual > 0) {
    _tutorialSlideAtual--;
    renderTutorialSlide();
  }
}

function fecharTutorial() {
  document.getElementById('modal-tutorial')?.classList.remove('active');
  if (!STATE.config.tutorialVisto) {
    STATE.config.tutorialVisto = true;
    salvar();
  }
  if (_tutorialPrimeiraVez) {
    _tutorialPrimeiraVez = false;
    setTimeout(() => pedirPermissaoNotificacao(), 500);
  }
}

// ═══════════════════════════════════════════════
// NOTIFICAÇÕES
// ═══════════════════════════════════════════════
async function pedirPermissaoNotificacao() {
  if (!('Notification' in window)) {
    mostrarToast('⚠️ Seu navegador não suporta notificações');
    return false;
  }
  if (Notification.permission === 'granted') {
    STATE.config.notificacoes = true;
    salvar();
    atualizarToggleNotificacoes();
    notificacaoTeste();
    sincronizarPush(); // ativa o lembrete real (funciona com app fechado)
    return true;
  }
  if (Notification.permission === 'denied') {
    mostrarToast('🔕 Notificações bloqueadas. Ative nas configs do navegador.');
    return false;
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    STATE.config.notificacoes = true;
    salvar();
    atualizarToggleNotificacoes();
    mostrarToast('🔔 Notificações ativadas!');
    notificacaoTeste();
    sincronizarPush(); // ativa o lembrete real (funciona com app fechado)
    return true;
  } else {
    STATE.config.notificacoes = false;
    salvar();
    atualizarToggleNotificacoes();
    mostrarToast('🔕 Sem notificações por enquanto');
    return false;
  }
}

async function notificacaoTeste() {
  const nome = STATE.player.nome || 'Guerreira';
  const titulo = `👑 Olá, ${nome}!`;
  const opts = {
    body: 'As notificações do DailyRealm estão funcionando! ✨',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'dailyrealm-teste'
  };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        reg.showNotification(titulo, opts);
        return;
      }
    }
    new Notification(titulo, opts);
  } catch (e) {
    console.warn('[Notif] Erro no teste:', e);
  }
}

function atualizarToggleNotificacoes() {
  const toggle = document.getElementById('config-notificacoes');
  if (toggle) toggle.checked = STATE.config.notificacoes;
}

// ═══════════════════════════════════════════════
// APLICAR TEMA
// ═══════════════════════════════════════════════
function aplicarTema() {
  const body = document.body;
  if (STATE.config.modoEscuro) {
    body.classList.add('dark');
    body.classList.remove('light');
  } else {
    body.classList.add('light');
    body.classList.remove('dark');
  }
}

// ═══════════════════════════════════════════════
// NAVEGAÇÃO
// ═══════════════════════════════════════════════
function navegarPara(tela) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const alvo = document.getElementById('screen-' + tela);
  if (alvo) alvo.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const btn = document.querySelector(`.nav-item[data-screen="${tela}"]`);
  if (btn) btn.classList.add('active');

  if (tela === 'config') renderCategoriasConfig();
  if (tela === 'conquistas') renderConquistas();
  if (tela === 'tarefas') {
    renderFiltrosCategorias();
    renderQuests();
  }

  window.scrollTo(0, 0);
}

// ═══════════════════════════════════════════════
// CATEGORIAS — Render na Config
// ═══════════════════════════════════════════════
function renderCategoriasConfig() {
  const lista = document.getElementById('categorias-lista');
  if (!lista) return;

  if (STATE.categorias.length === 0) {
    lista.innerHTML = `<p style="text-align:center;color:var(--cor-texto-3);padding:14px;font-size:13px;">Nenhuma categoria. Crie a primeira ✨</p>`;
    return;
  }

  lista.innerHTML = STATE.categorias.map(cat => `
    <div class="categoria-item ${cat.ativa ? '' : 'desativada'}" data-id="${escapeAttr(cat.id)}">
      <div class="categoria-info">
        <span class="categoria-emoji">${escapeHTML(cat.emoji)}</span>
        <span class="categoria-nome">${escapeHTML(cat.nome)}</span>
      </div>
      <div class="categoria-acoes">
        <label class="switch">
          <input type="checkbox" ${cat.ativa ? 'checked' : ''}
                 data-action="toggle-cat" data-id="${escapeAttr(cat.id)}">
          <span class="slider"></span>
        </label>
        ${cat.fixa
          ? ''
          : `<button class="categoria-excluir" data-action="excluir-cat" data-id="${escapeAttr(cat.id)}" title="Excluir">🗑️</button>`
        }
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════
// MODAL GERENCIAR CATEGORIAS
// ═══════════════════════════════════════════════
function abrirGerenciarCategorias() {
  const modal = document.getElementById('modal-gerenciar-categorias');
  if (!modal) return;
  renderCategoriasConfig();
  renderSugestoesCategorias();
  modal.classList.add('active');
}

function fecharGerenciarCategorias() {
  const modal = document.getElementById('modal-gerenciar-categorias');
  if (!modal) return;
  modal.classList.remove('active');
  renderFiltrosCategorias();
}

// ═══════════════════════════════════════════════
// SUGESTÕES — Render dos chips
// ═══════════════════════════════════════════════
function renderSugestoesCategorias() {
  const cont = document.getElementById('cat-sugestoes');
  if (!cont) return;

  const nomesExistentes = STATE.categorias.map(c => c.nome.toLowerCase());
  const idsExistentes = STATE.categorias.map(c => c.id);

  const disponiveis = SUGESTOES_CATEGORIAS.filter(s =>
    !idsExistentes.includes(s.id) &&
    !nomesExistentes.includes(s.nome.toLowerCase())
  );

  if (disponiveis.length === 0) {
    cont.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--cor-texto-3);font-size:13px;padding:10px;">✨ Todas as sugestões já foram adicionadas!</p>`;
    return;
  }

  cont.innerHTML = disponiveis.map(s => `
    <button type="button"
            class="cat-sugestao-chip"
            data-action="add-sugestao"
            data-id="${escapeAttr(s.id)}">
      <span class="cat-sugestao-emoji">${escapeHTML(s.emoji)}</span>
      <span class="cat-sugestao-nome">${escapeHTML(s.nome)}</span>
      <span class="cat-sugestao-plus">＋</span>
    </button>
  `).join('');
}

function adicionarSugestao(sugestaoId) {
  const sugestao = SUGESTOES_CATEGORIAS.find(s => s.id === sugestaoId);
  if (!sugestao) {
    mostrarToast('⚠️ Sugestão não encontrada');
    return;
  }

  if (STATE.categorias.some(c => c.id === sugestao.id || c.nome.toLowerCase() === sugestao.nome.toLowerCase())) {
    mostrarToast('⚠️ Categoria já existe');
    renderSugestoesCategorias();
    return;
  }

  STATE.categorias.push({
    id: sugestao.id,
    nome: sugestao.nome,
    emoji: sugestao.emoji,
    ativa: true,
    fixa: false
  });
  salvar();
  renderCategoriasConfig();
  renderSugestoesCategorias();
  renderFiltrosCategorias();
  mostrarToast(`✨ "${sugestao.nome}" adicionada!`);
}

// ═══════════════════════════════════════════════
// CATEGORIAS — Picker (modal nova quest)
// ═══════════════════════════════════════════════
function renderCategoriaPicker() {
  const picker = document.getElementById('category-picker-novaquest');
  if (!picker) return;

  const ativas = getCategoriasAtivas();
  if (ativas.length === 0) {
    picker.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--cor-texto-3);font-size:13px;">Nenhuma categoria ativa. Crie uma em Config ⚙️</p>`;
    return;
  }

  if (!ativas.some(c => c.id === STATE.modal.categoria)) {
    STATE.modal.categoria = ativas[0].id;
  }

  picker.innerHTML = ativas.map(cat => `
    <button type="button"
            class="pick-btn ${cat.id === STATE.modal.categoria ? 'active' : ''}"
            data-cat="${escapeAttr(cat.id)}"
            data-action="pick-cat">
      ${escapeHTML(cat.emoji)} ${escapeHTML(cat.nome)}
    </button>
  `).join('');
}

function selecionarCategoriaPicker(catId) {
  STATE.modal.categoria = catId;
  document.querySelectorAll('#category-picker-novaquest .pick-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === catId);
  });
}

// ═══════════════════════════════════════════════
// CATEGORIAS — Filtros (tela quests)
// ═══════════════════════════════════════════════
function renderFiltrosCategorias() {
  const cont = document.getElementById('filtros-categorias');
  if (!cont) return;

  const ativas = getCategoriasAtivas();

  let html = `<button class="filtro ${STATE.filtroAtivo === 'todas' ? 'active' : ''}" data-cat="todas">✨ Todas</button>`;
  html += ativas.map(cat => `
    <button class="filtro ${STATE.filtroAtivo === cat.id ? 'active' : ''}" data-cat="${escapeAttr(cat.id)}">
      ${escapeHTML(cat.emoji)} ${escapeHTML(cat.nome)}
    </button>
  `).join('');

  cont.innerHTML = html;

  cont.querySelectorAll('.filtro').forEach(btn => {
    btn.addEventListener('click', () => {
      cont.querySelectorAll('.filtro').forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      STATE.filtroAtivo = btn.dataset.cat;
      renderQuests();
    });
  });
}

// ═══════════════════════════════════════════════
// CATEGORIAS — Modal Nova
// ═══════════════════════════════════════════════
function abrirNovaCategoria() {
  const modal = document.getElementById('modal-nova-categoria');
  if (!modal) return;
  modal.classList.add('active');
  setTimeout(() => document.getElementById('cat-nome')?.focus(), 100);
}

function fecharNovaCategoria() {
  const modal = document.getElementById('modal-nova-categoria');
  if (!modal) return;
  modal.classList.remove('active');
  document.getElementById('form-nova-categoria')?.reset();
}

function criarCategoria(event) {
  event.preventDefault();
  const nome = document.getElementById('cat-nome').value.trim();
  const emoji = document.getElementById('cat-emoji').value.trim();

  if (!nome || !emoji) {
    mostrarToast('⚠️ Preencha nome e emoji');
    return;
  }

  if (STATE.categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
    mostrarToast('⚠️ Já existe uma categoria com esse nome');
    return;
  }

  STATE.categorias.push({
    id: gerarIdCategoria(nome),
    nome,
    emoji,
    ativa: true,
    fixa: false
  });
  salvar();
  fecharNovaCategoria();
  renderCategoriasConfig();
  renderSugestoesCategorias();
  renderFiltrosCategorias();
  mostrarToast(`✨ Categoria "${nome}" criada!`);
}

// ═══════════════════════════════════════════════
// CATEGORIAS — Toggle / Excluir
// ═══════════════════════════════════════════════
function toggleCategoria(catId, novaAtiva) {
  const cat = getCategoria(catId);
  if (!cat) return;

  if (!novaAtiva) {
    const qtdQuests = STATE.quests.filter(q => q.categoria === catId && !q.done).length;
    if (qtdQuests > 0) {
      abrirDesativarCategoria(catId, qtdQuests);
      renderCategoriasConfig();
      return;
    }
  }

  cat.ativa = novaAtiva;
  salvar();
  renderCategoriasConfig();
  renderFiltrosCategorias();
  mostrarToast(novaAtiva ? `✅ "${cat.nome}" ativada` : `🔕 "${cat.nome}" desativada`);
}

function abrirDesativarCategoria(catId, qtdQuests) {
  // L2: estado como objeto — { id, excluir } em vez de string com sufixo
  STATE.categoriaParaDesativar = { id: catId, excluir: false };
  const cat = getCategoria(catId);
  const modal = document.getElementById('modal-desativar-categoria');
  const aviso = document.getElementById('aviso-desativar-texto');
  const select = document.getElementById('cat-destino-mover');
  const btnConfirmar = document.getElementById('btn-confirmar-desativar');

  aviso.innerHTML = `A categoria <strong>${escapeHTML(cat.emoji)} ${escapeHTML(cat.nome)}</strong> tem <strong>${qtdQuests}</strong> quest${qtdQuests === 1 ? '' : 's'} ativa${qtdQuests === 1 ? '' : 's'}.`;

  const outras = STATE.categorias.filter(c => c.id !== catId && c.ativa);
  if (outras.length === 0) {
    select.innerHTML = `<option value="">⚠️ Nenhuma categoria disponível</option>`;
    select.disabled = true;
    if (btnConfirmar) {
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = '⚠️ Crie outra categoria primeiro';
    }
  } else {
    select.innerHTML = outras.map(c =>
      `<option value="${escapeAttr(c.id)}">${escapeHTML(c.emoji)} ${escapeHTML(c.nome)}</option>`
    ).join('');
    select.disabled = false;
    if (btnConfirmar) {
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = '✅ Mover e desativar';
    }
  }

  modal.classList.add('active');
}

function fecharDesativarCategoria() {
  document.getElementById('modal-desativar-categoria').classList.remove('active');
  STATE.categoriaParaDesativar = null;
}

function confirmarDesativarCategoria() {
  const alvo = STATE.categoriaParaDesativar;
  const destino = document.getElementById('cat-destino-mover').value;
  if (!alvo || !destino) {
    mostrarToast('⚠️ Escolha uma categoria de destino');
    return;
  }

  const catId = alvo.id;
  const deveExcluir = alvo.excluir;

  let movidas = 0;
  STATE.quests.forEach(q => {
    if (q.categoria === catId) {
      q.categoria = destino;
      movidas++;
    }
  });

  if (deveExcluir) {
    STATE.categorias = STATE.categorias.filter(c => c.id !== catId);
    salvar();
    fecharDesativarCategoria();
    renderCategoriasConfig();
    renderSugestoesCategorias();
    renderFiltrosCategorias();
    renderQuests();
    mostrarToast(`🗑️ Categoria excluída e ${movidas} quest${movidas === 1 ? '' : 's'} movida${movidas === 1 ? '' : 's'}`);
  } else {
    const cat = getCategoria(catId);
    if (cat) cat.ativa = false;
    salvar();
    fecharDesativarCategoria();
    renderCategoriasConfig();
    renderFiltrosCategorias();
    renderQuests();
    mostrarToast(`✅ ${movidas} quest${movidas === 1 ? '' : 's'} movida${movidas === 1 ? '' : 's'}`);
  }
}

async function excluirCategoria(catId) {
  const cat = getCategoria(catId);
  if (!cat || cat.fixa) {
    mostrarToast('⚠️ Esta categoria não pode ser excluída');
    return;
  }

  const qtdQuests = STATE.quests.filter(q => q.categoria === catId).length;
  if (qtdQuests > 0) {
    abrirDesativarCategoria(catId, qtdQuests);
    STATE.categoriaParaDesativar.excluir = true; // L2: marca intenção de excluir
    return;
  }

  const ok = await confirmarCustom(`Excluir categoria "${cat.nome}"?`, 'Excluir categoria');
  if (!ok) return;

  STATE.categorias = STATE.categorias.filter(c => c.id !== catId);
  salvar();
  renderCategoriasConfig();
  renderSugestoesCategorias();
  renderFiltrosCategorias();
  mostrarToast(`🗑️ "${cat.nome}" excluída`);
}

// ═══════════════════════════════════════════════
// MODAL CONFIRMAR (substitui confirm() nativo)
// ═══════════════════════════════════════════════
let _confirmarResolve = null;
function confirmarCustom(mensagem, titulo = 'Confirmar') {
  return new Promise(resolve => {
    _confirmarResolve = resolve;
    document.getElementById('modal-confirmar-titulo').textContent = titulo;
    document.getElementById('modal-confirmar-msg').textContent = mensagem;
    document.getElementById('modal-confirmar').classList.add('active');
  });
}
function fecharConfirmar(resultado) {
  document.getElementById('modal-confirmar').classList.remove('active');
  if (_confirmarResolve) {
    _confirmarResolve(resultado);
    _confirmarResolve = null;
  }
}

// ═══════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════
function renderStats() {
  const el = (id) => document.getElementById(id);
  if (el('stat-nivel'))  el('stat-nivel').textContent  = STATE.player.nivel;
  if (el('stat-xp'))     el('stat-xp').textContent     = STATE.player.xp;
  if (el('stat-streak')) el('stat-streak').textContent = STATE.player.streak;

  // U2: barra de XP até o próximo nível
  const meta = xpProximoNivel(STATE.player.nivel);
  const barra = el('xp-bar');
  if (barra) barra.style.width = Math.min(100, (STATE.player.xp / meta) * 100) + '%';
  const txt = el('xp-bar-txt');
  if (txt) txt.textContent = `${STATE.player.xp} / ${meta} XP`;
}

// ═══════════════════════════════════════════════
// RENDER QUESTS
// ═══════════════════════════════════════════════
// v18: aba Pendentes (lista aberta) x aba Concluídas (agrupada por
// semana/mês, pra não poluir a tela com o tempo)
function mudarStatusQuests(status) {
  STATE.filtroStatus = status;
  document.querySelectorAll('.status-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.status === status);
  });
  renderQuests();
}

function renderQuests() {
  const lista = document.getElementById('quest-list');
  if (!lista) return;

  const porCategoria = STATE.filtroAtivo === 'todas'
    ? STATE.quests
    : STATE.quests.filter(q => q.categoria === STATE.filtroAtivo);

  if (STATE.filtroStatus === 'concluidas') {
    renderQuestsConcluidas(lista, porCategoria.filter(q => q.done));
  } else {
    renderQuestsPendentes(lista, porCategoria.filter(q => !q.done));
  }
}

function renderQuestsPendentes(lista, itens) {
  if (itens.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📜</div>
        <p class="empty-title">Nenhuma quest pendente</p>
        <p class="empty-desc">Toque no botão <strong>+</strong> e crie sua próxima aventura!</p>
      </div>`;
    return;
  }
  lista.innerHTML = itens.map(renderQuestCard).join('');
}

function renderQuestCard(q) {
  return `
    <div class="quest-card ${q.done ? 'done' : ''}" data-id="${escapeAttr(q.id)}">
      <button class="quest-check ${q.done ? 'done' : ''}" data-action="toggle" data-id="${escapeAttr(q.id)}" aria-label="${q.done ? 'Desmarcar' : 'Concluir'} quest">
        ${q.done ? '✓' : ''}
      </button>
      <div class="quest-content">
        <div class="quest-title-txt">${escapeHTML(q.titulo)}</div>
        <div class="quest-meta">
          <span class="quest-cat-tag">${escapeHTML(getEmojiCategoria(q.categoria))} ${escapeHTML(getNomeCategoria(q.categoria))}</span>
          <span class="quest-xp">+${q.xp} XP</span>
          ${q.requerFoto ? '<span class="quest-prova-badge" title="Precisa de foto de prova para concluir">📸</span>' : ''}
        </div>
      </div>
      <button class="quest-delete" data-action="delete" data-id="${escapeAttr(q.id)}" aria-label="Excluir quest">🗑️</button>
    </div>`;
}

// v18: agrupa concluídas em "Esta semana" + um grupo por mês (mais recente primeiro)
function renderQuestsConcluidas(lista, itens) {
  if (itens.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏁</div>
        <p class="empty-title">Nenhuma quest concluída ainda</p>
        <p class="empty-desc">Complete quests na aba Pendentes pra vê-las aqui!</p>
      </div>`;
    return;
  }

  const ordenadas = itens.slice().sort((a, b) => (b.concluidoEm || 0) - (a.concluidoEm || 0));

  // Início da semana atual (segunda-feira 00:00)
  const agora = new Date();
  const diaSemanaISO = (agora.getDay() + 6) % 7; // 0 = segunda
  const inicioSemana = new Date(agora);
  inicioSemana.setHours(0, 0, 0, 0);
  inicioSemana.setDate(agora.getDate() - diaSemanaISO);
  const inicioSemanaTs = inicioSemana.getTime();

  const estaSemana = [];
  const porMes = new Map(); // 'YYYY-MM' -> { label, itens }

  ordenadas.forEach(q => {
    const ts = q.concluidoEm || 0;
    if (ts >= inicioSemanaTs) {
      estaSemana.push(q);
    } else {
      const d = new Date(ts);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!porMes.has(chave)) {
        const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        porMes.set(chave, { label: label.charAt(0).toUpperCase() + label.slice(1), itens: [] });
      }
      porMes.get(chave).itens.push(q);
    }
  });

  const gruposMes = [...porMes.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, v]) => v);

  let html = '';
  if (estaSemana.length > 0) {
    html += renderGrupoConcluidas('📅 Esta semana', estaSemana, true);
  }
  gruposMes.forEach(g => {
    html += renderGrupoConcluidas(g.label, g.itens, false);
  });

  lista.innerHTML = html;
}

function renderGrupoConcluidas(titulo, itens, aberto) {
  return `
    <details class="quest-grupo" ${aberto ? 'open' : ''}>
      <summary class="quest-grupo-titulo">${escapeHTML(titulo)} <span class="quest-grupo-contagem">${itens.length}</span></summary>
      <div class="quest-grupo-lista">
        ${itens.map(renderQuestCard).join('')}
      </div>
    </details>`;
}

// ═══════════════════════════════════════════════
// SONS (WebAudio — gerados por código, sem arquivos)
// Respeitam o toggle 🔊 da Config (STATE.config.sons)
// ═══════════════════════════════════════════════
let _audioCtx = null;

function _ctxAudio() {
  if (!STATE.config.sons) return null; // portão único: sons desligados = silêncio
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  } catch (e) {
    return null; // navegador sem suporte: app segue funcionando mudo
  }
}

function _tocarNota(freq, inicio, duracao, tipo = 'sine', volume = 0.18) {
  const ctx = _ctxAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  const t = ctx.currentTime + inicio;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duracao);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duracao + 0.05);
}

// ✨ Quest concluída: "plim" ascendente curto
function somConcluir() {
  _tocarNota(660, 0,    0.15, 'sine');
  _tocarNota(880, 0.08, 0.20, 'sine');
}

// 👑 Level up: fanfarra de 4 notas (dó-mi-sol-dó)
function somLevelUp() {
  [523, 659, 784, 1047].forEach((f, i) => _tocarNota(f, i * 0.12, 0.25, 'triangle', 0.22));
}

// 🔥 Streak: subida "8-bit" empolgante
function somStreak() {
  _tocarNota(440, 0,    0.12, 'square', 0.08);
  _tocarNota(587, 0.10, 0.12, 'square', 0.08);
  _tocarNota(880, 0.20, 0.30, 'square', 0.10);
}

// 🏆 Conquista: brilho agudo de "tesouro encontrado"
function somConquista() {
  _tocarNota(988,  0,    0.15, 'triangle', 0.15);
  _tocarNota(1319, 0.12, 0.35, 'triangle', 0.18);
}

// ═══════════════════════════════════════════════
// CONQUISTAS (Troféus)
// cond() recebe o player e devolve true quando desbloqueia
// ═══════════════════════════════════════════════
const CONQUISTAS = [
  { id: 'primeira',  emoji: '🎯', nome: 'Primeiro Passo',    desc: 'Conclua sua primeira quest',        cond: p => p.totalConcluidas >= 1 },
  { id: 'cinco',     emoji: '⚔️', nome: 'Aventureira',       desc: 'Conclua 5 quests',                  cond: p => p.totalConcluidas >= 5 },
  { id: 'dez',       emoji: '🛡️', nome: 'Guerreira',         desc: 'Conclua 10 quests',                 cond: p => p.totalConcluidas >= 10 },
  { id: 'cinquenta', emoji: '🏰', nome: 'Heroína do Reino',  desc: 'Conclua 50 quests',                 cond: p => p.totalConcluidas >= 50 },
  { id: 'cem',       emoji: '👑', nome: 'Lenda Viva',        desc: 'Conclua 100 quests',                cond: p => p.totalConcluidas >= 100 },
  { id: 'nivel3',    emoji: '⭐', nome: 'Em Ascensão',       desc: 'Alcance o nível 3',                 cond: p => p.nivel >= 3 },
  { id: 'nivel5',    emoji: '🌟', nome: 'Estrela do Reino',  desc: 'Alcance o nível 5',                 cond: p => p.nivel >= 5 },
  { id: 'nivel10',   emoji: '💫', nome: 'Suprema',           desc: 'Alcance o nível 10',                cond: p => p.nivel >= 10 },
  { id: 'streak3',   emoji: '🔥', nome: 'Pegando Fogo',      desc: '3 dias seguidos com quest feita',   cond: p => p.streak >= 3 },
  { id: 'streak7',   emoji: '🌋', nome: 'Semana Épica',      desc: '7 dias seguidos com quest feita',   cond: p => p.streak >= 7 },
  { id: 'streak30',  emoji: '☄️', nome: 'Imparável',         desc: '30 dias seguidos com quest feita',  cond: p => p.streak >= 30 },
  { id: 'foto',      emoji: '📸', nome: 'Maga da Câmera',    desc: 'Crie quests fotografando uma lista', cond: p => p.fotosLidas >= 1 },
  { id: 'epica',     emoji: '💎', nome: 'Caçadora de Épicas', desc: 'Conclua uma quest Épica (100 XP)',  cond: p => p.epicasConcluidas >= 1 }
];

function verificarConquistas() {
  if (!STATE.player.conquistas) STATE.player.conquistas = {};
  const novas = [];
  CONQUISTAS.forEach(c => {
    if (!STATE.player.conquistas[c.id] && c.cond(STATE.player)) {
      STATE.player.conquistas[c.id] = Date.now();
      novas.push(c);
    }
  });
  if (novas.length === 0) return;
  salvar();
  // Toasts escalonados para não atropelar os avisos de XP/streak
  novas.forEach((c, i) => {
    setTimeout(() => {
      somConquista();
      mostrarToast(`🏆 Conquista desbloqueada: ${c.emoji} ${c.nome}!`);
    }, 2800 + i * 2700);
  });
}

function renderConquistas() {
  const lista = document.getElementById('conquistas-lista');
  if (!lista) return;
  const desbloq = STATE.player.conquistas || {};
  const feitas = Object.keys(desbloq).length;

  const contador = document.getElementById('conquistas-contador');
  if (contador) {
    contador.textContent = feitas === 0
      ? 'Complete quests para desbloquear troféus!'
      : `${feitas} de ${CONQUISTAS.length} troféus conquistados`;
  }

  lista.innerHTML = CONQUISTAS.map(c => {
    const quando = desbloq[c.id];
    const data = quando ? new Date(quando).toLocaleDateString('pt-BR') : '';
    // T2: recompensa real (se configurada) — visível como meta mesmo antes de desbloquear
    const r = STATE.recompensas[c.id];
    const temRecompensa = r && r.texto && r.texto.trim();
    return `
      <div class="conquista-card ${quando ? 'aberta' : 'bloqueada'}">
        <div class="conquista-emoji">${quando ? c.emoji : '🔒'}</div>
        <div class="conquista-nome">${escapeHTML(c.nome)}</div>
        <div class="conquista-desc">${escapeHTML(c.desc)}</div>
        ${quando ? `<div class="conquista-data">✨ ${data}</div>` : ''}
        ${temRecompensa ? `
          <div class="conquista-recompensa ${quando && r.resgatado ? 'resgatada' : ''}">
            🎁 ${escapeHTML(r.texto)}${quando && r.resgatado ? ' ✅' : ''}
          </div>` : ''}
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════
// T2: RECOMPENSAS REAIS POR TROFÉU (editável em Config)
// ═══════════════════════════════════════════════
function renderRecompensasConfig() {
  const lista = document.getElementById('recompensas-lista');
  if (!lista) return;
  const desbloq = STATE.player.conquistas || {};

  lista.innerHTML = CONQUISTAS.map(c => {
    const desbloqueada = !!desbloq[c.id];
    const r = STATE.recompensas[c.id] || { texto: '', resgatado: false };
    return `
      <div class="recompensa-item">
        <div class="recompensa-cabecalho">
          <span class="recompensa-emoji">${desbloqueada ? c.emoji : '🔒'}</span>
          <span class="recompensa-nome">${escapeHTML(c.nome)}</span>
        </div>
        <input type="text" class="recompensa-input"
               placeholder="Ex: Jantar romântico, dia de spa..."
               value="${escapeAttr(r.texto || '')}" maxlength="80"
               data-action="rec-texto" data-id="${escapeAttr(c.id)}">
        <div class="recompensa-rodape">
          ${desbloqueada
            ? `<span class="recompensa-status">${r.resgatado ? '✅ Resgatado' : 'Marcar como resgatado'}</span>
               <label class="switch">
                 <input type="checkbox" data-action="rec-resgatado" data-id="${escapeAttr(c.id)}" ${r.resgatado ? 'checked' : ''}>
                 <span class="slider"></span>
               </label>`
            : `<span class="recompensa-bloqueada">🔒 Desbloqueie o troféu pra poder resgatar</span>`
          }
        </div>
      </div>`;
  }).join('');
}

function abrirRecompensas() {
  const modal = document.getElementById('modal-recompensas');
  if (!modal) return;
  renderRecompensasConfig();
  modal.classList.add('active');
}

function fecharRecompensas() {
  document.getElementById('modal-recompensas')?.classList.remove('active');
  renderConquistas(); // reflete edições na tela de Troféus
}

document.getElementById('recompensas-lista')?.addEventListener('input', (e) => {
  const input = e.target.closest('[data-action="rec-texto"]');
  if (!input) return;
  const id = input.dataset.id;
  if (!STATE.recompensas[id]) STATE.recompensas[id] = { texto: '', resgatado: false };
  STATE.recompensas[id].texto = input.value;
  salvar();
});

document.getElementById('recompensas-lista')?.addEventListener('change', (e) => {
  const chk = e.target.closest('[data-action="rec-resgatado"]');
  if (!chk) return;
  const id = chk.dataset.id;
  if (!STATE.recompensas[id]) STATE.recompensas[id] = { texto: '', resgatado: false };
  STATE.recompensas[id].resgatado = chk.checked;
  salvar();
  mostrarToast(chk.checked ? '✅ Recompensa marcada como resgatada!' : '↩️ Desmarcada');
});

// ═══════════════════════════════════════════════
// AÇÕES DE QUEST
// ═══════════════════════════════════════════════
// U1: streak incrementa na 1ª quest concluída do dia
// (dia seguinte = +1; pulou dia = recomeça em 1)
function atualizarStreak() {
  const hoje = new Date().toDateString();
  if (STATE.player.ultimoDiaComQuest === hoje) return;
  const ontem = new Date(Date.now() - 864e5).toDateString();
  STATE.player.streak = (STATE.player.ultimoDiaComQuest === ontem)
    ? STATE.player.streak + 1
    : 1;
  STATE.player.ultimoDiaComQuest = hoje;
  if (STATE.player.streak > 1) {
    setTimeout(() => {
      somStreak();
      mostrarToast(`🔥 Streak de ${STATE.player.streak} dias! Imparável!`);
    }, 1200);
  }
}

function toggleQuest(id) {
  const q = STATE.quests.find(x => x.id === id);
  if (!q) return;
  // T1: quests com "requerFoto" não concluem direto — abrem a câmera de prova primeiro
  if (!q.done && q.requerFoto) {
    abrirCameraProva(id);
    return;
  }
  if (!q.done) {
    q.done = true;
    q.concluidoEm = Date.now();
    somConcluir();
    adicionarXP(q.xp);
    atualizarStreak();
    // T: contadores para conquistas
    STATE.player.totalConcluidas++;
    if (q.xp >= 100) STATE.player.epicasConcluidas++;
    verificarConquistas();
    mostrarToast(`✨ +${q.xp} XP conquistado!`);
  } else {
    q.done = false;
    delete q.concluidoEm;
    removerXP(q.xp); // B1: agora reverte nível corretamente
    // T: reverte contadores (conquistas já ganhas permanecem — padrão de jogos)
    STATE.player.totalConcluidas = Math.max(0, STATE.player.totalConcluidas - 1);
    if (q.xp >= 100) STATE.player.epicasConcluidas = Math.max(0, STATE.player.epicasConcluidas - 1);
  }
  salvar();
  renderStats();
  renderQuests();
}

// U4: exclusão com Desfazer — protege contra toque acidental (sem fricção de modal)
function deletarQuest(id) {
  const idx = STATE.quests.findIndex(q => q.id === id);
  if (idx < 0) return;
  const removida = STATE.quests.splice(idx, 1)[0];
  salvar();
  renderQuests();
  mostrarToastDesfazer('🗑️ Quest removida', () => {
    STATE.quests.splice(Math.min(idx, STATE.quests.length), 0, removida);
    salvar();
    renderQuests();
    renderStats();
  });
}

function mostrarToastDesfazer(msg, aoDesfazer) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'toast-undo-btn';
  btn.textContent = 'Desfazer';
  btn.onclick = () => {
    t.classList.remove('show');
    aoDesfazer();
  };
  t.appendChild(btn);
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
}

function adicionarXP(qtd) {
  STATE.player.xp += qtd;
  while (STATE.player.xp >= xpProximoNivel(STATE.player.nivel)) {
    STATE.player.xp -= xpProximoNivel(STATE.player.nivel);
    STATE.player.nivel++;
    const nome = STATE.player.nome || 'Guerreira';
    setTimeout(somLevelUp, 350); // toca após o "plim" da conclusão
    mostrarToast(`👑 LEVEL UP, ${nome}! Nível ${STATE.player.nivel}!`);
  }
}

// ═══════════════════════════════════════════════
// B1: REMOVER XP COM REVERSÃO DE NÍVEL
// ═══════════════════════════════════════════════
function removerXP(qtd) {
  STATE.player.xp -= qtd;
  // Se XP ficou negativo, "empresta" do nível anterior
  while (STATE.player.xp < 0 && STATE.player.nivel > 1) {
    STATE.player.nivel--;
    STATE.player.xp += xpProximoNivel(STATE.player.nivel);
  }
  // Se mesmo assim ficou negativo (estava no nível 1), zera
  if (STATE.player.xp < 0) {
    STATE.player.xp = 0;
  }
}

// ═══════════════════════════════════════════════
// B5: RESETAR PROGRESSO
// ═══════════════════════════════════════════════
async function resetarProgresso() {
  const ok = await confirmarCustom(
    'Isso vai apagar TODAS as suas quests, XP, nível e streak. Suas categorias e configurações serão mantidas. Tem certeza?',
    '⚠️ Resetar progresso'
  );
  if (!ok) return;

  const nomeAtual = STATE.player.nome;
  const criadoEmAtual = STATE.player.criadoEm;

  STATE.quests = [];
  STATE.player = {
    ...PLAYER_PADRAO,
    nome: nomeAtual,           // preserva nome
    criadoEm: criadoEmAtual,   // preserva data de criação
    ultimoAcesso: Date.now(),
    conquistas: {}             // T: objeto novo — troféus zerados no reset
  };

  _salvarImediato();
  renderStats();
  renderQuests();
  mostrarToast('🔄 Progresso resetado! Recomeço épico ⚔️');
}

// ═══════════════════════════════════════════════
// MODAL DE ESCOLHA
// ═══════════════════════════════════════════════
function abrirEscolha() {
  document.getElementById('modal-escolha')?.classList.add('active');
}
function fecharEscolha() {
  document.getElementById('modal-escolha')?.classList.remove('active');
}
function escolherFoto() {
  // Correção: chamada síncrona (sem setTimeout). Celulares exigem que
  // input.click() ocorra no mesmo instante do toque do usuário — um
  // atraso, mesmo pequeno, faz o Android bloquear a câmera silenciosamente.
  abrirCameraFoto();
  fecharEscolha();
}
function escolherDigitar() {
  fecharEscolha();
  setTimeout(() => abrirNovaQuest(), 180);
}

// ═══════════════════════════════════════════════
// MODAL NOVA QUEST
// ═══════════════════════════════════════════════
function abrirNovaQuest() {
  const modal = document.getElementById('modal-nova-quest');
  if (!modal) return;

  const ativas = getCategoriasAtivas();
  if (ativas.length > 0) {
    STATE.modal.categoria = ativas[0].id;
  }
  STATE.modal.xp = 10;
  STATE.modal.requerFoto = false;

  renderCategoriaPicker();
  document.querySelectorAll('.diff-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.xp === '10'));
  const chkFoto = document.getElementById('quest-requer-foto');
  if (chkFoto) chkFoto.checked = false;

  modal.classList.add('active');
  setTimeout(() => document.getElementById('quest-titulo')?.focus(), 100);
}

function fecharNovaQuest() {
  const modal = document.getElementById('modal-nova-quest');
  if (!modal) return;
  modal.classList.remove('active');
  document.getElementById('form-nova-quest')?.reset();
}

function criarQuest(e) {
  e.preventDefault();
  const titulo = document.getElementById('quest-titulo').value.trim();
  const desc   = document.getElementById('quest-desc').value.trim();
  if (!titulo) return;

  const chkFoto = document.getElementById('quest-requer-foto');
  STATE.quests.unshift({
    id: uid(),
    titulo,
    desc,
    categoria: STATE.modal.categoria,
    xp: STATE.modal.xp,
    done: false,
    criadoEm: Date.now(),
    requerFoto: !!(chkFoto && chkFoto.checked) // T1: exige foto de prova pra concluir
  });

  salvar();
  renderQuests();
  fecharNovaQuest();
  mostrarToast('⚔️ Nova quest criada!');
}

// ═══════════════════════════════════════════════
// LISTENERS GLOBAIS (delegação)
// ═══════════════════════════════════════════════
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    STATE.modal.xp = parseInt(btn.dataset.xp, 10);
  });
});

// L1: mapa único de fechamento — overlay e ESC usam a mesma fonte
const FECHAR_MODAL = {
  'modal-confirmar':            () => fecharConfirmar(false),
  'modal-escolha':              fecharEscolha,
  'modal-nova-quest':           fecharNovaQuest,
  'modal-nova-categoria':       fecharNovaCategoria,
  'modal-desativar-categoria':  fecharDesativarCategoria,
  'modal-gerenciar-categorias': fecharGerenciarCategorias,
  'modal-recompensas':          fecharRecompensas,
  'modal-tutorial':             fecharTutorial
};

// Fechar modais clicando no overlay
Object.keys(FECHAR_MODAL).forEach(id => {
  document.getElementById(id)?.addEventListener('click', (e) => {
    if (e.target.id === id) FECHAR_MODAL[id]();
  });
});

// Lista de quests — delegação
document.getElementById('quest-list')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'toggle') toggleQuest(id);
  if (action === 'delete') deletarQuest(id);
});

// Picker de categorias no modal nova quest — delegação
document.getElementById('category-picker-novaquest')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="pick-cat"]');
  if (!btn) return;
  selecionarCategoriaPicker(btn.dataset.cat);
});

// Lista de categorias (toggle/excluir) — delegação
document.getElementById('categorias-lista')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="excluir-cat"]');
  if (btn) {
    excluirCategoria(btn.dataset.id);
  }
});
document.getElementById('categorias-lista')?.addEventListener('change', (e) => {
  const input = e.target.closest('[data-action="toggle-cat"]');
  if (input) toggleCategoria(input.dataset.id, input.checked);
});

// Sugestões — delegação
document.getElementById('cat-sugestoes')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="add-sugestao"]');
  if (btn) adicionarSugestao(btn.dataset.id);
});

// ESC fecha modais ativos
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const ativos = document.querySelectorAll('.modal-overlay.active');
  if (ativos.length === 0) return;
  const ultimo = ativos[ativos.length - 1];
  FECHAR_MODAL[ultimo.id]?.();
});

// ═══════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════
let _toastTimer = null;
function mostrarToast(msg, duracaoMs = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), duracaoMs);
}

// ═══════════════════════════════════════════════
// CAPTURA POR FOTO + PREVIEW
// ═══════════════════════════════════════════════
function abrirCameraFoto() {
  const input = document.getElementById('input-camera');
  if (!input) {
    mostrarToast('⚠️ Erro: input de câmera não encontrado');
    return;
  }
  input.value = '';
  input.click();
}

// R3: comprime a foto antes do envio — POST menor, OCR mais rápido, menos quota
function comprimirImagem(dataURL, maxLado = 1600, qualidade = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      if (escala === 1 && dataURL.length < 2_000_000) {
        resolve(dataURL); // já é pequena, não recomprime
        return;
      }
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * escala);
      cv.height = Math.round(img.height * escala);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      resolve(cv.toDataURL('image/jpeg', qualidade));
    };
    img.onerror = () => resolve(dataURL); // fallback: usa original
    img.src = dataURL;
  });
}

function aoTirarFoto(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) { abrirEscolha(); return; }
  if (!file.type.startsWith('image/')) {
    mostrarToast('⚠️ Arquivo não é uma imagem');
    abrirEscolha();
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    STATE.fotoAtual = await comprimirImagem(e.target.result);
    const img = document.getElementById('preview-img');
    if (img) img.src = STATE.fotoAtual;
    abrirPreviewFoto();
  };
  reader.onerror = () => {
    mostrarToast('❌ Erro ao ler a foto');
    abrirEscolha();
  };
  reader.readAsDataURL(file);
}

function abrirPreviewFoto() {
  document.getElementById('preview-foto')?.classList.add('active');
}
function fecharPreviewFoto() {
  document.getElementById('preview-foto')?.classList.remove('active');
}
function tirarOutraFoto() { abrirCameraFoto(); }
function cancelarPreview() {
  fecharPreviewFoto();
  STATE.fotoAtual = null;
  const img = document.getElementById('preview-img');
  if (img) img.src = '';
  setTimeout(() => abrirEscolha(), 180);
}

// ═══════════════════════════════════════════════
// T1: FOTO DE PROVA (concluir quest marcada como "requerFoto")
// Fluxo separado do OCR: aqui a foto NÃO é enviada pra leitura de texto,
// só serve pra confirmar a conclusão (+bônus) e oferecer compartilhamento.
// ═══════════════════════════════════════════════
function abrirCameraProva(questId) {
  STATE.provaQuestId = questId;
  const input = document.getElementById('input-camera-prova');
  if (!input) {
    mostrarToast('⚠️ Erro: câmera de prova não encontrada');
    return;
  }
  input.value = '';
  input.click(); // síncrono — mesma lição do escolherFoto (v15.6)
}

function aoTirarFotoProva(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    mostrarToast('⚠️ Arquivo não é uma imagem');
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    STATE.provaFotoAtual = await comprimirImagem(e.target.result);
    const img = document.getElementById('prova-preview-img');
    if (img) img.src = STATE.provaFotoAtual;
    document.getElementById('preview-prova')?.classList.add('active');
  };
  reader.onerror = () => mostrarToast('❌ Erro ao ler a foto');
  reader.readAsDataURL(file);
}

function tirarOutraFotoProva() { abrirCameraProva(STATE.provaQuestId); }

function cancelarProva() {
  document.getElementById('preview-prova')?.classList.remove('active');
  const img = document.getElementById('prova-preview-img');
  if (img) img.src = '';
  STATE.provaFotoAtual = null;
  STATE.provaQuestId = null;
}

function confirmarConclusaoComProva() {
  const q = STATE.quests.find(x => x.id === STATE.provaQuestId);
  const foto = STATE.provaFotoAtual;
  if (!q) { cancelarProva(); return; }

  document.getElementById('preview-prova')?.classList.remove('active');

  q.done = true;
  q.concluidoEm = Date.now();
  somConcluir();
  const xpTotal = q.xp + XP_BONUS_FOTO_PROVA;
  adicionarXP(xpTotal);
  atualizarStreak();
  STATE.player.totalConcluidas++;
  if (q.xp >= 100) STATE.player.epicasConcluidas++;
  verificarConquistas();
  mostrarToast(`✨ +${xpTotal} XP (prova enviada)! 📸`);

  salvar();
  renderStats();
  renderQuests();

  // Oferece compartilhar a foto (WhatsApp/Email/etc) — não fica salva no app
  oferecerCompartilharProva(foto, q.titulo);

  STATE.provaFotoAtual = null;
  STATE.provaQuestId = null;
  const img = document.getElementById('prova-preview-img');
  if (img) img.src = '';
}

function dataURLToBlob(dataURL) {
  const [header, base64] = dataURL.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// Web Share API — abre o menu nativo (WhatsApp, Email, etc.) pra Aline
// mandar a foto de prova pra Roberta manualmente. Sem backend nenhum.
async function oferecerCompartilharProva(dataURL, tituloQuest) {
  if (!dataURL) return;
  try {
    const blob = dataURLToBlob(dataURL);
    const file = new File([blob], `prova-${uid()}.jpg`, { type: blob.type || 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Prova de quest concluída — DailyRealm',
        text: `📸 Prova: "${tituloQuest}" concluída! ✨`
      });
      return;
    }
  } catch (e) {
    // Usuária cancelou o compartilhamento ou navegador não suporta — sem problema
    console.warn('[Prova] Compartilhar não concluído:', e);
  }
  mostrarToast('📸 Prova registrada! Envie a foto manualmente se quiser compartilhar.');
}

// ═══════════════════════════════════════════════
// OCR
// ═══════════════════════════════════════════════
// R2: timeout de 30s — evita overlay "Lendo..." pendurado em rede instável
const OCR_TIMEOUT_MS = 30000;

async function enviarFotoParaOCR(dataURL) {
  const base64Puro = dataURL.replace(/^data:image\/\w+;base64,/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);
  try {
    const response = await fetch(OCR_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Puro }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Worker retornou ${response.status}: ${response.statusText}`);
    return await response.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Tempo esgotado — verifique sua conexão');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function mostrarLoadingOCR(mostrar) {
  let loading = document.getElementById('loading-ocr');
  if (mostrar) {
    if (!loading) {
      loading = document.createElement('div');
      loading.id = 'loading-ocr';
      loading.innerHTML = `
        <div class="loading-conteudo">
          <div class="loading-spinner">🔍</div>
          <h2>Lendo sua lista...</h2>
          <p>Aguarde alguns segundos ✨</p>
        </div>`;
      document.body.appendChild(loading);
    }
    loading.style.display = 'flex';
  } else if (loading) {
    loading.style.display = 'none';
  }
}

async function confirmarFoto() {
  // N5: proteção contra duplo clique / chamada simultânea
  if (_ocrEmAndamento) {
    console.warn('[OCR] Já em andamento, ignorando clique duplicado');
    return;
  }
  if (!STATE.fotoAtual) { mostrarToast('❌ Nenhuma foto carregada'); return; }

  _ocrEmAndamento = true;
  const btnConfirmar = document.querySelector('.preview-btn-confirmar');
  if (btnConfirmar) btnConfirmar.disabled = true;

  mostrarLoadingOCR(true);
  try {
    const resultado = await enviarFotoParaOCR(STATE.fotoAtual);
    mostrarLoadingOCR(false);
    fecharPreviewFoto();
    const textoBruto = resultado.text || resultado.fullText || resultado.textoExtraido || '';
    if (!textoBruto.trim()) {
      mostrarToast('😕 Não consegui ler nada na foto');
      setTimeout(() => abrirEscolha(), 500);
      return;
    }
    const questsDetectadas = parsearTextoOCR(textoBruto);
    if (questsDetectadas.length === 0) {
      mostrarToast('😕 Nenhuma tarefa reconhecida');
      setTimeout(() => abrirEscolha(), 500);
      return;
    }
    abrirRevisao(questsDetectadas);
  } catch (erro) {
    mostrarLoadingOCR(false);
    console.error('[OCR] ❌ Erro:', erro);
    // Erro de OCR fica visível 10s (em vez de 2,5s) — tempo real de dar print no celular
    mostrarToast('❌ Erro ao ler a foto: ' + erro.message, 10000);
  } finally {
    _ocrEmAndamento = false;
    if (btnConfirmar) btnConfirmar.disabled = false;
  }
}

// ═══════════════════════════════════════════════
// PARSER OCR
// ═══════════════════════════════════════════════
const LIXO_OCR = [
  'SEG','TER','QUA','QUI','SEX','SÁB','SAB','DOM',
  'SEGUNDA','TERÇA','TERCA','QUARTA','QUINTA','SEXTA','SÁBADO','SABADO','DOMINGO',
  'SEMANA','LISTA','TAREFAS','TAREFA','HOJE','AMANHÃ','AMANHA',
  'DIA','DATA','MÊS','MES','ANO',
  'JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'
];

const DICIONARIO_CATEGORIA = {
  compras: ['comprar','compra','mercado','feira','padaria','farmácia','farmacia','açougue','acougue','supermercado','shopping','loja','amazon','shopee'],
  trabalho: ['reunião','reuniao','email','e-mail','relatório','relatorio','planilha','sap','nf','nfe','nfs','banco','conciliação','conciliacao','fechamento','cliente','fornecedor','boleto'],
  pet: ['ração','racao','vermífugo','vermifugo','vet','veterinário','veterinario','gato','gata','cachorro','cão','cao','areia','tosar','tosa']
};

function parsearTextoOCR(textoBruto) {
  let linhas = textoBruto.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
  linhas = linhas.filter(linha => !ehLixo(linha));
  linhas = juntarLinhasQuebradas(linhas);
  linhas = linhas.filter(l => l.length >= 3 && /[a-záéíóúâêôãõç]/i.test(l));
  return linhas.map(linha => ({
    id: uid(),
    titulo: capitalizarPrimeira(linha),
    categoria: detectarCategoria(linha),
    xp: 10,
    ativa: true,
    requerFoto: false // T1: pode ser marcada individualmente na tela de revisão
  }));
}

function ehLixo(linha) {
  const limpa = linha.toUpperCase().replace(/[^A-ZÀ-Ú\s]/g, '').trim();
  if (!limpa) return true;
  const palavras = limpa.split(/\s+/).filter(p => p.length > 0);
  if (palavras.length === 0) return true;
  return palavras.every(p => LIXO_OCR.includes(p));
}

function juntarLinhasQuebradas(linhas) {
  const resultado = [];
  for (let i = 0; i < linhas.length; i++) {
    const atual = linhas[i];
    const proxima = linhas[i + 1];
    if (proxima && /^[a-záéíóúâêôãõç]/.test(proxima) && !/[.!?;:]$/.test(atual) && atual.length < 40) {
      resultado.push(atual + ' ' + proxima);
      i++;
    } else {
      resultado.push(atual);
    }
  }
  return resultado;
}

function detectarCategoria(linha) {
  const lower = linha.toLowerCase();
  for (const [cat, palavras] of Object.entries(DICIONARIO_CATEGORIA)) {
    if (palavras.some(p => lower.includes(p))) {
      if (getCategoria(cat)?.ativa) return cat;
    }
  }
  const ativas = getCategoriasAtivas();
  return ativas.length > 0 ? ativas[0].id : 'casa';
}

function capitalizarPrimeira(str) {
  if (!str) return str;
  // L3: não força lowercase no resto — preserva nomes próprios e siglas
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ═══════════════════════════════════════════════
// TELA DE REVISÃO
// ═══════════════════════════════════════════════
function abrirRevisao(quests) {
  QUESTS_REVISAO = quests;
  renderRevisao();
  document.getElementById('tela-revisao').classList.add('active');
}

function cancelarRevisao() {
  document.getElementById('tela-revisao').classList.remove('active');
  QUESTS_REVISAO = [];
  STATE.fotoAtual = null;
}

function renderRevisao() {
  const lista = document.getElementById('revisao-lista');
  const titulo = document.getElementById('revisao-titulo-txt');
  const btnConfirmar = document.getElementById('btn-confirmar-revisao');

  const ativas = QUESTS_REVISAO.filter(q => q.ativa).length;
  titulo.textContent = `✨ Encontrei ${QUESTS_REVISAO.length} quest${QUESTS_REVISAO.length === 1 ? '' : 's'}!`;
  btnConfirmar.textContent = ativas === 0 ? '⚔️ Criar quests' : `⚔️ Criar ${ativas} quest${ativas === 1 ? '' : 's'}`;
  btnConfirmar.disabled = ativas === 0;

  if (QUESTS_REVISAO.length === 0) {
    lista.innerHTML = `<div class="revisao-vazio"><div class="revisao-vazio-icon">😕</div><p>Nenhuma tarefa identificada</p></div>`;
    return;
  }

  lista.innerHTML = QUESTS_REVISAO.map(q => `
    <div class="revisao-card ${q.ativa ? '' : 'desativada'}" data-id="${escapeAttr(q.id)}">
      <button class="revisao-check ${q.ativa ? 'ativa' : ''}" data-action="rev-toggle" data-id="${escapeAttr(q.id)}" aria-label="${q.ativa ? 'Desmarcar' : 'Marcar'}">
        ${q.ativa ? '✓' : ''}
      </button>
      <button class="revisao-cat-btn" data-action="rev-cat" data-id="${escapeAttr(q.id)}" title="Trocar categoria">
        ${escapeHTML(getEmojiCategoria(q.categoria))}
      </button>
      <input type="text" class="revisao-texto" value="${escapeAttr(q.titulo)}"
             data-action="rev-edit" data-id="${escapeAttr(q.id)}"
             ${q.ativa ? '' : 'disabled'}>
      <button class="revisao-foto-btn ${q.requerFoto ? 'ativo' : ''}" data-action="rev-foto" data-id="${escapeAttr(q.id)}" title="Pedir foto de prova ao concluir (+5 XP)" aria-label="Pedir foto de prova ao concluir">
        📸
      </button>
      <button class="revisao-del" data-action="rev-del" data-id="${escapeAttr(q.id)}" title="Excluir" aria-label="Excluir">🗑️</button>
    </div>
  `).join('');
}

function toggleRevisao(id) {
  const q = QUESTS_REVISAO.find(x => x.id === id);
  if (!q) return;
  q.ativa = !q.ativa;
  renderRevisao();
}

function trocarCategoriaRevisao(id) {
  const q = QUESTS_REVISAO.find(x => x.id === id);
  if (!q) return;
  const ativas = getCategoriasAtivas();
  if (ativas.length === 0) return;
  const idx = ativas.findIndex(c => c.id === q.categoria);
  q.categoria = ativas[(idx + 1) % ativas.length].id;
  renderRevisao();
}

function editarTituloRevisao(id, novoTitulo) {
  const q = QUESTS_REVISAO.find(x => x.id === id);
  if (!q) return;
  q.titulo = novoTitulo.trim();
}

function excluirRevisao(id) {
  QUESTS_REVISAO = QUESTS_REVISAO.filter(q => q.id !== id);
  renderRevisao();
}

// T1: permite marcar, item por item, quais quests criadas por foto vão exigir prova ao concluir
function toggleFotoRevisao(id) {
  const q = QUESTS_REVISAO.find(x => x.id === id);
  if (!q) return;
  q.requerFoto = !q.requerFoto;
  renderRevisao();
}

// Delegação na revisão
document.getElementById('revisao-lista')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'rev-toggle') toggleRevisao(id);
  if (action === 'rev-cat') trocarCategoriaRevisao(id);
  if (action === 'rev-foto') toggleFotoRevisao(id);
  if (action === 'rev-del') excluirRevisao(id);
});
document.getElementById('revisao-lista')?.addEventListener('change', (e) => {
  const input = e.target.closest('[data-action="rev-edit"]');
  if (input) editarTituloRevisao(input.dataset.id, input.value);
});

function confirmarRevisao() {
  const ativas = QUESTS_REVISAO.filter(q => q.ativa && q.titulo.trim());
  if (ativas.length === 0) {
    mostrarToast('⚠️ Nenhuma quest selecionada');
    return;
  }
  ativas.forEach(q => {
    STATE.quests.unshift({
      id: uid(),
      titulo: q.titulo.trim(),
      desc: '',
      categoria: q.categoria,
      xp: q.xp,
      done: false,
      criadoEm: Date.now(),
      requerFoto: !!q.requerFoto // T1: respeita a marcação individual feita na revisão
    });
  });
  // T: registra uso do OCR para a conquista "Maga da Câmera"
  STATE.player.fotosLidas++;
  verificarConquistas();

  salvar();
  renderQuests();
  document.getElementById('tela-revisao').classList.remove('active');
  QUESTS_REVISAO = [];
  STATE.fotoAtual = null;
  navegarPara('tarefas');
  mostrarToast(`⚔️ ${ativas.length} quest${ativas.length === 1 ? '' : 's'} criada${ativas.length === 1 ? '' : 's'}!`);
}

// ═══════════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════════
function renderConfig() {
  const inputNome = document.getElementById('config-nome');
  if (inputNome) inputNome.value = STATE.player.nome || '';

  const sons = document.getElementById('config-sons');
  const escuro = document.getElementById('config-escuro');
  const notif = document.getElementById('config-notificacoes');
  if (sons)  sons.checked  = STATE.config.sons;
  if (escuro) escuro.checked = STATE.config.modoEscuro;
  if (notif) notif.checked = STATE.config.notificacoes && (window.Notification?.permission === 'granted');

  // v18: 2 horários por período (manha1/manha2/tarde1/tarde2/noite1/noite2)
  ['manha1', 'manha2', 'tarde1', 'tarde2', 'noite1', 'noite2'].forEach(k => {
    const el = document.getElementById('hora-' + k);
    if (el) el.value = STATE.config.horarios[k] || '';
  });

  const insist = document.getElementById('config-insistir');
  if (insist) insist.value = STATE.config.insistirHoras;

  const perg = document.getElementById('config-perguntar-horarios');
  if (perg) perg.checked = STATE.config.perguntarHorariosAoAbrir;

  renderCategoriasConfig();
}

function salvarConfigNome() {
  const novo = document.getElementById('config-nome').value.trim();
  if (!novo) {
    mostrarToast('⚠️ O nome não pode ficar vazio');
    document.getElementById('config-nome').value = STATE.player.nome;
    return;
  }
  STATE.player.nome = novo;
  salvar();
  aplicarNomeNaUI();
  mostrarToast(`✨ Nome atualizado pra ${novo}!`);
}

function salvarConfigHorario(periodo, valor) {
  STATE.config.horarios[periodo] = valor;
  salvar();
  sincronizarPush(); // mantém o Worker de push com os horários atualizados
}

function salvarConfigInsistir(valor) {
  STATE.config.insistirHoras = parseInt(valor, 10) || 0;
  salvar();
  mostrarToast(`🔁 Insistência: ${STATE.config.insistirHoras}h`);
  sincronizarPush();
}

function toggleConfigSons(checked) {
  STATE.config.sons = checked;
  salvar();
}

function toggleConfigEscuro(checked) {
  STATE.config.modoEscuro = checked;
  salvar();
  aplicarTema();
}

async function toggleConfigNotificacoes(checked) {
  if (checked) {
    const ok = await pedirPermissaoNotificacao();
    if (!ok) document.getElementById('config-notificacoes').checked = false;
  } else {
    STATE.config.notificacoes = false;
    salvar();
    mostrarToast('🔕 Notificações desligadas');
    sincronizarPush(); // avisa o Worker pra parar de mandar (horários vazios)
  }
}

function toggleConfigPerguntar(checked) {
  STATE.config.perguntarHorariosAoAbrir = checked;
  salvar();
}

// ═══════════════════════════════════════════════
// LEMBRETES (MVP — verifica ao abrir e a cada minuto
// enquanto o app estiver aberto; 1 aviso por período/dia)
// ═══════════════════════════════════════════════
function _lerNotifLog() {
  const log = lerStorage('dr_notif_log', {});
  const hoje = new Date().toDateString();
  if (log.data !== hoje) return { data: hoje, periodos: [], ultimaNotif: 0 };
  return log;
}

function _salvarNotifLog(log) {
  try { localStorage.setItem('dr_notif_log', JSON.stringify(log)); } catch (e) {}
}

function questsPendentes() {
  return STATE.quests.filter(q => !q.done).length;
}

async function notificarPendentes() {
  const n = questsPendentes();
  if (n === 0) return;
  const nome = STATE.player.nome || 'Guerreira';
  const titulo = `⚔️ ${nome}, seu reino te chama!`;
  const body = n === 1
    ? 'Você tem 1 quest esperando. Bora? ✨'
    : `Você tem ${n} quests esperando. Bora? ✨`;
  const opts = {
    body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: 'dailyrealm-lembrete' // substitui a anterior em vez de empilhar
  };
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        reg.showNotification(titulo, opts);
        return;
      }
    }
    new Notification(titulo, opts);
  } catch (e) {
    console.warn('[Notif] Erro no lembrete:', e);
  }
}

function verificarLembretes() {
  if (!STATE.config.notificacoes) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (questsPendentes() === 0) return;

  const agora = new Date();
  const hhmm = String(agora.getHours()).padStart(2, '0') + ':' +
               String(agora.getMinutes()).padStart(2, '0');
  const log = _lerNotifLog();

  // Períodos cujo horário já passou e ainda não foram avisados hoje
  const vencidos = Object.entries(STATE.config.horarios || {})
    .filter(([periodo, hora]) => hora && !log.periodos.includes(periodo) && hhmm >= hora);

  if (vencidos.length > 0) {
    // Marca todos os vencidos, mas avisa só 1 vez (evita rajada ao abrir à noite)
    vencidos.forEach(([periodo]) => log.periodos.push(periodo));
    log.ultimaNotif = Date.now();
    _salvarNotifLog(log);
    notificarPendentes();
    return;
  }

  // Insistência: repete o aviso a cada X horas enquanto houver pendentes
  const h = STATE.config.insistirHoras;
  if (h > 0 && log.ultimaNotif > 0 && Date.now() - log.ultimaNotif >= h * 3600000) {
    log.ultimaNotif = Date.now();
    _salvarNotifLog(log);
    notificarPendentes();
  }
}

// ═══════════════════════════════════════════════
// SHORTCUTS DO MANIFEST (PWA long-press)
// ═══════════════════════════════════════════════
function processarShortcuts() {
  if (document.getElementById('tela-onboarding')?.classList.contains('active')) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const tela = params.get('tela');
  const acao = params.get('acao');

  if (tela === 'tarefas') {
    navegarPara('tarefas');
  }

  if (acao === 'nova-quest') {
    navegarPara('tarefas');
    setTimeout(() => abrirEscolha(), 300);
  }

  if (tela || acao) {
    history.replaceState({}, '', window.location.pathname);
  }
}

// ═══════════════════════════════════════════════
// SERVICE WORKER + AUTO-UPDATE
// ═══════════════════════════════════════════════
let swRegistration = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        swRegistration = reg;
        console.log('[SW] ✅ Registrado:', reg.scope);

        reg.addEventListener('updatefound', () => {
          const novoSW = reg.installing;
          if (!novoSW) return;

          novoSW.addEventListener('statechange', () => {
            if (novoSW.state === 'installed' && navigator.serviceWorker.controller) {
              mostrarToastAtualizacao(novoSW);
            }
          });
        });
      })
      .catch(err => console.warn('[SW] ⚠️ Falhou:', err));

    let recarregando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recarregando) return;
      recarregando = true;
      window.location.reload();
    });
  });
}

function mostrarToastAtualizacao(novoSW) {
  let toastAtt = document.getElementById('toast-atualizacao');
  if (!toastAtt) {
    toastAtt = document.createElement('div');
    toastAtt.id = 'toast-atualizacao';
    toastAtt.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
      background:#8338ec;color:#fff;padding:14px 20px;border-radius:14px;
      box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:9999;
      display:flex;align-items:center;gap:12px;font-size:14px;
    `;
    toastAtt.innerHTML = `
      <span>✨ Nova versão disponível!</span>
      <button id="btn-atualizar-app" style="
        background:#fff;color:#8338ec;border:none;padding:6px 14px;
        border-radius:8px;font-weight:600;cursor:pointer;font-size:13px;">
        Atualizar
      </button>
    `;
    document.body.appendChild(toastAtt);

    document.getElementById('btn-atualizar-app').addEventListener('click', () => {
      novoSW.postMessage({ type: 'SKIP_WAITING' });
      toastAtt.innerHTML = '<span>🔄 Atualizando...</span>';
    });
  }
}

// ═══════════════════════════════════════════════
// INIT — B7: ordem corrigida (onboarding ANTES de renderConfig)
// ═══════════════════════════════════════════════
aplicarTema();

// B7: verifica onboarding PRIMEIRO — evita renderConfig em estado inconsistente
const onboardingAtivo = verificarOnboarding();

renderStats();
renderFiltrosCategorias();
renderQuests();
renderConfig();
renderConquistas();
verificarConquistas(); // T: desbloqueia retroativas (ex.: backfill de perfil antigo)

if (!onboardingAtivo) {
  processarShortcuts();
  // v18: quem já usava o app antes do tutorial existir também vê 1x
  if (!STATE.config.tutorialVisto) {
    setTimeout(() => abrirTutorial(true), 700);
  }
}

// 🔔 Lembretes: checa ao abrir e a cada minuto com o app aberto
verificarLembretes();
setInterval(verificarLembretes, 60000);

// 🔔 Push real: se já tinha permissão concedida antes, garante que o
// Worker está com os horários mais atuais (funciona com app fechado)
if (STATE.config.notificacoes && window.Notification?.permission === 'granted') {
  sincronizarPush();
}

// B6: garante versão no HTML mesmo se hardcoded estiver desatualizado
const elVersion = document.getElementById('app-version');
if (elVersion) elVersion.textContent = APP_VERSAO;

// B4: salva ultimoAcesso atualizado
salvar();
