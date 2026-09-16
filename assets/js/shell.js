/* ============================================================
   RetroNet — moldura compartilhada
   ------------------------------------------------------------
   Este arquivo monta cabeçalho, menu das oito fases, indicador
   de progresso, navegação anterior/próxima e rodapé em QUALQUER
   página do site. Mexeu aqui, mudou nas nove páginas.

   Cada página só precisa declarar duas coisas na tag <html>:

     data-raiz="../../"   caminho até a raiz do site
     data-fase="3"        número da fase (a home não declara)

   Não existe build step nem framework: o site roda abrindo o
   index.html direto, inclusive por file://. Por isso a moldura é
   gerada em JavaScript em vez de vir de um arquivo HTML parcial
   (fetch de arquivo local é bloqueado pelo navegador).
   ============================================================ */

(function () {
  "use strict";

  var R = (window.RetroNet = window.RetroNet || {});
  var html = document.documentElement;
  var raiz = html.dataset.raiz || "./";
  var faseAtual = html.dataset.fase ? Number(html.dataset.fase) : null;
  var FASES = R.FASES || [];

  var menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ----------------------------------------------------------
     Ícones. Em SVG inline, nunca emoji — eles mudam de desenho
     em cada sistema e não aceitam a cor da fase.
     ---------------------------------------------------------- */
  var ICONES = {
    menu: '<path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
    fechar:
      '<path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
    somLigado:
      '<path d="M3 7v4h3l4 3V4L6 7H3z" fill="currentColor"/><path d="M12.5 6.5a4 4 0 010 5M14.5 4.5a7 7 0 010 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>',
    somDesligado:
      '<path d="M3 7v4h3l4 3V4L6 7H3z" fill="currentColor"/><path d="M12.5 6.5l4 5M16.5 6.5l-4 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>',
    seta: '<path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  };

  function icone(nome, tamanho) {
    return (
      '<svg viewBox="0 0 18 18" width="' +
      (tamanho || 18) +
      '" height="' +
      (tamanho || 18) +
      '" aria-hidden="true" focusable="false">' +
      ICONES[nome] +
      "</svg>"
    );
  }

  /* Escapa texto antes de jogar em innerHTML. Os dados vêm do
     nosso próprio fases.js, mas manter o hábito evita surpresa
     quando alguém do grupo colar um texto com < ou &. */
  function esc(txt) {
    return String(txt).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* O "index.html" no fim NÃO é enfeite. Um servidor web entrega o
     index.html sozinho quando o link aponta para a pasta, mas o site
     roda por file:// no dia da amostra, e aí o navegador mostra a
     listagem da pasta em vez da página. Sempre aponte para o arquivo. */
  function caminhoDaFase(fase) {
    return raiz + "fases/" + fase.pasta + "/index.html";
  }

  /* ==========================================================
     Cabeçalho
     ========================================================== */
  function montarCabecalho() {
    var cabecalho = document.createElement("header");
    cabecalho.className = "cabecalho";

    var partes = [
      '<a class="logo" href="' +
        raiz +
        'index.html">RetroNet<span class="logo__cursor" aria-hidden="true">_</span></a>',
    ];

    if (faseAtual) partes.push(montarProgresso());

    partes.push(
      '<div class="cabecalho__acoes">' +
        '<button type="button" class="acao acao--som" aria-pressed="false">' +
        '<span class="acao__icone" aria-hidden="true">' +
        icone("somDesligado", 15) +
        "</span>" +
        '<span class="acao__texto">Som</span>' +
        "</button>" +
        '<button type="button" class="acao acao--menu" aria-expanded="false" aria-controls="menu-fases">' +
        icone("menu", 15) +
        '<span class="acao__texto">Fases</span>' +
        "</button>" +
        "</div>"
    );

    cabecalho.innerHTML = partes.join("");
    document.body.insertBefore(cabecalho, document.body.firstChild);

    /* Link de pular, antes de tudo, para quem navega por teclado. */
    var pular = document.createElement("a");
    pular.className = "pular-para-conteudo";
    pular.href = "#conteudo";
    pular.textContent = "Pular para o conteúdo";
    document.body.insertBefore(pular, cabecalho);

    ligarBotaoSom(cabecalho.querySelector(".acao--som"));
    cabecalho.querySelector(".acao--menu").addEventListener("click", abrirMenu);
  }

  /* ==========================================================
     Progresso — posicional, sem guardar nada
     ========================================================== */
  function montarProgresso() {
    var marcas = FASES.map(function (fase) {
      var classe = "progresso__marca";
      if (fase.numero < faseAtual) classe += " progresso__marca--passada";
      if (fase.numero === faseAtual) classe += " progresso__marca--atual";
      return '<span class="' + classe + '"></span>';
    }).join("");

    return (
      '<div class="progresso">' +
      '<p class="progresso__rotulo">Fase <b>' +
      faseAtual +
      "</b> de " +
      FASES.length +
      "</p>" +
      '<div class="progresso__trilho" aria-hidden="true">' +
      marcas +
      "</div>" +
      "</div>"
    );
  }

  /* ==========================================================
     Menu das oito fases
     ========================================================== */
  var menu = null;
  var focoAnterior = null;

  function montarMenu() {
    menu = document.createElement("div");
    menu.className = "menu";
    menu.id = "menu-fases";
    menu.hidden = true;
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "As oito fases da linha do tempo");

    var itens = FASES.map(function (fase) {
      var atual = fase.numero === faseAtual;
      return (
        '<li><a class="fase-item" style="--cor-item:' +
        fase.cor +
        '" href="' +
        caminhoDaFase(fase) +
        '" data-cor="' +
        fase.cor +
        '"' +
        (atual ? ' aria-current="page"' : "") +
        ">" +
        '<span class="fase-item__numero" aria-hidden="true">' +
        String(fase.numero).padStart(2, "0") +
        "</span>" +
        '<span class="fase-item__texto">' +
        '<span class="fase-item__epoca">' +
        esc(fase.epoca) +
        "</span>" +
        '<span class="fase-item__titulo">' +
        esc(fase.titulo) +
        "</span>" +
        '<span class="fase-item__resumo">' +
        esc(fase.resumo) +
        "</span>" +
        "</span>" +
        '<span class="fase-item__interacao' +
        (fase.pendente ? " fase-item__pendente" : "") +
        '">' +
        esc(fase.interacao) +
        "</span>" +
        "</a></li>"
      );
    }).join("");

    menu.innerHTML =
      '<div class="menu__caixa">' +
      '<div class="menu__topo">' +
      '<h2 class="menu__titulo">Escolha uma fase</h2>' +
      '<button type="button" class="acao acao--fechar">' +
      icone("fechar", 15) +
      '<span class="acao__texto">Fechar</span>' +
      "</button>" +
      "</div>" +
      '<ul class="menu__lista">' +
      itens +
      "</ul>" +
      "</div>";

    document.body.appendChild(menu);
    menu.querySelector(".acao--fechar").addEventListener("click", fecharMenu);

    /* Clicar fora da caixa fecha. */
    menu.addEventListener("click", function (evento) {
      if (evento.target === menu) fecharMenu();
    });
  }

  function abrirMenu() {
    focoAnterior = document.activeElement;
    menu.hidden = false;
    document.querySelector(".acao--menu").setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var primeiro = menu.querySelector(".fase-item");
    if (primeiro) primeiro.focus();
    document.addEventListener("keydown", tecladoDoMenu);
  }

  function fecharMenu() {
    menu.hidden = true;
    document.querySelector(".acao--menu").setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", tecladoDoMenu);
    if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
  }

  /* Esc fecha; Tab circula dentro do menu e não escapa para a
     página atrás dele. */
  function tecladoDoMenu(evento) {
    if (evento.key === "Escape") {
      evento.preventDefault();
      fecharMenu();
      return;
    }
    if (evento.key !== "Tab") return;

    var focaveis = menu.querySelectorAll("a[href], button");
    if (!focaveis.length) return;
    var primeiro = focaveis[0];
    var ultimo = focaveis[focaveis.length - 1];

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  /* ==========================================================
     Navegação anterior / próxima
     Preenche o <div data-moldura="navegacao"> da página, se houver.
     ========================================================== */
  function montarNavegacao() {
    var alvo = document.querySelector('[data-moldura="navegacao"]');
    if (!alvo || !faseAtual) return;

    var anterior = R.acharFase(faseAtual - 1);
    var proxima = R.acharFase(faseAtual + 1);
    var partes = [];

    if (anterior) {
      partes.push(
        '<a class="nav-seta nav-seta--anterior" href="' +
          caminhoDaFase(anterior) +
          '" data-cor="' +
          anterior.cor +
          '">' +
          '<span class="nav-seta__rotulo">Fase anterior</span>' +
          '<span class="nav-seta__titulo">' +
          esc(anterior.titulo) +
          "</span></a>"
      );
    } else {
      partes.push(
        '<a class="nav-seta nav-seta--anterior" href="' +
          raiz +
          'index.html">' +
          '<span class="nav-seta__rotulo">Voltar</span>' +
          '<span class="nav-seta__titulo">Início</span></a>'
      );
    }

    if (proxima) {
      partes.push(
        '<a class="nav-seta nav-seta--proxima" href="' +
          caminhoDaFase(proxima) +
          '" data-cor="' +
          proxima.cor +
          '">' +
          '<span class="nav-seta__rotulo">Próxima fase</span>' +
          '<span class="nav-seta__titulo">' +
          esc(proxima.titulo) +
          "</span></a>"
      );
    } else {
      partes.push(
        '<a class="nav-seta nav-seta--proxima" href="' +
          raiz +
          'creditos/index.html">' +
          '<span class="nav-seta__rotulo">Fim da linha do tempo</span>' +
          '<span class="nav-seta__titulo">Créditos e fontes</span></a>'
      );
    }

    alvo.className = "navegacao-fases";
    alvo.innerHTML = partes.join("");
  }

  /* ==========================================================
     Rodapé
     ========================================================== */
  /* Lista única dos integrantes — o rodapé (nas nove páginas) e a
     página de créditos usam esta mesma fonte, para nunca ficarem
     dessincronizados. */
  var INTEGRANTES = (R.INTEGRANTES = [
    "Arthur Gabriel",
    "Kallani Santos",
    "Henrique Sasaki",
    "Gustavo Nobre",
    "Victor Morsoletto",
    "Victor Dias",
    "Guilherme Weiss",
    "Guilherme Bruno",
  ]);

  function montarRodape() {
    var alvo = document.querySelector('[data-moldura="rodape"]');
    if (!alvo) return;
    alvo.className = "rodape";
    var nomes = INTEGRANTES.map(function (nome) {
      return '<span class="nome-brilhante">' + nome + "</span>";
    }).join("");
    alvo.innerHTML =
      '<div class="envoltorio rodape__conteudo">' +
      '<p class="rodape__integrantes">' +
      nomes +
      "<br />3º Ano A, Curso Técnico Integrado ao Ensino Médio</p>" +
      '<p><a href="' +
      raiz +
      'creditos/index.html">Créditos e fontes</a></p>' +
      "</div>";
  }

  /* ==========================================================
     Som
     ========================================================== */
  function ligarBotaoSom(botao) {
    /* O estado do som viaja pela URL porque o site não usa
       armazenamento de nenhum tipo. */
    var params = new URLSearchParams(window.location.search);
    if (params.get("som") === "1") R.som.definir(true);

    function desenhar(ativo) {
      botao.setAttribute("aria-pressed", ativo ? "true" : "false");
      botao.querySelector(".acao__icone").innerHTML = icone(
        ativo ? "somLigado" : "somDesligado",
        15
      );
      botao.setAttribute(
        "aria-label",
        ativo ? "Desligar o som do site" : "Ligar o som do site"
      );
    }

    desenhar(R.som.estaAtivo());
    R.som.aoMudar(desenhar);
    botao.addEventListener("click", function () {
      R.som.alternar();
    });
  }

  /* ==========================================================
     Travessia entre páginas
     A cor da fase de destino lava a tela antes de navegar, e o
     conteúdo da página seguinte entra subindo. É o "avanço no
     tempo" pedido na modelagem, em vez de um corte seco.
     ========================================================== */
  function ligarTravessia() {
    var lencol = document.createElement("div");
    lencol.className = "travessia";
    document.body.appendChild(lencol);

    document.addEventListener("click", function (evento) {
      var link = evento.target.closest("a[href]");
      if (!link) return;

      /* Deixa passar o que não é navegação interna simples. */
      if (
        evento.defaultPrevented ||
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey ||
        link.target === "_blank" ||
        link.hasAttribute("download")
      )
        return;

      var destino = new URL(link.href, window.location.href);
      /* file:// não tem origem confiável: comparamos protocolo e
         host, que funcionam tanto em file:// quanto em http://. */
      if (
        destino.protocol !== window.location.protocol ||
        destino.host !== window.location.host
      )
        return;
      if (destino.hash && destino.pathname === window.location.pathname) return;

      /* Carrega o estado do som para a próxima página. */
      if (R.som.estaAtivo()) destino.searchParams.set("som", "1");

      if (menosMovimento.matches) {
        evento.preventDefault();
        window.location.href = destino.href;
        return;
      }

      evento.preventDefault();
      lencol.style.setProperty(
        "--cor-travessia",
        link.dataset.cor || getComputedStyle(html).getPropertyValue("--destaque")
      );
      lencol.classList.add("travessia--saindo");
      R.som.tocar("travessia");

      /* Espera a cor terminar de cobrir a tela. Navegar antes disso
         deixava a faixa cortada no meio do caminho, que era o erro
         da primeira versão. A animação é "forwards", então a tela
         segue coberta enquanto a página nova carrega. */
      var duracao =
        parseFloat(getComputedStyle(html).getPropertyValue("--mov-travessia")) ||
        420;
      window.setTimeout(function () {
        window.location.href = destino.href;
      }, duracao);
    });
  }

  /* ==========================================================
     Atalhos de teclado do site inteiro
     ========================================================== */
  function ligarAtalhos() {
    document.addEventListener("keydown", function (evento) {
      /* Não sequestra teclas enquanto alguém digita numa
         atividade (o BASIC da fase 2, por exemplo). */
      var alvo = evento.target;
      if (
        alvo &&
        (alvo.tagName === "INPUT" ||
          alvo.tagName === "TEXTAREA" ||
          alvo.isContentEditable)
      )
        return;
      if (menu && !menu.hidden) return;

      if (evento.key === "ArrowRight" && faseAtual) {
        var proxima = R.acharFase(faseAtual + 1);
        if (proxima) irPara(caminhoDaFase(proxima), proxima.cor);
      } else if (evento.key === "ArrowLeft" && faseAtual) {
        var anterior = R.acharFase(faseAtual - 1);
        if (anterior) irPara(caminhoDaFase(anterior), anterior.cor);
      } else if (evento.key === "m" || evento.key === "M") {
        abrirMenu();
      }
    });
  }

  /* Navega passando pela mesma travessia dos cliques. */
  function irPara(href, cor) {
    var link = document.createElement("a");
    link.href = href;
    if (cor) link.dataset.cor = cor;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /* ==========================================================
     Início
     ========================================================== */
  function montar() {
    if (!FASES.length) {
      console.error("RetroNet: fases.js precisa ser carregado antes de shell.js");
      return;
    }
    montarCabecalho();
    montarMenu();
    montarNavegacao();
    montarRodape();
    ligarTravessia();
    ligarAtalhos();
  }

  R.montarMoldura = montar;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar);
  } else {
    montar();
  }
})();
