# -*- coding: utf-8 -*-
"""
Baixa retratos e fotos de máquinas do Wikimedia Commons para uso offline.

Como funciona:
  1. pergunta à Wikipedia qual é a imagem principal do artigo da pessoa ou
     máquina — ou usa direto um arquivo do Commons, quando indicado;
  2. confirma no Commons que o arquivo tem licença livre (domínio público ou
     Creative Commons). Imagem sem licença livre é descartada;
  3. baixa o original, recorta/redimensiona e salva em WebP em assets/retratos/;
  4. grava assets/retratos/creditos.json e creditos.js com autor, licença e
     link de cada imagem, que alimentam a página de créditos.

Regra de negócio atendida: nenhuma fase vai ao ar sem as referências listadas
na página de créditos.

Rodar:  python ferramentas/baixar_retratos.py
"""

import html as html_lib
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image

# Wikimedia exige User-Agent identificando o projeto e um contato.
AGENTE = "RetroNetSTEAM/1.0 (projeto escolar; henrique.sasaki14@gmail.com)"
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, "assets", "retratos")

# Licenças aceitas. Qualquer coisa fora disso é recusada.
LICENCAS_OK = re.compile(r"(public domain|pd-|cc0|cc by|cc-by|attribution)", re.I)
LICENCAS_PROIBIDAS = re.compile(r"(fair use|non-?free|noncommercial)", re.I)

# Cada linha é (fase, identificador do arquivo, origem, enquadramento, rótulo).
#
#   origem       título de um artigo da Wikipédia em inglês, de onde sai a
#                imagem principal — ou "File:Nome.jpg" para pegar um arquivo
#                específico do Commons, quando a imagem do artigo não serve.
#   enquadramento  "retrato" recorta em 3:4; "objeto" só limita a largura.
#   rótulo       o nome que aparece na página de créditos, em português.
CATALOGO = [
    # ---------- Fase 1: primórdios ----------
    (1, "charles-babbage", "Charles Babbage", "retrato", "Charles Babbage"),
    (1, "ada-lovelace", "Ada Lovelace", "retrato", "Ada Lovelace"),
    (1, "george-boole", "George Boole", "retrato", "George Boole"),
    (1, "alan-turing", "Alan Turing", "retrato", "Alan Turing"),
    (1, "claude-shannon", "Claude Shannon", "retrato", "Claude Shannon"),
    (1, "grace-hopper", "Grace Hopper", "retrato", "Grace Hopper"),
    (1, "john-von-neumann", "John von Neumann", "retrato", "John von Neumann"),
    (1, "konrad-zuse", "Konrad Zuse", "retrato", "Konrad Zuse"),
    (1, "jean-bartik", "File:Betty Jennings (Mrs. Bartik).jpg", "retrato",
     "Betty Jennings (Jean Bartik), programadora do ENIAC"),
    (1, "betty-holberton", "Betty Holberton", "retrato",
     "Betty Snyder Holberton, programadora do ENIAC"),
    (1, "kay-mcnulty", "Kathleen Antonelli", "retrato",
     "Kay McNulty, programadora do ENIAC"),
    (1, "marlyn-meltzer", "File:Marlyn Meltzer (crop).jpg", "retrato",
     "Marlyn Wescoff Meltzer, programadora do ENIAC"),
    (1, "frances-spence", "Frances Spence", "retrato",
     "Fran Bilas Spence, programadora do ENIAC"),
    (1, "ruth-teitelbaum", "File:Ruth Teitelbaum.png", "retrato",
     "Ruth Lichterman Teitelbaum, programadora do ENIAC"),
    (1, "eniac", "ENIAC", "objeto", "ENIAC"),
    (1, "programadoras-eniac", "File:Reprogramming ENIAC.png", "objeto",
     "Programadoras reconfigurando o ENIAC"),
    (1, "enigma", "Enigma machine", "objeto", "Máquina Enigma"),
    (1, "tear-jacquard", "Jacquard machine", "objeto",
     "Retrato de Jacquard tecido em um tear Jacquard"),
    (1, "maquina-analitica", "Analytical engine", "objeto",
     "Máquina Analítica de Babbage"),
    # ---------- Fase 2: computação pessoal ----------
    (2, "steve-wozniak", "Steve Wozniak", "retrato", "Steve Wozniak"),
    (2, "steve-jobs", "Steve Jobs", "retrato", "Steve Jobs"),
    (2, "bill-gates", "Bill Gates", "retrato", "Bill Gates"),
    (2, "paul-allen", "Paul Allen", "retrato", "Paul Allen"),
    (2, "altair-8800", "Altair 8800", "objeto", "Altair 8800"),
    (2, "apple-ii", "Apple II", "objeto", "Apple II"),
    (2, "ibm-pc", "File:IBM PC 5150.jpg", "objeto", "IBM PC 5150"),
    (2, "intel-4004", "Intel 4004", "objeto", "Intel 4004"),
    # ---------- Fase 3: interfaces gráficas ----------
    (3, "bjarne-stroustrup", "Bjarne Stroustrup", "retrato", "Bjarne Stroustrup"),
    (3, "macintosh-128k", "Macintosh 128K", "objeto", "Apple Macintosh 128K"),
    (3, "amiga-1000", "Amiga 1000", "objeto", "Commodore Amiga 1000"),
    (3, "xerox-alto", "File:Xerox Alto.jpg", "objeto",
     "Xerox Alto, o computador que originou a interface gráfica no Xerox PARC"),
    # ---------- Fase 4: web ----------
    (4, "tim-berners-lee", "Tim Berners-Lee", "retrato", "Tim Berners-Lee"),
    (4, "marc-andreessen", "Marc Andreessen", "retrato", "Marc Andreessen"),
    (4, "linus-torvalds", "Linus Torvalds", "retrato", "Linus Torvalds"),
    (4, "next-computer", "File:First Web Server.jpg", "objeto",
     "O NeXT Cube que serviu o primeiro site da web"),
    # ---------- Fase 5: web 2.0 ----------
    (5, "jimmy-wales", "Jimmy Wales", "retrato", "Jimmy Wales"),
    (5, "orkut-buyukkokten", "Orkut Büyükkökten", "retrato", "Orkut Büyükkökten"),
    (5, "mark-zuckerberg", "Mark Zuckerberg", "retrato", "Mark Zuckerberg"),
    (5, "chad-hurley", "Chad Hurley", "retrato", "Chad Hurley"),
    (5, "jawed-karim", "Jawed Karim", "retrato", "Jawed Karim"),
    (5, "steve-chen", "Steve Chen (YouTube)", "retrato", "Steve Chen"),
    (5, "servidores-nuvem", "File:Servers in a Rack.jpg", "objeto",
     "Servidores em rack, símbolo da computação em nuvem que nasce nesta fase"),
    # ---------- Fase 6: era móvel ----------
    (6, "andy-rubin", "Andy Rubin", "retrato", "Andy Rubin"),
    (6, "iphone-1", "File:IPhone First Generation (cropped).jpg", "objeto",
     "iPhone de primeira geração, 2007"),
    (6, "htc-dream", "File:HTC Dream (front view).jpg", "objeto",
     "HTC Dream (T-Mobile G1), o primeiro aparelho Android, 2008"),
    (6, "ipad-1", "File:IPad First Gen.jpg", "objeto",
     "iPad de primeira geração, 2010"),
    (6, "kindle-1", "File:Amazon Kindle - Off.jpg", "objeto",
     "Amazon Kindle de primeira geração, 2007"),
    # ---------- Fase 7: plataformas ----------
    (7, "satya-nadella", "Satya Nadella", "retrato", "Satya Nadella"),
    (7, "amazon-echo", "File:Amazon Echo.jpg", "objeto",
     "Amazon Echo de primeira geração, 2014"),
    (7, "conteineres", "File:Shipping containers in a port (Unsplash).jpg", "objeto",
     "Contêineres de transporte, a metáfora por trás do Docker e do Kubernetes"),
    # ---------- Fase 8: era atual ----------
    (8, "vision-pro", "File:Apple Vision Pro on display.jpg", "objeto",
     "Apple Vision Pro, computação espacial apresentada em 2023"),
    (8, "meta-quest", "File:Meta Quest 3 front View.jpg", "objeto",
     "Meta Quest 3, óculos de realidade mista"),
]

# Pessoas citadas na modelagem para as quais NÃO existe imagem com licença
# livre no Commons. A página da fase precisa apresentá-las de outra forma
# (cartão tipográfico), e não com uma foto emprestada de qualquer lugar.
SEM_IMAGEM_LIVRE = {
    "Gary Kildall (fase 2)": "nenhuma foto no Commons; só a assinatura dele",
}


def buscar(url):
    pedido = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    with urllib.request.urlopen(pedido, timeout=40) as resposta:
        return resposta.read()


def limpar_texto(bruto):
    """Transforma o HTML que vem do Commons em texto limpo.

    Os campos de autoria costumam vir como um emaranhado de tags aninhadas.
    Trocar tag por espaço (em vez de apagar) evita que duas palavras grudem,
    e o teste de frase repetida resolve o caso comum em que o mesmo nome
    aparece duas vezes por causa das tags empilhadas.
    """
    texto = re.sub(r"<[^>]*>", " ", bruto or "")
    texto = html_lib.unescape(texto)
    texto = re.sub(r"\s+", " ", texto)
    texto = re.sub(r"\s+([.,;:])", r"\1", texto)  # " ." vira "."
    texto = texto.strip().strip(",;")

    # "Unknown author Unknown author" vira "Unknown author": o nome aparece
    # duas vezes porque no Commons ele vem dentro de tags empilhadas.
    palavras = texto.split(" ")
    if len(palavras) >= 2 and len(palavras) % 2 == 0:
        metade = len(palavras) // 2
        if palavras[:metade] == palavras[metade:]:
            texto = " ".join(palavras[:metade])

    if re.fullmatch(r"unknown( author)?|anonymous|not provided", texto, re.I):
        texto = "autoria desconhecida"

    return texto


def imagem_do_artigo(titulo):
    """Devolve a URL da imagem principal do artigo, ou None."""
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(
        titulo.replace(" ", "_")
    )
    try:
        dados = json.loads(buscar(url))
    except Exception as erro:
        return None, "artigo não encontrado (%s)" % erro
    original = dados.get("originalimage") or dados.get("thumbnail")
    if not original:
        return None, "artigo sem imagem principal"
    return original["source"], None


def nome_do_arquivo(url_imagem):
    """Extrai o nome do arquivo a partir da URL devolvida pela Wikipédia."""
    # A API gruda parâmetros de rastreio (?utm_source=...) no fim da URL.
    nome = urllib.parse.unquote(url_imagem.split("?")[0].split("/")[-1])
    return re.sub(r"^\d+px-", "", nome)  # se veio um thumb, volta ao original


def ficha_do_commons(nome):
    """Confirma que o arquivo existe no Commons e devolve autor e licença."""
    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&format=json"
        "&prop=imageinfo&iiprop=url%7Cextmetadata&titles="
        + urllib.parse.quote("File:" + nome)
    )
    try:
        dados = json.loads(buscar(api))
    except Exception as erro:
        return None, "falha na consulta ao Commons (%s)" % erro

    paginas = dados.get("query", {}).get("pages", {})
    for pagina in paginas.values():
        if "missing" in pagina or not pagina.get("imageinfo"):
            return None, "arquivo não existe no Commons (provável uso justo)"
        info = pagina["imageinfo"][0]
        meta = info.get("extmetadata", {})

        def campo(chave):
            return limpar_texto(meta.get(chave, {}).get("value", ""))

        licenca = campo("LicenseShortName") or campo("License")
        if LICENCAS_PROIBIDAS.search(licenca) or not LICENCAS_OK.search(licenca):
            return None, "licença não aceita: %r" % (licenca or "desconhecida")

        return {
            "arquivo_origem": pagina["title"],
            "autor": campo("Artist") or "autoria não informada",
            "licenca": licenca,
            "licenca_url": meta.get("LicenseUrl", {}).get("value", ""),
            "pagina": info.get("descriptionurl", ""),
            "url_original": info["url"].split("?")[0],
        }, None
    return None, "resposta vazia do Commons"


def tratar(bytes_imagem, tipo):
    """Recorta retrato em 3:4 e limita objeto a 900px de largura."""
    img = Image.open(io.BytesIO(bytes_imagem))
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        fundo = Image.new("RGBA", img.size, (13, 15, 18, 255))
        img = Image.alpha_composite(fundo, img)
    img = img.convert("RGB")

    if tipo == "retrato":
        alvo_l, alvo_a = 640, 853  # 3:4, o rosto costuma ficar no terço superior
        escala = max(alvo_l / img.width, alvo_a / img.height)
        novo = (max(1, round(img.width * escala)), max(1, round(img.height * escala)))
        img = img.resize(novo, Image.LANCZOS)
        esq = (img.width - alvo_l) // 2
        topo = int((img.height - alvo_a) * 0.22)  # puxa o corte para cima
        img = img.crop((esq, topo, esq + alvo_l, topo + alvo_a))
    elif img.width > 900:
        img = img.resize((900, round(img.height * 900 / img.width)), Image.LANCZOS)

    saida = io.BytesIO()
    img.save(saida, "WEBP", quality=82, method=6)
    return saida.getvalue(), img.size


def gravar_creditos(creditos):
    with io.open(os.path.join(DESTINO, "creditos.json"), "w", encoding="utf-8") as s:
        json.dump(creditos, s, ensure_ascii=False, indent=2)

    # O site roda por file:// no dia da amostra, e o navegador bloqueia fetch
    # de arquivo local. Por isso a mesma lista sai também como .js, que a
    # página de créditos carrega com uma tag <script> comum.
    with io.open(os.path.join(DESTINO, "creditos.js"), "w", encoding="utf-8") as s:
        s.write("/* Gerado por ferramentas/baixar_retratos.py. Não edite à mão. */\n")
        s.write("window.RetroNet = window.RetroNet || {};\n")
        s.write("window.RetroNet.CREDITOS_IMAGENS = ")
        json.dump(creditos, s, ensure_ascii=False, indent=2)
        s.write(";\n")


def main():
    os.makedirs(DESTINO, exist_ok=True)
    creditos, recusadas = [], []

    for fase, ident, origem, tipo, rotulo in CATALOGO:
        if origem.startswith("File:"):
            nome = origem[len("File:"):]
        else:
            url_imagem, erro = imagem_do_artigo(origem)
            if erro:
                recusadas.append((ident, erro))
                print("  RECUSADA  %-20s %s" % (ident, erro))
                continue
            nome = nome_do_arquivo(url_imagem)

        ficha, erro = ficha_do_commons(nome)
        if erro:
            recusadas.append((ident, erro))
            print("  RECUSADA  %-20s %s" % (ident, erro))
            continue

        nome_arquivo = "%s.webp" % ident
        caminho = os.path.join(DESTINO, nome_arquivo)

        # Se a imagem ja foi baixada, nao baixa de novo: assim da para
        # corrigir so os creditos sem passar dez minutos rebaixando tudo.
        # Apague o .webp (ou a pasta inteira) para forcar o download.
        if os.path.exists(caminho):
            with Image.open(caminho) as existente:
                tamanho = existente.size
            print("  reusada   %-20s %s" % (ident, ficha["licenca"]))
        else:
            try:
                dados, tamanho = tratar(buscar(ficha["url_original"]), tipo)
            except Exception as falha:
                recusadas.append((ident, "falha ao processar (%s)" % falha))
                print("  RECUSADA  %-20s falha ao processar: %s" % (ident, falha))
                continue
            with open(caminho, "wb") as saida:
                saida.write(dados)
            print("  baixada   %-20s %5dKB  %s"
                  % (ident, len(dados) // 1024, ficha["licenca"]))

        ficha.update({
            "id": ident,
            "fase": fase,
            "assunto": rotulo,
            "tipo": tipo,
            "arquivo": "assets/retratos/" + nome_arquivo,
            "largura": tamanho[0],
            "altura": tamanho[1],
        })
        creditos.append(ficha)
        time.sleep(0.25)  # gentileza com os servidores do Wikimedia

    gravar_creditos(creditos)

    print("\n%d imagens salvas, %d recusadas" % (len(creditos), len(recusadas)))
    if SEM_IMAGEM_LIVRE:
        print("\nSem imagem de licença livre (usar cartão tipográfico na página):")
        for quem, motivo in SEM_IMAGEM_LIVRE.items():
            print("  - %s: %s" % (quem, motivo))
    return 0


if __name__ == "__main__":
    sys.exit(main())
