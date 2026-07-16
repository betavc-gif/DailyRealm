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
//                     por período (manhã/tarde/noite) em vez de 1 |
//                     recompensas reais pré-preenchidas nos 13 troféus
//              v18.1: fix .status-toggle sem width:100% | recompensas
//                     deixam de ser editáveis dentro do app (texto fixo
//                     definido pela Roberta, só o "Resgatado" fica ativo)
//              v18.2: Maga da Câmera movida pro topo da lista de troféus
//              v18.3: SW força checagem de atualização no load + ao
//                     voltar pro primeiro plano (Chrome só rechecava
//                     sozinho a cada ~24h, atrasando o aviso de nova
//                     versão) | botão "Dúvidas e sugestões" (WhatsApp) |
//                     remove toggle "Modo escuro" (nunca teve efeito —
//                     não existia tema claro)
//              v18.4: remove tela "Gerenciar recompensas" de Config —
//                     marcar "Resgatado" agora é direto no card do
//                     troféu (tela Troféus) | remove toggle "Perguntar
//                     horários ao abrir" (nunca teve efeito) | botão
//                     do tutorial em 1 linha só
//              v18.5: corte de foto antes do OCR — permite recortar a
//                     área da lista, excluindo outras anotações do
//                     planner que não devem virar quest
//              v18.6: usa agrupamento por parágrafo do Worker OCR v3
//                     (quando disponível) pra reduzir 1 lembrete de
//                     2-3 linhas virando quests separadas | encadeia
//                     junção automática de mais de 2 linhas | botão
//                     manual "🔗 Unir com a próxima" na revisão
//              v18.7: revisão do OCR ganha seletor de XP/dificuldade
//                     por item (igual à criação manual) + ações em
//                     massa: marcar/desmarcar todas, igualar categoria
//                     e ligar/desligar foto de prova pra todas de vez
//              v18.8: card da quest mostra prévia da descrição (antes
//                     ficava salva mas nunca aparecia) | tocar no card
//                     abre edição completa (título/desc/categoria/XP/
//                     foto) — antes só dava pra concluir ou excluir,
//                     nunca corrigir uma quest já criada
//              v18.9: troféus repaginados — Aventureira em diante
//                     também exigem quests concluídas com foto de
//                     prova (não só volume), e Caçadora de Épicas
//                     agora exige que a quest Épica tenha foto de
//                     prova | recompensas atualizadas (Pegando Fogo
//                     e Caçadora de Épicas trocaram de prêmio)
//              v18.10: botão "🔄 Atualizar recompensas" em Config →
//                     Ajuda — atualiza o texto das recompensas sem
//                     precisar de console do navegador (preserva os
//                     "Resgatado" já marcados)
//              v18.11: IA (Worker dailyrealm-classify) define um TETO de
//                     XP pela dificuldade real da tarefa — vale tanto na
//                     quest digitada quanto na revisão do OCR. Só dá pra
//                     escolher esse XP ou algo mais fácil, nunca mais
//                     difícil (evita classificar tarefa simples como
//                     Épica só pra destravar troféu/recompensa rápido).
//                     Difícil/Épica passam a exigir foto de prova sempre.
//                     Falha de rede/IA cai em Fácil (10 XP) por segurança.
//              v18.12: foto de prova/OCR aceita galeria além da câmera |
//                     4 troféus secretos temáticos (Multitarefa, Madrugadora,
//                     Coruja, Dia Perfeito) — nome/descrição ocultos até
//                     desbloquear | backup + sincronização entre aparelhos
//                     via Worker dailyrealm-backup e frase pessoal (sem
//                     login) — sincroniza ao abrir o app e a cada save
//              v18.13: FIX de segurança no teto de XP por IA — antes, se o
//                     Worker dailyrealm-classify estivesse fora do ar (ou
//                     ainda não configurado), o app deixava passar qualquer
//                     XP escolhido sem travar em Fácil. Agora falha de
//                     rede/IA SEMPRE trava em Fácil (10 XP), tanto na
//                     criação manual quanto na revisão do OCR | Config
//                     reorganizada (Nome/Lembretes primeiro, Backup/Ajuda
//                     no fim) e sem textos redundantes acima dos botões
//              v18.14: 12 novos troféus — Ritmo de Guerra (streak 14) e
//                     Domadora de Titãs (5 Épicas c/ prova) visíveis;
//                     Exploradora, Dia Impecável, Madrugada Profunda,
//                     Rotina Noturna, Maratonista do Dia, Fúria de Quests,
//                     Mil e Uma Faces, Camaleoa, Voltei Mais Forte e
//                     Cúmplices como secretos | recompensa definida pra
//                     TODOS os troféus secretos (inclusive os 4 do v18.12
//                     que ainda estavam sem prêmio) | categoria sugerida
//                     "Casal" (destrava o troféu Cúmplices)
//              v18.15: Bloco 2 — anti-farm por repetição (XP cai pra 50%/
//                     25%/10% se o MESMO título for concluído de novo no
//                     mesmo dia) | streak com "perdão" (1 congelamento por
//                     mês perdoa 1 dia perdido sem quebrar a sequência) |
//                     quests recorrentes (toggle "Repetir" diária/semanal
//                     no modal — ao concluir, a próxima ocorrência aparece
//                     sozinha em Pendentes)
//              v18.16: tutorial reescrito explicando todas as novidades
//                     de v18.11 a v18.15 (IA no XP, galeria, streak com
//                     perdão, quests recorrentes, troféus secretos,
//                     backup na nuvem) — reabre sozinho 1x pra quem já
//                     tinha visto a versão antiga, sem repetir o pedido
//                     de permissão de notificação
//              v18.17: tela de Troféus ganha a seção "🎁 Prontas pra
//                     resgatar" no topo — troféus já desbloqueados com
//                     recompensa ainda não marcada como resgatada sobem
//                     pra lá, em vez de ficarem perdidos no meio da grade
//                     completa (pedido direto da Roberta ao ver o print)
//              v18.18: FIX — troféu que aparece em "Prontas pra resgatar"
//                     não aparece mais duplicado lá embaixo em "Demais
//                     troféus" (cada troféu só existe em 1 lugar na tela)
//              v18.19: 3 troféus novos (Além da Lenda 200 quests, Imparável
//                     2.0 streak 60, Data Especial por calendário do casal
//                     + 4 datas configuráveis em Config); botão de
//                     compartilhar troféu (menu nativo do celular) no toast
//                     de desbloqueio e no ícone 📤 de cada troféu no quadro
//              v18.20: as 4 datas especiais deixam de aparecer em Config —
//                     ficam fixas só no código, pra não entregar a surpresa
//                     do troféu "Data Especial" pra quem abre a tela (Aline
//                     usa a mesma tela de Config)
//              v18.21: FIX — em Android/Chrome mais novos, o seletor de foto
//                     sem "capture" abre direto o Photo Picker do sistema
//                     (só galeria, sem opção de câmera). Os 2 fluxos de foto
//                     (criar quest por foto e foto de prova) agora perguntam
//                     explicitamente Câmera ou Galeria em vez de depender do
//                     celular escolher — reportado pela Roberta
//              v18.22: a escolha Câmera/Galeria vira um popup separado (estilo
//                     WhatsApp) que só aparece depois de tocar em "Por Foto" —
//                     a Roberta não gostou de ver as 2 opções direto na tela
//                     "Como criar?" (v18.21 mostrava as 2 lado a lado)
//              v18.23: tutorial ganha um slide sobre o botão de compartilhar
//                     troféu (📤) — estava parado na v18.16, sem mencionar
//                     essa novidade do v18.19; reabre sozinho 1x pra quem já
//                     viu a versão antiga
//              v18.24: FIX — botão "📤 Compartilhar" (toast de troféu e
//                     "Desfazer" ao excluir quest) aparecia mas não tinha
//                     ação nenhuma ao tocar. Causa: .toast tem pointer-
//                     events:none (pra não bloquear toques atrás dele) e
//                     os botões dentro herdavam esse bloqueio, sem uma regra
//                     liberando o clique só neles. Fix só em style.css.
//              v18.25: FIX — troféus adicionados em atualizações (v18.14/
//                     v18.19 em diante) ficavam sem o cartão de recompensa
//                     em instalações que já tinham `dr_recompensas` salvo,
//                     porque o load não fazia merge com RECOMPENSAS_PADRAO
//                     (diferente de player/config, que já faziam). Agora
//                     faz merge — preenche só o que falta, sem sobrescrever
//                     texto customizado nem o status "Resgatado" existente.
// ═══════════════════════════════════════════════════════════════

const APP_VERSAO = 'v18.25';
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
// v18.11: CLASSIFICAÇÃO DE DIFICULDADE POR IA (anti-inflação de XP)
// ─────────────────────────────────────────────
// A IA (Worker dailyrealm-classify, Groq/Llama) devolve um TETO de XP pela
// dificuldade real da tarefa. O app NUNCA deixa passar desse teto — só
// permite escolher esse valor ou algo mais fácil. Isso existe pra impedir
// que uma tarefa simples seja classificada como Difícil/Épica só pra
// desbloquear troféus/recompensas mais rápido (a maioria das recompensas
// depende da Roberta cumprir algo).
// Qualquer falha (rede fora, Worker fora, resposta inválida) sempre cai
// no nível mais baixo (Fácil/10 XP, offline:true) — nunca no meio-termo,
// pra não abrir brecha justamente quando a checagem está indisponível.
// ═══════════════════════════════════════════════
const CLASSIFY_WORKER_URL = 'https://dailyrealm-classify.dailyrealm.workers.dev/';

async function classificarQuestIA(titulo, desc) {
  try {
    const resp = await fetch(CLASSIFY_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, desc: desc || '' })
    });
    const data = await resp.json();
    if (!data || typeof data.xp !== 'number') throw new Error('resposta inválida da IA');
    return {
      xp: data.xp,
      dificuldade: data.dificuldade || 'FACIL',
      exigirFoto: !!data.exigirFoto,
      motivo: data.motivo || '',
      // O próprio Worker devolve success:false no fallback dele (Groq fora,
      // chave inválida etc.) — nesse caso trata como "offline" também, já
      // que o xp:10 devolvido não é uma classificação real da IA.
      offline: data.success === false
    };
  } catch (e) {
    console.warn('[IA] ⚠️ Falha ao classificar quest, usando Fácil por segurança:', e);
    return { xp: 10, dificuldade: 'FACIL', exigirFoto: false, motivo: '', offline: true };
  }
}

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
  { id: 'pessoal',     nome: 'Pessoal',     emoji: '🌱' },
  { id: 'casal',       nome: 'Casal',       emoji: '💞' } // v18.14: destrava o troféu secreto Cúmplices
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
  // v18.9: contadores pra troféus que exigem prova real (não só volume)
  comProvaConcluidas: 0,       // quests concluídas com foto de prova
  epicasComProvaConcluidas: 0, // quests Épicas (100 XP) concluídas com foto de prova
  // v18.12: flags/contadores pra troféus temáticos secretos
  completouAntes7h: false,    // alguma quest concluída antes das 7h
  completouApos23h: false,    // alguma quest concluída depois das 23h
  categoriasMesmoDiaMax: 0,   // maior nº de categorias diferentes concluídas num mesmo dia
  diaPerfeitoAlcancado: false, // já zerou a lista de pendentes pelo menos 1 vez
  // v18.14: contadores/flags pros 12 novos troféus
  completouEntre0e4h: false,     // alguma quest concluída entre 0h-4h (Madrugada Profunda)
  vezesApos22h: 0,                // quantas quests já concluídas depois das 22h (Rotina Noturna)
  maxQuestsDia: 0,                 // recorde de quests concluídas num único dia (Maratonista/Fúria)
  titulosConcluidos: [],            // títulos únicos já concluídos, normalizados (Mil e Uma Faces/Camaleoa)
  streakQuebrouEm: null,             // timestamp da última quebra de streak >=3 (Voltei Mais Forte)
  recuperouStreak: false,             // reconstruiu a streak até >=3 em até 3 dias da quebra
  concluidasPorCategoria: {},          // { [categoriaId]: total concluído } (ex: troféu Cúmplices)
  diaImpecavelAlcancado: false,         // zerou a lista E todas exigiam foto de prova
  // v18.15: streak com "perdão" — 1 congelamento por mês
  ultimoCongelamentoMes: null,           // 'YYYY-MM' do último mês em que o congelamento foi usado
  // v18.19: troféu "Data Especial" (calendário do casal)
  dataEspecialAtingida: false,            // já bateu em alguma data especial configurada, pelo menos 1 vez
  ultimaChecagemDataEspecial: null,       // toDateString() do último dia já checado (evita reprocessar)
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
  streak3:   { texto: 'Sairemos para jantar em um Restaurante da SUA escolha!', resgatado: false },
  streak7:   { texto: 'Planejaremos definitivamente uma viagem longa!', resgatado: false },
  streak30:  { texto: 'Tu pede, EU faço! (modo HOT!)', resgatado: false },
  foto:      { texto: 'Cozinharei o que você quiser!', resgatado: false },
  epica:     { texto: 'Pernoite no 2001!!!', resgatado: false },
  // v18.14: os 4 troféus secretos do v18.12 finalmente ganham recompensa
  variada:     { texto: 'Hoje EU cuido de tudo em casa — você só relaxa', resgatado: false },
  madrugadora: { texto: 'Café da manhã na cama, do jeito que você gosta', resgatado: false },
  corujao:     { texto: 'Filme/série até tarde hoje, sem culpa nenhuma', resgatado: false },
  diaperfeito: { texto: 'Você escolhe o jantar E o programa da noite — dia 100% seu', resgatado: false },
  // v18.14: recompensas dos 12 troféus novos
  ritmoguerra:      { texto: 'Passeio surpresa curto, só nós dois', resgatado: false },
  domadora:         { texto: 'Um presente da sua wishlist, finalmente!', resgatado: false },
  exploradora:      { texto: 'Flores de surpresa, sem motivo nenhum', resgatado: false },
  diaimpecavel:     { texto: 'Encontro à luz de velas em casa, só nós dois', resgatado: false },
  madrugadaprofunda:{ texto: 'Café da manhã na cama + você escolhe a trilha sonora do dia', resgatado: false },
  rotinanoturna:    { texto: 'Lanche de madrugada por conta da casa, sem pestanejar', resgatado: false },
  maratonista:      { texto: 'Massagem de 15 minutinhos, sem enrolação', resgatado: false },
  furia:            { texto: 'Jantar fora, comida que você quiser', resgatado: false },
  milfaces:         { texto: 'Você manda no programa da noite, sem discussão', resgatado: false },
  camaleoa:         { texto: 'Day use ou diária romântica — sua escolha', resgatado: false },
  voltoumaisforte:  { texto: 'Um bilhete escondido de orgulho + um mimo surpresa', resgatado: false },
  casal10:          { texto: 'Passeio a dois, sem celular, só vocês', resgatado: false },
  // v18.19: recompensas dos 3 troféus novos — texto é só sugestão, troque quando quiser
  lendaviva200: { texto: 'Um fim de semana só nosso, sem compromisso nenhum — você escolhe o destino', resgatado: false },
  imparavel60:  { texto: 'Uma escapada de fim de semana, do jeito que você quiser planejar', resgatado: false },
  dataespecial: { texto: 'Um mimo especial só porque hoje é um dia nosso', resgatado: false }
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
  moverDiaSeguinte: true,
  tutorialVisto: false, // v18: controla se já mostrou o tutorial automático
  tutorialVersaoVista: '', // v18.16: qual TUTORIAL_VERSAO essa pessoa já viu
  fraseBackup: '', // v18.12: chave pessoal pro backup/sincronização na nuvem
  // v18.19: datas especiais do casal — disparam o troféu secreto "Data Especial"
  // v18.20: fixas aqui no código (SEM campo em Config) — a tela de Config é a
  // mesma que a Aline usa, então deixar as datas visíveis/editáveis ali
  // entregaria a existência do troféu-surpresa. Pra trocar uma data, edita aqui.
  datasEspeciais: {
    casamento: '12/07',   // aniversário de casamento (DD/MM)
    mesversario: '12',    // dia do mês — repete todo mês
    roberta: '03/09',     // aniversário da Roberta (DD/MM)
    aline: '28/04'        // aniversário da Aline (DD/MM)
  }
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
    horarios: { ...CONFIG_PADRAO.horarios, ...(_cfgSalvo.horarios || {}) },
    // v18.19: merge profundo — instalação antiga sem essa chave não perde os padrões
    datasEspeciais: { ...CONFIG_PADRAO.datasEspeciais, ...(_cfgSalvo.datasEspeciais || {}) }
  },
  categorias: lerStorage('dr_categorias', CATEGORIAS_PADRAO),
  // T2: recompensas reais por troféu — { [conquistaId]: { texto, resgatado } }
  // v18: usa RECOMPENSAS_PADRAO como valor inicial (edições ficam salvas por instalação)
  // v18.25: FIX — merge com RECOMPENSAS_PADRAO (igual já era feito com player/config).
  // Antes, se `dr_recompensas` já existisse salvo, troféus novos adicionados numa
  // atualização (ex.: v18.14, v18.19) ficavam sem recompensa nenhuma até alguém
  // tocar manualmente em "🔄 Atualizar recompensas". Agora entra automático,
  // preservando texto/resgatado de quem já estava salvo.
  recompensas: { ...RECOMPENSAS_PADRAO, ...lerStorage('dr_recompensas', {}) },
  filtroAtivo: 'todas',
  filtroStatus: 'pendentes', // v18: 'pendentes' ou 'concluidas' (não persiste, reseta ao abrir)
  modal: { categoria: 'casa', xp: 10, requerFoto: false, editandoId: null, recorrente: null }, // v18.8: editandoId != null = editando quest existente | v18.15: recorrente = { frequencia }
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
    // v18.12: carimba o momento da mudança local e agenda envio pra nuvem
    _ultimaModificacaoLocal = Date.now();
    localStorage.setItem('dr_ultima_mod', String(_ultimaModificacaoLocal));
    agendarPushNuvem();
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

// ═══════════════════════════════════════════════
// v18.12: BACKUP + SINCRONIZAÇÃO ENTRE APARELHOS
// ─────────────────────────────────────────────
// Guarda uma cópia completa do jogo na nuvem (Worker dailyrealm-backup),
// identificada por uma "frase" pessoal (NÃO é login/senha — só uma chave
// de gaveta, sem cadastro). Ao abrir o app, puxa a versão mais recente da
// nuvem (se for mais nova que a local). A cada salvamento local, envia
// uma cópia pra nuvem (debounced). Serve tanto de backup (recuperar dados
// perdidos) quanto de sincronização entre 2 aparelhos (tablet + celular).
// Sem frase configurada, essa seção inteira fica inerte (opt-in).
// ═══════════════════════════════════════════════
const BACKUP_WORKER_URL = 'https://dailyrealm-backup.dailyrealm.workers.dev/';
let _ultimaModificacaoLocal = Number(lerStorage('dr_ultima_mod', 0)) || 0;
let _syncEmAndamento = false;
let _syncPushTimer = null;

function _pacoteBackup() {
  return {
    quests: STATE.quests,
    player: STATE.player,
    config: STATE.config,
    categorias: STATE.categorias,
    recompensas: STATE.recompensas
  };
}

async function enviarBackupNuvem() {
  const frase = (STATE.config.fraseBackup || '').trim();
  if (!frase) return;
  try {
    await fetch(BACKUP_WORKER_URL + 'salvar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frase, dados: _pacoteBackup(), timestamp: _ultimaModificacaoLocal })
    });
  } catch (e) {
    console.warn('[Backup] ⚠️ Falha ao enviar backup:', e);
  }
}

// Chamado sempre que algo é salvo localmente — manda pra nuvem com uma
// folga (debounce), pra não disparar 1 request a cada pequena mudança
function agendarPushNuvem() {
  if (!(STATE.config.fraseBackup || '').trim()) return;
  if (_syncPushTimer) clearTimeout(_syncPushTimer);
  _syncPushTimer = setTimeout(enviarBackupNuvem, 4000);
}

// Aplica um pacote vindo da nuvem por cima do estado local — usado tanto
// na sincronização automática quanto na restauração manual (onboarding)
function aplicarDadosRemotos(dados, timestamp) {
  if (!dados) return;
  STATE.quests = Array.isArray(dados.quests) ? dados.quests : STATE.quests;
  STATE.player = { ...PLAYER_PADRAO, ...(dados.player || {}) };
  STATE.config = {
    ...CONFIG_PADRAO,
    ...(dados.config || {}),
    horarios: { ...CONFIG_PADRAO.horarios, ...((dados.config || {}).horarios || {}) },
    datasEspeciais: { ...CONFIG_PADRAO.datasEspeciais, ...((dados.config || {}).datasEspeciais || {}) }
  };
  STATE.categorias = Array.isArray(dados.categorias) && dados.categorias.length > 0 ? dados.categorias : STATE.categorias;
  STATE.recompensas = { ...RECOMPENSAS_PADRAO, ...(dados.recompensas || {}) };

  _ultimaModificacaoLocal = timestamp || Date.now();
  try { localStorage.setItem('dr_ultima_mod', String(_ultimaModificacaoLocal)); } catch (e) {}
  _salvarImediato();

  aplicarNomeNaUI();
  renderStats();
  renderCategoriasConfig();
  renderFiltrosCategorias();
  renderQuests();
  renderConquistas();
  renderConfig();
}

// Busca a versão mais recente da nuvem. Se for mais nova que a local,
// substitui os dados locais. Senão, envia a local pra nuvem (garante que
// a nuvem sempre reflita o aparelho usado mais recentemente).
async function sincronizarComNuvem({ silencioso = true } = {}) {
  const frase = (STATE.config.fraseBackup || '').trim();
  if (!frase || _syncEmAndamento) return;
  _syncEmAndamento = true;
  try {
    const resp = await fetch(BACKUP_WORKER_URL + 'carregar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frase })
    });
    const data = await resp.json();

    if (data && data.encontrado && data.timestamp > _ultimaModificacaoLocal) {
      aplicarDadosRemotos(data.dados, data.timestamp);
      mostrarToast('☁️ Dados atualizados a partir da nuvem!');
    } else {
      await enviarBackupNuvem();
      if (!silencioso) mostrarToast('☁️ Sincronizado!');
    }
  } catch (e) {
    console.warn('[Backup] ⚠️ Falha ao sincronizar:', e);
    if (!silencioso) mostrarToast('⚠️ Não consegui sincronizar agora — verifique a internet');
  } finally {
    _syncEmAndamento = false;
  }
}

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

// v18.12: restaurar dados de outro aparelho (backup/sincronização) direto
// da tela de onboarding — evita ter que criar um perfil novo do zero
function mostrarRestaurarOnboarding() {
  document.getElementById('btn-mostrar-restaurar')?.classList.add('oculto');
  document.getElementById('form-restaurar-onboarding')?.classList.remove('oculto');
  setTimeout(() => document.getElementById('onboarding-frase-restaurar')?.focus(), 100);
}

async function restaurarBackupOnboarding(event) {
  event.preventDefault();
  const input = document.getElementById('onboarding-frase-restaurar');
  const frase = (input?.value || '').trim();
  if (!frase) {
    mostrarToast('⚠️ Digite a frase de backup do outro aparelho');
    return;
  }

  const btn = event.target.querySelector('button[type="submit"]');
  const rotuloOriginal = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '☁️ Procurando...'; }

  try {
    const resp = await fetch(BACKUP_WORKER_URL + 'carregar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frase })
    });
    const data = await resp.json();

    if (!data || !data.encontrado) {
      mostrarToast('😕 Nenhum backup encontrado com essa frase');
      if (btn) { btn.disabled = false; btn.textContent = rotuloOriginal; }
      return;
    }

    aplicarDadosRemotos(data.dados, data.timestamp);
    STATE.config.fraseBackup = frase; // mantém a mesma frase pra continuar sincronizando
    salvar();
    document.getElementById('tela-onboarding')?.classList.remove('active');
    mostrarToast('✅ Dados restaurados com sucesso!');
  } catch (e) {
    mostrarToast('⚠️ Não consegui buscar o backup agora. Verifique a internet e tente de novo.');
    if (btn) { btn.disabled = false; btn.textContent = rotuloOriginal; }
  }
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
// Mostra sozinho 1x (onboarding novo ou upgrade de quem já usava), e
// também 1x sempre que o CONTEÚDO do tutorial mudar (ver TUTORIAL_VERSAO
// e config.tutorialVersaoVista lá no INIT) — assim ninguém perde as
// novidades de versões novas. Fica sempre disponível via botão
// "❓ Como funciona" na Config também.
// v18.16: reescrito pra explicar IA no XP, galeria, streak com perdão,
// quests recorrentes, troféus secretos e backup na nuvem.
// ═══════════════════════════════════════════════
const TUTORIAL_VERSAO = 'v18.23';
const TUTORIAL_SLIDES = [
  { emoji: '👑', titulo: 'Bem-vinda ao DailyRealm',
    texto: 'Transforme sua rotina em uma jornada épica! Cada tarefa do dia vira uma "quest" que te dá XP, sobe seu nível e desbloqueia troféus.' },
  { emoji: '⚔️', titulo: 'Criando suas Quests',
    texto: 'Toque no botão + na tela de Quests. Você pode criar uma quest manualmente, ou tocar em "Por Foto" e fotografar (ou escolher da galeria) sua agenda/planner — o app lê e cria as quests sozinho.' },
  { emoji: '🤖', titulo: 'A IA cuida do XP por você',
    texto: 'Ao criar uma quest, uma IA avalia a dificuldade real da tarefa e define um teto de XP — você só pode escolher esse valor ou algo mais fácil, nunca mais difícil do que realmente é. Tarefas Difíceis/Épicas sempre pedem foto de prova.' },
  { emoji: '📸', titulo: 'Foto de Prova',
    texto: 'Algumas quests pedem uma foto pra confirmar que foram feitas de verdade — pela câmera ou da galeria. Ao concluir, é só escolher a foto e compartilhar com quem acompanha. Vale +5 XP bônus!' },
  { emoji: '🔥', titulo: 'XP, Nível e Streak',
    texto: 'Cada quest concluída dá XP. Ao encher a barra, você sobe de nível. Completar pelo menos 1 quest por dia mantém sua sequência (streak) 🔥.' },
  { emoji: '🛡️', titulo: 'Streak com perdão',
    texto: 'Perdeu 1 dia sem querer? Sem drama: 1 vez por mês, a sequência é perdoada automaticamente — você nem precisa pedir nada. Só não cobre 2 dias seguidos perdidos.' },
  { emoji: '🔁', titulo: 'Quests que se repetem sozinhas',
    texto: 'Pra tarefas de rotina (remédio, arrumar a cama...), ative "🔁 Repetir" ao criar a quest. Ao concluir, a próxima já aparece pronta em Pendentes. E pra ninguém "inflar" XP fazendo a mesma coisa várias vezes no dia, repetir o mesmo título dá cada vez menos XP.' },
  { emoji: '🏆', titulo: 'Troféus e Recompensas',
    texto: 'Na aba Troféus você vê suas conquistas e a recompensa real de cada uma. Alguns troféus são secretos (aparecem como "❓" até você desbloquear sem querer) — pura surpresa! Ao desbloquear, marque como "Resgatado" quando aproveitar o prêmio de verdade.' },
  { emoji: '📤', titulo: 'Compartilhe suas conquistas',
    texto: 'Desbloqueou um troféu? Toque em "📤 Compartilhar" no aviso que aparece na hora, ou no ícone 📤 de qualquer troféu já desbloqueado na aba Troféus — abre o WhatsApp com uma mensagem prontinha pra contar a novidade.' },
  { emoji: '☁️', titulo: 'Backup na nuvem',
    texto: 'Em Config você pode criar uma frase pessoal de backup — sem login, sem senha. Ela guarda seu progresso na nuvem e sincroniza sozinha entre aparelhos (ex: celular e tablet). Ótimo se trocar de aparelho ou limpar o cache sem querer.' },
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
  if (!STATE.config.tutorialVisto || STATE.config.tutorialVersaoVista !== TUTORIAL_VERSAO) {
    STATE.config.tutorialVisto = true;
    STATE.config.tutorialVersaoVista = TUTORIAL_VERSAO; // v18.16
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

// v18.8: prévia curta da descrição no card + card tocável abre edição
// completa (antes o campo "detalhes" ficava salvo mas nunca aparecia
// em lugar nenhum, e não dava pra corrigir nada após criar a quest)
function renderQuestCard(q) {
  const temDesc = q.desc && q.desc.trim();
  const previaDesc = temDesc
    ? (q.desc.length > 60 ? q.desc.trim().slice(0, 60) + '…' : q.desc.trim())
    : '';
  return `
    <div class="quest-card ${q.done ? 'done' : ''}" data-id="${escapeAttr(q.id)}">
      <button class="quest-check ${q.done ? 'done' : ''}" data-action="toggle" data-id="${escapeAttr(q.id)}" aria-label="${q.done ? 'Desmarcar' : 'Concluir'} quest">
        ${q.done ? '✓' : ''}
      </button>
      <div class="quest-content" data-action="editar" data-id="${escapeAttr(q.id)}">
        <div class="quest-title-txt">${escapeHTML(q.titulo)}</div>
        ${temDesc ? `<div class="quest-desc-preview">${escapeHTML(previaDesc)}</div>` : ''}
        <div class="quest-meta">
          <span class="quest-cat-tag">${escapeHTML(getEmojiCategoria(q.categoria))} ${escapeHTML(getNomeCategoria(q.categoria))}</span>
          <span class="quest-xp">+${q.xp} XP</span>
          ${q.requerFoto ? '<span class="quest-prova-badge" title="Precisa de foto de prova para concluir">📸</span>' : ''}
          ${q.recorrente ? `<span class="quest-prova-badge" title="Quest recorrente (${q.recorrente.frequencia === 'semanal' ? 'semanal' : 'diária'})">🔁</span>` : ''}
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
// v18.9: dificuldade repaginada — troféus iniciais continuam fáceis
// (ganham logo, prendem o jogador), e a partir de "Aventureira" passa a
// exigir também quests concluídas com foto de prova real, não só volume.
// Streaks e níveis ficam como estavam (já crescem naturalmente).
const CONQUISTAS = [
  { id: 'foto',      emoji: '📸', nome: 'Maga da Câmera',    desc: 'Crie quests fotografando uma lista', cond: p => p.fotosLidas >= 1 },
  { id: 'primeira',  emoji: '🎯', nome: 'Primeiro Passo',    desc: 'Conclua sua primeira quest',        cond: p => p.totalConcluidas >= 1 },
  { id: 'cinco',     emoji: '⚔️', nome: 'Aventureira',       desc: 'Conclua 5 quests, sendo 1 com foto de prova',      cond: p => p.totalConcluidas >= 5 && p.comProvaConcluidas >= 1 },
  { id: 'dez',       emoji: '🛡️', nome: 'Guerreira',         desc: 'Conclua 10 quests, sendo 2 com foto de prova',     cond: p => p.totalConcluidas >= 10 && p.comProvaConcluidas >= 2 },
  { id: 'cinquenta', emoji: '🏰', nome: 'Heroína do Reino',  desc: 'Conclua 50 quests, sendo 10 com foto de prova',    cond: p => p.totalConcluidas >= 50 && p.comProvaConcluidas >= 10 },
  { id: 'cem',       emoji: '👑', nome: 'Lenda Viva',        desc: 'Conclua 100 quests, sendo 25 com foto de prova',   cond: p => p.totalConcluidas >= 100 && p.comProvaConcluidas >= 25 },
  // v18.19: degrau acima da Lenda Viva — bônus pra quem passa dos 200
  { id: 'lendaviva200', emoji: '🏆', nome: 'Além da Lenda', desc: 'Conclua 200 quests, sendo 50 com foto de prova', cond: p => p.totalConcluidas >= 200 && p.comProvaConcluidas >= 50 },
  { id: 'nivel3',    emoji: '⭐', nome: 'Em Ascensão',       desc: 'Alcance o nível 3',                 cond: p => p.nivel >= 3 },
  { id: 'nivel5',    emoji: '🌟', nome: 'Estrela do Reino',  desc: 'Alcance o nível 5',                 cond: p => p.nivel >= 5 },
  { id: 'nivel10',   emoji: '💫', nome: 'Suprema',           desc: 'Alcance o nível 10',                cond: p => p.nivel >= 10 },
  { id: 'streak3',   emoji: '🔥', nome: 'Pegando Fogo',      desc: '3 dias seguidos com quest feita',   cond: p => p.streak >= 3 },
  { id: 'streak7',   emoji: '🌋', nome: 'Semana Épica',      desc: '7 dias seguidos com quest feita',   cond: p => p.streak >= 7 },
  // v18.14: degrau entre Semana Épica (7) e Imparável (30)
  { id: 'ritmoguerra', emoji: '⚡', nome: 'Ritmo de Guerra', desc: '14 dias seguidos com quest feita',  cond: p => p.streak >= 14 },
  { id: 'streak30',  emoji: '☄️', nome: 'Imparável',         desc: '30 dias seguidos com quest feita',  cond: p => p.streak >= 30 },
  // v18.19: degrau acima do Imparável — bônus pra streak de peso pesado
  { id: 'imparavel60', emoji: '🌠', nome: 'Imparável 2.0', desc: '60 dias seguidos com quest feita', cond: p => p.streak >= 60 },
  { id: 'epica',     emoji: '💎', nome: 'Caçadora de Épicas', desc: 'Conclua uma quest Épica (100 XP) com foto de prova', cond: p => p.epicasComProvaConcluidas >= 1 },
  // v18.14: degrau acima da Caçadora de Épicas, mesmo contador
  { id: 'domadora',  emoji: '🏔️', nome: 'Domadora de Titãs', desc: 'Conclua 5 quests Épicas (100 XP) com foto de prova', cond: p => p.epicasComProvaConcluidas >= 5 },
  // v18.12/v18.14: troféus secretos — nome/descrição ficam ocultos
  // (renderConquistas) até desbloquear, pra dar efeito surpresa.
  { id: 'variada',     emoji: '🎭', nome: 'Multitarefa',  desc: 'Conclua quests de 3 categorias diferentes no mesmo dia', secreto: true, cond: p => p.categoriasMesmoDiaMax >= 3 },
  { id: 'madrugadora', emoji: '🌅', nome: 'Madrugadora',  desc: 'Conclua uma quest antes das 7h da manhã',                secreto: true, cond: p => !!p.completouAntes7h },
  { id: 'corujao',     emoji: '🦉', nome: 'Coruja',       desc: 'Conclua uma quest depois das 23h',                       secreto: true, cond: p => !!p.completouApos23h },
  { id: 'diaperfeito', emoji: '✨', nome: 'Dia Perfeito', desc: 'Zere a lista de quests pendentes pelo menos uma vez',    secreto: true, cond: p => !!p.diaPerfeitoAlcancado },
  // v18.14: 8 novos troféus secretos, na maioria variações mais raras dos acima
  { id: 'exploradora',       emoji: '🗺️', nome: 'Exploradora',        desc: 'Conclua quests de 4 categorias diferentes no mesmo dia',       secreto: true, cond: p => p.categoriasMesmoDiaMax >= 4 },
  { id: 'diaimpecavel',      emoji: '💠', nome: 'Dia Impecável',       desc: 'Zere a lista de pendentes com foto de prova em TODAS as quests do dia', secreto: true, cond: p => !!p.diaImpecavelAlcancado },
  { id: 'madrugadaprofunda', emoji: '🌌', nome: 'Madrugada Profunda',  desc: 'Conclua uma quest entre meia-noite e 4h da manhã',              secreto: true, cond: p => !!p.completouEntre0e4h },
  { id: 'rotinanoturna',     emoji: '🌙', nome: 'Rotina Noturna',      desc: 'Conclua 3 quests depois das 22h',                                secreto: true, cond: p => (p.vezesApos22h || 0) >= 3 },
  { id: 'maratonista',       emoji: '🏃‍♀️', nome: 'Maratonista do Dia', desc: 'Conclua 5 quests em um único dia',                              secreto: true, cond: p => (p.maxQuestsDia || 0) >= 5 },
  { id: 'furia',             emoji: '🌪️', nome: 'Fúria de Quests',     desc: 'Conclua 8 quests em um único dia',                               secreto: true, cond: p => (p.maxQuestsDia || 0) >= 8 },
  { id: 'milfaces',          emoji: '🌈', nome: 'Mil e Uma Faces',     desc: 'Conclua 15 tipos diferentes de quest (títulos únicos)',          secreto: true, cond: p => (p.titulosConcluidos || []).length >= 15 },
  { id: 'camaleoa',          emoji: '🎨', nome: 'Camaleoa',            desc: 'Conclua 30 tipos diferentes de quest (títulos únicos)',          secreto: true, cond: p => (p.titulosConcluidos || []).length >= 30 },
  { id: 'voltoumaisforte',   emoji: '🛟', nome: 'Voltei Mais Forte',   desc: 'Quebrou uma streak de 3+ dias e voltou a alcançar 3 dias em até 3 dias', secreto: true, cond: p => !!p.recuperouStreak },
  { id: 'casal10',           emoji: '💞', nome: 'Cúmplices',           desc: 'Conclua 10 quests na categoria Casal',                           secreto: true, cond: p => ((p.concluidasPorCategoria || {}).casal || 0) >= 10 },
  // v18.19: troféu de calendário — dispara em qualquer data especial configurada em Config
  { id: 'dataespecial',      emoji: '🎂', nome: 'Data Especial',       desc: 'Esteve no DailyRealm numa data especial do casal',              secreto: true, cond: p => !!p.dataEspecialAtingida }
];

// v18.12: atualiza os contadores/flags usados pelos troféus temáticos acima —
// chamar sempre que uma quest for concluída (com ou sem foto de prova),
// ANTES de verificarConquistas(), senão o desbloqueio sai um ciclo atrasado.
function atualizarFlagsConquistasContextuais(q) {
  const ts = q.concluidoEm || Date.now();
  const dt = new Date(ts);
  const hora = dt.getHours();
  if (hora < 7) STATE.player.completouAntes7h = true;
  if (hora >= 23) STATE.player.completouApos23h = true;
  if (hora < 4) STATE.player.completouEntre0e4h = true; // v18.14: Madrugada Profunda
  if (hora >= 22) STATE.player.vezesApos22h = (STATE.player.vezesApos22h || 0) + 1; // v18.14: Rotina Noturna

  const inicioDia = new Date(dt); inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dt); fimDia.setHours(23, 59, 59, 999);
  const concluidasHoje = STATE.quests.filter(
    x => x.done && x.concluidoEm >= inicioDia.getTime() && x.concluidoEm <= fimDia.getTime()
  );

  const categoriasHoje = new Set(concluidasHoje.map(x => x.categoria));
  if (categoriasHoje.size > (STATE.player.categoriasMesmoDiaMax || 0)) {
    STATE.player.categoriasMesmoDiaMax = categoriasHoje.size;
  }

  // v18.14: recorde de quests concluídas num único dia (Maratonista/Fúria)
  if (concluidasHoje.length > (STATE.player.maxQuestsDia || 0)) {
    STATE.player.maxQuestsDia = concluidasHoje.length;
  }

  // v18.14: histórico de títulos únicos já concluídos (Mil e Uma Faces/Camaleoa)
  const tituloNorm = (q.titulo || '').trim().toLowerCase();
  if (tituloNorm) {
    if (!Array.isArray(STATE.player.titulosConcluidos)) STATE.player.titulosConcluidos = [];
    if (!STATE.player.titulosConcluidos.includes(tituloNorm)) {
      STATE.player.titulosConcluidos.push(tituloNorm);
    }
  }

  // v18.14: contador de conclusões por categoria (ex.: troféu Cúmplices na categoria Casal)
  if (q.categoria) {
    if (!STATE.player.concluidasPorCategoria) STATE.player.concluidasPorCategoria = {};
    STATE.player.concluidasPorCategoria[q.categoria] = (STATE.player.concluidasPorCategoria[q.categoria] || 0) + 1;
  }

  // "Dia perfeito": nenhuma quest pendente sobrando (e existe ao menos 1 quest)
  if (STATE.quests.length > 0 && STATE.quests.every(x => x.done)) {
    STATE.player.diaPerfeitoAlcancado = true;
    // v18.14: versão mais rara — todas as concluídas do dia exigiam foto de prova
    if (STATE.quests.every(x => x.requerFoto)) {
      STATE.player.diaImpecavelAlcancado = true;
    }
  }
}

// v18.19: TROFÉU "DATA ESPECIAL" — checa se hoje bate com alguma das datas
// cadastradas em Config → Datas Especiais. Roda no init e a cada minuto
// (mesmo timer dos lembretes), mas só processa 1x por dia (ultimaChecagemDataEspecial).
// Formato esperado: 'DD/MM' pras datas anuais, só o dia (nº) pro mesversário.
function verificarDatasEspeciais() {
  const cfg = STATE.config.datasEspeciais;
  if (!cfg) return;
  const hoje = new Date();
  const hojeStr = hoje.toDateString();
  if (STATE.player.ultimaChecagemDataEspecial === hojeStr) return;
  STATE.player.ultimaChecagemDataEspecial = hojeStr;

  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1;

  const bateDDMM = (str) => {
    if (!str) return false;
    const partes = String(str).split('/');
    const d = parseInt(partes[0], 10);
    const m = parseInt(partes[1], 10);
    return d === dia && m === mes;
  };
  const bateMesversario = (str) => {
    if (!str) return false;
    return parseInt(str, 10) === dia;
  };

  if (bateDDMM(cfg.casamento) || bateDDMM(cfg.roberta) || bateDDMM(cfg.aline) || bateMesversario(cfg.mesversario)) {
    STATE.player.dataEspecialAtingida = true;
    salvar();
  }
}

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
      mostrarToastConquista(`🏆 Conquista desbloqueada: ${c.emoji} ${c.nome}!`, c.id);
    }, 2800 + i * 2700);
  });
}

// v18.17: markup de 1 card de troféu — extraído pra função própria pra
// poder ser reaproveitado tanto na grade completa quanto na seção de
// destaque "Prontas pra resgatar" (evita duplicar o HTML nos dois lugares)
function renderCartaoConquista(c, desbloq) {
  const quando = desbloq[c.id];
  const data = quando ? new Date(quando).toLocaleDateString('pt-BR') : '';
  // v18.12: troféu secreto ainda não desbloqueado — esconde nome/descrição
  const oculto = !!c.secreto && !quando;
  // T2: recompensa real (fixa) — visível como meta mesmo antes de desbloquear
  const r = STATE.recompensas[c.id];
  const temRecompensa = !oculto && r && r.texto && r.texto.trim();
  return `
    <div class="conquista-card ${quando ? 'aberta' : 'bloqueada'} ${oculto ? 'secreta' : ''}">
      ${quando ? `<button type="button" class="conquista-compartilhar" data-action="compartilhar" data-id="${escapeAttr(c.id)}" aria-label="Compartilhar troféu" title="Compartilhar">📤</button>` : ''}
      <div class="conquista-emoji">${quando ? c.emoji : (oculto ? '❓' : '🔒')}</div>
      <div class="conquista-nome">${oculto ? '???' : escapeHTML(c.nome)}</div>
      <div class="conquista-desc">${oculto ? 'Troféu secreto — desbloqueie pra descobrir!' : escapeHTML(c.desc)}</div>
      ${quando ? `<div class="conquista-data">✨ ${data}</div>` : ''}
      ${temRecompensa ? `
        <button type="button"
                class="conquista-recompensa ${quando && r.resgatado ? 'resgatada' : ''}"
                ${quando ? `data-action="toggle-resgatado" data-id="${escapeAttr(c.id)}"` : 'disabled'}>
          🎁 ${escapeHTML(r.texto)}${quando && r.resgatado ? ' ✅' : ''}
        </button>` : ''}
    </div>`;
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

  // v18.17: troféus já desbloqueados com recompensa ainda não resgatada
  // sobem pra uma seção própria no topo — senão ficam perdidos no meio da
  // grade completa (com 29 troféus, ficou fácil não notar um prêmio novo)
  const secaoPendentes = document.getElementById('conquistas-pendentes-secao');
  const listaPendentes = document.getElementById('conquistas-pendentes-lista');
  const pendentes = CONQUISTAS
    .filter(c => {
      const quando = desbloq[c.id];
      const r = STATE.recompensas[c.id];
      return quando && r && r.texto && r.texto.trim() && !r.resgatado;
    })
    .sort((a, b) => (desbloq[b.id] || 0) - (desbloq[a.id] || 0)); // mais recentes primeiro
  // v18.18: fix — os que sobem pro topo saem da grade completa lá embaixo,
  // senão o MESMO troféu aparecia 2x na tela (reportado pela Roberta)
  const idsPendentes = new Set(pendentes.map(c => c.id));

  if (secaoPendentes && listaPendentes) {
    if (pendentes.length > 0) {
      listaPendentes.innerHTML = pendentes.map(c => renderCartaoConquista(c, desbloq)).join('');
      secaoPendentes.classList.remove('oculto');
    } else {
      listaPendentes.innerHTML = '';
      secaoPendentes.classList.add('oculto');
    }
  }

  lista.innerHTML = CONQUISTAS
    .filter(c => !idsPendentes.has(c.id))
    .map(c => renderCartaoConquista(c, desbloq))
    .join('');
}

// v18.4: recompensa é fixa (definida pela Roberta) — a tela "Gerenciar
// recompensas" em Config foi removida. Tocar no card da recompensa já
// desbloqueada (tela Troféus) marca/desmarca como resgatada.
function _aoClicarResgatarConquista(e) {
  // v18.19: compartilhar troféu (ícone 📤 no card já desbloqueado)
  const btnShare = e.target.closest('[data-action="compartilhar"]');
  if (btnShare) {
    compartilharTrofeu(btnShare.dataset.id);
    return;
  }
  const btn = e.target.closest('[data-action="toggle-resgatado"]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!STATE.recompensas[id]) STATE.recompensas[id] = { texto: '', resgatado: false };
  STATE.recompensas[id].resgatado = !STATE.recompensas[id].resgatado;
  salvar();
  renderConquistas();
  mostrarToast(STATE.recompensas[id].resgatado ? '✅ Recompensa marcada como resgatada!' : '↩️ Desmarcada');
}
document.getElementById('conquistas-lista')?.addEventListener('click', _aoClicarResgatarConquista);
document.getElementById('conquistas-pendentes-lista')?.addEventListener('click', _aoClicarResgatarConquista); // v18.17

// v18.19: COMPARTILHAR TROFÉU — pq a Aline não consegue avisar a Roberta
// sozinha quando desbloqueia algo. Usa o menu nativo de compartilhar do
// celular (Web Share API); se o navegador não suportar, cai pra copiar o
// texto na área de transferência (e por último, um prompt manual).
async function compartilharTrofeu(conquistaId) {
  const c = CONQUISTAS.find(x => x.id === conquistaId);
  if (!c) return;
  const r = STATE.recompensas[conquistaId];
  const recompensaTexto = (r && r.texto && r.texto.trim()) ? `\n🎁 Recompensa: ${r.texto}` : '';
  const texto = `🏆 Troféu desbloqueado no DailyRealm: ${c.emoji} ${c.nome} — ${c.desc}!${recompensaTexto}`;

  if (navigator.share) {
    try {
      await navigator.share({ text: texto });
    } catch (e) {
      // cancelou o compartilhamento — comportamento normal, sem toast de erro
    }
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast('📋 Texto copiado! Cole no WhatsApp pra compartilhar.');
      return;
    } catch (e) {
      // segue pro fallback abaixo
    }
  }
  try { window.prompt('Copie o texto abaixo pra compartilhar:', texto); } catch (e) {}
}

// v18.10: botão em Config → Ajuda pra atualizar os textos das recompensas
// sem precisar de console do navegador — refaz o texto de cada troféu a
// partir de RECOMPENSAS_PADRAO (o que estiver definido no app.js "atual"),
// mas preserva os "Resgatado" já marcados
function restaurarRecompensasPadrao() {
  const ok = confirm('Isso vai atualizar o texto das recompensas dos troféus pros valores mais recentes. As marcações de "Resgatado" são mantidas. Continuar?');
  if (!ok) return;
  Object.keys(RECOMPENSAS_PADRAO).forEach(id => {
    const atual = STATE.recompensas[id];
    STATE.recompensas[id] = {
      texto: RECOMPENSAS_PADRAO[id].texto,
      resgatado: atual ? !!atual.resgatado : false
    };
  });
  salvar();
  renderConquistas();
  mostrarToast('🔄 Recompensas atualizadas!');
}

// ═══════════════════════════════════════════════
// AÇÕES DE QUEST
// ═══════════════════════════════════════════════
// U1: streak incrementa na 1ª quest concluída do dia
// (dia seguinte = +1; pulou dia = recomeça em 1)
function atualizarStreak() {
  const hoje = new Date().toDateString();
  if (STATE.player.ultimoDiaComQuest === hoje) return;
  const ontem = new Date(Date.now() - 864e5).toDateString();
  const anteontem = new Date(Date.now() - 2 * 864e5).toDateString();
  const consecutivo = STATE.player.ultimoDiaComQuest === ontem;

  // v18.15: streak com "perdão" — perdeu EXATAMENTE 1 dia (não consecutivo,
  // mas o último dia registrado foi anteontem) e ainda tem o congelamento
  // do mês disponível: a sequência é perdoada em vez de quebrar
  if (!consecutivo && STATE.player.ultimoDiaComQuest === anteontem && STATE.player.streak >= 1) {
    const mesAtual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    if (STATE.player.ultimoCongelamentoMes !== mesAtual) {
      STATE.player.ultimoCongelamentoMes = mesAtual;
      STATE.player.streak += 1;
      STATE.player.ultimoDiaComQuest = hoje;
      setTimeout(() => {
        mostrarToast('🛡️ Você perdeu 1 dia, mas usamos seu congelamento do mês — streak protegida!');
      }, 1200);
      return; // não é quebra de streak — pula a detecção de quebra abaixo
    }
  }

  // v18.14: guarda o momento em que uma streak de peso (>=3) quebrou, pra
  // detectar recuperação rápida — troféu secreto "Voltei Mais Forte"
  if (!consecutivo && STATE.player.ultimoDiaComQuest && STATE.player.streak >= 3) {
    STATE.player.streakQuebrouEm = Date.now();
  }

  STATE.player.streak = consecutivo ? STATE.player.streak + 1 : 1;
  STATE.player.ultimoDiaComQuest = hoje;

  // v18.14: streak reconstruída até >=3 dentro de 3 dias da quebra anterior
  if (STATE.player.streakQuebrouEm) {
    if (STATE.player.streak >= 3) {
      if (Date.now() - STATE.player.streakQuebrouEm <= 3 * 864e5) {
        STATE.player.recuperouStreak = true;
      }
      STATE.player.streakQuebrouEm = null; // consome a marca (sucesso ou não)
    } else if (Date.now() - STATE.player.streakQuebrouEm > 3 * 864e5) {
      STATE.player.streakQuebrouEm = null; // prazo esgotado, limpa a marca
    }
  }

  if (STATE.player.streak > 1) {
    setTimeout(() => {
      somStreak();
      mostrarToast(`🔥 Streak de ${STATE.player.streak} dias! Imparável!`);
    }, 1200);
  }
}

// v18.15: anti-farm por repetição — XP cai progressivamente se a MESMA
// quest (mesmo título, normalizado) for concluída várias vezes no mesmo
// dia. Evita criar "tomar água" 10x e ganhar XP de graça repetidamente.
const TABELA_ANTIFARM = [1, 0.5, 0.25, 0.1]; // 1ª=100%, 2ª=50%, 3ª=25%, 4ª em diante=10%
function calcularMultiplicadorAntiFarm(titulo) {
  const tituloNorm = (titulo || '').trim().toLowerCase();
  if (!tituloNorm) return 1;
  const agora = new Date();
  const inicioDia = new Date(agora); inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(agora); fimDia.setHours(23, 59, 59, 999);
  const jaConcluidasHoje = STATE.quests.filter(x =>
    x.done &&
    x.concluidoEm >= inicioDia.getTime() && x.concluidoEm <= fimDia.getTime() &&
    (x.titulo || '').trim().toLowerCase() === tituloNorm
  ).length;
  return TABELA_ANTIFARM[Math.min(jaConcluidasHoje, TABELA_ANTIFARM.length - 1)];
}

// v18.15: quest recorrente — spawna a próxima ocorrência (pendente) assim
// que a atual é concluída. Reaparece imediatamente em vez de esperar a
// data certa por simplicidade — se completar de novo no mesmo dia, o
// anti-farm acima já cuida de reduzir o XP, então não abre brecha.
function spawnarProximaOcorrencia(q) {
  if (!q.recorrente) return;
  STATE.quests.unshift({
    id: uid(),
    titulo: q.titulo,
    desc: q.desc,
    categoria: q.categoria,
    xp: q.xp,
    done: false,
    criadoEm: Date.now(),
    requerFoto: q.requerFoto,
    recorrente: q.recorrente
  });
}

function toggleQuest(id) {
  const q = STATE.quests.find(x => x.id === id);
  if (!q) return;
  // T1: quests com "requerFoto" não concluem direto — abrem a câmera de prova primeiro
  if (!q.done && q.requerFoto) {
    abrirEscolhaProva(id); // v18.21: pergunta câmera ou galeria antes de abrir o seletor
    return;
  }
  if (!q.done) {
    // v18.15: calcula o multiplicador ANTES de marcar como concluída
    // (senão ela contaria a si mesma na contagem de repetições do dia)
    const mult = calcularMultiplicadorAntiFarm(q.titulo);
    const xpConcedido = Math.max(1, Math.round(q.xp * mult));
    q.done = true;
    q.concluidoEm = Date.now();
    q.xpConcedido = xpConcedido; // guarda o XP realmente dado, pra reverter certo se desmarcar
    somConcluir();
    adicionarXP(xpConcedido);
    atualizarStreak();
    // T: contadores para conquistas
    STATE.player.totalConcluidas++;
    if (q.xp >= 100) STATE.player.epicasConcluidas++;
    atualizarFlagsConquistasContextuais(q); // v18.12: troféus temáticos secretos
    verificarConquistas();
    mostrarToast(mult < 1
      ? `✨ +${xpConcedido} XP (repetida hoje — XP reduzido)`
      : `✨ +${xpConcedido} XP conquistado!`);
    spawnarProximaOcorrencia(q); // v18.15: quests recorrentes
  } else {
    q.done = false;
    delete q.concluidoEm;
    removerXP(q.xpConcedido != null ? q.xpConcedido : q.xp); // B1/v18.15: reverte o XP realmente dado
    delete q.xpConcedido;
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

// v18.19: toast de troféu desbloqueado ganha um botão de compartilhar direto
// (o "botão informativo" que a Roberta pediu) — mesmo padrão do Desfazer
function mostrarToastConquista(msg, conquistaId) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'toast-share-btn';
  btn.textContent = '📤 Compartilhar';
  btn.onclick = () => {
    t.classList.remove('show');
    compartilharTrofeu(conquistaId);
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
// v18.22: ao tocar em "Por Foto", fecha essa modal e abre um popup pequeno
// perguntando Câmera ou Galeria (igual ao anexo do WhatsApp) — em vez de
// mostrar as 2 opções direto nessa tela. Ver abrirCameraFoto() pro motivo
// de precisarmos perguntar isso agora (Android/Chrome mudou o comportamento
// do seletor de arquivo).
function escolherFoto() {
  fecharEscolha();
  setTimeout(() => abrirEscolhaFonte(), 180); // mesmo padrão de escolherDigitar — deixa a modal anterior fechar antes de abrir a próxima
}
function abrirEscolhaFonte() {
  document.getElementById('modal-escolha-fonte')?.classList.add('active');
}
function fecharEscolhaFonte() {
  document.getElementById('modal-escolha-fonte')?.classList.remove('active');
}
function escolherFonteCamera() {
  // Correção: chamada síncrona (sem setTimeout). Celulares exigem que
  // input.click() ocorra no mesmo instante do toque do usuário — um
  // atraso, mesmo pequeno, faz o Android bloquear a câmera silenciosamente.
  fecharEscolhaFonte();
  abrirCameraFoto(true);
}
function escolherFonteGaleria() {
  fecharEscolhaFonte();
  abrirCameraFoto(false);
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

  STATE.modal.editandoId = null;

  const ativas = getCategoriasAtivas();
  if (ativas.length > 0) {
    STATE.modal.categoria = ativas[0].id;
  }
  STATE.modal.xp = 10;
  STATE.modal.requerFoto = false;
  STATE.modal.recorrente = null;

  renderCategoriaPicker();
  document.querySelectorAll('.diff-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.xp === '10'));
  const chkFoto = document.getElementById('quest-requer-foto');
  if (chkFoto) chkFoto.checked = false;
  const chkRepetir = document.getElementById('quest-repetir');
  if (chkRepetir) chkRepetir.checked = false;
  document.getElementById('quest-repetir-freq')?.classList.add('oculto');

  document.getElementById('modal-nova-quest-titulo').textContent = '✨ Nova Quest';
  document.getElementById('btn-salvar-quest').textContent = '⚔️ Criar Quest';
  document.getElementById('btn-excluir-quest-modal')?.classList.add('oculto');

  modal.classList.add('active');
  setTimeout(() => document.getElementById('quest-titulo')?.focus(), 100);
}

// v18.8: reabre o mesmo modal em modo edição — resolve tanto a
// descrição invisível quanto a impossibilidade de corrigir uma quest
// já criada (antes só dava pra concluir ou excluir, nunca editar)
function abrirEditarQuest(id) {
  const q = STATE.quests.find(x => x.id === id);
  const modal = document.getElementById('modal-nova-quest');
  if (!q || !modal) return;

  STATE.modal.editandoId = q.id;
  STATE.modal.categoria = q.categoria;
  STATE.modal.xp = q.xp;
  STATE.modal.requerFoto = !!q.requerFoto;
  STATE.modal.recorrente = q.recorrente || null;

  document.getElementById('quest-titulo').value = q.titulo;
  document.getElementById('quest-desc').value = q.desc || '';

  renderCategoriaPicker();
  document.querySelectorAll('.diff-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.xp, 10) === q.xp));
  const chkFoto = document.getElementById('quest-requer-foto');
  if (chkFoto) chkFoto.checked = !!q.requerFoto;
  const chkRepetir = document.getElementById('quest-repetir');
  const freqSelect = document.getElementById('quest-repetir-freq');
  if (chkRepetir) chkRepetir.checked = !!q.recorrente;
  if (freqSelect) {
    freqSelect.value = q.recorrente ? q.recorrente.frequencia : 'diaria';
    freqSelect.classList.toggle('oculto', !q.recorrente);
  }

  document.getElementById('modal-nova-quest-titulo').textContent = '✏️ Editar Quest';
  document.getElementById('btn-salvar-quest').textContent = '💾 Salvar Alterações';
  document.getElementById('btn-excluir-quest-modal')?.classList.remove('oculto');

  modal.classList.add('active');
  setTimeout(() => document.getElementById('quest-titulo')?.focus(), 100);
}

// v18.15: mostra/esconde o seletor de frequência junto com o toggle "Repetir"
function onToggleRepetirQuest(checked) {
  document.getElementById('quest-repetir-freq')?.classList.toggle('oculto', !checked);
}

function fecharNovaQuest() {
  const modal = document.getElementById('modal-nova-quest');
  if (!modal) return;
  modal.classList.remove('active');
  document.getElementById('form-nova-quest')?.reset();
  STATE.modal.editandoId = null;
}

async function criarQuest(e) {
  e.preventDefault();
  const titulo = document.getElementById('quest-titulo').value.trim();
  const desc   = document.getElementById('quest-desc').value.trim();
  if (!titulo) return;

  const chkFoto = document.getElementById('quest-requer-foto');
  let requerFoto = !!(chkFoto && chkFoto.checked); // T1: exige foto de prova pra concluir
  let xpFinal = STATE.modal.xp;
  const editandoId = STATE.modal.editandoId; // captura antes do await (modal pode fechar/reabrir durante a espera)

  // v18.15: quest recorrente — repete automaticamente ao ser concluída
  const chkRepetir = document.getElementById('quest-repetir');
  const freqSelect = document.getElementById('quest-repetir-freq');
  const recorrente = (chkRepetir && chkRepetir.checked)
    ? { frequencia: (freqSelect && freqSelect.value) || 'diaria' }
    : null;

  // v18.11: IA define o TETO de XP pela dificuldade real da tarefa —
  // só pode ficar nesse valor ou mais fácil do que o escolhido manualmente.
  const btnSalvar = document.getElementById('btn-salvar-quest');
  const rotuloOriginal = btnSalvar ? btnSalvar.textContent : '';
  if (btnSalvar) { btnSalvar.disabled = true; btnSalvar.textContent = '🤖 Avaliando dificuldade...'; }
  const ia = await classificarQuestIA(titulo, desc);
  if (btnSalvar) { btnSalvar.disabled = false; btnSalvar.textContent = rotuloOriginal; }

  // v18.13: o clamp vale MESMO offline (classificarQuestIA já devolve xp:10
  // nesse caso) — antes um Worker fora do ar deixava passar qualquer XP
  // escolhido sem travar em Fácil, reabrindo a brecha que isso existe pra fechar
  if (xpFinal > ia.xp) {
    xpFinal = ia.xp;
    mostrarToast(ia.offline
      ? '⚠️ Não consegui avaliar a dificuldade agora — classifiquei como Fácil por segurança'
      : `🤖 Reclassificada como ${XP_NOME_REVISAO[ia.xp] || 'Fácil'} (${ia.xp} XP) — dificuldade real da tarefa`);
  }
  if (xpFinal >= 50) requerFoto = true; // Difícil/Épica sempre exige foto de prova de verdade

  // v18.8: modo edição — atualiza a quest existente em vez de criar outra
  if (editandoId) {
    const q = STATE.quests.find(x => x.id === editandoId);
    if (q) {
      q.titulo = titulo;
      q.desc = desc;
      q.categoria = STATE.modal.categoria;
      q.xp = xpFinal;
      q.requerFoto = requerFoto;
      q.recorrente = recorrente;
    }
    salvar();
    renderQuests();
    fecharNovaQuest();
    mostrarToast('💾 Quest atualizada!');
    return;
  }

  STATE.quests.unshift({
    id: uid(),
    titulo,
    desc,
    categoria: STATE.modal.categoria,
    xp: xpFinal,
    done: false,
    criadoEm: Date.now(),
    requerFoto,
    recorrente
  });

  salvar();
  renderQuests();
  fecharNovaQuest();
  mostrarToast('⚔️ Nova quest criada!');
}

// v18.8: excluir direto pelo modal de edição (mesmo destino da lixeira do card)
function excluirQuestDoModal() {
  if (!STATE.modal.editandoId) return;
  const id = STATE.modal.editandoId;
  fecharNovaQuest();
  deletarQuest(id);
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
  if (action === 'editar') abrirEditarQuest(id);
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
// v18.21: recebe se deve FORÇAR a câmera (capture=environment) ou deixar
// livre pra escolher da galeria. Em Android/Chrome mais novos, um input
// sem "capture" abre direto o Photo Picker do sistema (só fotos salvas,
// sem opção de câmera) — por isso paramos de deixar o celular decidir e
// controlamos explicitamente qual das duas opções o input vai abrir.
function abrirCameraFoto(forcarCamera) {
  const input = document.getElementById('input-camera');
  if (!input) {
    mostrarToast('⚠️ Erro: input de câmera não encontrado');
    return;
  }
  if (forcarCamera) input.setAttribute('capture', 'environment');
  else input.removeAttribute('capture');
  STATE._modoFotoCamera = !!forcarCamera; // pra "tirar outra" lembrar o modo escolhido
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
function tirarOutraFoto() { sairModoCorte(); abrirCameraFoto(STATE._modoFotoCamera); }
function cancelarPreview() {
  sairModoCorte();
  fecharPreviewFoto();
  STATE.fotoAtual = null;
  const img = document.getElementById('preview-img');
  if (img) img.src = '';
  setTimeout(() => abrirEscolha(), 180);
}

// ═══════════════════════════════════════════════
// v18.5: CORTE DE FOTO — recorta a foto antes de mandar pro OCR.
// Útil quando o planner tem outras coisas escritas na página que não
// devem virar quest: cortando fora, sobra menos linha de ruído no OCR.
// ═══════════════════════════════════════════════
let _crop = null; // { container, rectEl, imgW, imgH, rect: {x,y,w,h}, modo }
const CROP_MIN = 40; // tamanho mínimo (px na tela) da área de corte

function _clampCorte(v, min, max) { return Math.max(min, Math.min(max, v)); }

function entrarModoCorte() {
  const img = document.getElementById('preview-img');
  const wrap = document.getElementById('preview-imagem-wrap');
  if (!img || !wrap || !img.naturalWidth) return;

  const imgRect = img.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();

  const container = document.createElement('div');
  container.className = 'crop-container';
  container.style.left = (imgRect.left - wrapRect.left) + 'px';
  container.style.top = (imgRect.top - wrapRect.top) + 'px';
  container.style.width = imgRect.width + 'px';
  container.style.height = imgRect.height + 'px';

  const rectEl = document.createElement('div');
  rectEl.className = 'crop-rect';
  ['nw', 'ne', 'sw', 'se'].forEach(pos => {
    const h = document.createElement('div');
    h.className = `crop-handle ${pos}`;
    h.dataset.handle = pos;
    rectEl.appendChild(h);
  });
  container.appendChild(rectEl);
  wrap.appendChild(container);

  const margemX = imgRect.width * 0.1;
  const margemY = imgRect.height * 0.1;

  _crop = {
    container,
    rectEl,
    imgW: imgRect.width,
    imgH: imgRect.height,
    rect: {
      x: margemX,
      y: margemY,
      w: imgRect.width - margemX * 2,
      h: imgRect.height - margemY * 2
    },
    modo: null
  };
  _atualizarRectCorte();

  rectEl.addEventListener('pointerdown', _onCropPointerDown);

  document.getElementById('acoes-normais-foto')?.classList.add('oculto');
  document.getElementById('btn-confirmar-foto')?.classList.add('oculto');
  document.getElementById('hint-corte')?.classList.remove('oculto');
  document.getElementById('acoes-corte-foto')?.classList.remove('oculto');
}

function _atualizarRectCorte() {
  if (!_crop) return;
  const { rectEl, rect } = _crop;
  rectEl.style.left = rect.x + 'px';
  rectEl.style.top = rect.y + 'px';
  rectEl.style.width = rect.w + 'px';
  rectEl.style.height = rect.h + 'px';
}

function _onCropPointerDown(e) {
  if (!_crop) return;
  const handle = e.target.closest('.crop-handle');
  _crop.modo = handle ? handle.dataset.handle : 'move';
  _crop.inicioX = e.clientX;
  _crop.inicioY = e.clientY;
  _crop.rectInicio = { ..._crop.rect };
  window.addEventListener('pointermove', _onCropPointerMove);
  window.addEventListener('pointerup', _onCropPointerUp);
  e.preventDefault();
}

function _onCropPointerMove(e) {
  if (!_crop || !_crop.modo) return;
  const dx = e.clientX - _crop.inicioX;
  const dy = e.clientY - _crop.inicioY;
  const r0 = _crop.rectInicio;
  let { x, y, w, h } = r0;

  if (_crop.modo === 'move') {
    x = _clampCorte(r0.x + dx, 0, _crop.imgW - r0.w);
    y = _clampCorte(r0.y + dy, 0, _crop.imgH - r0.h);
  } else {
    if (_crop.modo.includes('n')) {
      const novoY = _clampCorte(r0.y + dy, 0, r0.y + r0.h - CROP_MIN);
      h = r0.h - (novoY - r0.y);
      y = novoY;
    }
    if (_crop.modo.includes('s')) {
      h = _clampCorte(r0.h + dy, CROP_MIN, _crop.imgH - r0.y);
    }
    if (_crop.modo.includes('w')) {
      const novoX = _clampCorte(r0.x + dx, 0, r0.x + r0.w - CROP_MIN);
      w = r0.w - (novoX - r0.x);
      x = novoX;
    }
    if (_crop.modo.includes('e')) {
      w = _clampCorte(r0.w + dx, CROP_MIN, _crop.imgW - r0.x);
    }
  }

  _crop.rect = { x, y, w, h };
  _atualizarRectCorte();
}

function _onCropPointerUp() {
  if (_crop) _crop.modo = null;
  window.removeEventListener('pointermove', _onCropPointerMove);
  window.removeEventListener('pointerup', _onCropPointerUp);
}

function sairModoCorte() {
  if (!_crop) return;
  _crop.container.remove();
  _crop = null;
  document.getElementById('acoes-normais-foto')?.classList.remove('oculto');
  document.getElementById('btn-confirmar-foto')?.classList.remove('oculto');
  document.getElementById('hint-corte')?.classList.add('oculto');
  document.getElementById('acoes-corte-foto')?.classList.add('oculto');
}

function cancelarModoCorte() {
  sairModoCorte();
}

async function aplicarCorte() {
  if (!_crop) return;
  const img = document.getElementById('preview-img');
  const escala = img.naturalWidth / _crop.imgW;
  const sx = _crop.rect.x * escala;
  const sy = _crop.rect.y * escala;
  const sw = _crop.rect.w * escala;
  const sh = _crop.rect.h * escala;

  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(sw));
  cv.height = Math.max(1, Math.round(sh));
  cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
  const cortada = await comprimirImagem(cv.toDataURL('image/jpeg', 0.9));

  STATE.fotoAtual = cortada;
  img.src = cortada;

  sairModoCorte();
  mostrarToast('✂️ Foto cortada!');
}

// ═══════════════════════════════════════════════
// T1: FOTO DE PROVA (concluir quest marcada como "requerFoto")
// Fluxo separado do OCR: aqui a foto NÃO é enviada pra leitura de texto,
// só serve pra confirmar a conclusão (+bônus) e oferecer compartilhamento.
// ═══════════════════════════════════════════════
// v18.21: mesma escolha explícita câmera/galeria da criação por foto —
// ver comentário em abrirCameraFoto() sobre o Photo Picker do Android
function abrirEscolhaProva(questId) {
  STATE.provaQuestId = questId;
  document.getElementById('modal-escolha-prova')?.classList.add('active');
}
function fecharEscolhaProva() {
  document.getElementById('modal-escolha-prova')?.classList.remove('active');
}
function escolherProvaCamera() {
  fecharEscolhaProva();
  abrirCameraProva(STATE.provaQuestId, true);
}
function escolherProvaGaleria() {
  fecharEscolhaProva();
  abrirCameraProva(STATE.provaQuestId, false);
}

function abrirCameraProva(questId, forcarCamera) {
  STATE.provaQuestId = questId;
  const input = document.getElementById('input-camera-prova');
  if (!input) {
    mostrarToast('⚠️ Erro: câmera de prova não encontrada');
    return;
  }
  if (forcarCamera) input.setAttribute('capture', 'environment');
  else input.removeAttribute('capture');
  STATE._modoProvaCamera = !!forcarCamera; // pra "tirar outra" lembrar o modo escolhido
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

function tirarOutraFotoProva() { abrirCameraProva(STATE.provaQuestId, STATE._modoProvaCamera); }

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

  // v18.15: anti-farm — calcula ANTES de marcar como concluída
  const mult = calcularMultiplicadorAntiFarm(q.titulo);
  q.done = true;
  q.concluidoEm = Date.now();
  somConcluir();
  const xpTotal = Math.max(1, Math.round((q.xp + XP_BONUS_FOTO_PROVA) * mult));
  q.xpConcedido = xpTotal; // guarda o XP realmente dado (usado se algum dia precisar reverter)
  adicionarXP(xpTotal);
  atualizarStreak();
  STATE.player.totalConcluidas++;
  if (q.xp >= 100) STATE.player.epicasConcluidas++;
  // v18.9: contadores de conclusão COM prova real — usados pelos troféus
  // mais difíceis (Aventureira em diante e Caçadora de Épicas)
  STATE.player.comProvaConcluidas++;
  if (q.xp >= 100) STATE.player.epicasComProvaConcluidas++;
  atualizarFlagsConquistasContextuais(q); // v18.12: troféus temáticos secretos
  verificarConquistas();
  mostrarToast(mult < 1
    ? `✨ +${xpTotal} XP (prova enviada, repetida hoje) 📸`
    : `✨ +${xpTotal} XP (prova enviada)! 📸`);
  spawnarProximaOcorrencia(q); // v18.15: quests recorrentes

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
    // v18.6: usa os parágrafos do Worker OCR v3 (agrupamento visual do
    // Google Vision) quando disponíveis — reduz lembretes de 2-3 linhas
    // virando quests separadas. Se o Worker ainda não foi atualizado,
    // cai no parser por linha de sempre.
    const questsDetectadas = Array.isArray(resultado.paragrafos) && resultado.paragrafos.length > 0
      ? parsearParagrafosOCR(resultado.paragrafos)
      : parsearTextoOCR(textoBruto);
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

// v18.6: Worker OCR v3 agrupa por PARÁGRAFO (posição visual, não só
// quebra de linha) — resolve a maior parte dos casos de 1 lembrete
// escrito em 2-3 linhas virando quests separadas. Usado quando o
// Worker já foi atualizado; se não, cai no parser por linha de sempre.
function parsearParagrafosOCR(paragrafos) {
  let linhas = paragrafos.map(l => l.trim()).filter(l => l.length > 0);
  linhas = linhas.filter(linha => !ehLixo(linha));
  return linhasParaQuests(linhas);
}

function parsearTextoOCR(textoBruto) {
  let linhas = textoBruto.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
  linhas = linhas.filter(linha => !ehLixo(linha));
  linhas = juntarLinhasQuebradas(linhas);
  return linhasParaQuests(linhas);
}

function linhasParaQuests(linhas) {
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

// v18.6: encadeia quantas linhas forem necessárias (antes só juntava
// pares — um lembrete quebrado em 3 linhas virava 2 quests em vez de 1)
function juntarLinhasQuebradas(linhas) {
  const resultado = [];
  let atual = linhas[0];
  for (let i = 1; i <= linhas.length; i++) {
    const proxima = linhas[i];
    const podeContinuar = atual !== undefined && proxima &&
      /^[a-záéíóúâêôãõç]/.test(proxima) &&
      !/[.!?;:]$/.test(atual) &&
      atual.length < 40;
    if (podeContinuar) {
      atual = atual + ' ' + proxima;
    } else {
      if (atual !== undefined) resultado.push(atual);
      atual = proxima;
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
  _massaCatIdx = 0; // v18.7: recomeça o ciclo de "igualar categoria" a cada nova revisão
  renderRevisao();
  document.getElementById('tela-revisao').classList.add('active');
}

function cancelarRevisao() {
  document.getElementById('tela-revisao').classList.remove('active');
  QUESTS_REVISAO = [];
  STATE.fotoAtual = null;
}

// v18.7: tiers de XP/dificuldade também na revisão do OCR (igual à
// criação manual) — antes toda quest de foto saía fixa em 10 XP
const XP_TIERS_REVISAO = [10, 25, 50, 100];
const XP_EMOJI_REVISAO = { 10: '🟢', 25: '🟡', 50: '🔴', 100: '💎' };
const XP_NOME_REVISAO = { 10: 'Fácil', 25: 'Médio', 50: 'Difícil', 100: 'Épica' };

function renderRevisao() {
  const lista = document.getElementById('revisao-lista');
  const titulo = document.getElementById('revisao-titulo-txt');
  const btnConfirmar = document.getElementById('btn-confirmar-revisao');
  const btnMassaSelecionar = document.getElementById('btn-massa-selecionar');

  const ativas = QUESTS_REVISAO.filter(q => q.ativa).length;
  titulo.textContent = `✨ Encontrei ${QUESTS_REVISAO.length} quest${QUESTS_REVISAO.length === 1 ? '' : 's'}!`;
  btnConfirmar.textContent = ativas === 0 ? '⚔️ Criar quests' : `⚔️ Criar ${ativas} quest${ativas === 1 ? '' : 's'}`;
  btnConfirmar.disabled = ativas === 0;

  if (btnMassaSelecionar) {
    const todasAtivas = QUESTS_REVISAO.length > 0 && QUESTS_REVISAO.every(q => q.ativa);
    btnMassaSelecionar.textContent = todasAtivas ? '⬜ Desmarcar todas' : '☑️ Marcar todas';
  }

  if (QUESTS_REVISAO.length === 0) {
    lista.innerHTML = `<div class="revisao-vazio"><div class="revisao-vazio-icon">😕</div><p>Nenhuma tarefa identificada</p></div>`;
    return;
  }

  lista.innerHTML = QUESTS_REVISAO.map((q, i) => `
    <div class="revisao-card ${q.ativa ? '' : 'desativada'}" data-id="${escapeAttr(q.id)}">
      <div class="revisao-linha-1">
        <button class="revisao-check ${q.ativa ? 'ativa' : ''}" data-action="rev-toggle" data-id="${escapeAttr(q.id)}" aria-label="${q.ativa ? 'Desmarcar' : 'Marcar'}">
          ${q.ativa ? '✓' : ''}
        </button>
        <input type="text" class="revisao-texto" value="${escapeAttr(q.titulo)}"
               data-action="rev-edit" data-id="${escapeAttr(q.id)}"
               ${q.ativa ? '' : 'disabled'}>
        <button class="revisao-del" data-action="rev-del" data-id="${escapeAttr(q.id)}" title="Excluir" aria-label="Excluir">🗑️</button>
      </div>
      <div class="revisao-linha-2">
        <button class="revisao-cat-btn" data-action="rev-cat" data-id="${escapeAttr(q.id)}" title="Trocar categoria">
          ${escapeHTML(getEmojiCategoria(q.categoria))}
        </button>
        <button class="revisao-xp-btn" data-action="rev-xp" data-id="${escapeAttr(q.id)}" ${q._iaAvaliando ? 'disabled' : ''} title="${q._iaAvaliando ? 'Avaliando dificuldade...' : (XP_NOME_REVISAO[q.xp] || 'Fácil') + ' · +' + q.xp + ' XP'}">
          ${q._iaAvaliando ? '⏳' : (XP_EMOJI_REVISAO[q.xp] || '🟢')}
        </button>
        <button class="revisao-foto-btn ${q.requerFoto ? 'ativo' : ''}" data-action="rev-foto" data-id="${escapeAttr(q.id)}" title="Pedir foto de prova ao concluir (+5 XP)" aria-label="Pedir foto de prova ao concluir">
          📸
        </button>
        ${i < QUESTS_REVISAO.length - 1 ? `
          <button class="revisao-unir-btn" data-action="rev-unir" data-id="${escapeAttr(q.id)}" title="Unir esta linha com a próxima (mesmo lembrete quebrado em 2 linhas)">
            🔗 Unir com a próxima
          </button>` : ''}
      </div>
    </div>
  `).join('');
}

// v18.11: primeira vez que mexe no XP desta linha, busca o TETO da IA pra
// esta quest (cacheado em q._iaTeto). Só cacheia numa resposta real (não
// offline), pra que uma falha de rede não trave o item num teto errado —
// a próxima tentativa reavalia. O ciclo de XP nunca passa do teto.
async function trocarXPRevisao(id) {
  const q = QUESTS_REVISAO.find(x => x.id === id);
  if (!q || q._iaAvaliando) return;

  let teto = q._iaTeto;
  let eraOffline = false;

  if (teto === undefined) {
    q._iaAvaliando = true;
    renderRevisao();
    const ia = await classificarQuestIA(q.titulo, '');
    q._iaAvaliando = false;
    if (!ia.offline) {
      q._iaTeto = ia.xp;
      teto = ia.xp;
      if (ia.exigirFoto) q.requerFoto = true;
    } else {
      // v18.13: sem conseguir avaliar, trava em Fácil só nesta tentativa
      // (NÃO cacheia em q._iaTeto, pra próxima troca tentar de novo — mas
      // também não deixa o ciclo livre nesse meio tempo, senão reabre a
      // brecha que essa trava toda existe pra fechar)
      eraOffline = true;
      teto = 10;
    }
  }

  const tetoIdx = XP_TIERS_REVISAO.indexOf(teto);
  const tiersPermitidos = tetoIdx === -1 ? XP_TIERS_REVISAO : XP_TIERS_REVISAO.slice(0, tetoIdx + 1);

  const idxAtual = tiersPermitidos.indexOf(q.xp);
  q.xp = tiersPermitidos[idxAtual === -1 ? 0 : (idxAtual + 1) % tiersPermitidos.length];
  if (q.xp >= 50) q.requerFoto = true; // Difícil/Épica sempre exige foto de prova

  if (eraOffline) mostrarToast('⚠️ Não consegui avaliar agora — travado em Fácil até reconectar');
  renderRevisao();
}

// v18.7: ações em massa (topo da tela de revisão)
function alternarTodasRevisao() {
  if (QUESTS_REVISAO.length === 0) return;
  const todasAtivas = QUESTS_REVISAO.every(q => q.ativa);
  QUESTS_REVISAO.forEach(q => q.ativa = !todasAtivas);
  renderRevisao();
}

let _massaCatIdx = 0;
function aplicarCategoriaTodasRevisao() {
  const ativasCats = getCategoriasAtivas();
  const alvo = QUESTS_REVISAO.filter(q => q.ativa);
  if (ativasCats.length === 0 || alvo.length === 0) return;
  const cat = ativasCats[_massaCatIdx % ativasCats.length];
  _massaCatIdx++;
  alvo.forEach(q => q.categoria = cat.id);
  renderRevisao();
  mostrarToast(`🗂️ "${cat.nome}" aplicada em ${alvo.length} quest${alvo.length === 1 ? '' : 's'}`);
}

function alternarFotoTodasRevisao() {
  const alvo = QUESTS_REVISAO.filter(q => q.ativa);
  if (alvo.length === 0) return;
  const todasComFoto = alvo.every(q => q.requerFoto);
  alvo.forEach(q => q.requerFoto = !todasComFoto);
  renderRevisao();
  mostrarToast(todasComFoto ? '📸 Foto de prova desativada em todas' : '📸 Foto de prova ativada em todas');
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
  delete q._iaTeto; // v18.11: título mudou — teto antigo da IA não vale mais
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

// v18.6: junta manualmente esta linha com a próxima — pra quando o OCR
// separa 1 lembrete escrito em várias linhas em 2+ quests
function unirComProxima(id) {
  const idx = QUESTS_REVISAO.findIndex(q => q.id === id);
  if (idx === -1 || idx === QUESTS_REVISAO.length - 1) return;
  const atual = QUESTS_REVISAO[idx];
  const proxima = QUESTS_REVISAO[idx + 1];
  atual.titulo = capitalizarPrimeira(`${atual.titulo.trim()} ${proxima.titulo.trim()}`.trim());
  delete atual._iaTeto; // v18.11: texto mudou — reavalia teto na próxima troca de XP
  QUESTS_REVISAO.splice(idx + 1, 1);
  renderRevisao();
  mostrarToast('🔗 Linhas unidas!');
}

// Delegação na revisão
document.getElementById('revisao-lista')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'rev-toggle') toggleRevisao(id);
  if (action === 'rev-cat') trocarCategoriaRevisao(id);
  if (action === 'rev-xp') trocarXPRevisao(id);
  if (action === 'rev-foto') toggleFotoRevisao(id);
  if (action === 'rev-del') excluirRevisao(id);
  if (action === 'rev-unir') unirComProxima(id);
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
  const notif = document.getElementById('config-notificacoes');
  if (sons)  sons.checked  = STATE.config.sons;
  if (notif) notif.checked = STATE.config.notificacoes && (window.Notification?.permission === 'granted');

  // v18: 2 horários por período (manha1/manha2/tarde1/tarde2/noite1/noite2)
  ['manha1', 'manha2', 'tarde1', 'tarde2', 'noite1', 'noite2'].forEach(k => {
    const el = document.getElementById('hora-' + k);
    if (el) el.value = STATE.config.horarios[k] || '';
  });

  const insist = document.getElementById('config-insistir');
  if (insist) insist.value = STATE.config.insistirHoras;

  const inputFrase = document.getElementById('config-frase-backup');
  if (inputFrase) inputFrase.value = STATE.config.fraseBackup || '';
  atualizarStatusBackupUI();

  renderCategoriasConfig();
}

// v18.12: define/atualiza a frase de backup+sincronização
function salvarFraseBackup() {
  const input = document.getElementById('config-frase-backup');
  const frase = (input?.value || '').trim();
  if (frase && frase.length < 4) {
    mostrarToast('⚠️ Use pelo menos 4 caracteres na frase');
    return;
  }
  const mudou = frase !== (STATE.config.fraseBackup || '');
  STATE.config.fraseBackup = frase;
  salvar();
  atualizarStatusBackupUI();
  if (mudou && frase) {
    mostrarToast('☁️ Frase salva! Sincronizando...');
    sincronizarComNuvem({ silencioso: false });
  } else if (mudou && !frase) {
    mostrarToast('⚪ Backup desativado');
  }
}

function atualizarStatusBackupUI() {
  const el = document.getElementById('config-backup-status');
  if (!el) return;
  el.textContent = (STATE.config.fraseBackup || '').trim()
    ? '✅ Backup automático ativo'
    : '⚪ Backup desativado — defina uma frase pra ativar';
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

        // v18.3: força checagem imediata no registro — o Chrome só
        // reverifica sozinho a cada ~24h, o que fazia demorar demais
        // pra a "Nova versão disponível" aparecer depois de um deploy
        reg.update();

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

    // v18.3: revalida sempre que o app volta pro primeiro plano
    // (ex.: reabrir pelo ícone) — sem isso, o app podia ficar "preso"
    // numa versão antiga por até 24h mesmo reabrindo várias vezes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && swRegistration) {
        swRegistration.update();
      }
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

// v18.12: se já tem frase de backup configurada nesse aparelho, sincroniza
// com a nuvem antes de seguir — é isso que dá o efeito de "espelhar" entre
// tablet e celular (aplicarDadosRemotos re-renderiza tudo sozinha se trouxer
// dados mais novos). Silencioso — não é pra incomodar toda vez que abre o app.
if (!onboardingAtivo) {
  sincronizarComNuvem({ silencioso: true });
}

renderStats();
renderFiltrosCategorias();
renderQuests();
renderConfig();
renderConquistas();
verificarConquistas(); // T: desbloqueia retroativas (ex.: backfill de perfil antigo)

if (!onboardingAtivo) {
  processarShortcuts();
  if (!STATE.config.tutorialVisto) {
    // v18: quem já usava o app antes do tutorial existir também vê 1x
    setTimeout(() => abrirTutorial(true), 700);
  } else if (STATE.config.tutorialVersaoVista !== TUTORIAL_VERSAO) {
    // v18.16: já viu o tutorial, mas o conteúdo mudou — reabre 1x pra
    // mostrar as novidades. Não é "primeira vez" (abrirTutorial(false)),
    // então não dispara de novo o pedido de permissão de notificação.
    setTimeout(() => abrirTutorial(false), 700);
  }
}

// 🔔 Lembretes: checa ao abrir e a cada minuto com o app aberto
verificarLembretes();
setInterval(verificarLembretes, 60000);

// 🎂 v18.19: Data Especial — mesma cadência, mas só reprocessa 1x/dia (guard interno)
verificarDatasEspeciais();
verificarConquistas();
setInterval(() => { verificarDatasEspeciais(); verificarConquistas(); }, 60000);

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
