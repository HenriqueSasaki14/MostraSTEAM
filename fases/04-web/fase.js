/* ============================================================
   RetroNet — Fase 4: construtor de página de 1996
   ------------------------------------------------------------
   Editor dividido em dois: à esquerda a caixa de tags que podem
   ser arrastadas, à direita a página se montando ao vivo. As
   tags disponíveis são as que definiram a década: h1 com Comic
   Sans, bgcolor, marquee, blink, hr colorido, contador de
   visitas e o GIF "em construção".

   Isto não é uma imagem estática fingindo os anos 90: o marquee
   realmente rola e o blink realmente pisca, com CSS controlado
   por este arquivo — e não pela tag nativa do navegador, porque
   o suporte nativo de <marquee> e <blink> varia entre Chrome,
   Firefox e Edge (o site precisa funcionar igual nos três).

   Ao terminar, o visitante compara a mesma página em dois modos:
   "Netscape 1996" (onde os efeitos funcionam) e "hoje" (onde a
   maioria foi abandonada — o que é literalmente verdade: nenhum
   navegador atual pisca texto com <blink>). E vê quanto tempo
   aquela página levaria para carregar num modem de 56k, calculado
   a partir do tamanho real das tags escolhidas.
   ============================================================ */

(function () {
  "use strict";

  var R = window.RetroNet;

  /* ----------------------------------------------------------
     As sete tags da modelagem. "kb" é o peso aproximado que cada
     elemento tinha numa página real de 1996 — é o que alimenta o
     cálculo do tempo de carregamento, não é decoração.
     ---------------------------------------------------------- */
  var TAGS = [
    { id: "h1", tag: "<h1>", rotulo: "Título (Comic Sans)", kb: 0.3 },
    { id: "bgcolor", tag: "bgcolor", rotulo: "Cor de fundo", kb: 0.1 },
    { id: "marquee", tag: "<marquee>", rotulo: "Texto correndo", kb: 0.4 },
    { id: "blink", tag: "<blink>", rotulo: "Texto piscando", kb: 0.3 },
    { id: "hr", tag: "<hr color>", rotulo: "Linha colorida", kb: 0.1 },
    { id: "contador", tag: "contador.gif", rotulo: "Contador de visitas", kb: 2.1 },
    { id: "construcao", tag: "under_construction.gif", rotulo: "Em construção", kb: 14.8 },
  ];

  var PESO_BASE_KB = 2.2; /* HTML e cabeçalho da página */
  var VELOCIDADE_KBPS = 4.2; /* taxa efetiva típica de um 56k, em KB/s */

  var CORES_HR = ["#ffd700", "#ff00cc", "#00e5ff", "#39ff6a"];
  var CORES_FUNDO = [
    { nome: "Cinza (padrão de 1991)", valor: "#c0c0c0", textoClaro: false },
    { nome: "Azul marinho", valor: "#000080", textoClaro: true },
    { nome: "Preto", valor: "#000000", textoClaro: true },
    { nome: "Magenta", valor: "#ff00cc", textoClaro: false },
  ];

  var ativas = {}; /* id da tag -> true */
  var indiceCorFundo = 0;
  var indiceCorHr = 0;
  var contadorVisitas = 4231; /* número inicial, como as páginas reais tinham */
  var elCaixaTags, elPagina, elTelaWeb, elMonitor, elCarregBarra, elCarregTexto, elEndereco;
  var modoAtual = "1996";
  var arrastando = null;

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ==========================================================
     Caixa de tags
     ========================================================== */

  function montarCaixaTags() {
    elCaixaTags.innerHTML = TAGS.map(function (t) {
      return (
        '<button type="button" class="tag-chip" data-tag="' +
        t.id +
        '" aria-pressed="false">' +
        '<span>' +
        '<span class="tag-chip__rotulo">' +
        esc(t.rotulo) +
        "</span>" +
        '<span class="tag-chip__tag">' +
        esc(t.tag) +
        "</span>" +
        "</span>" +
        '<span class="tag-chip__marca" aria-hidden="true">&#10003;</span>' +
        "</button>"
      );
    }).join("");
  }

  function alternarTag(id) {
    ativas[id] = !ativas[id];
    if (id === "bgcolor" && ativas[id]) {
      /* Cada vez que a cor de fundo é ligada de novo, avança para
         a próxima cor da lista, como um seletor cíclico. */
      indiceCorFundo = (indiceCorFundo + 1) % CORES_FUNDO.length;
    }
    if (id === "hr" && ativas[id]) {
      indiceCorHr = (indiceCorHr + 1) % CORES_HR.length;
    }
    if (id === "contador" && ativas[id]) {
      contadorVisitas++;
    }
    R.som.tocar("tecla");
    render();
  }

  /* ==========================================================
     Arrasto das tags até a tela (com clique simples como
     alternativa, para quem não consegue arrastar com precisão)
     ========================================================== */

  var elFantasma = null;

  function iniciarArrastoTag(ev) {
    var chip = ev.target.closest(".tag-chip");
    if (!chip) return;
    ev.preventDefault();

    arrastando = {
      id: chip.dataset.tag,
      x: ev.clientX,
      y: ev.clientY,
      moveu: false,
    };
    elCaixaTags.setPointerCapture(ev.pointerId);
  }

  function moverArrastoTag(ev) {
    if (!arrastando) return;
    var dx = ev.clientX - arrastando.x;
    var dy = ev.clientY - arrastando.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) arrastando.moveu = true;

    if (arrastando.moveu) {
      if (!elFantasma) {
        elFantasma = document.createElement("div");
        elFantasma.className = "tag-fantasma";
        var tag = TAGS.find(function (t) {
          return t.id === arrastando.id;
        });
        elFantasma.textContent = tag ? tag.rotulo : "";
        document.body.appendChild(elFantasma);
      }
      elFantasma.style.left = ev.clientX + "px";
      elFantasma.style.top = ev.clientY + "px";

      var sobreTela = elTelaWeb.getBoundingClientRect();
      var dentro =
        ev.clientX >= sobreTela.left &&
        ev.clientX <= sobreTela.right &&
        ev.clientY >= sobreTela.top &&
        ev.clientY <= sobreTela.bottom;
      elMonitor.classList.toggle("monitor-web--alvo", dentro);
    }
  }

  function soltarArrastoTag(ev) {
    if (!arrastando) return;
    if (elFantasma) {
      elFantasma.remove();
      elFantasma = null;
    }
    elMonitor.classList.remove("monitor-web--alvo");

    if (!arrastando.moveu) {
      /* Sem movimento: equivale a um clique simples no chip. */
      alternarTag(arrastando.id);
    } else {
      var sobreTela = elTelaWeb.getBoundingClientRect();
      var dentro =
        ev.clientX >= sobreTela.left &&
        ev.clientX <= sobreTela.right &&
        ev.clientY >= sobreTela.top &&
        ev.clientY <= sobreTela.bottom;
      if (dentro && !ativas[arrastando.id]) {
        alternarTag(arrastando.id);
      } else if (!dentro) {
        /* Soltou fora: nada muda, sem penalidade. */
      }
    }
    arrastando = null;
  }

  /* ==========================================================
     Renderização da página construída
     ========================================================== */

  function pesoTotalKB() {
    var total = PESO_BASE_KB;
    TAGS.forEach(function (t) {
      if (ativas[t.id]) total += t.kb;
    });
    return total;
  }

  function algumaAtiva() {
    return TAGS.some(function (t) {
      return ativas[t.id];
    });
  }

  function iconeConstrucao() {
    return (
      '<svg class="bloco-construcao__icone" viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="5" r="2.4" fill="#000"/>' +
      '<path d="M12 8v6l-4 6M12 14l5 5M8 12l8-2" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      "</svg>"
    );
  }

  function render() {
    var cor = CORES_FUNDO[indiceCorFundo];
    var corHr = CORES_HR[indiceCorHr];

    if (!algumaAtiva()) {
      elPagina.style.background = "";
      elPagina.style.color = "";
      elPagina.innerHTML =
        '<p class="pagina-construida__vazio">Arraste uma tag da esquerda até aqui,<br>ou apenas clique nela.</p>';
    } else {
      var blocos = [];

      if (ativas.h1) {
        blocos.push('<h1 class="bloco-h1">Minha HomePage Web!</h1>');
      }
      if (ativas.marquee) {
        blocos.push(
          '<div class="bloco-marquee"><span class="bloco-marquee__texto">*** Bem-vindo ao meu site na Web! Assine meu livro de visitas! ***</span></div>'
        );
      }
      if (ativas.blink) {
        blocos.push('<span class="bloco-blink">✦ Melhor visto no Netscape Navigator ✦</span><br>');
      }
      if (ativas.hr) {
        blocos.push('<hr class="bloco-hr" style="--cor-hr:' + corHr + '">');
      }
      if (ativas.contador) {
        var digitos = String(contadorVisitas).padStart(6, "0").split("");
        blocos.push(
          '<div class="bloco-contador">Você é o visitante número' +
            '<span class="bloco-contador__digitos">' +
            digitos.map(function (d) {
              return "<span>" + d + "</span>";
            }).join("") +
            "</span></div><br>"
        );
      }
      if (ativas.construcao) {
        blocos.push(
          '<div class="bloco-construcao">' +
            iconeConstrucao() +
            '<span class="bloco-construcao__texto">EM CONSTRUÇÃO</span></div><br>'
        );
      }
      blocos.push(
        '<p class="aviso-obsoleto">Nesta visualização, o piscar, a rolagem, o fundo colorido e os selos ' +
          "animados somem: nenhum navegador atual os mantém. É a mesma página, só que o " +
          "navegador de hoje ignora o que os anos 90 mais usavam.</p>"
      );

      elPagina.innerHTML = blocos.join("\n");

      if (modoAtual === "1996") {
        elPagina.style.background = cor.valor;
        elPagina.style.color = cor.textoClaro ? "#fff" : "#000";
      } else {
        elPagina.style.background = "";
        elPagina.style.color = "";
      }
    }

    atualizarChips();
    atualizarCarregamento();
  }

  function atualizarChips() {
    elCaixaTags.querySelectorAll(".tag-chip").forEach(function (chip) {
      var ligada = !!ativas[chip.dataset.tag];
      chip.setAttribute("aria-pressed", ligada ? "true" : "false");
      chip.querySelector(".tag-chip__marca").textContent = ligada ? "✓" : "";
    });
  }

  /* ==========================================================
     Alternância 1996 / hoje
     ========================================================== */

  function trocarModo(modo) {
    modoAtual = modo;
    elTelaWeb.classList.toggle("tela-web--hoje", modo === "hoje");
    elMonitor.classList.toggle("monitor-web--hoje", modo === "hoje");
    var elTituloJanela = document.querySelector(".navegador-chrome__titulo");
    if (elTituloJanela) {
      elTituloJanela.textContent = modo === "1996" ? "Netscape Navigator" : "Navegador";
    }
    document.querySelectorAll(".chave-navegador button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.modo === modo ? "true" : "false");
    });
    elEndereco.value =
      modo === "1996"
        ? "http://www.geocities.com/~seunome/index.html"
        : "https://seunome.dev";
    R.som.tocar("tecla");
    render();
  }

  /* ==========================================================
     Carregamento em 56k — calculado de verdade, a partir do
     peso das tags escolhidas, não uma barra decorativa.
     ========================================================== */

  var relogioCarregamento = null;

  function atualizarCarregamento() {
    var kb = pesoTotalKB();
    var segundos = kb / VELOCIDADE_KBPS;
    elCarregTexto.innerHTML =
      "Tamanho estimado: <strong>" +
      kb.toFixed(1) +
      " KB</strong> &middot; num modem de 56k, cerca de <strong>" +
      segundos.toFixed(1) +
      " s</strong> para carregar";
  }

  function simularCarregamento() {
    if (!algumaAtiva()) return;
    window.clearInterval(relogioCarregamento);

    var kb = pesoTotalKB();
    var segundosTotais = kb / VELOCIDADE_KBPS;
    var duracaoMs = Math.min(Math.max(segundosTotais * 1000, 900), 7000);
    var inicio = performance.now();

    elPagina.style.clipPath = "inset(0 0 100% 0)";
    R.som.tocar("modem");

    relogioCarregamento = window.setInterval(function () {
      var decorrido = performance.now() - inicio;
      var progresso = Math.min(1, decorrido / duracaoMs);
      elCarregBarra.style.width = progresso * 100 + "%";
      elPagina.style.clipPath = "inset(0 0 " + (1 - progresso) * 100 + "% 0)";

      var segundosReais = (decorrido / 1000).toFixed(1);
      elCarregTexto.innerHTML =
        "Carregando&hellip; <strong>" +
        segundosReais +
        " s</strong> de " +
        segundosTotais.toFixed(1) +
        " s previstos (" +
        kb.toFixed(1) +
        " KB a 56k)";

      if (progresso >= 1) {
        window.clearInterval(relogioCarregamento);
        elPagina.style.clipPath = "";
        elCarregTexto.innerHTML =
          "Pronto. <strong>" +
          kb.toFixed(1) +
          " KB</strong> em <strong>" +
          segundosTotais.toFixed(1) +
          " s</strong> — e olha que essa página quase não tem nada.";
      }
    }, 60);
  }

  /* ==========================================================
     Reinício
     ========================================================== */

  function reiniciar() {
    ativas = {};
    indiceCorFundo = 0;
    indiceCorHr = 0;
    contadorVisitas = 4231;
    window.clearInterval(relogioCarregamento);
    elCarregBarra.style.width = "0%";
    elPagina.style.clipPath = "";
    trocarModo("1996");
  }

  /* ==========================================================
     Início
     ========================================================== */

  function iniciar() {
    elCaixaTags = document.querySelector(".caixa-tags__lista");
    elPagina = document.querySelector(".pagina-construida");
    elTelaWeb = document.querySelector(".tela-web");
    elMonitor = document.querySelector(".monitor-web");
    elCarregBarra = document.querySelector(".carregamento__preenchimento");
    elCarregTexto = document.querySelector(".carregamento__texto");
    elEndereco = document.querySelector(".navegador-chrome__endereco input");

    if (!elCaixaTags || !elPagina) return;

    montarCaixaTags();

    elCaixaTags.addEventListener("pointerdown", iniciarArrastoTag);
    elCaixaTags.addEventListener("pointermove", moverArrastoTag);
    elCaixaTags.addEventListener("pointerup", soltarArrastoTag);
    elCaixaTags.addEventListener("pointercancel", soltarArrastoTag);

    /* Teclado: Enter/Espaço num chip focado alterna a tag. */
    elCaixaTags.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      var chip = ev.target.closest(".tag-chip");
      if (!chip) return;
      ev.preventDefault();
      alternarTag(chip.dataset.tag);
    });

    document.querySelectorAll(".chave-navegador button").forEach(function (b) {
      b.addEventListener("click", function () {
        trocarModo(b.dataset.modo);
      });
    });

    document.querySelector("[data-carregar]").addEventListener("click", simularCarregamento);

    trocarModo("1996");

    R.inatividade.aoReiniciar(reiniciar);
    R.inatividade.iniciar(90);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
