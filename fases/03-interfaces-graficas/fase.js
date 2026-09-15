/* ============================================================
   RetroNet — Fase 3: desktop de 1984
   ------------------------------------------------------------
   Micro-interação: o visitante arrasta janelas e ícones no
   Macintosh original, abre a lixeira e, com um clique, compara a
   mesma área de trabalho com a de hoje.

   O que a comparação ensina: o vocabulário não mudou. Janela,
   ícone, pasta, lixeira e barra de menus continuam exatamente
   onde estavam em 1984 — o que mudou foi só o acabamento.
   ============================================================ */

(function () {
  "use strict";

  var R = window.RetroNet;

  /* ----------------------------------------------------------
     Ícones em SVG inline. Nada de emoji: emoji muda de desenho em
     cada sistema e não aceita o tratamento de 1 bit.
     ---------------------------------------------------------- */
  var ICONES = {
    disquete:
      '<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">' +
      '<rect x="3" y="3" width="26" height="26" fill="#fff" stroke="#000" stroke-width="2"/>' +
      '<rect x="9" y="5" width="14" height="10" fill="#000"/>' +
      '<rect x="12" y="7" width="4" height="6" fill="#fff"/>' +
      '<rect x="8" y="19" width="16" height="9" fill="#fff" stroke="#000" stroke-width="2"/>' +
      '<rect x="11" y="22" width="10" height="1.6" fill="#000"/>' +
      '<rect x="11" y="25" width="10" height="1.6" fill="#000"/></svg>',
    pasta:
      '<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">' +
      '<path d="M3 9h9l3 3h14v16H3z" fill="#fff" stroke="#000" stroke-width="2"/>' +
      '<path d="M3 9h9l3 3H3z" fill="#000"/></svg>',
    documento:
      '<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">' +
      '<path d="M7 3h13l6 6v20H7z" fill="#fff" stroke="#000" stroke-width="2"/>' +
      '<path d="M20 3v6h6" fill="none" stroke="#000" stroke-width="2"/>' +
      '<rect x="11" y="14" width="12" height="1.6" fill="#000"/>' +
      '<rect x="11" y="18" width="12" height="1.6" fill="#000"/>' +
      '<rect x="11" y="22" width="8" height="1.6" fill="#000"/></svg>',
    lixeira:
      '<svg viewBox="0 0 32 32" aria-hidden="true" shape-rendering="crispEdges">' +
      '<rect x="12" y="3" width="8" height="3" fill="#fff" stroke="#000" stroke-width="2"/>' +
      '<rect x="7" y="7" width="18" height="3" fill="#fff" stroke="#000" stroke-width="2"/>' +
      '<path d="M9 11h14l-2 18H11z" fill="#fff" stroke="#000" stroke-width="2"/>' +
      '<rect x="13" y="15" width="1.8" height="10" fill="#000"/>' +
      '<rect x="17" y="15" width="1.8" height="10" fill="#000"/></svg>',
    maca:
      '<svg viewBox="0 0 32 32" aria-hidden="true">' +
      '<path d="M21 5c-1 2-3 3-4 3 0-2 1-4 3-4.6C21 3 21.3 4 21 5zM24 20c-.6 1.6-2 4.4-3.6 4.4-1.3 0-1.8-.9-3.3-.9s-2 .9-3.3.9C12 24.4 9 20 9 16.2c0-3.7 2.4-5.6 4.6-5.6 1.4 0 2.6 1 3.4 1 .8 0 2.1-1 3.7-1 1.4 0 2.9.6 3.8 1.8-3.3 1.9-2.8 6.5.5 7.6z" fill="#000"/></svg>',
  };

  /* Conteúdo de cada janela: só texto curto, para o visitante ler
     em pé durante a amostra. */
  var JANELAS = {
    disquete: {
      titulo: "Macintosh HD",
      corpo:
        "<p>400 KB no disquete de 3,5 polegadas. O sistema inteiro cabia aqui, com espaço sobrando para os seus arquivos.</p>" +
        "<p>Um MP3 de hoje não caberia.</p>",
    },
    pasta: {
      titulo: "Sistema",
      corpo:
        "<p>Pasta, janela, ícone e lixeira estreiam no Macintosh em 1984 e continuam sendo a metáfora da área de trabalho até hoje.</p>",
    },
    documento: {
      titulo: "Leia-me",
      corpo:
        "<p>A interface gráfica nasceu no Xerox PARC, nos anos 70. O Macintosh não a inventou — ele foi o primeiro a vendê-la para o grande público.</p>" +
        "<p>Arraste esta janela pela barra de título. Arraste um ícone até a lixeira.</p>",
    },
  };

  var elTela, elMac, elLegenda;
  var zTopo = 10;
  var arrastando = null;
  var naLixeira = 0;

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ==========================================================
     Monta a área de trabalho
     ========================================================== */

  var POSICOES_INICIAIS = {
    disquete: { x: 88, y: 12 },
    pasta: { x: 88, y: 46 },
    documento: { x: 88, y: 80 },
    lixeira: { x: 88, y: 118 },
  };

  function montar() {
    elTela.innerHTML =
      '<div class="menu-mac">' +
      ICONES.maca +
      "<span>Arquivo</span><span>Editar</span><span>Visualizar</span><span>Especial</span>" +
      "</div>";

    /* Ícones encostados na margem direita, como no Mac original. */
    Object.keys(POSICOES_INICIAIS).forEach(function (tipo) {
      var pos = POSICOES_INICIAIS[tipo];
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "icone-mac";
      botao.dataset.tipo = tipo;
      botao.style.right = pos.x + "px";
      botao.style.top = pos.y + "px";
      botao.innerHTML =
        ICONES[tipo] +
        '<span class="icone-mac__nome">' +
        esc(
          tipo === "disquete"
            ? "Macintosh HD"
            : tipo === "pasta"
            ? "Sistema"
            : tipo === "documento"
            ? "Leia-me"
            : "Lixo"
        ) +
        "</span>";
      botao.setAttribute(
        "aria-label",
        tipo === "lixeira"
          ? "Lixo. Arraste um ícone até aqui."
          : "Ícone " + tipo + ". Dois cliques para abrir."
      );
      elTela.appendChild(botao);
    });
  }

  /* ==========================================================
     Janelas
     ========================================================== */

  function abrirJanela(tipo) {
    var dados = JANELAS[tipo];
    if (!dados) return;

    var existente = elTela.querySelector('.janela-mac[data-de="' + tipo + '"]');
    if (existente) {
      existente.style.zIndex = ++zTopo;
      return;
    }

    var janela = document.createElement("div");
    janela.className = "janela-mac";
    janela.dataset.de = tipo;
    janela.style.left = 16 + Object.keys(JANELAS).indexOf(tipo) * 26 + "px";
    janela.style.top = 42 + Object.keys(JANELAS).indexOf(tipo) * 26 + "px";
    janela.style.width = "236px";
    janela.style.zIndex = ++zTopo;
    janela.innerHTML =
      '<div class="janela-mac__barra">' +
      '<button type="button" class="janela-mac__fechar" aria-label="Fechar janela"></button>' +
      '<span class="janela-mac__titulo">' +
      esc(dados.titulo) +
      "</span>" +
      '<span style="width:12px"></span>' +
      "</div>" +
      '<div class="janela-mac__corpo">' +
      dados.corpo +
      "</div>";

    elTela.appendChild(janela);
    R.som.tocar("confirmar");
  }

  /* ==========================================================
     Arrasto de janelas e ícones
     ========================================================== */

  function iniciarArrasto(ev) {
    var barra = ev.target.closest(".janela-mac__barra");
    var icone = ev.target.closest(".icone-mac");

    if (ev.target.closest(".janela-mac__fechar")) return;

    var alvo = null;
    var tipo = null;
    if (barra) {
      alvo = barra.closest(".janela-mac");
      tipo = "janela";
    } else if (icone && icone.dataset.tipo !== "lixeira") {
      alvo = icone;
      tipo = "icone";
    }
    if (!alvo) return;

    ev.preventDefault();
    var base = elTela.getBoundingClientRect();
    var caixa = alvo.getBoundingClientRect();

    /* Ícone posicionado por "right" passa a ser posicionado por
       "left" no momento em que começa a se mover. */
    if (tipo === "icone" && alvo.style.right) {
      alvo.style.left = caixa.left - base.left + "px";
      alvo.style.right = "";
    }

    alvo.classList.add(tipo === "janela" ? "janela-mac--arrastando" : "icone-mac--arrastando");
    if (tipo === "janela") alvo.style.zIndex = ++zTopo;

    arrastando = {
      elemento: alvo,
      tipo: tipo,
      deslocX: ev.clientX - caixa.left,
      deslocY: ev.clientY - caixa.top,
      largura: caixa.width,
      altura: caixa.height,
    };
    elTela.setPointerCapture(ev.pointerId);
  }

  function moverArrasto(ev) {
    if (!arrastando) return;
    var base = elTela.getBoundingClientRect();
    var x = ev.clientX - base.left - arrastando.deslocX;
    var y = ev.clientY - base.top - arrastando.deslocY;

    /* Não deixa sair da tela nem subir por cima da barra de menus. */
    x = Math.max(0, Math.min(x, base.width - arrastando.largura));
    y = Math.max(24, Math.min(y, base.height - arrastando.altura));

    arrastando.elemento.style.left = x + "px";
    arrastando.elemento.style.top = y + "px";
  }

  function terminarArrasto(ev) {
    if (!arrastando) return;
    var elemento = arrastando.elemento;
    var tipo = arrastando.tipo;
    elemento.classList.remove("janela-mac--arrastando", "icone-mac--arrastando");

    if (tipo === "icone") {
      var lixeira = elTela.querySelector('.icone-mac[data-tipo="lixeira"]');
      if (lixeira && seTocam(elemento, lixeira)) {
        jogarNoLixo(elemento, lixeira);
      }
    }

    arrastando = null;
  }

  function seTocam(a, b) {
    var ra = a.getBoundingClientRect();
    var rb = b.getBoundingClientRect();
    return !(
      ra.right < rb.left ||
      ra.left > rb.right ||
      ra.bottom < rb.top ||
      ra.top > rb.bottom
    );
  }

  function jogarNoLixo(icone, lixeira) {
    icone.remove();
    naLixeira++;
    lixeira.classList.add("icone-mac--lixeira-cheia");
    R.som.tocar("travessia");

    var janela = elTela.querySelector('.janela-mac[data-de="' + icone.dataset.tipo + '"]');
    if (janela) janela.remove();
  }

  function esvaziarLixo() {
    var lixeira = elTela.querySelector('.icone-mac[data-tipo="lixeira"]');
    abrirJanelaAvulsa(
      "Lixo",
      naLixeira
        ? "<p>" +
            naLixeira +
            (naLixeira === 1 ? " item" : " itens") +
            " no lixo.</p><p>No Mac de 1984, o lixo só era esvaziado de verdade quando você escolhia <em>Esvaziar Lixo</em> no menu Especial. Até lá dava para arrepender.</p>"
        : "<p>O lixo está vazio.</p><p>Arraste um ícone até aqui para ver o que acontece.</p>"
    );
    if (lixeira) lixeira.classList.remove("icone-mac--lixeira-cheia");
    naLixeira = 0;
  }

  function abrirJanelaAvulsa(titulo, corpo) {
    var antiga = elTela.querySelector('.janela-mac[data-de="lixo"]');
    if (antiga) antiga.remove();

    var janela = document.createElement("div");
    janela.className = "janela-mac";
    janela.dataset.de = "lixo";
    janela.style.left = "70px";
    janela.style.top = "120px";
    janela.style.width = "250px";
    janela.style.zIndex = ++zTopo;
    janela.innerHTML =
      '<div class="janela-mac__barra">' +
      '<button type="button" class="janela-mac__fechar" aria-label="Fechar janela"></button>' +
      '<span class="janela-mac__titulo">' +
      esc(titulo) +
      "</span><span style=\"width:12px\"></span></div>" +
      '<div class="janela-mac__corpo">' +
      corpo +
      "</div>";
    elTela.appendChild(janela);
    R.som.tocar("confirmar");
  }

  /* ==========================================================
     Alternância 1984 / hoje
     ========================================================== */

  function trocarEpoca(epoca) {
    var hoje = epoca === "hoje";
    elMac.classList.toggle("mac--hoje", hoje);
    elLegenda.textContent = hoje
      ? "A mesma área de trabalho, com o acabamento de hoje"
      : "Macintosh 128K · System 1 · 1984";

    document.querySelectorAll(".chave-epoca button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.epoca === epoca ? "true" : "false");
    });
    R.som.tocar("tecla");
  }

  /* ==========================================================
     Reinício
     ========================================================== */

  function reiniciar() {
    naLixeira = 0;
    zTopo = 10;
    montar();
    trocarEpoca("1984");
  }

  /* ==========================================================
     Início
     ========================================================== */

  function iniciar() {
    elTela = document.querySelector(".mac__tela");
    elMac = document.querySelector(".mac");
    elLegenda = document.querySelector(".mac__legenda");
    if (!elTela) return;

    montar();

    elTela.addEventListener("pointerdown", iniciarArrasto);
    elTela.addEventListener("pointermove", moverArrasto);
    elTela.addEventListener("pointerup", terminarArrasto);
    elTela.addEventListener("pointercancel", terminarArrasto);

    elTela.addEventListener("click", function (ev) {
      if (ev.target.closest(".janela-mac__fechar")) {
        ev.target.closest(".janela-mac").remove();
        return;
      }
      var icone = ev.target.closest(".icone-mac");
      if (!icone) {
        elTela.querySelectorAll(".icone-mac--selecionado").forEach(function (i) {
          i.classList.remove("icone-mac--selecionado");
        });
        return;
      }
      elTela.querySelectorAll(".icone-mac--selecionado").forEach(function (i) {
        i.classList.remove("icone-mac--selecionado");
      });
      icone.classList.add("icone-mac--selecionado");
    });

    /* Dois cliques abrem, como no Mac. */
    elTela.addEventListener("dblclick", function (ev) {
      var icone = ev.target.closest(".icone-mac");
      if (!icone) return;
      if (icone.dataset.tipo === "lixeira") esvaziarLixo();
      else abrirJanela(icone.dataset.tipo);
    });

    /* Enter no teclado equivale aos dois cliques. */
    elTela.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      var icone = ev.target.closest(".icone-mac");
      if (!icone) return;
      ev.preventDefault();
      if (icone.dataset.tipo === "lixeira") esvaziarLixo();
      else abrirJanela(icone.dataset.tipo);
    });

    document.querySelectorAll(".chave-epoca button").forEach(function (b) {
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
