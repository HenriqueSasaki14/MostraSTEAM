/* ============================================================
   RetroNet — som
   ------------------------------------------------------------
   Todos os efeitos são sintetizados na hora com a Web Audio API.
   Não existe nenhum arquivo .mp3 ou .wav no projeto: o site roda
   offline e queremos que ele continue leve.

   O som começa DESLIGADO. São oito estações numa amostra, e uma
   página que apita sozinha ao abrir vira barulho. Além disso, o
   navegador bloqueia áudio antes do primeiro clique do visitante,
   então ligar por padrão nem funcionaria de forma confiável.

   Como o site não usa nenhum tipo de armazenamento, o estado do
   som viaja pela URL (?som=1). Quem liga o som na fase 1 continua
   com ele ligado na fase 2 — quem chega pelo link direto começa
   no silêncio.
   ============================================================ */

window.RetroNet = window.RetroNet || {};

window.RetroNet.som = (function () {
  var contexto = null;
  var ativo = false;
  var ouvintes = [];

  /* O AudioContext só pode ser criado depois de um gesto do
     visitante, senão o navegador o deixa suspenso. */
  function pegarContexto() {
    if (!contexto) {
      var Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) return null;
      contexto = new Contexto();
    }
    if (contexto.state === "suspended") contexto.resume();
    return contexto;
  }

  /* Envelope curto: sobe rápido e cai, para não estourar nem
     deixar estalo no fim. */
  function envelope(ganho, agora, pico, ataque, queda) {
    ganho.gain.setValueAtTime(0.0001, agora);
    ganho.gain.exponentialRampToValueAtTime(pico, agora + ataque);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + ataque + queda);
  }

  /* Ruído branco curto, base dos sons mecânicos (tecla, fita). */
  function ruido(ctx, duracao) {
    var quadros = Math.max(1, Math.floor(ctx.sampleRate * duracao));
    var buffer = ctx.createBuffer(1, quadros, ctx.sampleRate);
    var dados = buffer.getChannelData(0);
    for (var i = 0; i < quadros; i++) dados[i] = Math.random() * 2 - 1;
    var fonte = ctx.createBufferSource();
    fonte.buffer = buffer;
    return fonte;
  }

  var efeitos = {
    /* Batida de máquina de escrever: estalo seco e curto. */
    tecla: function (ctx) {
      var agora = ctx.currentTime;
      var fonte = ruido(ctx, 0.05);
      var filtro = ctx.createBiquadFilter();
      filtro.type = "bandpass";
      filtro.frequency.value = 1800 + Math.random() * 700;
      filtro.Q.value = 1.4;
      var ganho = ctx.createGain();
      envelope(ganho, agora, 0.14, 0.001, 0.045);
      fonte.connect(filtro).connect(ganho).connect(ctx.destination);
      fonte.start(agora);
      fonte.stop(agora + 0.06);
    },

    /* Confirmação: dois tons curtos subindo. */
    confirmar: function (ctx) {
      var agora = ctx.currentTime;
      [660, 990].forEach(function (hz, i) {
        var osc = ctx.createOscillator();
        var ganho = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = hz;
        envelope(ganho, agora + i * 0.075, 0.05, 0.005, 0.07);
        osc.connect(ganho).connect(ctx.destination);
        osc.start(agora + i * 0.075);
        osc.stop(agora + i * 0.075 + 0.1);
      });
    },

    /* Travessia entre fases: varredura descendente, como uma
       fita passando rápido. */
    travessia: function (ctx) {
      var agora = ctx.currentTime;
      var fonte = ruido(ctx, 0.5);
      var filtro = ctx.createBiquadFilter();
      filtro.type = "bandpass";
      filtro.Q.value = 3;
      filtro.frequency.setValueAtTime(2400, agora);
      filtro.frequency.exponentialRampToValueAtTime(320, agora + 0.42);
      var ganho = ctx.createGain();
      envelope(ganho, agora, 0.1, 0.03, 0.4);
      fonte.connect(filtro).connect(ganho).connect(ctx.destination);
      fonte.start(agora);
      fonte.stop(agora + 0.5);
    },
  };

  function avisar() {
    ouvintes.forEach(function (fn) {
      fn(ativo);
    });
  }

  return {
    /* Liga/desliga. Devolve o novo estado. */
    alternar: function () {
      ativo = !ativo;
      if (ativo) {
        pegarContexto();
        this.tocar("confirmar");
      }
      avisar();
      return ativo;
    },

    definir: function (novoEstado) {
      ativo = !!novoEstado;
      avisar();
    },

    estaAtivo: function () {
      return ativo;
    },

    /* Avisa a moldura quando o estado muda, para o botão do
       cabeçalho se redesenhar. */
    aoMudar: function (fn) {
      ouvintes.push(fn);
    },

    tocar: function (nome) {
      if (!ativo || !efeitos[nome]) return;
      var ctx = pegarContexto();
      if (!ctx) return;
      try {
        efeitos[nome](ctx);
      } catch (erro) {
        /* Áudio nunca pode derrubar a página na hora da amostra. */
        console.warn("RetroNet: falha ao tocar o som", nome, erro);
      }
    },
  };
})();
