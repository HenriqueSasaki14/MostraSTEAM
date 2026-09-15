/* ============================================================
   RetroNet — animação de abertura da home
   ------------------------------------------------------------
   Tela preta, um terminal digitando a frase de abertura caractere
   por caractere e, ao fundo, lampejos das oito estéticas do site
   — verde militar, azul 8 bits, bege, magenta, azul das redes,
   azul iOS, verde flat, roxo — como se a tela atravessasse as
   décadas em segundos, até estabilizar no fundo escuro padrão.

   O visitante pode pular a qualquer momento: clique, toque ou
   qualquer tecla. Quem pediu menos movimento não vê a animação.
   ============================================================ */

(function () {
  "use strict";

  var R = (window.RetroNet = window.RetroNet || {});

  var FRASE = "Dois séculos de computação em oito etapas";
  var MS_POR_CARACTERE = 46;
  var PAUSA_FINAL = 620; // cursor piscando antes de revelar a home
  var ANO_INICIAL = 1804; // o tear de Jacquard
  var ANO_FINAL = 2026;

  function iniciar() {
    var abertura = document.querySelector(".abertura");
    if (!abertura) return;

    var saida = document.querySelector(".abertura__texto");
    var resto = document.querySelector(".abertura__resto");
    var lampejo = document.querySelector(".abertura__lampejo");
    var ano = document.querySelector(".abertura__ano");
    var menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

    var temporizadores = [];
    var encerrada = false;

    /* O que ainda não foi digitado fica no DOM, invisível, ocupando
       o próprio espaço. Sem isso a frase recalcula a quebra de linha
       a cada caractere e o bloco de texto pula na tela. */
    resto.textContent = FRASE;

    function encerrar(porTeclado) {
      if (encerrada) return;
      encerrada = true;

      temporizadores.forEach(clearTimeout);
      document.removeEventListener("keydown", pularComTeclado);
      abertura.removeEventListener("click", pularComMouse);

      abertura.classList.add("abertura--saindo");
      window.setTimeout(function () {
        abertura.remove();
      }, 600);

      /* Só leva o foco para o botão quem chegou aqui pelo teclado:
         para quem usa mouse, um anel de foco surgindo sozinho na
         home é ruído visual. */
      if (porTeclado) {
        var botao = document.querySelector(".botao--principal");
        if (botao) botao.focus({ preventScroll: true });
      }
    }

    function pularComTeclado() {
      encerrar(true);
    }

    function pularComMouse() {
      encerrar(false);
    }

    /* Sem animação para quem pediu menos movimento: a home
       aparece direto no estado final. */
    if (menosMovimento.matches) {
      abertura.remove();
      return;
    }

    document.addEventListener("keydown", pularComTeclado);
    abertura.addEventListener("click", pularComMouse);

    var total = FRASE.length;
    var cores = (R.FASES || []).map(function (fase) {
      return fase.cor;
    });

    for (var i = 1; i <= total; i++) {
      (function (posicao) {
        temporizadores.push(
          window.setTimeout(function () {
            saida.textContent = FRASE.slice(0, posicao);
            resto.textContent = FRASE.slice(posicao);

            var progresso = posicao / total;
            ano.textContent = Math.round(
              ANO_INICIAL + (ANO_FINAL - ANO_INICIAL) * progresso
            );

            /* Um estalo de máquina de escrever por caractere,
               pulando os espaços para não virar metralhadora. */
            if (FRASE[posicao - 1] !== " ") R.som.tocar("tecla");

            /* Oito lampejos distribuídos ao longo da digitação,
               na ordem cronológica das fases. */
            var faseDoLampejo = Math.floor(progresso * cores.length);
            if (
              cores[faseDoLampejo] &&
              lampejo.dataset.ultima !== String(faseDoLampejo)
            ) {
              lampejo.dataset.ultima = String(faseDoLampejo);
              lampejo.style.setProperty("--cor-lampejo", cores[faseDoLampejo]);
              lampejo.classList.remove("abertura__lampejo--aceso");
              void lampejo.offsetWidth; // reinicia a animação
              lampejo.classList.add("abertura__lampejo--aceso");
            }
          }, posicao * MS_POR_CARACTERE)
        );
      })(i);
    }

    temporizadores.push(
      window.setTimeout(function () {
        encerrar(false);
      }, total * MS_POR_CARACTERE + PAUSA_FINAL)
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
