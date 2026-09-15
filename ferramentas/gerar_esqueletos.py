# -*- coding: utf-8 -*-
"""
Cria a pasta e o index.html provisório de cada fase que ainda não foi feita.

NÃO sobrescreve página que já existe: assim que a fase 1 ganhar a página de
verdade, rodar este script de novo não apaga o trabalho de ninguém.

Rodar:  python ferramentas/gerar_esqueletos.py
"""

import io
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# A lista de fases vive em assets/js/fases.js e é lida daqui, para não existir
# uma segunda cópia dos mesmos dados dentro deste script.
ETAPA_DO_PLANO = {
    1: "Etapa 2 do plano: fase 1 completa, com o painel de fios do Enigma.",
    2: "Etapa 3 do plano: fase 2, com o interpretador BASIC.",
    3: "Etapa 4 do plano: fase 3, com a micro-interação do desktop de 1984.",
    4: "Etapa 3 do plano: fase 4, com o construtor de página de 1996.",
    5: "Etapa 4 do plano: fase 5, com a micro-interação do perfil retrô.",
    6: "Etapa 4 do plano: fase 6, com a micro-interação da tela inicial.",
    7: "Etapa 4 do plano: fase 7. A pesquisa desta fase ainda não existe.",
    8: "Etapa 3 do plano: fase 8, com a atividade Ensine a máquina.",
}

MODELO = '''<!doctype html>
<html lang="pt-BR" data-raiz="../../" data-fase="{numero}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{titulo} — RetroNet</title>
    <meta name="description" content="{epoca}: {marco}." />

    <script>
      document.documentElement.classList.add("js");
    </script>

    <link
      rel="icon"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230D0F12'/%3E%3Crect x='7' y='21' width='18' height='4' fill='%23FFB000'/%3E%3C/svg%3E"
    />

    <link rel="stylesheet" href="../../assets/css/fontes.css" />
    <link rel="stylesheet" href="../../assets/css/tokens.css" />
    <link rel="stylesheet" href="../../assets/css/base.css" />
    <link rel="stylesheet" href="../../assets/css/shell.css" />

    <!-- Provisório: trocar por ./fase.css quando esta fase for construída. -->
    <link rel="stylesheet" href="../../assets/css/construcao.css" />
  </head>

  <body>
    <main id="conteudo" class="conteudo-principal">
      <div class="envoltorio em-construcao">
        <p class="etiqueta">Fase {numero} de 8 &middot; {epoca}</p>
        <h1 class="em-construcao__titulo">{titulo}</h1>
        <p class="em-construcao__marco">{marco}</p>
        <div class="em-construcao__faixa" aria-hidden="true"></div>

        <div class="em-construcao__aviso">
          <p><span class="marcador-pendente">PÁGINA NÃO CONSTRUÍDA</span></p>
          <p>{etapa}</p>
          <p>
            A atividade prevista para esta fase é:
            <strong>{interacao}</strong>. Uma fase só é considerada pronta
            quando a atividade dela estiver funcionando.
          </p>
        </div>
      </div>

      <div class="envoltorio"><div data-moldura="navegacao"></div></div>
    </main>

    <div data-moldura="rodape"></div>

    <script src="../../assets/js/fases.js"></script>
    <script src="../../assets/js/som.js"></script>
    <script src="../../assets/js/shell.js"></script>
    <script src="../../assets/js/inatividade.js"></script>
  </body>
</html>
'''


def ler_fases():
    """Lê assets/js/fases.js e devolve a lista de fases."""
    caminho = os.path.join(RAIZ, "assets", "js", "fases.js")
    texto = io.open(caminho, encoding="utf-8").read()
    fases = []
    for bloco in re.findall(r"\{\s*numero:.*?\n  \}", texto, re.S):
        fase = {}
        for chave in ("pasta", "epoca", "titulo", "marco", "interacao"):
            # O valor vai ate a aspa de fechamento, e nao ate a primeira
            # virgula: varios marcos tem virgula no meio do texto, como
            # "Babbage, Turing, ENIAC, ARPANET".
            achado = re.search(chave + r':\s*"((?:[^"\\]|\\.)*)"', bloco)
            if achado:
                fase[chave] = achado.group(1)
        fase["numero"] = int(re.search(r"numero:\s*(\d+)", bloco).group(1))
        fases.append(fase)
    return fases


def main():
    fases = ler_fases()
    if len(fases) != 8:
        print("ERRO: li %d fases em fases.js, esperava 8" % len(fases))
        return 1

    for fase in fases:
        pasta = os.path.join(RAIZ, "fases", fase["pasta"])
        os.makedirs(pasta, exist_ok=True)
        destino = os.path.join(pasta, "index.html")

        if os.path.exists(destino):
            print("  mantida   fases/%s/index.html (já existe)" % fase["pasta"])
            continue

        html = MODELO.format(
            numero=fase["numero"],
            epoca=fase["epoca"],
            titulo=fase["titulo"],
            marco=fase["marco"],
            interacao=fase["interacao"],
            etapa=ETAPA_DO_PLANO[fase["numero"]],
        )
        io.open(destino, "w", encoding="utf-8", newline="\n").write(html)
        print("  criada    fases/%s/index.html" % fase["pasta"])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
