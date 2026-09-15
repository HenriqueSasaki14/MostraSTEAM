/* ============================================================
   Fase 2 — quem aparece na galeria
   ------------------------------------------------------------
   Gary Kildall entra sem "id" de propósito: não existe foto dele
   com licença livre no Wikimedia Commons, e este projeto não usa
   imagem sem procedência. Ele aparece como cartão tipográfico.
   ============================================================ */

RetroNet.montarPessoas(".pessoas", [
  {
    id: "steve-wozniak",
    nome: "Steve Wozniak",
    anos: "1950–",
    papel: "Projetou o Apple I e o Apple II, sozinho.",
  },
  {
    id: "steve-jobs",
    nome: "Steve Jobs",
    anos: "1955–2011",
    papel: "Transformou o Apple II em produto de loja.",
  },
  {
    id: "bill-gates",
    nome: "Bill Gates",
    anos: "1955–",
    papel: "Escreveu o BASIC do Altair e licenciou o MS-DOS.",
  },
  {
    id: "paul-allen",
    nome: "Paul Allen",
    anos: "1953–2018",
    papel: "Cofundou a Microsoft com Gates, em 1975.",
  },
  {
    /* sem id: sem foto de licença livre */
    nome: "Gary Kildall",
    anos: "1942–1994",
    papel: "Criou o CP/M, primeiro sistema padrão dos chips de 8 bits.",
  },
]);
