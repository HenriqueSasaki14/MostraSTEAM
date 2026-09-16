/* ============================================================
   RetroNet — classificador de desenhos (fase 8)
   ------------------------------------------------------------
   Aprende de verdade com os desenhos do visitante. Não é uma
   animação fingindo aprender: é um classificador por vizinho mais
   próximo do centroide, rodando em cima de pixels — sem rede
   neural, exatamente como a modelagem pede.

   Como funciona, em três passos:

     1. NORMALIZAR — cada desenho vira um vetor de números. O
        traço é recortado pelo próprio contorno (para não importar
        se o visitante desenhou no canto ou no meio da tela), e a
        imagem recortada é reduzida a uma grade fixa de 16×16
        células, cada uma guardando "quanto de tinta" tem ali.

     2. TREINAR — para cada rótulo, calcula-se o centroide: a
        média, célula a célula, de todos os exemplos daquele
        rótulo. É o "desenho médio" de cada categoria.

     3. CLASSIFICAR — o desenho novo também vira um vetor, e é
        comparado aos dois centroides pela distância. O rótulo
        mais próximo vence, e a diferença das distâncias vira a
        porcentagem de confiança.

   Isso explica também por que o modelo "erra com confiança": ele
   é obrigado a escolher entre as duas categorias que existem. Um
   desenho de qualquer outra coisa ainda assim cai no centroide
   mais próximo — e às vezes essa distância mínima ainda parece
   "convicta" em porcentagem.

   Confira rodando: node fases/08-ia-generativa/classificador.js
   ============================================================ */

(function (raiz) {
  "use strict";

  var LADO_GRADE = 16; /* 16×16 = 256 células por desenho */

  /* ----------------------------------------------------------
     Recebe uma matriz de intensidade (0 a 1, "quanto de tinta"
     em cada pixel bruto do canvas) e devolve o vetor normalizado
     de LADO_GRADE × LADO_GRADE números.

     Puramente numérico — não toca em Canvas nem em DOM, por isso
     dá para testar direto com node, sem navegador.
     ---------------------------------------------------------- */
  function normalizar(intensidade, largura, altura) {
    /* 1) acha o retângulo que envolve o traço */
    var minX = largura,
      minY = altura,
      maxX = -1,
      maxY = -1;
    for (var y = 0; y < altura; y++) {
      for (var x = 0; x < largura; x++) {
        if (intensidade[y * largura + x] > 0.08) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    var vetor = new Array(LADO_GRADE * LADO_GRADE).fill(0);

    /* Tela em branco: vetor todo zero, sem dividir por zero. */
    if (maxX < 0) return vetor;

    /* 2) acrescenta uma margem de 10% para o traço não colar na
       borda da grade — desenhos "abertos" (uma reta, por exemplo)
       ficam mais fáceis de comparar assim. */
    var largBox = maxX - minX + 1;
    var altBox = maxY - minY + 1;
    var margemX = largBox * 0.1;
    var margemY = altBox * 0.1;
    /* Math.floor/ceil é essencial aqui: sem arredondar para
       inteiro, minX/minY viram fracionários (ex.: 17.6), e
       "origemX = minX + xx" também fica fracionário. Indexar um
       array com índice fracionário devolve undefined em vez de um
       número — e undefined + número vira NaN, contaminando o
       vetor inteiro silenciosamente. */
    minX = Math.max(0, Math.floor(minX - margemX));
    maxX = Math.min(largura - 1, Math.ceil(maxX + margemX));
    minY = Math.max(0, Math.floor(minY - margemY));
    maxY = Math.min(altura - 1, Math.ceil(maxY + margemY));
    largBox = maxX - minX + 1;
    altBox = maxY - minY + 1;

    /* 3) reamostra o recorte para a grade fixa, fazendo a média
       de cada bloco de pixels que cai em cada célula. */
    var contagem = new Array(LADO_GRADE * LADO_GRADE).fill(0);
    for (var yy = 0; yy < altBox; yy++) {
      var origemY = minY + yy;
      if (origemY < 0 || origemY >= altura) continue;
      var celulaY = Math.min(LADO_GRADE - 1, Math.floor((yy / altBox) * LADO_GRADE));
      for (var xx = 0; xx < largBox; xx++) {
        var origemX = minX + xx;
        if (origemX < 0 || origemX >= largura) continue;
        var celulaX = Math.min(LADO_GRADE - 1, Math.floor((xx / largBox) * LADO_GRADE));
        var indice = celulaY * LADO_GRADE + celulaX;
        vetor[indice] += intensidade[origemY * largura + origemX];
        contagem[indice]++;
      }
    }
    for (var i = 0; i < vetor.length; i++) {
      if (contagem[i] > 0) vetor[i] /= contagem[i];
    }
    return vetor;
  }

  /* Distância euclidiana entre dois vetores do mesmo tamanho. */
  function distancia(a, b) {
    var soma = 0;
    for (var i = 0; i < a.length; i++) {
      var d = a[i] - b[i];
      soma += d * d;
    }
    return Math.sqrt(soma);
  }

  /* Centroide: média célula a célula de uma lista de vetores. */
  function centroide(vetores) {
    var soma = new Array(LADO_GRADE * LADO_GRADE).fill(0);
    vetores.forEach(function (v) {
      for (var i = 0; i < v.length; i++) soma[i] += v[i];
    });
    return soma.map(function (s) {
      return s / vetores.length;
    });
  }

  /* ----------------------------------------------------------
     Treina: recebe uma lista de {rotulo, vetor} e devolve um
     centroide por rótulo.
     ---------------------------------------------------------- */
  function treinar(exemplos) {
    var porRotulo = {};
    exemplos.forEach(function (ex) {
      (porRotulo[ex.rotulo] = porRotulo[ex.rotulo] || []).push(ex.vetor);
    });
    var centroides = {};
    Object.keys(porRotulo).forEach(function (rotulo) {
      centroides[rotulo] = centroide(porRotulo[rotulo]);
    });
    return centroides;
  }

  /* ----------------------------------------------------------
     Classifica um vetor contra os centroides de exatamente dois
     rótulos, devolvendo o vencedor e a confiança de cada lado.

     A confiança não é a distância bruta: é a distância do OUTRO
     centroide dividida pela soma das duas, o que naturalmente dá
     duas porcentagens que somam 100%. Quanto mais perto de um
     centroide (e longe do outro), maior a confiança nele.
     ---------------------------------------------------------- */
  function classificar(vetor, centroides) {
    var rotulos = Object.keys(centroides);
    if (rotulos.length !== 2) {
      throw new Error("classificar precisa de exatamente dois rótulos treinados");
    }

    var distancias = {};
    rotulos.forEach(function (r) {
      distancias[r] = distancia(vetor, centroides[r]);
    });

    var somaDistancias = distancias[rotulos[0]] + distancias[rotulos[1]];
    var confiancas = {};

    if (somaDistancias === 0) {
      /* Exatamente em cima dos dois centroides ao mesmo tempo
         (só acontece se os dois forem idênticos): empate. */
      confiancas[rotulos[0]] = 50;
      confiancas[rotulos[1]] = 50;
    } else {
      rotulos.forEach(function (r, i) {
        var outro = rotulos[1 - i];
        confiancas[r] = Math.round((distancias[outro] / somaDistancias) * 100);
      });
      /* Arredondamento pode deixar 99+99 ou 100+100: ajusta o
         segundo para a soma fechar exatamente em 100. */
      confiancas[rotulos[1]] = 100 - confiancas[rotulos[0]];
    }

    var vencedor = confiancas[rotulos[0]] >= confiancas[rotulos[1]] ? rotulos[0] : rotulos[1];

    return {
      rotulo: vencedor,
      confianca: confiancas[vencedor],
      confiancas: confiancas,
    };
  }

  var API = {
    LADO_GRADE: LADO_GRADE,
    normalizar: normalizar,
    distancia: distancia,
    centroide: centroide,
    treinar: treinar,
    classificar: classificar,

    /* Casos de verificação do classificador. */
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
      function proximo(nome, obtido, esperado, tolerancia) {
        var ok = Math.abs(obtido - esperado) <= tolerancia;
        r.push({
          nome: nome,
          obtido: obtido,
          esperado: "~" + esperado,
          passou: ok,
        });
      }

      /* Desenha um "quadrado cheio" 10x10 num canvas 40x40, todo
         zero fora dele — testa se o recorte por bounding box
         funciona e ignora o fundo em branco. */
      function tela(largura, altura) {
        return new Array(largura * altura).fill(0);
      }
      function pintarRetangulo(pix, largura, x0, y0, x1, y1, valor) {
        for (var y = y0; y < y1; y++) {
          for (var x = x0; x < x1; x++) pix[y * largura + x] = valor;
        }
      }

      var telaVazia = tela(40, 40);
      var vetorVazio = normalizar(telaVazia, 40, 40);
      checar(
        "tela em branco vira vetor todo zero",
        vetorVazio.every(function (v) {
          return v === 0;
        }),
        true
      );

      /* Dois quadrados desenhados em posições BEM diferentes da
         tela devem virar vetores parecidos — é o que a normalização
         por bounding box garante. */
      var quadradoCanto = tela(40, 40);
      pintarRetangulo(quadradoCanto, 40, 2, 2, 12, 12, 1);
      var quadradoCentro = tela(40, 40);
      pintarRetangulo(quadradoCentro, 40, 20, 20, 30, 30, 1);
      var vA = normalizar(quadradoCanto, 40, 40);
      var vB = normalizar(quadradoCentro, 40, 40);
      proximo(
        "mesma forma em posições diferentes fica parecida após normalizar",
        distancia(vA, vB),
        0,
        1.5
      );

      /* Uma linha horizontal e uma vertical precisam virar vetores
         bem diferentes entre si. */
      var linhaH = tela(40, 40);
      pintarRetangulo(linhaH, 40, 5, 18, 35, 22, 1);
      var linhaV = tela(40, 40);
      pintarRetangulo(linhaV, 40, 18, 5, 22, 35, 1);
      var vH = normalizar(linhaH, 40, 40);
      var vV = normalizar(linhaV, 40, 40);
      r.push({
        nome: "formas diferentes ficam mais longe entre si que a mesma forma repetida",
        obtido: "d(H,V)=" + distancia(vH, vV).toFixed(2) + " vs d(A,B)=" + distancia(vA, vB).toFixed(2),
        esperado: "d(H,V) > d(A,B)",
        passou: distancia(vH, vV) > distancia(vA, vB),
      });

      /* Treina com "quadrados" (cantos e centro) e "linhas"
         (horizontais e verticais) e classifica um quadrado novo. */
      var exemplos = [
        { rotulo: "quadrado", vetor: vA },
        { rotulo: "quadrado", vetor: vB },
        { rotulo: "linha", vetor: vH },
        { rotulo: "linha", vetor: vV },
      ];
      var centroides = treinar(exemplos);
      checar("treinar gera um centroide por rótulo", Object.keys(centroides).sort(), [
        "linha",
        "quadrado",
      ]);

      var quadradoNovo = tela(40, 40);
      pintarRetangulo(quadradoNovo, 40, 10, 10, 20, 20, 1);
      var resultado = classificar(normalizar(quadradoNovo, 40, 40), centroides);
      checar("classifica um quadrado novo corretamente como quadrado", resultado.rotulo, "quadrado");

      var somaConf = resultado.confiancas.quadrado + resultado.confiancas.linha;
      checar("as duas confianças somam 100", somaConf, 100);

      /* classificar exige exatamente dois rótulos. */
      var lancouErro = false;
      try {
        classificar(vA, { so: vA, um: vB, rotulo: vA });
      } catch (e) {
        lancouErro = true;
      }
      checar("classificar recusa treinar com mais de dois rótulos", lancouErro, true);

      return r;
    },
  };

  raiz.RetroNet = raiz.RetroNet || {};
  raiz.RetroNet.Classificador = API;

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
