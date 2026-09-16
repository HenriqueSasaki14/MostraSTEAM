/* ============================================================
   Fase 6 — quem aparece na galeria
   Andy Rubin: nascimento confirmado em duas fontes (claim P569
   do Wikidata e a infobox da Wikipédia em inglês, 13/03/1963) —
   o rótulo do item do Wikidata estava vandalizado, mas a data
   em si batia nas duas fontes.
   ============================================================ */

RetroNet.montarPessoas(".pessoas", [
  {
    id: "steve-jobs",
    nome: "Steve Jobs",
    anos: "1955–2011",
    papel: "Apresentou o iPhone em 9 de janeiro de 2007.",
  },
  {
    id: "andy-rubin",
    nome: "Andy Rubin",
    anos: "1963–",
    papel: "Fundou a empresa por trás do Android, comprada pelo Google em 2005.",
  },
]);
