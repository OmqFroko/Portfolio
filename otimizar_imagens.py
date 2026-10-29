#!/usr/bin/env python3
"""
OTIMIZAR_IMAGENS.PY — deixa as imagens do portfólio muito mais leves.

O que faz:
  1. Percorre a pasta Imagens/ (e as subpastas que indicares em PASTAS_IMAGENS).
  2. Reduz as imagens que sejam maiores do que LARGURA_MAXIMA x ALTURA_MAXIMA.
  3. Converte para WebP (ou JPG) com a QUALIDADE escolhida.
  4. Só substitui uma imagem se o ficheiro novo for realmente mais pequeno.
  5. Atualiza os nomes no config.js (ex.: "Capa1.png" passa a "Capa1.webp").
  6. Guarda os originais numa pasta de backup FORA do site, para nunca perderes nada.

Como usar (na pasta do site, onde está o config.js):
  pip install pillow            (só na primeira vez)
  python otimizar_imagens.py --simular     vê quanto vais poupar, sem alterar nada
  python otimizar_imagens.py               otimiza mesmo
(no Windows, se "python" não funcionar, tenta "py" em vez de "python")
"""

import io
import re
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps


# =============================================================================
# AJUSTES — números e opções para afinar
# =============================================================================

PASTA_SITE = Path(__file__).resolve().parent          # a pasta onde este script está
PASTAS_IMAGENS = ["Imagens"]                          # pastas a otimizar (Media fica de fora: logo e favicon)
FICHEIRO_CONFIG = "config.js"                         # onde estão os nomes dos ficheiros

LARGURA_MAXIMA = 1800                                 # px; imagens maiores são reduzidas (nunca ampliadas)
ALTURA_MAXIMA = 2400                                  # px; cartazes altos podem ser maiores na vertical
QUALIDADE = 85                                        # 1 a 100: 80-90 é o ponto certo para portfólios
FORMATO_SAIDA = "webp"                                # "webp" (mais leve) ou "jpg" (compatível com tudo)
GANHO_MINIMO = 0.05                                   # só substitui se poupar pelo menos 5 %
LIMPAR_NOMES = False                                  # True: tira espaços e acentos dos nomes ("MP MAS.png" -> "MP-MAS.webp")

EXTENSOES_ENTRADA = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
PASTA_BACKUP = PASTA_SITE.parent / "_backup_imagens"  # os originais ficam aqui, fora do site


# =============================================================================
# FUNÇÕES
# =============================================================================

def formatar(bytes_):
    return f"{bytes_ / 1_048_576:.2f} MB" if bytes_ >= 1_048_576 else f"{bytes_ / 1024:.0f} KB"


def nome_limpo(texto):
    """'Anúncio do Grupo.png' -> 'Anuncio-do-Grupo' (só se LIMPAR_NOMES estiver ligado)."""
    import unicodedata
    sem_acentos = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9._-]+", "-", sem_acentos).strip("-") or "imagem"


def listar_imagens():
    for pasta in PASTAS_IMAGENS:
        raiz = PASTA_SITE / pasta
        if not raiz.is_dir():
            print(f"  (a pasta {pasta}/ não existe, ignorada)")
            continue
        for caminho in sorted(raiz.rglob("*")):
            if caminho.is_file() and caminho.suffix.lower() in EXTENSOES_ENTRADA:
                yield caminho


def codificar(caminho):
    """Abre a imagem, reduz se for grande e devolve os bytes já no formato de saída."""
    with Image.open(caminho) as original:
        imagem = ImageOps.exif_transpose(original)          # respeita a rotação das fotos de telemóvel

        proporcao = min(LARGURA_MAXIMA / imagem.width, ALTURA_MAXIMA / imagem.height, 1)
        if proporcao < 1:
            imagem = imagem.resize((round(imagem.width * proporcao), round(imagem.height * proporcao)), Image.LANCZOS)

        tem_transparencia = imagem.mode in ("RGBA", "LA") or (imagem.mode == "P" and "transparency" in imagem.info)
        saida = io.BytesIO()

        if FORMATO_SAIDA == "webp":
            imagem = imagem.convert("RGBA" if tem_transparencia else "RGB")
            imagem.save(saida, "WEBP", quality=QUALIDADE, method=6)
        else:   # jpg não tem transparência: o fundo transparente passa a branco
            if tem_transparencia:
                imagem = imagem.convert("RGBA")
                fundo = Image.new("RGB", imagem.size, "white")
                fundo.paste(imagem, mask=imagem.split()[-1])
                imagem = fundo
            else:
                imagem = imagem.convert("RGB")
            imagem.save(saida, "JPEG", quality=QUALIDADE, optimize=True, progressive=True)

        return saida.getvalue(), (imagem.width, imagem.height)


def novo_caminho(caminho, ocupados):
    """Escolhe o nome do ficheiro novo, evitando choques (ex.: a.png e a.jpg dão ambos a.webp)."""
    extensao = ".webp" if FORMATO_SAIDA == "webp" else ".jpg"
    base = nome_limpo(caminho.stem) if LIMPAR_NOMES else caminho.stem
    candidato, n = caminho.with_name(base + extensao), 2
    while candidato in ocupados and candidato != caminho:
        candidato = caminho.with_name(f"{base}-{n}{extensao}")
        n += 1
    return candidato


def atualizar_config(renomeacoes, simular):
    """Troca "Capa1.png" por "Capa1.webp" no config.js (guarda uma cópia em config.js.bak)."""
    config = PASTA_SITE / FICHEIRO_CONFIG
    if not renomeacoes:
        return
    if not config.exists():
        print(f"\n⚠ Não encontrei {FICHEIRO_CONFIG}: atualiza os nomes à mão.")
        return

    texto = config.read_text(encoding="utf-8")
    original = texto
    trocados = 0
    for antigo, novo in renomeacoes.items():
        padrao = re.compile(r"([\"'])" + re.escape(antigo) + r"\1")
        texto, n = padrao.subn(lambda m: f"{m.group(1)}{novo}{m.group(1)}", texto)
        trocados += n

    print(f"\n{FICHEIRO_CONFIG}: {trocados} referência(s) atualizada(s).")
    sem_uso = [a for a in renomeacoes if not re.search(r"([\"'])" + re.escape(a) + r"\1", original)]
    if sem_uso:
        print(f"  {len(sem_uso)} imagem(ns) não estão no config.js (não faz mal), por exemplo: {sem_uso[0]}")

    if not simular and texto != original:
        shutil.copy2(config, config.with_suffix(".js.bak"))
        config.write_text(texto, encoding="utf-8")
        print(f"  (cópia de segurança: {config.with_suffix('.js.bak').name})")


def main():
    simular = "--simular" in sys.argv
    print("SIMULAÇÃO: nada vai ser alterado.\n" if simular else "A otimizar as imagens...\n")

    ocupados = set(listar_imagens())
    renomeacoes = {}          # nome antigo -> nome novo (só o nome do ficheiro)
    total_antes = total_depois = 0
    mantidas = 0

    for caminho in list(ocupados):
        antes = caminho.stat().st_size
        try:
            dados, (largura, altura) = codificar(caminho)
        except Exception as erro:
            print(f"  ✗ {caminho.name}: não consegui abrir ({erro})")
            continue

        if len(dados) > antes * (1 - GANHO_MINIMO):
            mantidas += 1
            print(f"  = {caminho.name}: já está bem ({formatar(antes)}), mantida")
            continue

        destino = novo_caminho(caminho, ocupados)
        total_antes += antes
        total_depois += len(dados)
        print(f"  ✓ {caminho.name}  {formatar(antes)} -> {formatar(len(dados))}  ({largura}x{altura})  -> {destino.name}")

        if not simular:
            backup = PASTA_BACKUP / caminho.relative_to(PASTA_SITE)
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(caminho, backup)
            destino.write_bytes(dados)
            if destino != caminho:
                caminho.unlink()
        ocupados.discard(caminho)
        ocupados.add(destino)
        if destino.name != caminho.name:
            renomeacoes[caminho.name] = destino.name

    atualizar_config(renomeacoes, simular)

    if total_antes:
        poupado = total_antes - total_depois
        print(f"\nTotal: {formatar(total_antes)} -> {formatar(total_depois)}  "
              f"(poupas {formatar(poupado)}, {poupado / total_antes:.0%})")
    else:
        print("\nNão havia nada para otimizar.")
    if mantidas:
        print(f"{mantidas} imagem(ns) já estavam otimizadas.")
    if not simular and total_antes:
        print(f"\nOs originais estão em: {PASTA_BACKUP}")
        print("Abre o site e confirma que está tudo bem; só depois podes apagar o backup.")


if __name__ == "__main__":
    main()