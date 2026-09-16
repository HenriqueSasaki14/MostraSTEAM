/* ============================================================
   RetroNet — Fase 6: tela inicial
   ------------------------------------------------------------
   Micro-interação: o visitante arrasta ícones para reorganizar a
   tela inicial de um celular simulado — o mesmo gesto de segurar
   e mover que existe desde o primeiro iPhone — e compara o
   acabamento skeuomórfico de 2007 com o flat design de hoje.

   Os ícones e os apps são os mesmos nos dois modos: o que muda é
   só o tratamento visual, que é exatamente o ponto da atividade.
   ============================================================ */

(function () {
  "use strict";

  var R = window.RetroNet;

  /* Ícones em SVG inline, com a cor de vidro de cada app de 2007. */
  var APPS = [
    { id: "telefone", nome: "Telefone", cor: "#3fce4f", doca: true,
      glifo: '<path d="M7 4c1 3 2 5 4 6-1 2-1 3 0 4 2 2 6 5 8 6 1-1 2-1 4 0l2 2c-2 3-6 3-9 1-5-3-9-8-11-13-1-3 0-5 2-6z" fill="#fff"/>' },
    { id: "safari", nome: "Safari", cor: "#4a9fe0", doca: true,
      glifo: '<circle cx="16" cy="16" r="11" fill="#fff"/><path d="M22 10l-9 4-4 9 9-4z" fill="#e0483c"/>' },
    { id: "mail", nome: "Mail", cor: "#8fb4de", doca: true,
      glifo: '<rect x="5" y="9" width="22" height="15" rx="2" fill="#fff"/><path d="M6 10l10 8 10-8" stroke="#4a6b8f" stroke-width="2" fill="none"/>' },
    { id: "musica", nome: "Música", cor: "#e04f8f", doca: true,
      glifo: '<circle cx="12" cy="23" r="3.4" fill="#fff"/><circle cx="23" cy="21" r="3.4" fill="#fff"/><path d="M15.4 23V8l11-2.4V19" stroke="#fff" stroke-width="2.2" fill="none"/>' },
    { id: "mensagens", nome: "Mensagens", cor: "#5fce56",
      glifo: '<path d="M5 8h22v13H13l-5 5v-5H5z" fill="#fff"/><circle cx="12" cy="14.5" r="1.6" fill="#5fce56"/><circle cx="16" cy="14.5" r="1.6" fill="#5fce56"/><circle cx="20" cy="14.5" r="1.6" fill="#5fce56"/>' },
    { id: "mapas", nome: "Mapas", cor: "#9fce5a",
      glifo: '<path d="M6 8l7-2 6 2 7-2v18l-7 2-6-2-7 2z" fill="#fff"/><path d="M13 6v18M19 8v18" stroke="#9fce5a" stroke-width="1.6"/><circle cx="16" cy="14" r="2.6" fill="#e0483c"/>' },
    { id: "camera", nome: "Câmera", cor: "#4a4f57",
      glifo: '<rect x="4" y="10" width="24" height="15" rx="2" fill="#fff"/><rect x="11" y="6" width="10" height="5" rx="1" fill="#fff"/><circle cx="16" cy="18" r="5" fill="#4a4f57"/>' },
    { id: "appstore", nome: "App Store", cor: "#4f7fe0",
      glifo: '<path d="M16 5l3.6 7.4 8 1.2-5.8 5.8 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.8 8-1.2z" fill="#fff"/>' },
  ];

  var elTela, elGrade, elDoca;
  var arrastando = null;
  var elFantasma = null;

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function criarIcone(app) {
    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "icone6";
    botao.dataset.id = app.id;
    botao.setAttribute("aria-label", app.nome + ". Segure e arraste para reorganizar.");
    botao.innerHTML =
      '<span class="icone6__glifo" style="background:' +
      app.cor +
      '">' +
      app.glifo +
      "</span>" +
      '<span class="icone6__nome">' +
      esc(app.nome) +
      "</span>";
    return botao;
  }

  function montar() {
    elGrade.innerHTML = "";
    elDoca.innerHTML = "";
    APPS.forEach(function (app) {
      var icone = criarIcone(app);
      (app.doca ? elDoca : elGrade).appendChild(icone);
    });
  }

  /* ==========================================================
     Arrasto e reordenação
     Ao soltar sobre outro ícone, os dois trocam de lugar no DOM
     — como a grade é CSS Grid, a ordem no DOM decide a posição.
     ========================================================== */

  /* O ícone original NUNCA sai do fluxo do grid durante o arrasto —
     só fica esmaecido. Quem segue o dedo é um clone flutuante
     (".icone6-fantasma"), a mesma técnica da fase 4. Tirar o ícone
     de verdade do fluxo (position:fixed) faria os outros ícones da
     MESMA grade se reorganizarem para preencher o vão, deslocando
     o alvo antes de soltar — e o soltar erraria o alvo. */
  function iniciarArrasto(ev) {
    var icone = ev.target.closest(".icone6");
    if (!icone) return;
    ev.preventDefault();

    var caixa = icone.getBoundingClientRect();
    arrastando = {
      icone: icone,
      deslocX: ev.clientX - caixa.left,
      deslocY: ev.clientY - caixa.top,
    };

    icone.classList.add("icone6--arrastando");

    elFantasma = icone.cloneNode(true);
    elFantasma.classList.add("icone6-fantasma");
    elFantasma.style.width = caixa.width + "px";
    document.body.appendChild(elFantasma);

    posicionar(ev);
    elTela.setPointerCapture(ev.pointerId);
  }

  function posicionar(ev) {
    if (!elFantasma) return;
    elFantasma.style.left = ev.clientX - arrastando.deslocX + "px";
    elFantasma.style.top = ev.clientY - arrastando.deslocY + "px";
  }

  function moverArrasto(ev) {
    if (!arrastando) return;
    posicionar(ev);
  }

  function alvoSobPonteiro(ev) {
    /* O ícone real nunca se move, então não precisa escondê-lo:
       o fantasma é que fica por cima, e pointer-events:none nele
       (ver fase.css) já deixa elementFromPoint enxergar o que está
       embaixo. */
    var elemento = document.elementFromPoint(ev.clientX, ev.clientY);
    return elemento ? elemento.closest(".icone6") : null;
  }

  function terminarArrasto(ev) {
    if (!arrastando) return;
    var icone = arrastando.icone;
    var alvo = alvoSobPonteiro(ev);

    icone.classList.remove("icone6--arrastando");
    if (elFantasma) {
      elFantasma.remove();
      elFantasma = null;
    }

    if (alvo && alvo !== icone) {
      /* Troca as duas posições no DOM. O ícone nunca saiu do
         lugar durante o arrasto, então parentElement ainda reflete
         a posição original com segurança. */
      var destino = alvo.parentElement;
      var origem = icone.parentElement;
      var proximoDeAlvo = alvo.nextSibling;
      var proximoDeIcone = icone.nextSibling === alvo ? icone : icone.nextSibling;

      destino.insertBefore(icone, alvo);
      (proximoDeAlvo === icone ? destino : origem).insertBefore(
        alvo,
        proximoDeIcone
      );
      R.som.tocar("tecla");
    }

    arrastando = null;
  }

  /* ==========================================================
     Alternância 2007 / hoje
     ========================================================== */

  function trocarEpoca(epoca) {
    var hoje = epoca === "hoje";
    document.querySelector(".telefone").classList.toggle("telefone--hoje", hoje);
    document.querySelectorAll(".chave-epoca6 button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.epoca === epoca ? "true" : "false");
    });
    R.som.tocar("tecla");
  }

  /* ==========================================================
     Reinício
     ========================================================== */

  function reiniciar() {
    montar();
    trocarEpoca("2007");
  }

  /* ==========================================================
     Início
     ========================================================== */

  function iniciar() {
    elTela = document.querySelector(".telefone__tela");
    elGrade = document.querySelector(".telefone__grade");
    elDoca = document.querySelector(".telefone__doca");
    if (!elTela || !elGrade) return;

    montar();

    elTela.addEventListener("pointerdown", iniciarArrasto);
    elTela.addEventListener("pointermove", moverArrasto);
    elTela.addEventListener("pointerup", terminarArrasto);
    elTela.addEventListener("pointercancel", terminarArrasto);

    document.querySelectorAll(".chave-epoca6 button").forEach(function (b) {
      b.addEventListener("click", function () {
        trocarEpoca(b.dataset.epoca);
      });
    });

    R.inatividade.aoReiniciar(reiniciar);
    R.inatividade.iniciar(90);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
