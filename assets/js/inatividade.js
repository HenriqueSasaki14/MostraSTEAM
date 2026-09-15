/* ============================================================
   RetroNet — reinício automático por inatividade (RF16)
   ------------------------------------------------------------
   Na amostra, o visitante sai do notebook no meio da visita e o
   próximo chega e encontra a tela do anterior. Este módulo devolve
   a página ao estado inicial depois de um tempo sem uso.

   Na etapa 1 ele está ligado só na home, que reinicia recarregando
   a página (e assim a animação de abertura roda de novo para o
   próximo visitante). As fases vão registrar aqui as próprias
   funções de reinício — cada atividade sabe como voltar ao zero
   sem recarregar, o que é mais rápido e não perde o som ligado.

   Uso nas fases:
     RetroNet.inatividade.aoReiniciar(function () {  ...  });
     RetroNet.inatividade.iniciar(90);   // segundos
   ============================================================ */

(function () {
  "use strict";

  var R = (window.RetroNet = window.RetroNet || {});

  var SEGUNDOS_PADRAO = 180;
  var EVENTOS = [
    "pointerdown",
    "keydown",
    "wheel",
    "touchstart",
    "mousemove",
  ];

  var relogio = null;
  var limiteMs = SEGUNDOS_PADRAO * 1000;
  var reinicios = [];
  var ligado = false;

  function reiniciar() {
    if (reinicios.length) {
      /* As fases cuidam do próprio reinício. */
      reinicios.forEach(function (fn) {
        try {
          fn();
        } catch (erro) {
          console.warn("RetroNet: falha ao reiniciar a atividade", erro);
        }
      });
      adiar();
      return;
    }
    /* Sem função registrada, recarrega a página. */
    window.location.reload();
  }

  function adiar() {
    window.clearTimeout(relogio);
    relogio = window.setTimeout(reiniciar, limiteMs);
  }

  R.inatividade = {
    /* Registra o que fazer quando o tempo estourar. Pode ser
       chamado mais de uma vez: todas as funções rodam. */
    aoReiniciar: function (fn) {
      if (typeof fn === "function") reinicios.push(fn);
    },

    iniciar: function (segundos) {
      limiteMs = (segundos || SEGUNDOS_PADRAO) * 1000;
      if (!ligado) {
        ligado = true;
        EVENTOS.forEach(function (evento) {
          document.addEventListener(evento, adiar, { passive: true });
        });
      }
      adiar();
    },

    parar: function () {
      window.clearTimeout(relogio);
      EVENTOS.forEach(function (evento) {
        document.removeEventListener(evento, adiar);
      });
      ligado = false;
    },
  };

  /* A home se reinicia sozinha. As fases chamam iniciar() quando
     a atividade delas estiver pronta. */
  if (!document.documentElement.dataset.fase) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        R.inatividade.iniciar(SEGUNDOS_PADRAO);
      });
    } else {
      R.inatividade.iniciar(SEGUNDOS_PADRAO);
    }
  }
})();
