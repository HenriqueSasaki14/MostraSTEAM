/* ============================================================
   RetroNet — galeria de pessoas em destaque
   ------------------------------------------------------------
   Todas as fases mostram "pessoa importante da fase, com foto e
   período de vida". Este arquivo desenha essa galeria a partir de
   uma lista simples, para não repetir o mesmo HTML em oito
   páginas.

   Uso, dentro do pessoas.js de cada fase:

     RetroNet.montarPessoas(".pessoas", [
       { id: "ada-lovelace", nome: "Ada Lovelace",
         anos: "1815–1852", papel: "..." },
     ]);

   O "id" é o mesmo nome de arquivo usado em assets/retratos/,
   gerado por ferramentas/baixar_retratos.py. Se a pessoa não
   tiver foto de licença livre (é o caso de Gary Kildall), basta
   não informar o id: sai um cartão tipográfico no lugar, em vez
   de uma foto emprestada sem procedência.
   ============================================================ */

window.RetroNet = window.RetroNet || {};

window.RetroNet.montarPessoas = function (seletor, lista) {
  var alvo = document.querySelector(seletor);
  if (!alvo) return;

  var raiz = document.documentElement.dataset.raiz || "./";
  var creditos = window.RetroNet.CREDITOS_IMAGENS || [];

  function esc(txt) {
    return String(txt == null ? "" : txt).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function acharCredito(id) {
    for (var i = 0; i < creditos.length; i++) {
      if (creditos[i].id === id) return creditos[i];
    }
    return null;
  }

  alvo.innerHTML = lista
    .map(function (p) {
      var credito = p.id ? acharCredito(p.id) : null;

      var moldura;
      if (credito) {
        /* O alt descreve quem é; a autoria completa fica na
           página de créditos, como manda a regra do projeto. */
        moldura =
          '<span class="pessoa__moldura">' +
          '<img src="' +
          raiz +
          esc(credito.arquivo) +
          '" width="' +
          credito.largura +
          '" height="' +
          credito.altura +
          '" decoding="async" alt="' +
          /* Máquinas também entram nesta galeria, e "Retrato de
             Amiga 1000" ficaria estranho no leitor de tela. */
          (credito.tipo === "objeto" ? "Foto de " : "Retrato de ") +
          esc(p.nome) +
          '">' +
          "</span>";
      } else {
        /* Sem foto de licença livre: cartão tipográfico. */
        moldura =
          '<span class="pessoa__moldura pessoa__moldura--sem-foto" aria-hidden="true">' +
          '<span class="pessoa__iniciais">' +
          esc(
            p.nome
              .split(/\s+/)
              .filter(function (parte) {
                return parte.length > 2;
              })
              .slice(0, 2)
              .map(function (parte) {
                return parte[0];
              })
              .join("")
          ) +
          "</span></span>";
      }

      return (
        '<figure class="pessoa' +
        (p.marcada ? " pessoa--eniac" : "") +
        '">' +
        moldura +
        "<figcaption>" +
        '<span class="pessoa__nome">' +
        esc(p.nome) +
        "</span>" +
        (p.anos ? '<span class="pessoa__anos">' + esc(p.anos) + "</span>" : "") +
        (p.papel ? '<span class="pessoa__papel">' + esc(p.papel) + "</span>" : "") +
        "</figcaption></figure>"
      );
    })
    .join("");
};
