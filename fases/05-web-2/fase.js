/* ============================================================
   RetroNet — Fase 5: perfil retrô
   ------------------------------------------------------------
   Micro-interação: o visitante publica um recado num mural no
   estilo dos anos 2000 (Orkut, MSN, primeiro Facebook) e vê
   comentários de "amigos" aparecerem em seguida, com o indicador
   de "digitando..." antes de cada um — a mesma UX que a AJAX
   trouxe: atualizar parte da página sem recarregar tudo.

   O recado do visitante é real (o texto que ele digitou, exibido
   de verdade). As respostas que "chegam depois" são simuladas —
   isso fica dito na tela, sem fingir que são pessoas de verdade.
   ============================================================ */

(function () {
  "use strict";

  var R = window.RetroNet;

  /* Todas com pelo menos 4,5:1 de contraste contra texto branco. */
  var CORES_AVATAR = ["#1670a8", "#7a3fa0", "#0d8366", "#b3591b", "#9c3b52"];

  var EMOTICONS = [":)", ":D", "<3", "xD", ":o", ";)"];

  /* Respostas simuladas dos "amigos". Cada uma reage a algo do
     texto do visitante quando possível, senão usa um comentário
     genérico de mural da época. */
  var AMIGOS = [
    { nome: "Marina_2004", generica: "aee crlh vc sumiu! manda scrap depois :)" },
    { nome: "PedroHC", generica: "top demais, adicionei nos favoritos xD" },
    { nome: "ju.retro", generica: "kkkkkk mt bom!! bjs <3" },
    { nome: "diego_orkut", generica: "posta mais! e entra na comunidade tbm ;)" },
  ];

  var elLista, elForm, elTextarea, elBotao, elContadorRecados;
  var totalRecados = 0;
  var relogios = [];

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function iniciais(nome) {
    return nome.slice(0, 2).toUpperCase();
  }

  function avatar(nome, cor) {
    return (
      '<span class="recado__avatar" style="background:' +
      cor +
      '" aria-hidden="true">' +
      esc(iniciais(nome)) +
      "</span>"
    );
  }

  function limparVazio() {
    var vazio = elLista.querySelector(".mural__vazio");
    if (vazio) vazio.remove();
  }

  function adicionarRecado(nome, texto, proprio) {
    limparVazio();
    var cor = CORES_AVATAR[totalRecados % CORES_AVATAR.length];
    var item = document.createElement("div");
    item.className = "recado" + (proprio ? " recado--proprio" : "");
    item.innerHTML =
      avatar(nome, cor) +
      '<div class="recado__corpo">' +
      '<div class="recado__nome">' +
      esc(nome) +
      "</div>" +
      '<div class="recado__texto">' +
      esc(texto) +
      "</div>" +
      '<div class="recado__quando">agora mesmo</div>' +
      "</div>";
    elLista.appendChild(item);
    totalRecados++;
    if (elContadorRecados) elContadorRecados.textContent = totalRecados;
  }

  function mostrarDigitando(nome, cor) {
    var item = document.createElement("div");
    item.className = "recado";
    item.innerHTML =
      avatar(nome, cor) +
      '<div class="recado__corpo digitando">' +
      esc(nome) +
      " está digitando" +
      '<span class="digitando__pontos"><span></span><span></span><span></span></span>' +
      "</div>";
    elLista.appendChild(item);
    return item;
  }

  function publicar() {
    var texto = elTextarea.value.trim();
    if (!texto) return;

    adicionarRecado("Você", texto, true);
    elTextarea.value = "";
    R.som.tocar("confirmar");

    /* Escolhe de 1 a 2 amigos, sorteados, para "responder". */
    var quantos = 1 + Math.floor(Math.random() * 2);
    var escolhidos = AMIGOS.slice().sort(function () {
      return Math.random() - 0.5;
    }).slice(0, quantos);

    escolhidos.forEach(function (amigo, i) {
      var atraso = 700 + i * 1400;
      var t1 = window.setTimeout(function () {
        var cor = CORES_AVATAR[(totalRecados + i) % CORES_AVATAR.length];
        var elDigitando = mostrarDigitando(amigo.nome, cor);
        var t2 = window.setTimeout(function () {
          elDigitando.remove();
          adicionarRecado(amigo.nome, amigo.generica, false);
          R.som.tocar("tecla");
        }, 1100);
        relogios.push(t2);
      }, atraso);
      relogios.push(t1);
    });
  }

  function inserirEmoticon(simbolo) {
    var inicio = elTextarea.selectionStart || elTextarea.value.length;
    var fim = elTextarea.selectionEnd || elTextarea.value.length;
    var valor = elTextarea.value;
    elTextarea.value = valor.slice(0, inicio) + " " + simbolo + " " + valor.slice(fim);
    elTextarea.focus();
    R.som.tocar("tecla");
  }

  /* ==========================================================
     Reinício
     ========================================================== */

  function reiniciar() {
    relogios.forEach(window.clearTimeout);
    relogios = [];
    totalRecados = 0;
    if (elContadorRecados) elContadorRecados.textContent = "0";
    elLista.innerHTML = '<p class="mural__vazio">Nenhum recado ainda. Seja o primeiro!</p>';
    elTextarea.value = "";
  }

  /* ==========================================================
     Início
     ========================================================== */

  function montarEmoticons() {
    var caixa = document.querySelector(".emoticons");
    if (!caixa) return;
    caixa.innerHTML = EMOTICONS.map(function (simbolo) {
      return (
        '<button type="button" aria-label="Inserir ' +
        esc(simbolo) +
        '">' +
        esc(simbolo) +
        "</button>"
      );
    }).join("");
    caixa.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        inserirEmoticon(b.textContent);
      });
    });
  }

  function iniciar() {
    elLista = document.querySelector(".recados");
    elForm = document.querySelector(".recado-form");
    elTextarea = document.querySelector(".recado-form textarea");
    elBotao = document.querySelector("[data-publicar]");
    elContadorRecados = document.querySelector("[data-contador-recados]");

    if (!elLista || !elForm) return;

    elForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      publicar();
    });

    montarEmoticons();

    var elBotaoReiniciar = document.querySelector("[data-reiniciar]");
    if (elBotaoReiniciar) elBotaoReiniciar.addEventListener("click", reiniciar);

    R.inatividade.aoReiniciar(reiniciar);
    R.inatividade.iniciar(90);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
