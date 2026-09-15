# RetroNet

Linha do tempo interativa da história da computação, em oito etapas, para a
amostra STEAM. A modelagem completa está em [modelagem.md](modelagem.md) — leia
antes de mexer em qualquer coisa.

## Como abrir

Dê dois cliques em `index.html`. É só isso: não tem instalação, não tem
`npm install`, não tem servidor. O site precisa funcionar assim porque no dia da
amostra ele roda offline, no notebook da escola.

> **A regra que mais quebra o site:** todo link interno tem que terminar em
> `index.html`, e não na pasta. `fases/01-primordios/` funciona quando você testa
> com um servidor local, mas por `file://` o navegador abre a *listagem da pasta*
> em vez da página. Sempre `fases/01-primordios/index.html`.

Se quiser testar com servidor mesmo assim:

```
python -m http.server 8765
```

## Onde fica cada coisa

```
index.html              home
fases/<n>-<nome>/       uma pasta por fase, com index.html + fase.css + fase.js
creditos/               créditos, fontes históricas e crédito das imagens
assets/
  css/tokens.css        design system: cores, tipografia, espaçamento
  css/base.css          reset e componentes de todo o site
  css/shell.css         moldura: cabeçalho, menu, progresso, navegação
  css/fontes.css        @font-face das três fontes locais
  js/fases.js           OS DADOS DAS OITO FASES — a única lista que existe
  js/shell.js           monta a moldura em qualquer página
  js/som.js             efeitos sonoros sintetizados, sem arquivo de áudio
  js/inatividade.js     reinício automático entre visitantes
  fonts/                IBM Plex Mono, Space Grotesk e Inter (.woff2 locais)
  retratos/             fotos do Wikimedia + creditos.json e creditos.js
ferramentas/            scripts de apoio em Python, rodados só na hora de editar
```

## As duas regras da moldura

1. **Cabeçalho, menu e navegação são iguais nas nove páginas.** Ninguém os altera
   para agradar a estética da sua fase. Se a sua fase precisa de algo diferente
   na moldura, fale com o grupo antes.

2. **Sua fase muda `--destaque` e o miolo, mais nada.** A cor de destaque já está
   definida em `tokens.css`, em `[data-fase="N"]`. Use `var(--destaque)` para
   preenchimento, borda e brilho, e `var(--destaque-texto)` quando a cor carregar
   texto — nas fases 1 e 8 a cor original não alcança 4,5:1 sobre o fundo, e a
   variante clareada existe exatamente para isso.

## Como construir a página de uma fase

Cada `fases/<pasta>/index.html` começa como um esqueleto gerado. Para construir
a fase de verdade:

1. Na tag `<html>`, confira `data-raiz="../../"` e `data-fase="N"`. É daí que a
   moldura descobre qual fase é, qual cor usar e o que pôr no progresso.
2. Troque o `<link>` de `construcao.css` por um `./fase.css` seu.
3. Escreva o miolo dentro de `<main id="conteudo" class="conteudo-principal">`.
4. Deixe o `<div data-moldura="navegacao">` e o `<div data-moldura="rodape">`
   onde estão: o `shell.js` os preenche sozinho.
5. Quando a atividade estiver pronta, registre o reinício automático:

```js
RetroNet.inatividade.aoReiniciar(function () {
  /* devolve a atividade ao estado inicial */
});
RetroNet.inatividade.iniciar(90); // segundos
```

Uma fase só é considerada pronta quando a atividade dela estiver funcionando.
Página só com texto não entra.

## O que o site não faz, de propósito

- **Não usa localStorage nem nenhum outro armazenamento.** O progresso é
  posicional ("Fase 3 de 8"): mostra onde o visitante está, sem guardar nada.
  O estado do som viaja pela URL (`?som=1`).
- **Não pede login, e-mail ou qualquer dado do visitante.**
- **Não baixa nada da internet em tempo de execução.** Fontes, imagens e scripts
  são todos locais.
- **Não usa emoji como ícone.** Ícone é SVG inline, que aceita a cor da fase e
  não muda de desenho em cada sistema.

## Ferramentas

Precisam de Python e só são rodadas quando você quer mudar imagens ou criar a
pasta de uma fase nova. O site em si não depende delas.

```
python ferramentas/baixar_retratos.py     # baixa fotos do Wikimedia Commons
python ferramentas/gerar_esqueletos.py    # cria o index.html de fases novas
```

`baixar_retratos.py` recusa qualquer imagem sem licença livre confirmada e
escreve `assets/retratos/creditos.json` e `creditos.js`, que alimentam a página
de créditos. Imagem já baixada não é baixada de novo — apague o `.webp` para
forçar. `gerar_esqueletos.py` nunca sobrescreve página que já existe.

## Pendências conhecidas

- **Nomes dos integrantes** — aparecem como marcador no rodapé e nos créditos.
- **Fase 7 (2014–2019)** — a pesquisa não existe. A página tem estrutura e
  estética, e o conteúdo fica com marcador visível de pendência.
- **Fontes históricas por fase** — nenhuma fase vai ao ar sem as referências
  listadas na página de créditos.
- **Gary Kildall (fase 2)** — não existe foto dele com licença livre no
  Wikimedia Commons. A fase precisa apresentá-lo por cartão tipográfico, não com
  uma foto emprestada de qualquer lugar.
