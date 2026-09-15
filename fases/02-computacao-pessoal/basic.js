/* ============================================================
   RetroNet — interpretador BASIC (fase 2)
   ------------------------------------------------------------
   Executa de verdade o que o visitante digita. Não é uma
   animação fingindo rodar: o programa é analisado, as linhas são
   guardadas numeradas, e o laço é executado passo a passo.

   Comandos aceitos (é o que a modelagem pede, mais o mínimo para
   os três desafios fazerem sentido):

     PRINT "texto"        escreve na tela
     PRINT A              escreve o valor da variável
     LET A = 1            define variável (LET é opcional)
     GOTO 10              salta para a linha
     FOR I = 1 TO 10      abre laço
     NEXT I               fecha laço
     IF A > 5 THEN GOTO 40
     END                  encerra
     REM comentário       ignorado

   Erro de sintaxe devolve ?SYNTAX ERROR IN <linha>, como no
   Applesoft BASIC do Apple II.

   Confira rodando: node fases/02-computacao-pessoal/basic.js
   ============================================================ */

(function (raiz) {
  "use strict";

  /* Limite de passos: sem isso, GOTO 10 apontando para si mesmo
     travaria a aba do navegador. O Apple II também travava, mas
     lá dava para apertar RESET. */
  var MAX_PASSOS = 20000;
  var MAX_SAIDA = 400; // linhas impressas antes de cortar

  function ErroBasic(mensagem, linha) {
    this.mensagem = mensagem;
    this.linha = linha;
  }

  /* ----------------------------------------------------------
     Análise: transforma o texto digitado em linhas numeradas,
     ordenadas pelo número, como o BASIC fazia.
     ---------------------------------------------------------- */
  function analisar(texto) {
    var linhas = [];
    (texto || "").split("\n").forEach(function (bruta) {
      var limpa = bruta.trim();
      if (!limpa) return;

      var m = limpa.match(/^(\d+)\s*(.*)$/);
      if (!m) {
        /* Sem número de linha o Applesoft executava na hora; aqui
           tratamos como erro, porque os desafios pedem programa. */
        throw new ErroBasic("SYNTAX ERROR", limpa.split(/\s+/)[0]);
      }
      linhas.push({ numero: Number(m[1]), texto: m[2].trim() });
    });

    linhas.sort(function (a, b) {
      return a.numero - b.numero;
    });
    return linhas;
  }

  /* ----------------------------------------------------------
     Avaliação de expressões. Só o necessário: números, variáveis
     de uma letra, texto entre aspas, + - * / e comparações.
     Não usamos eval: um site de amostra não vai executar texto
     arbitrário do visitante.
     ---------------------------------------------------------- */
  function avaliar(expressao, variaveis, numeroLinha) {
    var exp = String(expressao).trim();

    /* Texto literal */
    var texto = exp.match(/^"([^"]*)"$/);
    if (texto) return texto[1];

    /* Junta texto com ponto e vírgula: PRINT "OI ";A */
    if (exp.indexOf(";") !== -1) {
      return exp
        .split(";")
        .map(function (parte) {
          return parte.trim() ? avaliar(parte, variaveis, numeroLinha) : "";
        })
        .join("");
    }

    /* Aritmética e comparação, da esquerda para a direita, com
       precedência de * / sobre + -. */
    var fichas = exp.match(/(<=|>=|<>|[<>=]|[-+*/()]|"[^"]*"|[A-Za-z][A-Za-z0-9]*|\d+\.?\d*)/g);
    if (!fichas) throw new ErroBasic("SYNTAX ERROR", numeroLinha);

    var pos = 0;

    function proximo() {
      return fichas[pos];
    }

    function consumir() {
      return fichas[pos++];
    }

    function fator() {
      var f = consumir();
      if (f === undefined) throw new ErroBasic("SYNTAX ERROR", numeroLinha);
      if (f === "(") {
        var v = comparacao();
        if (consumir() !== ")") throw new ErroBasic("SYNTAX ERROR", numeroLinha);
        return v;
      }
      if (f === "-") return -fator();
      if (/^"/.test(f)) return f.slice(1, -1);
      if (/^\d/.test(f)) return parseFloat(f);
      if (/^[A-Za-z]/.test(f)) {
        var nome = f.toUpperCase();
        if (!(nome in variaveis)) return 0; /* variável nova vale 0 */
        return variaveis[nome];
      }
      throw new ErroBasic("SYNTAX ERROR", numeroLinha);
    }

    function termo() {
      var v = fator();
      while (proximo() === "*" || proximo() === "/") {
        var op = consumir();
        var d = fator();
        v = op === "*" ? v * d : v / d;
      }
      return v;
    }

    function soma() {
      var v = termo();
      while (proximo() === "+" || proximo() === "-") {
        var op = consumir();
        var d = termo();
        v = op === "+" ? (typeof v === "string" ? v + d : v + d) : v - d;
      }
      return v;
    }

    function comparacao() {
      var v = soma();
      var op = proximo();
      if (op === "=" || op === "<" || op === ">" || op === "<=" || op === ">=" || op === "<>") {
        consumir();
        var d = soma();
        if (op === "=") return v === d ? 1 : 0;
        if (op === "<") return v < d ? 1 : 0;
        if (op === ">") return v > d ? 1 : 0;
        if (op === "<=") return v <= d ? 1 : 0;
        if (op === ">=") return v >= d ? 1 : 0;
        return v !== d ? 1 : 0;
      }
      return v;
    }

    var valor = comparacao();
    if (pos !== fichas.length) throw new ErroBasic("SYNTAX ERROR", numeroLinha);
    return valor;
  }

  function formatar(valor) {
    if (typeof valor === "number") {
      /* O Applesoft não mostrava ".0" em número inteiro. */
      return Number.isInteger(valor) ? String(valor) : String(valor);
    }
    return String(valor);
  }

  /* ----------------------------------------------------------
     Execução
     ---------------------------------------------------------- */
  function executar(texto) {
    var saida = [];
    var variaveis = {};
    var lacos = []; /* pilha de FOR */
    var passos = 0;
    var cortado = false;

    var linhas;
    try {
      linhas = analisar(texto);
    } catch (erro) {
      return { saida: [], erro: erro, variaveis: {} };
    }

    if (!linhas.length) return { saida: [], erro: null, variaveis: {} };

    /* Número da linha -> posição no vetor */
    var indicePorNumero = {};
    linhas.forEach(function (l, i) {
      indicePorNumero[l.numero] = i;
    });

    var i = 0;

    try {
      while (i < linhas.length) {
        if (++passos > MAX_PASSOS) {
          cortado = true;
          break;
        }

        var linha = linhas[i];
        var n = linha.numero;
        var cmd = linha.texto;
        var maiuscula = cmd.toUpperCase();
        var proximaLinha = i + 1;

        if (maiuscula === "END" || maiuscula === "STOP") {
          break;
        } else if (/^REM\b/.test(maiuscula) || maiuscula === "") {
          /* comentário: não faz nada */
        } else if (/^PRINT\b/i.test(cmd) || /^\?/.test(cmd)) {
          var argumento = cmd.replace(/^PRINT\b/i, "").replace(/^\?/, "").trim();
          if (saida.length >= MAX_SAIDA) {
            cortado = true;
            break;
          }
          saida.push(argumento === "" ? "" : formatar(avaliar(argumento, variaveis, n)));
        } else if (/^LET\b/i.test(cmd) || /^[A-Za-z][A-Za-z0-9]*\s*=/.test(cmd)) {
          var atribuicao = cmd.replace(/^LET\b/i, "").trim();
          var partes = atribuicao.match(/^([A-Za-z][A-Za-z0-9]*)\s*=\s*(.+)$/);
          if (!partes) throw new ErroBasic("SYNTAX ERROR", n);
          variaveis[partes[1].toUpperCase()] = avaliar(partes[2], variaveis, n);
        } else if (/^GOTO\b/i.test(maiuscula)) {
          var destino = Number(cmd.replace(/^GOTO\b/i, "").trim());
          if (!(destino in indicePorNumero)) {
            throw new ErroBasic("UNDEF'D STATEMENT ERROR", n);
          }
          proximaLinha = indicePorNumero[destino];
        } else if (/^FOR\b/i.test(maiuscula)) {
          var f = cmd.match(/^FOR\s+([A-Za-z][A-Za-z0-9]*)\s*=\s*(.+?)\s+TO\s+(.+?)(?:\s+STEP\s+(.+))?$/i);
          if (!f) throw new ErroBasic("SYNTAX ERROR", n);
          var nomeVar = f[1].toUpperCase();
          variaveis[nomeVar] = avaliar(f[2], variaveis, n);
          lacos.push({
            variavel: nomeVar,
            limite: avaliar(f[3], variaveis, n),
            passo: f[4] ? avaliar(f[4], variaveis, n) : 1,
            volta: i + 1,
          });
        } else if (/^NEXT\b/i.test(maiuscula)) {
          if (!lacos.length) throw new ErroBasic("NEXT WITHOUT FOR ERROR", n);
          var laco = lacos[lacos.length - 1];
          variaveis[laco.variavel] += laco.passo;
          var continua =
            laco.passo > 0
              ? variaveis[laco.variavel] <= laco.limite
              : variaveis[laco.variavel] >= laco.limite;
          if (continua) {
            proximaLinha = laco.volta;
          } else {
            lacos.pop();
          }
        } else if (/^IF\b/i.test(maiuscula)) {
          var cond = cmd.match(/^IF\s+(.+?)\s+THEN\s+(.+)$/i);
          if (!cond) throw new ErroBasic("SYNTAX ERROR", n);
          if (avaliar(cond[1], variaveis, n)) {
            var acao = cond[2].trim();
            /* THEN 40 é o mesmo que THEN GOTO 40 */
            if (/^\d+$/.test(acao)) acao = "GOTO " + acao;
            /* A ação do THEN vira uma linha própria, executada em
               seguida. Inserir no meio desloca todo mundo, então o
               índice de números precisa ser recalculado. */
            linhas.splice(i + 1, 0, { numero: n, texto: acao });
            proximaLinha = i + 1;
            indicePorNumero = {};
            linhas.forEach(function (l, k) {
              if (!(l.numero in indicePorNumero)) indicePorNumero[l.numero] = k;
            });
          }
        } else if (/^HOME$|^CLS$/.test(maiuscula)) {
          saida.length = 0;
        } else {
          throw new ErroBasic("SYNTAX ERROR", n);
        }

        i = proximaLinha;
      }
    } catch (erro) {
      if (erro instanceof ErroBasic) {
        return { saida: saida, erro: erro, variaveis: variaveis, cortado: cortado };
      }
      throw erro;
    }

    return { saida: saida, erro: null, variaveis: variaveis, cortado: cortado };
  }

  var API = {
    executar: executar,
    MAX_SAIDA: MAX_SAIDA,

    /* Casos de verificação do interpretador. */
    testar: function () {
      var r = [];
      function checar(nome, obtido, esperado) {
        r.push({
          nome: nome,
          obtido: JSON.stringify(obtido),
          esperado: JSON.stringify(esperado),
          passou: JSON.stringify(obtido) === JSON.stringify(esperado),
        });
      }

      checar("PRINT de texto", executar('10 PRINT "OI"').saida, ["OI"]);

      checar(
        "FOR/NEXT dez vezes",
        executar('10 FOR I = 1 TO 10\n20 PRINT "ANA"\n30 NEXT I').saida.length,
        10
      );

      checar(
        "GOTO volta e o limite corta o laço infinito",
        executar('10 PRINT "X"\n20 GOTO 10').cortado,
        true
      );

      checar("variável e aritmética", executar("10 LET A = 2 + 3 * 4\n20 PRINT A").saida, ["14"]);

      checar(
        "IF com THEN GOTO",
        executar('10 LET A = 5\n20 IF A > 3 THEN GOTO 50\n30 PRINT "NAO"\n40 END\n50 PRINT "SIM"').saida,
        ["SIM"]
      );

      checar(
        "junção com ponto e vírgula",
        executar('10 LET N = 7\n20 PRINT "N VALE ";N').saida,
        ["N VALE 7"]
      );

      var erro = executar("10 PRNIT \"OI\"").erro;
      checar("comando inválido vira SYNTAX ERROR", erro && erro.mensagem, "SYNTAX ERROR");

      var semLinha = executar('PRINT "OI"').erro;
      checar("linha sem número também é erro", !!semLinha, true);

      var indefinido = executar("10 GOTO 99").erro;
      checar(
        "GOTO para linha inexistente",
        indefinido && indefinido.mensagem,
        "UNDEF'D STATEMENT ERROR"
      );

      checar("REM é ignorado", executar('10 REM ISTO E UM COMENTARIO\n20 PRINT "A"').saida, ["A"]);

      return r;
    },
  };

  raiz.RetroNet = raiz.RetroNet || {};
  raiz.RetroNet.Basic = API;

  /* Permite rodar os testes por linha de comando com node. */
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);

/* Rodado direto pelo node: executa os testes. */
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  var resultados = module.exports.testar();
  var falhas = 0;
  resultados.forEach(function (t) {
    if (!t.passou) falhas++;
    console.log((t.passou ? "  ok      " : "  FALHOU  ") + t.nome);
    if (!t.passou) console.log("            obtido: " + t.obtido + " | esperado: " + t.esperado);
  });
  console.log(falhas ? "\n" + falhas + " falharam" : "\ntodos os " + resultados.length + " testes passaram");
}
