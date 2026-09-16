/* ============================================================
   RetroNet — Fase 7: empacote uma vez, rode em qualquer lugar
   ------------------------------------------------------------
   Micro-interação: o visitante compara dois jeitos de colocar um
   aplicativo para rodar em três ambientes diferentes — notebook
   pessoal, servidor da empresa e nuvem.

   ANTES dos containers, cada ambiente precisa da própria
   configuração manual, e é comum um deles falhar por causa de uma
   versão incompatível — a dor real que motivou o Docker (2013) e
   o Kubernetes, que o Google abriu o código em 2014.

   DEPOIS, o visitante arrasta o aplicativo para dentro de um
   container e implanta uma vez só: o mesmo pacote sobe igual nos
   três ambientes, porque o container leva junto tudo de que o
   aplicativo precisa para rodar.
   ============================================================ */

(function () {
  "use strict";

  var R = window.RetroNet;

  var AMBIENTES = [
    { id: "notebook", nome: "Notebook pessoal" },
    { id: "servidor", nome: "Servidor da empresa" },
    { id: "nuvem", nome: "Nuvem" },
  ];

  /* No modo "antes", o servidor da empresa falha na primeira
     tentativa — a dor de "funciona na minha máquina" que o
     container resolve. Não é aleatório, para o teste (e a
     demonstração) serem sempre repetíveis. */
  var AMBIENTE_QUE_FALHA = "servidor";

  var ICONE_APP =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="4" width="24" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 12h10M11 16h10M11 20h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  var ICONE_NOTEBOOK =
    '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="7" width="20" height="13" rx="1.5"/><path d="M3 25h26l-2-3H5z" stroke-linejoin="round"/></svg>';
  var ICONE_SERVIDOR =
    '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="5" width="20" height="8" rx="1.5"/><rect x="6" y="19" width="20" height="8" rx="1.5"/><circle cx="10" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="23" r="1" fill="currentColor" stroke="none"/></svg>';
  var ICONE_NUVEM =
    '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 22a5 5 0 01-1-9.9A6.5 6.5 0 0121 10a5 5 0 013 9.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 22h16" stroke-linecap="round"/></svg>';

  var ICONES_AMBIENTE = { notebook: ICONE_NOTEBOOK, servidor: ICONE_SERVIDOR, nuvem: ICONE_NUVEM };

  var modoAtual = "depois";
  var appNoContentor = false;
  var arrastando = null;
  var elFantasma = null;
  var estados = {}; /* id do ambiente -> 'parado'|'configurando'|'rodando'|'erro' */

  var elBlocoApp, elContentor, elAmbientes, elBotaoImplantar, elExplicacao;

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ==========================================================
     Montagem
     ========================================================== */

  function montarAmbientes() {
    elAmbientes.innerHTML = AMBIENTES.map(function (a) {
      return (
        '<div class="ambiente" data-ambiente="' +
        a.id +
        '">' +
        '<span class="ambiente__icone">' +
        ICONES_AMBIENTE[a.id] +
        "</span>" +
        '<span class="ambiente__nome">' +
        esc(a.nome) +
        "</span>" +
        '<span class="ambiente__estado" data-estado>Parado</span>' +
        (modoAtual === "antes"
          ? '<button type="button" class="botao7" data-configurar="' +
            a.id +
            '">Configurar</button>'
          : "") +
        "</div>"
      );
    }).join("");
  }

  function reiniciarEstados() {
    estados = {};
    AMBIENTES.forEach(function (a) {
      estados[a.id] = "parado";
    });
  }

  function renderizarEstados() {
    AMBIENTES.forEach(function (a) {
      var cartao = elAmbientes.querySelector('[data-ambiente="' + a.id + '"]');
      if (!cartao) return;
      var estado = estados[a.id];
      cartao.classList.toggle("ambiente--rodando", estado === "rodando");
      cartao.classList.toggle("ambiente--erro", estado === "erro");
      var rotulos = {
        parado: "Parado",
        configurando: "Configurando…",
        rodando: "✓ Rodando",
        erro: "✗ Versão incompatível",
      };
      cartao.querySelector("[data-estado]").textContent = rotulos[estado];
    });

    var todosRodando = AMBIENTES.every(function (a) {
      return estados[a.id] === "rodando";
    });
    elExplicacao.hidden = !todosRodando;
  }

  /* ==========================================================
     Modo "antes" — configuração manual, uma a uma
     ========================================================== */

  function configurarManualmente(id) {
    if (estados[id] === "configurando" || estados[id] === "rodando") return;
    estados[id] = "configurando";
    renderizarEstados();
    R.som.tocar("tecla");

    window.setTimeout(function () {
      var falha = id === AMBIENTE_QUE_FALHA && !estados[id + "-corrigido"];
      if (falha) {
        estados[id] = "erro";
        estados[id + "-corrigido"] = true; /* na próxima, deixa passar */
        R.som.tocar("tecla");
      } else {
        estados[id] = "rodando";
        R.som.tocar("confirmar");
      }
      renderizarEstados();
    }, 700);
  }

  /* ==========================================================
     Modo "depois" — arrastar para o container, implantar uma vez
     ========================================================== */

  function iniciarArrastoApp(ev) {
    if (appNoContentor) return;
    ev.preventDefault();
    arrastando = { x: ev.clientX, y: ev.clientY };

    elFantasma = document.createElement("div");
    elFantasma.className = "app-fantasma";
    elFantasma.innerHTML = ICONE_APP;
    document.body.appendChild(elFantasma);
    moverFantasma(ev);

    document.addEventListener("pointermove", moverArrastoApp);
    document.addEventListener("pointerup", soltarArrastoApp);
  }

  function moverFantasma(ev) {
    if (!elFantasma) return;
    elFantasma.style.left = ev.clientX + "px";
    elFantasma.style.top = ev.clientY + "px";

    var alvo = elContentor.getBoundingClientRect();
    var dentro =
      ev.clientX >= alvo.left &&
      ev.clientX <= alvo.right &&
      ev.clientY >= alvo.top &&
      ev.clientY <= alvo.bottom;
    elContentor.classList.toggle("contentor--alvo", dentro);
  }

  function moverArrastoApp(ev) {
    moverFantasma(ev);
  }

  function soltarArrastoApp(ev) {
    document.removeEventListener("pointermove", moverArrastoApp);
    document.removeEventListener("pointerup", soltarArrastoApp);

    var alvo = elContentor.getBoundingClientRect();
    var dentro =
      ev.clientX >= alvo.left &&
      ev.clientX <= alvo.right &&
      ev.clientY >= alvo.top &&
      ev.clientY <= alvo.bottom;

    if (elFantasma) {
      elFantasma.remove();
      elFantasma = null;
    }
    elContentor.classList.remove("contentor--alvo");

    if (dentro) {
      colocarAppNoContentor();
    }
    arrastando = null;
  }

  function colocarAppNoContentor() {
    if (appNoContentor) return;
    appNoContentor = true;
    elBlocoApp.classList.add("bloco-app--dentro");
    elContentor.querySelector(".contentor__app").innerHTML = ICONE_APP;
    elBotaoImplantar.disabled = false;
    R.som.tocar("confirmar");
  }

  function implantar() {
    if (!appNoContentor) return;
    AMBIENTES.forEach(function (a, i) {
      window.setTimeout(function () {
        estados[a.id] = "rodando";
        renderizarEstados();
        R.som.tocar("tecla");
      }, i * 260);
    });
    elBotaoImplantar.disabled = true;
  }

  /* ==========================================================
     Alternância antes / depois
     ========================================================== */

  function trocarModo(modo) {
    modoAtual = modo;
    document.querySelectorAll(".chave-epoca7 button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.modo === modo ? "true" : "false");
    });
    document.querySelector('[data-bloco="antes"]').hidden = modo !== "antes";
    document.querySelector('[data-bloco="depois"]').hidden = modo !== "depois";
    reiniciar();
  }

  /* ==========================================================
     Reinício
     ========================================================== */

  function reiniciar() {
    appNoContentor = false;
    reiniciarEstados();
    if (elBlocoApp) elBlocoApp.classList.remove("bloco-app--dentro");
    if (elContentor) elContentor.querySelector(".contentor__app").innerHTML = "";
    if (elBotaoImplantar) elBotaoImplantar.disabled = true;
    montarAmbientes();
    renderizarEstados();
  }

  /* ==========================================================
     Início
     ========================================================== */

  function iniciar() {
    elBlocoApp = document.querySelector(".bloco-app");
    elContentor = document.querySelector(".contentor");
    elAmbientes = document.querySelector(".ambientes");
    elBotaoImplantar = document.querySelector("[data-implantar]");
    elExplicacao = document.querySelector(".explicacao7");
    if (!elAmbientes) return;

    document.querySelectorAll(".chave-epoca7 button").forEach(function (b) {
      b.addEventListener("click", function () {
        trocarModo(b.dataset.modo);
      });
    });

    if (elBlocoApp) {
      elBlocoApp.addEventListener("pointerdown", iniciarArrastoApp);
      /* clique simples também funciona, para quem não conseguir
         arrastar com precisão numa tela de toque. */
      elBlocoApp.addEventListener("click", function () {
        if (!arrastando) colocarAppNoContentor();
      });
    }
    if (elBotaoImplantar) elBotaoImplantar.addEventListener("click", implantar);

    elAmbientes.addEventListener("click", function (ev) {
      var botao = ev.target.closest("[data-configurar]");
      if (botao) configurarManualmente(botao.dataset.configurar);
    });

    var elBotaoReiniciar = document.querySelector("[data-reiniciar]");
    if (elBotaoReiniciar) elBotaoReiniciar.addEventListener("click", reiniciar);

    trocarModo("depois");

    R.inatividade.aoReiniciar(reiniciar);
    R.inatividade.iniciar(90);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
