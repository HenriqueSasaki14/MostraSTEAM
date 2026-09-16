/* ============================================================
   RetroNet — dados das oito fases
   ------------------------------------------------------------
   Esta é a única lista de fases do site. O menu, a navegação
   anterior/próxima, o indicador de progresso e o trilho da home
   são todos montados a partir daqui: mexeu aqui, mudou em todo
   lugar. Não duplique estes dados dentro das páginas.

   Os textos abaixo saem da modelagem (modelagem.md). Não invente
   conteúdo histórico: se faltar informação, deixe pendente e
   avise o grupo.
   ============================================================ */

window.RetroNet = window.RetroNet || {};

window.RetroNet.FASES = [
  {
    numero: 1,
    pasta: "01-primordios",
    epoca: "Séc. XVIII – 1969",
    titulo: "Primórdios e pioneirismo",
    marco: "Babbage, Turing, ENIAC, ARPANET",
    interacao: "Painel de fios do Enigma",
    // Resumo de uma linha, usado no menu. Máximo de ~90 caracteres
    // para não quebrar o cartão em tela de notebook.
    resumo: "Quando computador ainda era o cargo de quem fazia contas à mão.",
    cor: "#6B7F5C",
  },
  {
    numero: 2,
    pasta: "02-computacao-pessoal",
    epoca: "1971 – 1981",
    titulo: "Microprocessadores e computação pessoal",
    marco: "Microprocessador, Apple II, IBM PC",
    interacao: "Interpretador BASIC",
    resumo: "O computador sai da empresa e entra na casa das pessoas.",
    cor: "#4A9FE0",
  },
  {
    numero: 3,
    pasta: "03-interfaces-graficas",
    epoca: "1982 – 1990",
    titulo: "Interfaces gráficas e redes locais",
    marco: "Macintosh, Amiga, Ethernet, DNS",
    interacao: "Desktop de 1984",
    resumo: "A linha de comando dá lugar a janelas, ícones e mouse.",
    cor: "#C9A227",
  },
  {
    numero: 4,
    pasta: "04-web",
    epoca: "Anos 1990",
    titulo: "World Wide Web e popularização da internet",
    marco: "Web, navegadores, bolha pontocom",
    interacao: "Página de 1996",
    resumo: "Qualquer pessoa passa a poder publicar para o mundo inteiro.",
    cor: "#FF00CC",
  },
  {
    numero: 5,
    pasta: "05-web-2",
    epoca: "2000 – 2006",
    titulo: "Web 2.0, redes sociais e nuvem",
    marco: "Web 2.0, redes sociais, nuvem",
    interacao: "Perfil retrô",
    resumo: "O usuário deixa de só ler e vira produtor de conteúdo.",
    cor: "#1DB8E8",
  },
  {
    numero: 6,
    pasta: "06-era-movel",
    epoca: "2007 – 2013",
    titulo: "Era móvel e dos smartphones",
    marco: "iPhone, Android, App Store",
    interacao: "Tela inicial",
    resumo: "O computador deixa de ser um lugar e vira algo que se carrega.",
    cor: "#8B8BFF",
  },
  {
    numero: 7,
    pasta: "07-plataformas",
    epoca: "2014 – 2019",
    titulo: "Plataformas, nuvem madura e aprendizado de máquina",
    marco: "Plataformas, nuvem e deep learning",
    interacao: "Empacote uma vez, rode em qualquer lugar",
    resumo: "A infraestrutura amadurece em silêncio e prepara o que vem depois.",
    cor: "#22C55E",
  },
  {
    numero: 8,
    pasta: "08-ia-generativa",
    epoca: "2020 – hoje",
    titulo: "Era atual e tendências emergentes",
    marco: "IA generativa, Web3, quântica",
    interacao: "Ensine a máquina",
    resumo: "Em vez de aprender comandos, o usuário descreve o que quer.",
    cor: "#8B5CF6",
  },
];

/* Busca uma fase pelo número. Devolve undefined se não existir. */
window.RetroNet.acharFase = function (numero) {
  return window.RetroNet.FASES.find(function (fase) {
    return fase.numero === Number(numero);
  });
};
