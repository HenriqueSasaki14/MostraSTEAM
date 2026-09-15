/* ============================================================
   RetroNet — motor do Enigma (fase 1)
   ------------------------------------------------------------
   Cifra de verdade. Não é uma animação fingindo cifrar: a letra
   entra, atravessa painel de fios, três rotores e o refletor, e
   volta pelo caminho inverso. Retirar um fio muda o resultado
   porque o caminho elétrico realmente muda.

   Fiação histórica das peças (dado público, documentado):
     Rotor I    EKMFLGDQVZNTOWYHXUSPAIBRCJ   entalhe Q
     Rotor II   AJDKSIRUXBLHWTMCQGZNPYFVOE   entalhe E
     Rotor III  BDFHJLCPRTXVZNYEIWGAKMUSQO   entalhe V
     Refletor B YRUHQSLDPXNGOKMIEBFZCWVJAT

   Confira o motor abrindo enigma-teste.html: ele roda os casos
   de verificação e diz se algum quebrou.
   ============================================================ */

window.RetroNet = window.RetroNet || {};

window.RetroNet.Enigma = (function () {
  "use strict";

  var A = 65; // código da letra A
  var ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  var ROTORES = {
    I: { fiacao: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", entalhe: "Q" },
    II: { fiacao: "AJDKSIRUXBLHWTMCQGZNPYFVOE", entalhe: "E" },
    III: { fiacao: "BDFHJLCPRTXVZNYEIWGAKMUSQO", entalhe: "V" },
  };

  var REFLETOR_B = "YRUHQSLDPXNGOKMIEBFZCWVJAT";

  function indice(letra) {
    return letra.charCodeAt(0) - A;
  }

  function letra(indice) {
    return String.fromCharCode(A + ((indice % 26) + 26) % 26);
  }

  /* ----------------------------------------------------------
     Um rotor: fiação para a frente e o caminho inverso já
     pré-calculado, para não recalcular a cada letra.
     ---------------------------------------------------------- */
  function criarRotor(nome, posicaoInicial) {
    var modelo = ROTORES[nome];
    var frente = modelo.fiacao.split("").map(indice);
    var tras = [];
    frente.forEach(function (destino, origem) {
      tras[destino] = origem;
    });

    return {
      nome: nome,
      posicao: indice(posicaoInicial || "A"),
      entalhe: indice(modelo.entalhe),

      /* Está no entalhe? Se sim, o próximo passo também gira o
         rotor da esquerda. */
      noEntalhe: function () {
        return this.posicao === this.entalhe;
      },

      girar: function () {
        this.posicao = (this.posicao + 1) % 26;
      },

      /* O sinal entra deslocado pela posição do rotor e sai
         desfazendo esse deslocamento. */
      passar: function (sinal, paraTras) {
        var entrada = (sinal + this.posicao + 26) % 26;
        var saida = paraTras ? tras[entrada] : frente[entrada];
        return (saida - this.posicao + 26) % 26;
      },
    };
  }

  /* ----------------------------------------------------------
     Painel de fios (Steckerbrett).
     Recebe os pares ligados, por exemplo [["A","R"],["B","N"]],
     e troca as letras nos dois sentidos. Letra sem fio passa
     direto. É exatamente por isso que tirar um fio muda tudo.
     ---------------------------------------------------------- */
  function criarPainel(pares) {
    var mapa = {};
    (pares || []).forEach(function (par) {
      if (!par || par.length !== 2) return;
      mapa[par[0]] = par[1];
      mapa[par[1]] = par[0];
    });
    return function (letraEntrada) {
      return mapa[letraEntrada] || letraEntrada;
    };
  }

  /* ----------------------------------------------------------
     Avanço dos rotores, com o "passo duplo" do Enigma real:
     quando o rotor do meio está no entalhe, ele gira junto com
     o da direita — e leva o da esquerda junto.
     ---------------------------------------------------------- */
  function avancar(esquerdo, meio, direito) {
    if (meio.noEntalhe()) {
      meio.girar();
      esquerdo.girar();
    } else if (direito.noEntalhe()) {
      meio.girar();
    }
    direito.girar();
  }

  /* ----------------------------------------------------------
     Máquina completa.
       config.rotores   ["I","II","III"] da esquerda para a direita
       config.posicoes  "AAA"
       config.pares     [["A","R"], ...]
     ---------------------------------------------------------- */
  function criarMaquina(config) {
    config = config || {};
    var nomes = config.rotores || ["I", "II", "III"];
    var posicoes = (config.posicoes || "AAA").toUpperCase();

    var esquerdo = criarRotor(nomes[0], posicoes[0]);
    var meio = criarRotor(nomes[1], posicoes[1]);
    var direito = criarRotor(nomes[2], posicoes[2]);
    var painel = criarPainel(config.pares);
    var refletor = REFLETOR_B.split("").map(indice);

    return {
      /* Posições atuais, para desenhar as janelinhas dos rotores. */
      janelas: function () {
        return letra(esquerdo.posicao) + letra(meio.posicao) + letra(direito.posicao);
      },

      /* Cifra uma letra. Toda tecla gira os rotores ANTES de
         fechar o circuito — por isso a mesma letra digitada duas
         vezes seguidas sai diferente. */
      cifrarLetra: function (entrada) {
        if (!/[A-Z]/.test(entrada)) return entrada;

        avancar(esquerdo, meio, direito);

        var sinal = indice(painel(entrada));
        sinal = direito.passar(sinal, false);
        sinal = meio.passar(sinal, false);
        sinal = esquerdo.passar(sinal, false);
        sinal = refletor[sinal];
        sinal = esquerdo.passar(sinal, true);
        sinal = meio.passar(sinal, true);
        sinal = direito.passar(sinal, true);

        return painel(letra(sinal));
      },

      cifrar: function (texto) {
        var saida = "";
        for (var i = 0; i < texto.length; i++) {
          saida += this.cifrarLetra(texto[i]);
        }
        return saida;
      },
    };
  }

  /* Tira acento, deixa maiúsculo e joga fora o que não for letra:
     o Enigma só conhece as 26 letras do alfabeto. */
  function normalizar(texto) {
    return (texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
  }

  return {
    criar: criarMaquina,
    normalizar: normalizar,
    ALFABETO: ALFABETO,

    /* Casos de verificação. O primeiro é o valor conhecido de
       referência para rotores I-II-III, refletor B, posições AAA
       e painel vazio. Os outros checam propriedades da máquina. */
    testar: function () {
      var resultados = [];

      function checar(nome, obtido, esperado) {
        resultados.push({
          nome: nome,
          obtido: obtido,
          esperado: esperado,
          passou: String(obtido) === String(esperado),
        });
      }

      checar(
        "AAAAA com painel vazio vira BDZGO",
        criarMaquina({ posicoes: "AAA" }).cifrar("AAAAA"),
        "BDZGO"
      );

      /* A cifra é recíproca: cifrar o texto cifrado com a mesma
         configuração devolve o original. Era assim que o receptor
         decifrava. */
      var m1 = criarMaquina({ posicoes: "AAA", pares: [["A", "R"], ["B", "N"]] });
      var cifrado = m1.cifrar("ATAQUEAOAMANHECER");
      var m2 = criarMaquina({ posicoes: "AAA", pares: [["A", "R"], ["B", "N"]] });
      checar("cifrar duas vezes volta ao original", m2.cifrar(cifrado), "ATAQUEAOAMANHECER");

      /* Nenhuma letra pode virar ela mesma — falha do projeto do
         Enigma que os criptoanalistas exploraram. */
      var m3 = criarMaquina({ posicoes: "AAA" });
      var nenhumaIgual = true;
      for (var i = 0; i < 26; i++) {
        var entrada = letra(i);
        if (m3.cifrarLetra(entrada) === entrada) nenhumaIgual = false;
      }
      checar("nenhuma letra vira ela mesma", nenhumaIgual, true);

      /* Tirar um fio precisa mudar o resultado — é o ponto que a
         atividade inteira quer ensinar. */
      var todos = [["A", "R"], ["B", "N"], ["C", "K"], ["D", "S"], ["E", "L"], ["F", "T"]];
      var comTodos = criarMaquina({ posicoes: "AAA", pares: todos }).cifrar("RETRONET");
      var semUm = criarMaquina({ posicoes: "AAA", pares: todos.slice(1) }).cifrar("RETRONET");
      checar("tirar um fio muda a cifra", comTodos !== semUm, true);

      /* O passo duplo do rotor do meio. Partindo de ADU, quatro
         letras depois a máquina precisa estar em BFY. */
      var m4 = criarMaquina({ posicoes: "ADU" });
      m4.cifrar("XXXX");
      checar("passo duplo dos rotores", m4.janelas(), "BFY");

      return resultados;
    },
  };
})();
