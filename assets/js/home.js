/* ============================================================
   RetroNet — comportamentos só da página inicial
   Monta o trilho das oito fases e liga o botão "Ver todas as
   fases" ao menu do cabeçalho.
   ============================================================ */

(function () {
  "use strict";

  var R = window.RetroNet || {};

  function montarTrilho() {
    var lista = document.querySelector(".trilho__lista");
    if (!lista || !R.FASES) return;

    lista.innerHTML = R.FASES.map(function (fase) {
      return (
        '<a class="trilho__item" style="--cor-item:' +
        fase.cor +
        /* Aponta para o arquivo, e não para a pasta: por file:// o
           navegador mostraria a listagem do diretório. */
        '" href="fases/' +
        fase.pasta +
        '/index.html" data-cor="' +
        fase.cor +
        '">' +
        '<span class="trilho__numero">FASE ' +
        String(fase.numero).padStart(2, "0") +
        "</span>" +
        '<span class="trilho__epoca">' +
        fase.epoca +
        "</span>" +
        "</a>"
      );
    }).join("");
  }

  /* O botão da home reaproveita o menu já montado pela moldura,
     em vez de ter uma segunda lista de fases para manter. */
  function ligarBotaoDoMenu() {
    var botao = document.querySelector("[data-abrir-menu]");
    if (!botao) return;
    botao.addEventListener("click", function () {
      var botaoDaMoldura = document.querySelector(".acao--menu");
      if (botaoDaMoldura) botaoDaMoldura.click();
    });
  }

  function iniciar() {
    montarTrilho();
    ligarBotaoDoMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
