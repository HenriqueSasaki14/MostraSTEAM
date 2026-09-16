/* ============================================================
   RetroNet — Fase 8: ensine a máquina
   ------------------------------------------------------------
   O visitante desenha cinco exemplos de cada categoria, marcando
   qual é qual, e depois desenha um sexto para o modelo tentar
   classificar. O modelo responde com porcentagem de confiança.
   Se errar, o visitante corrige e o acerto melhora.

   O aprendizado é real: classificador.js calcula um centroide de
   verdade a partir dos pixels de cada desenho salvo. Nada aqui é
   animação fingindo que aprendeu.
   ============================================================ */

(function () {
  "use strict";

  var R = window.RetroNet;
  var Classificador = R.Classificador;

  var MINIMO_POR_CATEGORIA = 5;
  /* A galeria mostra "X de 5" — se o limite não for aplicado de
     verdade, o visitante consegue salvar um sexto, sétimo... exemplo
     e o contador passa a mentir. O teto é o próprio mínimo: cinco
     exemplos por categoria é a quantidade que a atividade pede. */
  var MAXIMO_POR_CATEGORIA = MINIMO_POR_CATEGORIA;
  var LADO_CANVAS = 320; /* resolução interna do desenho, em pixels */

  var exemplos = []; /* [{rotulo, vetor, miniatura}] */
  var desenhoAtual = null; /* {vetor, miniatura} do quadro em uso */
  var centroidesAtuais = null;

  var elCanvas, elCtx, elGaleriaA, elGaleriaB, elInputA, elInputB;
  var elBotaoSalvarA, elBotaoSalvarB;
  var elDicaClassificar, elBotaoClassificar, elResultado, elMiniaturaResultado;
  var elVeredito, elBarrasConfianca, elCorrecao, elExplicacao;
  var desenhando = false;
  var pontoAnterior = null;
  var canvasTemTraco = false;

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function nomeRotuloA() {
    return elInputA.value.trim() || "Categoria A";
  }
  function nomeRotuloB() {
    return elInputB.value.trim() || "Categoria B";
  }

  /* ==========================================================
     Desenho no quadro
     ========================================================== */

  function prepararCanvas() {
    elCanvas.width = LADO_CANVAS;
    elCanvas.height = LADO_CANVAS;
    limparQuadro();
  }

  function limparQuadro() {
    elCtx.fillStyle = "#0a0910";
    elCtx.fillRect(0, 0, LADO_CANVAS, LADO_CANVAS);
    elCtx.strokeStyle = "#e4defb";
    elCtx.lineWidth = 14;
    elCtx.lineCap = "round";
    elCtx.lineJoin = "round";
    canvasTemTraco = false;
  }

  function coordenadaLocal(ev) {
    var caixa = elCanvas.getBoundingClientRect();
    var escalaX = elCanvas.width / caixa.width;
    var escalaY = elCanvas.height / caixa.height;
    return {
      x: (ev.clientX - caixa.left) * escalaX,
      y: (ev.clientY - caixa.top) * escalaY,
    };
  }

  function iniciarTraco(ev) {
    ev.preventDefault();
    desenhando = true;
    pontoAnterior = coordenadaLocal(ev);
    /* Um ponto isolado (clique sem arrastar) também deixa marca. */
    elCtx.beginPath();
    elCtx.arc(pontoAnterior.x, pontoAnterior.y, 7, 0, Math.PI * 2);
    elCtx.fillStyle = "#e4defb";
    elCtx.fill();
    canvasTemTraco = true;
    elCanvas.setPointerCapture(ev.pointerId);
  }

  function continuarTraco(ev) {
    if (!desenhando) return;
    var ponto = coordenadaLocal(ev);
    elCtx.beginPath();
    elCtx.moveTo(pontoAnterior.x, pontoAnterior.y);
    elCtx.lineTo(ponto.x, ponto.y);
    elCtx.stroke();
    pontoAnterior = ponto;
    canvasTemTraco = true;
  }

  function terminarTraco() {
    desenhando = false;
    pontoAnterior = null;
  }

  /* ==========================================================
     Canvas → vetor de intensidade → classificador
     ========================================================== */

  function extrairVetor() {
    var dados = elCtx.getImageData(0, 0, LADO_CANVAS, LADO_CANVAS).data;
    var intensidade = new Array(LADO_CANVAS * LADO_CANVAS);
    /* "Tinta" = o quanto o pixel está claro sobre o fundo escuro
       (o traço é claro, o fundo é escuro — luminância serve de
       medida direta de quanto foi desenhado ali). */
    for (var i = 0, p = 0; i < dados.length; i += 4, p++) {
      intensidade[p] = (dados[i] + dados[i + 1] + dados[i + 2]) / (3 * 255);
    }
    return Classificador.normalizar(intensidade, LADO_CANVAS, LADO_CANVAS);
  }

  function miniaturaDoQuadro() {
    var mini = document.createElement("canvas");
    mini.width = 48;
    mini.height = 48;
    mini.getContext("2d").drawImage(elCanvas, 0, 0, 48, 48);
    return mini.toDataURL("image/png");
  }

  /* ==========================================================
     Passo 1 — coletar exemplos
     ========================================================== */

  function contarPorRotulo(rotulo) {
    return exemplos.filter(function (e) {
      return e.rotulo === rotulo;
    }).length;
  }

  function salvarExemplo(rotulo) {
    if (!canvasTemTraco) return;
    if (contarPorRotulo(rotulo) >= MAXIMO_POR_CATEGORIA) return;
    var vetor = extrairVetor();
    exemplos.push({ rotulo: rotulo, vetor: vetor, miniatura: miniaturaDoQuadro() });
    R.som.tocar("confirmar");
    limparQuadro();
    atualizarGalerias();
    atualizarDisponibilidadeClassificar();
  }

  function montarGaleria(elemento, rotulo) {
    var itens = exemplos.filter(function (e) {
      return e.rotulo === rotulo;
    });
    if (!itens.length) {
      elemento.innerHTML = '<p class="galeria__vazia">Nenhum exemplo ainda.</p>';
      return;
    }
    elemento.innerHTML = itens
      .map(function (e) {
        return (
          '<span class="galeria__item"><img src="' +
          e.miniatura +
          '" alt="Exemplo salvo" width="48" height="48"></span>'
        );
      })
      .join("");
  }

  function atualizarGalerias() {
    montarGaleria(elGaleriaA, "A");
    montarGaleria(elGaleriaB, "B");

    document.querySelector("[data-conta-a]").textContent = contarPorRotulo("A");
    document.querySelector("[data-conta-b]").textContent = contarPorRotulo("B");
  }

  function atualizarDisponibilidadeClassificar() {
    var contaA = contarPorRotulo("A");
    var contaB = contarPorRotulo("B");
    var pronto = contaA >= MINIMO_POR_CATEGORIA && contaB >= MINIMO_POR_CATEGORIA;
    /* O botão e a dica aparecem bem ao lado do quadro — nunca é
       preciso rolar a página para desenhar o sexto exemplo, porque
       o quadro nunca sai da tela (ver comentário no index.html). */
    elBotaoClassificar.hidden = !pronto;
    elDicaClassificar.hidden = !pronto;

    /* Trava visível do limite: o botão de salvar desativa assim que
       a categoria bate no teto, em vez de deixar o contador "X de 5"
       virar mentira porque o visitante continuou salvando. */
    var cheiaA = contaA >= MAXIMO_POR_CATEGORIA;
    var cheiaB = contaB >= MAXIMO_POR_CATEGORIA;
    elBotaoSalvarA.disabled = cheiaA;
    elBotaoSalvarB.disabled = cheiaB;
    elBotaoSalvarA.textContent = cheiaA
      ? "Limite de " + MAXIMO_POR_CATEGORIA + " atingido"
      : "Salvar como " + nomeRotuloA();
    elBotaoSalvarB.textContent = cheiaB
      ? "Limite de " + MAXIMO_POR_CATEGORIA + " atingido"
      : "Salvar como " + nomeRotuloB();
  }

  /* ==========================================================
     Passo 2 — classificar
     ========================================================== */

  function classificarDesenho() {
    if (!canvasTemTraco) return;

    var vetor = extrairVetor();
    var miniatura = miniaturaDoQuadro();
    centroidesAtuais = Classificador.treinar(
      exemplos.map(function (e) {
        return { rotulo: e.rotulo, vetor: e.vetor };
      })
    );

    var resultado = Classificador.classificar(vetor, centroidesAtuais);
    desenhoAtual = { vetor: vetor, miniatura: miniatura };

    mostrarResultado(resultado);
    R.som.tocar("confirmar");
  }

  function nomeDoRotulo(codigo) {
    return codigo === "A" ? nomeRotuloA() : nomeRotuloB();
  }

  function mostrarResultado(resultado) {
    elResultado.hidden = false;
    elMiniaturaResultado.src = desenhoAtual.miniatura;

    elVeredito.innerHTML =
      "O modelo acha que isto é <strong>" + esc(nomeDoRotulo(resultado.rotulo)) + "</strong>";

    var ordem = ["A", "B"];
    elBarrasConfianca.innerHTML = ordem
      .map(function (codigo) {
        var pct = resultado.confiancas[codigo] || 0;
        return (
          '<div class="barra-confianca">' +
          '<span class="barra-confianca__nome">' +
          esc(nomeDoRotulo(codigo)) +
          "</span>" +
          '<span class="barra-confianca__trilho">' +
          '<span class="barra-confianca__preenchimento" style="width:' +
          pct +
          '%"></span>' +
          "</span>" +
          '<span class="barra-confianca__numero">' +
          pct +
          "%</span>" +
          "</div>"
        );
      })
      .join("");

    elCorrecao.innerHTML =
      "<p>Não era isso?</p>" +
      '<button type="button" class="botao8" data-corrigir="A">Era ' +
      esc(nomeRotuloA()) +
      "</button>" +
      '<button type="button" class="botao8" data-corrigir="B">Era ' +
      esc(nomeRotuloB()) +
      "</button>";

    elCorrecao.querySelectorAll("[data-corrigir]").forEach(function (b) {
      b.addEventListener("click", function () {
        corrigir(b.dataset.corrigir);
      });
    });

    elExplicacao.hidden = false;
  }

  function corrigir(rotuloCorreto) {
    /* A correção é o próprio aprendizado: o desenho errado entra
       no conjunto de treino com o rótulo certo, o centroide é
       recalculado, e a próxima classificação já usa esse reforço. */
    exemplos.push({
      rotulo: rotuloCorreto,
      vetor: desenhoAtual.vetor,
      miniatura: desenhoAtual.miniatura,
    });
    atualizarGalerias();
    R.som.tocar("tecla");

    centroidesAtuais = Classificador.treinar(
      exemplos.map(function (e) {
        return { rotulo: e.rotulo, vetor: e.vetor };
      })
    );
    var novoResultado = Classificador.classificar(desenhoAtual.vetor, centroidesAtuais);
    mostrarResultado(novoResultado);

    elCorrecao.insertAdjacentHTML(
      "afterbegin",
      '<p style="width:100%;color:var(--destaque-texto)">Obrigado — o modelo já aprendeu com essa correção.</p>'
    );
  }

  /* ==========================================================
     Reinício
     ========================================================== */

  function reiniciar() {
    exemplos = [];
    desenhoAtual = null;
    centroidesAtuais = null;
    limparQuadro();
    elResultado.hidden = true;
    elExplicacao.hidden = true;
    elInputA.value = "Círculo";
    elInputB.value = "Quadrado";
    atualizarGalerias();
    atualizarDisponibilidadeClassificar();
  }

  /* ==========================================================
     Início
     ========================================================== */

  function iniciar() {
    elCanvas = document.querySelector(".quadro");
    if (!elCanvas || !Classificador) return;
    elCtx = elCanvas.getContext("2d");

    elGaleriaA = document.querySelector('[data-galeria="A"]');
    elGaleriaB = document.querySelector('[data-galeria="B"]');
    elInputA = document.querySelector('[data-rotulo="A"]');
    elInputB = document.querySelector('[data-rotulo="B"]');
    elBotaoSalvarA = document.querySelector("[data-salvar-a]");
    elBotaoSalvarB = document.querySelector("[data-salvar-b]");
    elDicaClassificar = document.querySelector(".dica-classificar");
    elBotaoClassificar = document.querySelector("[data-classificar]");
    elResultado = document.querySelector(".resultado");
    elMiniaturaResultado = document.querySelector(".resultado__miniatura img");
    elVeredito = document.querySelector(".resultado__veredito");
    elBarrasConfianca = document.querySelector(".barras-confianca");
    elCorrecao = document.querySelector(".correcao");
    elExplicacao = document.querySelector(".explicacao-modelo");

    prepararCanvas();

    elCanvas.addEventListener("pointerdown", iniciarTraco);
    elCanvas.addEventListener("pointermove", continuarTraco);
    elCanvas.addEventListener("pointerup", terminarTraco);
    elCanvas.addEventListener("pointercancel", terminarTraco);

    document.querySelector("[data-limpar-quadro]").addEventListener("click", limparQuadro);

    elBotaoSalvarA.addEventListener("click", function () {
      salvarExemplo("A");
    });
    elBotaoSalvarB.addEventListener("click", function () {
      salvarExemplo("B");
    });

    /* Os textos dos botões e da galeria acompanham o nome que o
       visitante escolher para cada categoria — exceto quando a
       categoria já bateu no teto, caso em que o botão precisa
       continuar mostrando "limite atingido" (ver
       atualizarDisponibilidadeClassificar). */
    function atualizarRotulos() {
      if (!elBotaoSalvarA.disabled) elBotaoSalvarA.textContent = "Salvar como " + nomeRotuloA();
      if (!elBotaoSalvarB.disabled) elBotaoSalvarB.textContent = "Salvar como " + nomeRotuloB();
      document.querySelector('[data-titulo-categoria="A"]').textContent = nomeRotuloA();
      document.querySelector('[data-titulo-categoria="B"]').textContent = nomeRotuloB();
    }
    elInputA.addEventListener("input", atualizarRotulos);
    elInputB.addEventListener("input", atualizarRotulos);
    atualizarRotulos();

    elBotaoClassificar.addEventListener("click", classificarDesenho);

    var elBotaoReiniciar = document.querySelector("[data-reiniciar]");
    if (elBotaoReiniciar) elBotaoReiniciar.addEventListener("click", reiniciar);

    atualizarGalerias();

    R.inatividade.aoReiniciar(reiniciar);
    R.inatividade.iniciar(120); /* atividade mais longa: mais tempo antes de reiniciar */
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
