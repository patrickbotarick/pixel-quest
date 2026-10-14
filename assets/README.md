# Pixel Quest — Asset Factory v1.0

Biblioteca independente para **Pixel Quest: Aventura dos Desafios**. Samuca segue a ficha oficial fornecida em `00_references/samuca_official_reference.png`. A biblioteca fica em `assets/` no monorepositório; o jogo existente fica em `../game/`. A migração não regenerou arte.

221 recursos no manifesto; 183 ready; 38 needs_review; 83 spritesheets; 414 quadros de animação.

183 recursos aprovados, 75 spritesheets e 374 quadros no pacote de integração. A produção artística não está 100% aprovada: os itens em revisão permanecem fora de `dist/`.

## Abrir os resultados

Abra `09_previews/index.html` em um navegador. Os dados estão embutidos em `viewer_data.js`, portanto o visualizador também pode funcionar via arquivo local sem servidor. Para servir por HTTP, dentro de `assets/`:

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8766/09_previews/index.html`. Encerre o servidor com Ctrl+C no terminal correspondente.

O visualizador permite selecionar personagem/animação, pausar/reproduzir, avançar quadros, trocar escala e fundo, inspecionar metadata, alternar camadas e testar todos os caminhos. Ele apenas lê assets.

## Ferramentas

Execute os comandos desta seção a partir de `assets/`.

Python + Pillow (única dependência de produção). Na máquina desta entrega foi utilizado o Python empacotado pelo Codex, com Pillow 12.3.0. Node.js foi usado para verificar a sintaxe do visualizador. A arte complexa foi efetivamente gerada com `image_gen` nativa em 26 chamadas; não foram usadas credenciais de API nem bibliotecas de assets baixadas.

```powershell
# Python instalado no computador:
python -m pip install -r 11_tools/requirements.txt
python 11_tools/qa.py
python 11_tools/previews.py
python 11_tools/viewer.py

# Ou o runtime já disponível nesta máquina:
$factoryPython = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
& $factoryPython 11_tools/qa.py

# Reconstruir exportações a partir das fontes locais preservadas:
./11_tools/run_factory.ps1 -Python $factoryPython
```

`run_factory.ps1` não gera nova arte por API. Ele recompõe os arquivos a partir das fontes locais. Aprovações estão vinculadas a SHA256; se uma textura mudar, a revisão precisa ser refeita antes da exportação.

## Organização

```text
00_references/       referências oficiais, prints e fontes de ilustrações
01_brand/            logotipo original separado
02_characters/       Samuca: referências, PNGs, animações, expressões, metadata
03_enemies/          nove arquétipos, fontes, PNGs, animações e metadata
04_bosses/           Guardião de Pedra e Dragão das Sombras
05_environments/     quatro ambientes: seis camadas, props, fontes e metadata
06_ui/               botões, HUD, painéis, cartas, progress, ícones, menu
07_vfx/              doze efeitos + versões reduzidas
08_world/            mapa, introdução, vitória, derrota e encerramento
09_previews/         HTML local, GIFs, contact sheets, composições e catálogo
10_manifests/        manifesto, QA, cobertura, paletas, hashes e revisão
11_tools/            produção, exportação, validação e documentação
12_docs/             guias e exemplos TypeScript
dist/                exclusivamente recursos aprovados e metadados de integração
```

## Integração

Copie o **conteúdo de `dist/`** para uma pasta estática do jogo existente. Use `dist/assets.manifest.json`; nunca importe automaticamente o manifesto completo. Consulte `12_docs/PHASER_INTEGRATION.md`, `12_docs/examples/phaser_assets.ts` e `12_docs/GROK_IMPORT_PROMPT.md`.

O ZIP `pixel_quest_approved_assets_v1.zip` contém a mesma biblioteca aprovada, sem fontes, previews ou recursos pendentes. `dist/` e ZIP não são versionados: depois de clonar, execute `python 11_tools/qa.py` e `python 11_tools/release.py` para gerá-los. Consulte [publicação e reprodução](12_docs/GITHUB_PUBLICATION.md).

## Situação

QA técnico: 0 erros. A existência e o carregamento de arquivos não equivalem a aprovação visual. A lista precisa de pendências está em `12_docs/PRODUCTION_STATUS.md` e `10_manifests/visual_review.json`.

Leia também `ART_DIRECTION.md`, `ASSET_CATALOG.md`, `ANIMATION_GUIDE.md`, `QA_REPORT.md` e `LICENSE_AND_PROVENANCE.md` em `12_docs/`.
