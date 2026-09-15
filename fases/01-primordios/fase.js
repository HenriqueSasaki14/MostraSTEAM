/* ============================================================
   RetroNet — Fase 1: atividade do painel de fios do Enigma
   ------------------------------------------------------------
   Três partes, na ordem em que aparecem na tela:

     1. Ligar o painel — arrastar cada cabo até o par indicado na
        chave do dia. Encaixe certo acende a tomada; errado, o
        cabo volta sozinho.
     2. Ver o efeito — digitar uma palavra e ver a cifra. Depois
        retirar UM fio e comparar. Atenção: o painel troca letras
        só na entrada e na saída, então um cabo a menos NÃO muda
        todas as letras. A atividade mostra quantas mudaram e
        explica por quê — fingir o contrário seria ensinar errado
        como a máquina funciona.
     3. A lógica por trás — duas chaves e uma lâmpada, em série
        (E) ou em paralelo (OU). É a demonstração de Shannon.

   A cifra é feita pelo motor de enigma.js, que cifra de verdade.
   Este arquivo cuida só da interface.
   ============================================================ */

(function () {
  "use strict";

  var R = window.RetroNet;
  var Enigma = R.Enigma;

  /* ----------------------------------------------------------
     Chave do dia. Seis cabos, como num Enigma real em que nem
     todas as tomadas eram usadas. As letras de cada coluna são
     fixas; o que o visitante descobre é quem liga com quem.
     ---------------------------------------------------------- */
  var ESQUERDA = "ABCDEFGHIJ".split("");
  var DIREITA = "KLMNOPQRST".split("");
  var CHAVE_DO_DIA = [
    ["A", "R"],
    ["C", "K"],
    ["D", "S"],
    ["F", "T"],
    ["G", "M"],
    ["I", "O"],
  ];

  var CORES_CABO = ["#c0483c", "#3f7fb5", "#d8a12a", "#7a9169", "#9a6bb0", "#c9713f"];

  var PALAVRA_PADRAO = "MENSAGEMSECRETA";

  /* Quantas maneiras existem de ligar os cabos. Calculado por
     26! / ((26-2n)! * n! * 2^n). Com 6 cabos dá 100.391.791.500;
     com os 10 do Enigma real, 150.738.274.937.250. */
  var COMBINACOES_6_CABOS = "100 bilhões";
  var COMBINACOES_10_CABOS = "150 trilhões";

  /* Estado da atividade */
  var ligados = []; // [{esq, dir, cor}]
  var selecionada = null; // tomada de origem durante a ligação
  var arrastando = null; // {letra, lado, x, y}
  var fioRetirado = null; // par retirado na parte 2
  var modoLogica = "E";
  var chaves = { 1: false, 2: false };

  /* ==========================================================
     Elementos
     ========================================================== */
  var elPainel,
    elCabos,
    elParesChave,
    elPasso2,
    elPasso3,
    elEntrada,
    elRotores,
    elFitaAntes,
    elFitaDepois,
    elConclusao,
    elBotaoRetirar,
    elBotaoReiniciar,
    elInstrucao,
    elLampada,
    elTabela;

  /* ==========================================================
     Parte 1 — o painel de fios
     ========================================================== */

  function montarPainel() {
    function coluna(letras, lado) {
      return (
        '<div class="painel__coluna painel__coluna--' +
        lado +
        '">' +
        letras
          .map(function (l) {
            return (
              '<button type="button" class="tomada" data-letra="' +
              l +
              '" data-lado="' +
              lado +
              '" aria-label="Tomada ' +
              l +
              '">' +
              '<span class="tomada__letra">' +
              l +
              "</span>" +
              '<span class="tomada__furo"></span>' +
              "</button>"
            );
          })
          .join("") +
        "</div>"
      );
    }

    elPainel.innerHTML =
      coluna(ESQUERDA, "esquerda") +
      '<svg class="painel__cabos" aria-hidden="true"></svg>' +
      coluna(DIREITA, "direita") +
      '<p class="painel__instrucao">Arraste um cabo de uma letra da esquerda até o par indicado na chave do dia.</p>';

    elCabos = elPainel.querySelector(".painel__cabos");
    ligarArrasto();
  }

  function montarChaveDoDia() {
    elParesChave.innerHTML = CHAVE_DO_DIA.map(function (par) {
      var feito = estaLigado(par[0]);
      return (
        '<span class="par' +
        (feito ? " par--ligado" : "") +
        '" data-par="' +
        par[0] +
        par[1] +
        '">' +
        par[0] +
        "&ndash;" +
        par[1] +
        "</span>"
      );
    }).join("");
  }

  function estaLigado(letra) {
    return ligados.some(function (c) {
      return c.esq === letra || c.dir === letra;
    });
  }

  function parCorreto(esq, dir) {
    return CHAVE_DO_DIA.some(function (p) {
      return p[0] === esq && p[1] === dir;
    });
  }

  /* Centro de uma tomada, em coordenadas do SVG. */
  function centro(letra) {
    var botao = elPainel.querySelector('.tomada[data-letra="' + letra + '"]');
    if (!botao) return null;
    var furo = botao.querySelector(".tomada__furo");
    var r = furo.getBoundingClientRect();
    var base = elPainel.getBoundingClientRect();
    return {
      x: r.left - base.left + r.width / 2,
      y: r.top - base.top + r.height / 2,
    };
  }

  /* Curva do cabo: desce no meio, como fio pesado pendurado. */
  function curva(a, b) {
    var meioY = Math.max(a.y, b.y) + 26;
    return (
      "M" + a.x + "," + a.y + " C" + (a.x + 60) + "," + meioY + " " +
      (b.x - 60) + "," + meioY + " " + b.x + "," + b.y
    );
  }

  function desenharCabos() {
    if (!elCabos) return;
    var partes = ligados
      .map(function (c) {
        var a = centro(c.esq);
        var b = centro(c.dir);
        if (!a || !b) return "";
        return '<path class="cabo" d="' + curva(a, b) + '" stroke="' + c.cor + '"/>';
      })
      .join("");

    if (arrastando) {
      var origem = centro(arrastando.letra);
      if (origem) {
        partes +=
          '<path class="cabo cabo--arrastando" d="' +
          curva(
            arrastando.lado === "esquerda" ? origem : { x: arrastando.x, y: arrastando.y },
            arrastando.lado === "esquerda" ? { x: arrastando.x, y: arrastando.y } : origem
          ) +
          '" stroke="' + proximaCor() + '"/>';
      }
    }
    elCabos.innerHTML = partes;
  }

  function proximaCor() {
    return CORES_CABO[ligados.length % CORES_CABO.length];
  }

  function marcarTomadas() {
    elPainel.querySelectorAll(".tomada").forEach(function (t) {
      var letra = t.dataset.letra;
      t.classList.toggle("tomada--ligada", estaLigado(letra));
      t.classList.toggle(
        "tomada--selecionada",
        !!selecionada && selecionada.letra === letra
      );
    });
  }

  /* Tenta ligar duas letras. Devolve true se encaixou. */
  function tentarLigar(letraA, ladoA, letraB, ladoB) {
    if (ladoA === ladoB) return false;
    var esq = ladoA === "esquerda" ? letraA : letraB;
    var dir = ladoA === "esquerda" ? letraB : letraA;
    if (estaLigado(esq) || estaLigado(dir)) return false;

    if (!parCorreto(esq, dir)) {
      recusar(letraB);
      return false;
    }

    ligados.push({ esq: esq, dir: dir, cor: proximaCor() });
    R.som.tocar("confirmar");
    atualizarParte1();
    return true;
  }

  function recusar(letra) {
    var t = elPainel.querySelector('.tomada[data-letra="' + letra + '"]');
    if (!t) return;
    t.classList.add("tomada--errada");
    window.setTimeout(function () {
      t.classList.remove("tomada--errada");
    }, 400);
  }

  function atualizarParte1() {
    marcarTomadas();
    desenharCabos();
    montarChaveDoDia();

    if (ligados.length === CHAVE_DO_DIA.length) {
      elInstrucao.textContent =
        "Painel completo. A chave do dia está montada — agora veja o que ela faz.";
      abrirParte2();
    }
  }

  /* ---------- arrasto com ponteiro (mouse, caneta e toque) ---------- */
  function ligarArrasto() {
    elPainel.addEventListener("pointerdown", function (ev) {
      var tomada = ev.target.closest(".tomada");
      if (!tomada || estaLigado(tomada.dataset.letra)) return;
      ev.preventDefault();
      arrastando = {
        letra: tomada.dataset.letra,
        lado: tomada.dataset.lado,
        x: ev.clientX - elPainel.getBoundingClientRect().left,
        y: ev.clientY - elPainel.getBoundingClientRect().top,
      };
      elPainel.setPointerCapture(ev.pointerId);
      desenharCabos();
    });

    elPainel.addEventListener("pointermove", function (ev) {
      if (!arrastando) return;
      var base = elPainel.getBoundingClientRect();
      arrastando.x = ev.clientX - base.left;
      arrastando.y = ev.clientY - base.top;
      desenharCabos();
    });

    function soltar(ev) {
      if (!arrastando) return;
      var alvo = document.elementFromPoint(ev.clientX, ev.clientY);
      var tomada = alvo && alvo.closest ? alvo.closest(".tomada") : null;
      if (tomada) {
        tentarLigar(
          arrastando.letra,
          arrastando.lado,
          tomada.dataset.letra,
          tomada.dataset.lado
        );
      }
      arrastando = null;
      desenharCabos();
    }

    elPainel.addEventListener("pointerup", soltar);
    elPainel.addEventListener("pointercancel", function () {
      arrastando = null;
      desenharCabos();
    });

    /* Clique simples e teclado: seleciona a origem e depois o
       destino. É o caminho de quem não consegue arrastar. */
    elPainel.addEventListener("click", function (ev) {
      var tomada = ev.target.closest(".tomada");
      if (!tomada) return;
      var letra = tomada.dataset.letra;
      var lado = tomada.dataset.lado;
      if (estaLigado(letra)) return;

      if (!selecionada) {
        selecionada = { letra: letra, lado: lado };
      } else if (selecionada.letra === letra) {
        selecionada = null;
      } else {
        tentarLigar(selecionada.letra, selecionada.lado, letra, lado);
        selecionada = null;
      }
      marcarTomadas();
    });
  }

  /* ==========================================================
     Parte 2 — ver o efeito
     ========================================================== */

  function abrirParte2() {
    if (!elPasso2.hidden) return;
    elPasso2.hidden = false;
    elPasso2.scrollIntoView({ behavior: "smooth", block: "nearest" });
    elEntrada.value = PALAVRA_PADRAO;
    cifrar();
  }

  function paresAtuais() {
    return ligados.map(function (c) {
      return [c.esq, c.dir];
    });
  }

  function cifrar() {
    var texto = Enigma.normalizar(elEntrada.value).slice(0, 18);
    if (!texto) {
      elFitaAntes.innerHTML = "";
      elFitaDepois.innerHTML = "";
      return;
    }

    var maquina = Enigma.criar({ posicoes: "AAA", pares: paresAtuais() });
    var saida = maquina.cifrar(texto);
    animarRotores(maquina.janelas());

    if (!fioRetirado) {
      elFitaAntes.textContent = saida;
      elFitaDepois.innerHTML = "";
    } else {
      /* Com um fio a menos: destaca as letras que mudaram em
         relação à cifra feita com o painel completo. */
      var referencia = Enigma.criar({
        posicoes: "AAA",
        pares: CHAVE_DO_DIA,
      }).cifrar(texto);
      elFitaAntes.textContent = referencia;

      elFitaDepois.innerHTML = saida
        .split("")
        .map(function (letra, i) {
          return letra === referencia[i]
            ? letra
            : '<span class="mudou">' + letra + "</span>";
        })
        .join("");

      var diferentes = saida.split("").filter(function (l, i) {
        return l !== referencia[i];
      }).length;
      mostrarConclusao(diferentes, saida.length);
    }
  }

  /* A explicação diz o que realmente aconteceu, inclusive por que
     NÃO mudaram todas as letras. O painel troca as letras só na
     entrada e na saída, antes e depois dos rotores — então um cabo
     a menos afeta apenas as letras que passam por aquelas duas
     posições. O que o painel faz de verdade é multiplicar o número
     de chaves possíveis, e é por isso que ele importava tanto. */
  function mostrarConclusao(diferentes, total) {
    elConclusao.hidden = false;

    var abertura = diferentes
      ? "<strong>" + diferentes + " das " + total +
        " letras mudaram</strong> por causa de um único cabo retirado."
      : "<strong>Desta vez nenhuma letra mudou</strong> — e isso também ensina algo.";

    elConclusao.innerHTML =
      "<p>" + abertura + " Não mudaram todas porque o painel troca as letras " +
      "apenas na entrada e na saída, antes e depois dos rotores: só é afetada " +
      "a letra que passa por um dos dois furos daquele cabo.</p>" +
      "<p>O painel não servia para embaralhar mais, e sim para multiplicar o " +
      "número de chaves. Com os 6 cabos desta atividade já são cerca de " +
      COMBINACOES_6_CABOS + " de combinações; com os 10 cabos do Enigma real, " +
      "cerca de " + COMBINACOES_10_CABOS + ". Era isso que tornava impossível " +
      "testar todas as possibilidades à mão — e por isso a chave do dia " +
      "precisava ser secreta.</p>";
  }

  function animarRotores(janelas) {
    if (!elRotores) return;
    elRotores.querySelectorAll(".rotor").forEach(function (rotor, i) {
      var vao = rotor.querySelector(".rotor__janela span");
      if (vao.textContent === janelas[i]) return;
      vao.textContent = janelas[i];
      rotor.classList.remove("rotor--girando");
      void rotor.offsetWidth;
      rotor.classList.add("rotor--girando");
    });
  }

  /* Quantas letras mudariam se este cabo saísse. */
  function efeitoDoCabo(indice, texto) {
    var referencia = Enigma.criar({ posicoes: "AAA", pares: CHAVE_DO_DIA }).cifrar(texto);
    var pares = paresAtuais().filter(function (_, i) {
      return i !== indice;
    });
    var alternativa = Enigma.criar({ posicoes: "AAA", pares: pares }).cifrar(texto);
    var n = 0;
    for (var i = 0; i < referencia.length; i++) {
      if (referencia[i] !== alternativa[i]) n++;
    }
    return n;
  }

  function retirarFio() {
    if (fioRetirado || !ligados.length) return;

    /* Escolhe o cabo que mais muda a mensagem que está na tela.
       Retirar um cabo qualquer podia não mudar letra nenhuma —
       verdade sobre a máquina, mas péssimo como demonstração. */
    var texto = Enigma.normalizar(elEntrada.value) || PALAVRA_PADRAO;
    var melhor = 0;
    var melhorEfeito = -1;
    ligados.forEach(function (_, i) {
      var efeito = efeitoDoCabo(i, texto);
      if (efeito > melhorEfeito) {
        melhorEfeito = efeito;
        melhor = i;
      }
    });

    fioRetirado = ligados.splice(melhor, 1)[0];
    elBotaoRetirar.disabled = true;
    elBotaoRetirar.textContent = "Fio " + fioRetirado.esq + "–" + fioRetirado.dir + " retirado";
    R.som.tocar("tecla");
    marcarTomadas();
    desenharCabos();
    montarChaveDoDia();
    cifrar();
    elPasso3.hidden = false;
  }

  /* ==========================================================
     Parte 3 — o circuito de Shannon
     ========================================================== */

  function atualizarCircuito() {
    var acesa = modoLogica === "E"
      ? chaves[1] && chaves[2]
      : chaves[1] || chaves[2];

    elLampada.classList.toggle("lampada--acesa", acesa);
    elLampada.textContent = acesa ? "ACESA" : "APAGADA";

    document.querySelectorAll(".chave").forEach(function (b) {
      b.setAttribute("aria-pressed", chaves[b.dataset.chave] ? "true" : "false");
    });
    document.querySelectorAll(".seletor-logica button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.modo === modoLogica ? "true" : "false");
    });

    /* Marca a linha da tabela verdade correspondente ao estado. */
    var linhaAtual = (chaves[1] ? "1" : "0") + (chaves[2] ? "1" : "0");
    elTabela.querySelectorAll("tbody tr").forEach(function (tr) {
      tr.dataset.atual = tr.dataset.estado === linhaAtual ? "sim" : "nao";
      tr.querySelector(".saida").textContent =
        (modoLogica === "E"
          ? tr.dataset.estado === "11"
          : tr.dataset.estado !== "00")
          ? "acende"
          : "apagada";
    });
  }

  /* ==========================================================
     Reinício
     ========================================================== */

  function reiniciar() {
    ligados = [];
    selecionada = null;
    arrastando = null;
    fioRetirado = null;
    chaves = { 1: false, 2: false };
    modoLogica = "E";

    elPasso2.hidden = true;
    elPasso3.hidden = true;
    elConclusao.hidden = true;
    elEntrada.value = "";
    elFitaAntes.textContent = "";
    elFitaDepois.innerHTML = "";
    elBotaoRetirar.disabled = false;
    elBotaoRetirar.textContent = "Retirar um fio";
    elInstrucao.textContent =
      "Arraste um cabo de uma letra da esquerda até o par indicado na chave do dia.";

    elRotores.querySelectorAll(".rotor__janela span").forEach(function (s) {
      s.textContent = "A";
    });

    atualizarParte1();
    atualizarCircuito();
  }

  /* ==========================================================
     Início
     ========================================================== */

  function iniciar() {
    elPainel = document.querySelector(".painel");
    elParesChave = document.querySelector(".chave-do-dia__pares");
    elPasso2 = document.querySelector('[data-passo="2"]');
    elPasso3 = document.querySelector('[data-passo="3"]');
    elEntrada = document.querySelector(".entrada-mensagem");
    elRotores = document.querySelector(".rotores");
    elFitaAntes = document.querySelector(".fita--antes .fita__texto");
    elFitaDepois = document.querySelector(".fita--depois .fita__texto");
    elConclusao = document.querySelector(".conclusao");
    elBotaoRetirar = document.querySelector("[data-retirar]");
    elBotaoReiniciar = document.querySelector("[data-reiniciar]");
    elLampada = document.querySelector(".lampada");
    elTabela = document.querySelector(".tabela-verdade");

    if (!elPainel || !Enigma) {
      console.error("RetroNet fase 1: faltou o painel ou o motor do Enigma");
      return;
    }

    montarPainel();
    elInstrucao = elPainel.querySelector(".painel__instrucao");
    atualizarParte1();

    elEntrada.addEventListener("input", function () {
      cifrar();
      R.som.tocar("tecla");
    });
    elBotaoRetirar.addEventListener("click", retirarFio);
    elBotaoReiniciar.addEventListener("click", reiniciar);

    document.querySelectorAll(".chave").forEach(function (b) {
      b.addEventListener("click", function () {
        chaves[b.dataset.chave] = !chaves[b.dataset.chave];
        R.som.tocar("tecla");
        atualizarCircuito();
      });
    });
    document.querySelectorAll(".seletor-logica button").forEach(function (b) {
      b.addEventListener("click", function () {
        modoLogica = b.dataset.modo;
        atualizarCircuito();
      });
    });

    atualizarCircuito();

    /* Os cabos são desenhados em coordenadas de tela, então
       precisam ser redesenhados quando o layout muda. */
    window.addEventListener("resize", desenharCabos);

    /* Volta ao estado inicial sozinho, para o próximo visitante. */
    R.inatividade.aoReiniciar(reiniciar);
    R.inatividade.iniciar(90);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
