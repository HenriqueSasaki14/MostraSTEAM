/* ============================================================
   Fase 1 — quem aparece na galeria
   ------------------------------------------------------------
   Datas de nascimento e morte conferidas no Wikidata. O texto de
   cada pessoa tem uma linha só: o visitante lê em pé.
   As seis programadoras do ENIAC vêm marcadas.
   ============================================================ */

RetroNet.montarPessoas(".pessoas", [
  {
    id: "charles-babbage",
    nome: "Charles Babbage",
    anos: "1791–1871",
    papel: "Projetou a Máquina Analítica, em 1837.",
  },
  {
    id: "ada-lovelace",
    nome: "Ada Lovelace",
    anos: "1815–1852",
    papel: "Viu que a máquina poderia manipular símbolos, não só números.",
  },
  {
    id: "george-boole",
    nome: "George Boole",
    anos: "1815–1864",
    papel: "Formalizou a álgebra booleana, em 1854.",
  },
  {
    id: "alan-turing",
    nome: "Alan Turing",
    anos: "1912–1954",
    papel: "Definiu o que é computável, em 1936.",
  },
  {
    id: "claude-shannon",
    nome: "Claude Shannon",
    anos: "1916–2001",
    papel: "Ligou lógica a circuito elétrico, em 1937.",
  },
  {
    id: "konrad-zuse",
    nome: "Konrad Zuse",
    anos: "1910–1995",
    papel: "Construiu o Z3, de relés, em 1941.",
  },
  {
    id: "john-von-neumann",
    nome: "John von Neumann",
    anos: "1903–1957",
    papel: "Publicou o programa armazenado, em 1945.",
  },
  {
    id: "grace-hopper",
    nome: "Grace Hopper",
    anos: "1906–1992",
    papel: "Criou o primeiro compilador, em 1952.",
  },
  {
    id: "kay-mcnulty",
    nome: "Kay McNulty",
    anos: "1921–2006",
    papel: "Programadora do ENIAC.",
    marcada: true,
  },
  {
    id: "jean-bartik",
    nome: "Betty Jennings",
    anos: "1924–2011",
    papel: "Programadora do ENIAC.",
    marcada: true,
  },
  {
    id: "betty-holberton",
    nome: "Betty Snyder",
    anos: "1917–2001",
    papel: "Programadora do ENIAC.",
    marcada: true,
  },
  {
    id: "marlyn-meltzer",
    nome: "Marlyn Wescoff",
    anos: "1922–2008",
    papel: "Programadora do ENIAC.",
    marcada: true,
  },
  {
    id: "frances-spence",
    nome: "Fran Bilas",
    anos: "1922–2012",
    papel: "Programadora do ENIAC.",
    marcada: true,
  },
  {
    id: "ruth-teitelbaum",
    nome: "Ruth Lichterman",
    anos: "1924–1986",
    papel: "Programadora do ENIAC.",
    marcada: true,
  },
]);
