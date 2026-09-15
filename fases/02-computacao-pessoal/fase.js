/* ============================================================
   RetroNet — Fase 2: dez linhas de BASIC
   ------------------------------------------------------------
   Uma tela de Apple II com cursor piscando e um cartão de missões
   ao lado. O visitante digita comandos reais e o interpretador de
   basic.js executa. Erro de sintaxe devolve ?SYNTAX ERROR, como
   no original.

   As três missões da modelagem:
     1. fazer o próprio nome aparecer
     2. fazer aparecer infinitas vezes
     3. fazer aparecer exatamente dez vezes

   Cada missão é conferida olhando o programa E o resultado — não
   basta escrever o comando certo, tem que rodar e produzir a
   saída certa.
   ============================================================ */

(function () {
  "use strict";

  var R = window.RetroNet;
  var Basic = R.Basic;

  var ABERTURA =
    "APPLE ][\n\n" +
    "DOS VERSION 3.3  SYSTEM MASTER\n\n" +
    "]";

  var PROGRAMA_INICIAL = '10 PRINT "SEU NOME"\n';

  var elTela, elEditor, elMissoes, elBotaoRodar, elBotaoLimpar, elBotaoFita;
  var missoesCumpridas = {};

  /* ----------------------------------------------------------
     As três missões.
     "verificar" recebe o programa digitado e o resultado da
     execução, e decide se a missão foi cumprida.
     ---------------------------------------------------------- */
  var MISSOES = [
    {
      id: 1,
      titulo: "Faça o seu nome aparecer",
      dica: 'Use PRINT com o texto entre aspas. Ex.: 10 PRINT "ANA"',
      verificar: function (programa, resultado) {
        /* Precisa imprimir alguma coisa que não seja o exemplo. */
        return (
          resultado.saida.length >= 1 &&
          resultado.saida.some(function (l) {
            return l.trim() && l.trim().toUpperCase() !== "SEU NOME";
          })
        );
      },
    },
    {
      id: 2,
      titulo: "Faça aparecer infinitas vezes",
      dica: "GOTO manda o programa voltar para uma linha anterior.",
      verificar: function (programa, resultado) {
        /* O sinal de laço infinito é o interpretador ter cortado a
           execução no limite de passos. */
        return /\bGOTO\b/i.test(programa) && resultado.cortado === true;
      },
    },
    {
      id: 3,
      titulo: "Agora faça aparecer exatamente dez vezes",
      dica: "FOR I = 1 TO 10 ... NEXT I repete um trecho dez vezes.",
      verificar: function (programa, resultado) {
        var naoVazias = resultado.saida.filter(function (l) {
          return l.trim();
        });
        return (
          !resultado.cortado &&
          naoVazias.length === 10 &&
          naoVazias.every(function (l) {
            return l === naoVazias[0];
          })
        );
      },
    },
  ];

  /* ==========================================================
     Tela
     ========================================================== */

  function esc(txt) {
    return String(txt).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  function escrever(html) {
    elTela.innerHTML = html + '<span class="tela__cursor" aria-hidden="true"></span>';
    elTela.scrollTop = elTela.scrollHeight;
  }

  function telaInicial() {
    escrever(esc(ABERTURA));
  }

  /* ==========================================================
     Rodar
     ========================================================== */

  function rodar() {
    var programa = elEditor.value;
    var resultado = Basic.executar(programa);

    var linhas = ["]RUN", ""];

    if (resultado.erro) {
      resultado.saida.forEach(function (l) {
        linhas.push(l);
      });
      var msg = "?" + resultado.erro.mensagem;
      if (resultado.erro.linha !== undefined && resultado.erro.linha !== "") {
        msg += " IN " + resultado.erro.linha;
      }
      escrever(
        esc(linhas.join("\n")) +
          '\n<span class="tela__erro">' +
          esc(msg) +
          "</span>\n\n]"
      );
      R.som.tocar("tecla");
      atualizarMissoes(programa, resultado);
      return;
    }

    resultado.saida.forEach(function (l) {
      linhas.push(l);
    });

    var rodape = "";
    if (resultado.cortado) {
      rodape =
        '\n<span class="tela__aviso">' +
        esc(
          "*** PROGRAMA INTERROMPIDO ***\n" +
            "Estava rodando para sempre. No Apple II de verdade\n" +
            "era assim mesmo: só o botão RESET parava."
        ) +
        "</span>";
    }

    escrever(esc(linhas.join("\n")) + rodape + "\n\n]");
    R.som.tocar("confirmar");
    atualizarMissoes(programa, resultado);
  }

  /* ==========================================================
     Missões
     ========================================================== */

  function montarMissoes() {
    elMissoes.innerHTML =
      '<p class="missoes__titulo">Cartão de missões</p>' +
      MISSOES.map(function (m) {
        return (
          '<div class="missao" data-missao="' +
          m.id +
          '">' +
          '<span class="missao__marca" aria-hidden="true">✓</span>' +
          '<span class="missao__texto">' +
          '<span class="missao__titulo">' +
          m.id +
          ". " +
          esc(m.titulo) +
          "</span>" +
          '<span class="missao__dica">' +
          esc(m.dica) +
          "</span>" +
          "</span></div>"
        );
      }).join("") +
      '<div class="missoes__ajuda">' +
      "<p>Comandos que a máquina entende:<br>" +
      "<code>PRINT</code> escreve &middot; <code>GOTO</code> salta &middot; " +
      "<code>FOR</code>/<code>NEXT</code> repete &middot; <code>LET</code> guarda um valor &middot; " +
      "<code>IF … THEN</code> decide &middot; <code>END</code> encerra.<br>" +
      "Toda linha começa com um número.</p>" +
      "</div>";
  }

  function atualizarMissoes(programa, resultado) {
    MISSOES.forEach(function (m) {
      if (missoesCumpridas[m.id]) return;
      var ok = false;
      try {
        ok = m.verificar(programa, resultado);
      } catch (e) {
        ok = false;
      }
      if (!ok) return;

      missoesCumpridas[m.id] = true;
      var el = elMissoes.querySelector('[data-missao="' + m.id + '"]');
      if (el) el.classList.add("missao--cumprida");
      R.som.tocar("confirmar");
    });
  }

  /* ==========================================================
     Som de fita cassete
     ------------------------------------------------------------
     Antes do disquete, o programa vinha gravado em fita K7 e
     demorava minutos carregando, chiando. O botão deixa o
     visitante ouvir isso sem que o site apite sozinho.
     ========================================================== */

  function carregarFita() {
    var linhas = [
      "]LOAD",
      "",
      "CARREGANDO DA FITA CASSETE...",
    ];
    escrever(esc(linhas.join("\n")));
    R.som.tocar("travessia");

    var pontos = 0;
    var relogio = window.setInterval(function () {
      pontos++;
      escrever(esc(linhas.join("\n") + "\n" + ".".repeat(pontos)));
      R.som.tocar("tecla");
      if (pontos >= 18) {
        window.clearInterval(relogio);
        escrever(
          esc(
            linhas.join("\n") +
              "\n" +
              ".".repeat(pontos) +
              "\n\nPRONTO.\n\n" +
              "Em 1979 isto levava de 3 a 5 minutos de verdade,\n" +
              "chiando o tempo todo. Errou um byte? Rebobina e\n" +
              "carrega tudo de novo.\n\n]"
          )
        );
      }
    }, 90);
  }

  /* ==========================================================
     Reinício
     ========================================================== */

  function reiniciar() {
    missoesCumpridas = {};
    elEditor.value = PROGRAMA_INICIAL;
    elMissoes.querySelectorAll(".missao").forEach(function (m) {
      m.classList.remove("missao--cumprida");
    });
    telaInicial();
  }

  /* ==========================================================
     Início
     ========================================================== */

  function iniciar() {
    elTela = document.querySelector(".tela__texto");
    elEditor = document.querySelector(".editor textarea");
    elMissoes = document.querySelector(".missoes");
    elBotaoRodar = document.querySelector("[data-rodar]");
    elBotaoLimpar = document.querySelector("[data-limpar]");
    elBotaoFita = document.querySelector("[data-fita]");

    if (!elTela || !Basic) {
      console.error("RetroNet fase 2: faltou a tela ou o interpretador BASIC");
      return;
    }

    montarMissoes();
    elEditor.value = PROGRAMA_INICIAL;
    telaInicial();

    elBotaoRodar.addEventListener("click", rodar);
    elBotaoLimpar.addEventListener("click", reiniciar);
    elBotaoFita.addEventListener("click", carregarFita);

    /* Ctrl+Enter roda, como em qualquer editor moderno. O Apple II
       não tinha isso, mas quem usa o site hoje espera. */
    elEditor.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        rodar();
      }
    });

    elEditor.addEventListener("input", function () {
      R.som.tocar("tecla");
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
