# Prompt para o Claude Code — RetroNet

> Coloque este arquivo e o `MODELAGEM_RETRONET.md` na pasta do projeto e cole o texto abaixo no Claude Code.

---

Estou construindo o **RetroNet**, um site em formato de linha do tempo sobre a história da computação, para uma amostra STEAM de escola técnica. Anexei a modelagem completa em `MODELAGEM_RETRONET.md` — leia o arquivo inteiro antes de escrever qualquer código. Ele contém o conceito, as oito fases com todo o conteúdo, a identidade visual com paleta e tipografia, as quatro atividades interativas detalhadas, as regras de negócio e os requisitos.

## O que este projeto é

Um site que o visitante percorre em pé, durante poucos minutos, em um notebook na feira. Cada uma das oito fases é uma página inteira com estética própria da época que representa. O visual é o produto: se a página da fase 4 não parecer um site de 1996 e a da fase 8 não parecer uma interface de hoje, o projeto falhou, mesmo que o conteúdo esteja correto.

**A prioridade número um é o acabamento visual.** Não quero um site que pareça um template genérico com cores trocadas. Quero que cada fase tenha uma direção de arte específica e reconhecível.

## Stack

- HTML, CSS e JavaScript puros, sem framework e sem build step
- Nenhuma dependência externa em tempo de execução: fontes, imagens e scripts locais, porque o site roda offline no dia da amostra
- Uma pasta por fase, com um shell compartilhado (cabeçalho, navegação, sistema de cores) e o miolo customizado
- Sem localStorage, sem backend, sem login, sem coleta de dados

## Design system

Use exatamente a paleta e as fontes definidas na seção Identidade Visual do documento. O ponto central: **a moldura é neutra e constante, o miolo muda de época.** Cabeçalho, menu e navegação permanecem idênticos nas oito páginas; cada fase troca apenas sua cor de destaque e o tratamento visual do conteúdo.

Requisitos visuais que valem para todas as páginas:

- Contraste mínimo de 4,5:1 entre texto e fundo — inclusive nas fases de estética agressiva, como a Web 1.0 da fase 4
- Transições entre fases com sensação de avanço no tempo, não um corte seco
- Nada de emoji como ícone; se precisar de ícone, faça em SVG inline
- Tipografia com hierarquia clara: o visitante lê em pé, então corpo de texto generoso e blocos curtos
- Respeite `prefers-reduced-motion` desligando as animações decorativas

## Ordem de trabalho

Não construa as oito páginas de uma vez. Siga esta sequência e **pare para eu revisar ao fim de cada etapa**:

1. **Shell e home.** Estrutura de pastas, design system em CSS custom properties, cabeçalho, navegação entre fases, indicador de progresso e a página inicial com a animação de abertura descrita no documento.
2. **Fase 1 completa**, incluindo a atividade do painel de fios do Enigma. Esta é a mais complexa; quero validar o padrão de qualidade antes de replicar.
3. **Fases 2, 4 e 8**, que têm as outras três atividades principais.
4. **Fases 3, 5, 6 e 7**, com as micro-interações.
5. **Página de créditos e fontes**, reinício automático por inatividade e revisão final de acessibilidade.

## Sobre as atividades

As quatro atividades principais estão especificadas no capítulo "Atividades Interativas" do documento, com as partes que cada uma precisa ter. Elas são o coração do projeto — cada uma precisa funcionar de verdade, não ser uma animação simulando funcionamento:

- O painel de fios do Enigma precisa cifrar de fato, e retirar um fio precisa mudar o resultado de fato
- O interpretador BASIC precisa executar o código digitado, com erro de sintaxe real
- O classificador da fase 8 precisa aprender com os desenhos do visitante; pode ser um classificador simples por pixels, não precisa de rede neural

Cada atividade deve ser concluível em cerca de um minuto e voltar ao estado inicial sozinha.

## Como quero que você trabalhe

- Se algo na modelagem estiver ambíguo ou tecnicamente inviável, me pergunte antes de decidir sozinho
- Comente o código em português, porque outros quatro alunos vão mexer nele
- Ao terminar cada etapa, me diga o que ficou pronto e o que ficou pendente
- Não invente conteúdo histórico: use o que está no documento. Se faltar informação, sinalize em vez de preencher

A fase 7 está marcada como pendente no documento — a pesquisa dela ainda não existe. Construa a página com a estrutura e a estética definidas e deixe o conteúdo com marcadores visíveis de texto pendente.

Comece lendo o documento e me apresentando o plano da etapa 1 antes de codar.