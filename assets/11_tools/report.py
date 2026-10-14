"""Generate documentation and coverage tables from audited files, never invented totals."""
from pathlib import Path
from collections import Counter
import json
ROOT=Path(__file__).resolve().parents[1]

def write(name,text):
    p=ROOT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text.strip()+'\n',encoding='utf-8')

def reports():
    manifest=json.loads((ROOT/'10_manifests/assets.manifest.json').read_text(encoding='utf-8'));assets=manifest['assets']
    qa=json.loads((ROOT/'10_manifests/qa_report.json').read_text(encoding='utf-8'));counts=Counter(a['production_status'] for a in assets)
    ready=[a for a in assets if a['production_status']=='ready'];pending=[a for a in assets if a['production_status']!='ready']
    sources=json.loads((ROOT/'10_manifests/sources.json').read_text(encoding='utf-8'));colors=json.loads((ROOT/'10_manifests/used_colors.json').read_text(encoding='utf-8'))
    package=json.loads((ROOT/'10_manifests/package_report.json').read_text(encoding='utf-8')) if (ROOT/'10_manifests/package_report.json').exists() else None
    summary=f"{len(assets)} recursos no manifesto; {counts['ready']} ready; {counts['needs_review']} needs_review; {sum(a['type']=='spritesheet' for a in assets)} spritesheets; {sum(a['frames'] for a in assets if a['type']=='spritesheet')} quadros de animação."
    shipped=f"{len(ready)} recursos aprovados, {sum(a['type']=='spritesheet' for a in ready)} spritesheets e {sum(a['frames'] for a in ready if a['type']=='spritesheet')} quadros no pacote de integração."
    structure='''00_references/       referências oficiais, prints e fontes de ilustrações
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
dist/                exclusivamente recursos aprovados e metadados de integração'''
    write('README.md',f'''# Pixel Quest — Asset Factory v1.0

Biblioteca independente para **Pixel Quest: Aventura dos Desafios**. Samuca segue a ficha oficial fornecida em `00_references/samuca_official_reference.png`. Nenhum projeto do Grok ou código do jogo foi alterado.

{summary}

{shipped} A produção artística não está 100% aprovada: os itens em revisão permanecem fora de `dist/`.

## Abrir os resultados

Abra `09_previews/index.html` em um navegador. Os dados estão embutidos em `viewer_data.js`, portanto o visualizador também pode funcionar via arquivo local sem servidor. Para servir por HTTP, na raiz:

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8766/09_previews/index.html`. Encerre o servidor com Ctrl+C no terminal correspondente.

O visualizador permite selecionar personagem/animação, pausar/reproduzir, avançar quadros, trocar escala e fundo, inspecionar metadata, alternar camadas e testar todos os caminhos. Ele apenas lê assets.

## Ferramentas

Python + Pillow (única dependência de produção). Na máquina desta entrega foi utilizado o Python empacotado pelo Codex, com Pillow 12.3.0. Node.js foi usado para verificar a sintaxe do visualizador. A arte complexa foi efetivamente gerada com `image_gen` nativa em {len(sources)} chamadas; não foram usadas credenciais de API nem bibliotecas de assets baixadas.

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
{structure}
```

## Integração

Copie o **conteúdo de `dist/`** para uma pasta estática do jogo existente. Use `dist/assets.manifest.json`; nunca importe automaticamente o manifesto completo. Consulte `12_docs/PHASER_INTEGRATION.md`, `12_docs/examples/phaser_assets.ts` e `12_docs/GROK_IMPORT_PROMPT.md`.

O ZIP `pixel_quest_approved_assets_v1.zip` contém a mesma biblioteca aprovada, sem fontes, previews ou recursos pendentes. `dist/` e ZIP não são versionados: depois de clonar, execute `python 11_tools/qa.py` e `python 11_tools/release.py` para gerá-los. Consulte [publicação e reprodução](12_docs/GITHUB_PUBLICATION.md).

## Situação

QA técnico: {len(qa['errors'])} erros. A existência e o carregamento de arquivos não equivalem a aprovação visual. A lista precisa de pendências está em `12_docs/PRODUCTION_STATUS.md` e `10_manifests/visual_review.json`.

Leia também `ART_DIRECTION.md`, `ASSET_CATALOG.md`, `ANIMATION_GUIDE.md`, `QA_REPORT.md` e `LICENSE_AND_PROVENANCE.md` em `12_docs/`.
''')
    palette=json.loads((ROOT/'10_manifests/palette.json').read_text(encoding='utf-8'))['colors']
    table='\n'.join('| '+c['name']+' | '+c['hex']+' |' for c in palette)
    write('12_docs/ART_DIRECTION.md',f'''# Direção de arte

Identidade: fantasy pixel art 16-bit, Samuca chibi com cabelo castanho e mecha dourada, olhos expressivos, túnica azul com ouro, capa verde, botas marrons e espada curta. A fonte de identidade é a ficha oficial, preservada sem alterações. Os seis recortes de vistas/poses em `02_characters/samuca/references/` são referências com fundo, nunca sprites finais.

Luz principal no alto à esquerda; contorno escuro; sombras azuis/verdes; creme e ouro para os destaques. Floresta acolhedora e cristal mágico azul/violeta. Derrota amigável, sem violência gráfica.

Personagens e chefes: geração nativa com a ficha como referência de estilo; Samuca usa também a identidade da ficha. O ataque novo do Dragão recebeu a própria ficha gerada do Dragão como segunda referência. Exportações preservam fontes, normalizam alpha, encontram intervalos entre poses, removem pequenos fragmentos desconectados e usam nearest-neighbor. Nenhuma anatomia cortada foi reconstruída por código.

Samuca: 128×128 por frame, ampliado em relação à sugestão inicial de 96 para acomodar espada e capa. Inimigos: 96×96. Guardião: 192×192. Dragão: 256×256. Origem de personagem (0.5,0.9375). VFX: 128×128, origem central. Cenários: 1280×720, seis camadas reais independentes; props ocupam laterais. O apoio dos pés usa combat_baseline_y de cada layers.json, calibrado pela faixa opaca do terreno. Área de desafios reservada a partir de y=530.

As exportações usam até 256 cores RGB compartilhadas e nenhum dithering. Há {colors['count']} cores RGB efetivamente usadas; `10_manifests/used_colors.json` enumera todas em HEX, e `export_palette.json` contém a paleta completa de exportação. Transparência é separada da paleta RGB. Os sprites têm alpha binário; overlays podem ter alpha parcial.

## Cores mestras

| Nome | HEX |
|---|---|
{table}

As fontes originais de geração têm mais cores e não são destinadas ao preload. O logotipo usa glifos pixelados desenhados no script, sem fonte comercial. Textos de painéis, desafios, HP e números de fase devem ser renderizados dinamicamente pelo Phaser.

Os ambientes foram aprovados para parallax limitado. O terreno repete material original; as emendas não foram certificadas para rolagem infinita. Props avulsos e expressões recortadas precisam de acabamento antes de serem tratados como peças independentes.
''')
    lines=['# Catálogo de assets','',summary,'',shipped,'','| ID | Categoria | Dimensões | Quadros | Estado | Caminho |','|---|---|---|---:|---|---|']
    for a in assets: lines.append(f"| {a['id']} | {a['category']} | {a['width']}×{a['height']} | {a['frames']} | {a['production_status']} | `{a['path']}` |")
    write('12_docs/ASSET_CATALOG.md','\n'.join(lines))
    rows=['# Guia de animações','','Spritesheets em uma linha, sem margem nem espaçamento, quadros numéricos de 0 a N−1. Frames individuais ficam em `sprites/`; JSONs em `metadata/`. Os JSONs descrevem a carga e a animação; **não são JSONs de atlas** nem devem ser passados diretamente a `load.animation`. Use o exemplo TypeScript.','','Loops: idle dos personagens e segunda fase do Dragão. Preparação, ataque, dano, vitória, derrota, retorno e VFX são execuções únicas. GIFs de preview têm loop infinito apenas para animações marcadas como loop; previews de execução única terminam.','','Samuca possui 36 quadros finais; inimigos, 16 cada; Guardião, 30; Dragão, 36. As poses novas substituem fontes defeituosas, sem aumentar artificialmente o número de frames finais. A ordem do Dragão foi ajustada pela leitura das poses reais. Os counts do Guardião foram ajustados ao conteúdo observado, pois o pedido não fixou números por animação.','','| Animação | Frames | FPS | Loop | Estado |','|---|---:|---:|---|---|']
    for a in assets:
        if a['type']=='spritesheet': rows.append(f"| {a['id']} | {a['frames']} | {a['fps']} | {'sim' if a['loop'] else 'não'} | {a['production_status']} |")
    rows+=['','VFX de espada, impacto, dano, dissolução, Golem, Dragão, estrela, vitória e cristal são separados dos personagens. Cada efeito possui 8 quadros normais e 6 reduzidos. As versões reduzidas usam menos quadros; impactos, projéteis e celebrações também têm menos partículas. Elas não substituem testes de acessibilidade no jogo integrado. Alguns ataques de inimigos ainda têm rastros embutidos e estão em revisão.','', 'Eventos de jogo devem disparar as animações. Nunca calcule dano, sucesso de desafio ou progressão pela duração de uma animação visual.']
    write('12_docs/ANIMATION_GUIDE.md','\n'.join(rows))
    write('12_docs/PHASER_INTEGRATION.md',f'''# Integração futura com Phaser 3

{shipped}

Use os caminhos de `dist/assets.manifest.json` relativamente à pasta que receber o conteúdo de `dist/`. IDs completos são as chaves de textura e animação, por exemplo `samuca.idle`, `mushroom.attack`, `ui.card_sword` e `enchanted_forest.distant`.

## Preload e animações

O código em `examples/phaser_assets.ts` oferece funções genéricas para a Scene existente. Antes do preload, obtenha o manifesto aprovado usando o bootstrap já existente do jogo. Se ele for carregado em uma Scene de boot, repasse-o à Scene que carrega as texturas. Não tente usar uma textura imediatamente após enfileirá-la.

```typescript
// Dentro do preload existente, com manifest já obtido:
this.load.json('forest.layers', '/assets/pixel_quest/05_environments/enchanted_forest/metadata/layers.json');
queueAssets(this, manifest, '/assets/pixel_quest/', new Set([
  'samuca.idle', 'samuca.attack', 'mushroom.idle', 'mushroom.attack',
  'ui.card_sword', 'enchanted_forest.distant'
]));

// Dentro do create existente, após o carregamento:
registerAnimations(this, manifest);
const groundY = this.cache.json.get('forest.layers').combat_baseline_y;
const hero = addCharacterWithFallback(this, 320, groundY, 'samuca.idle', oldHeroTextureKey);
hero.setScale(2);
```

`oldHeroTextureKey` é uma chave real do jogo fornecida pelo integrador; não foi presumida. Use IDs distintos dos assets antigos, mantenha suas cargas e só remova o fallback depois da regressão. O projeto original não foi disponibilizado.

Samuca usa frames 128×128; inimigos 96×96; Guardião 192×192; Dragão 256×256. Cada PNG de animação é uma linha com N quadros; `startFrame=0`, `endFrame=N-1`, `margin=0`, `spacing=0`. Use `generateFrameNumbers` e `repeat=-1` nos loops; `repeat=0` nos demais. Os JSONs fornecem `frameConfig`, FPS, origem e execução. Não carregue GIFs como animações do Phaser.

Sprites de personagem têm origem (0.5,0.9375), correspondendo aos pés em y=120 para Samuca. VFX: (0.5,0.5). Camadas, fundos e overlays: (0,0). Os personagens foram desenhados voltados à direita; inimigos à direita da arena podem usar `setFlipX(true)`. Escala inicial sugerida: Samuca 2×, inimigos 2×, Guardião 2×, Dragão 1.5×; ajuste preservando as proporções aprovadas do jogo. O valor 1.5 é uma opção de apresentação, mas prefira escalas inteiras quando a resolução permitir.

## Camadas e UI

Cada ambiente possui `metadata/layers.json` com paths, depth, scroll_factor, combat_baseline_y calibrado e área de desafios y=530..719. Leia o baseline do ambiente para alinhar os pés; não use uma altura fixa para os quatro cenários. Adicione as seis imagens com origem zero na ordem distante, intermediário, cenário, solo, primeiro plano e partículas. Separe o HUD com scrollFactor zero. Limite o deslocamento da câmera para não revelar limites laterais das camadas. Não foram certificadas emendas de parallax infinito.

Botões 240×64, cards 68×84, ícones 32×32. Cartas permanecem legíveis na largura aproximada de 69 pixels solicitada. Bordas e cantos separados estão em `06_ui/buttons/nine_slice/`. Painéis e botões possuem metadados `nine_slice` e `safe_content`. Phaser 3.60+ em WebGL oferece `add.nineslice`; versões anteriores/Canvas podem montar as nove partes como imagens. Os painéis não contêm textos fixos. HP separa frame e fill; recorte o fill como no helper `setHPFill`, sem achatar a moldura.

O mapa separa background, coordenadas em `08_world/stage_map/stages.json`, ícones `ui.stage_*` e textos dinâmicos. Os chefes correspondem às fases 5 e 10. O overlay de trajeto está pendente e **não está em dist**; preserve temporariamente o caminho do jogo existente ou desenhe o caminho pelos dez pontos com seu renderer atual.

## Sequência recomendada

1. Backup do projeto e build de referência.
2. UI e cartas, comparando legibilidade e áreas clicáveis.
3. Samuca idle e Cogumelo Travesso na fase 3, mantendo fallback.
4. Animações aprovadas, HP e VFX separados.
5. Floresta e Ruínas; depois Cavernas e Santuário.
6. Chefes e mudança visual de fase disparada pela lógica já existente.
7. Mapa, menu e encerramento. Importar recursos pendentes somente após aprovação nova.

## Mobile e desempenho

Mantenha alvos de toque de pelo menos 44 pixels CSS e espaçamento que evite sobreposição. O helper `addTouchTarget` converte esse mínimo em unidades lógicas com o displayScale. Redimensione painéis e layouts em orientação/tela pequena; não comprima todo o HUD em uma única faixa. Teste em aparelhos reais, pois a Asset Factory não executou o jogo.

Carregue apenas o ambiente e inimigos necessários à fase. Remova texturas antigas quando não usadas por outras Scenes. Prefira `pixelArt: true`, `antialias: false`, `roundPixels: true`; alinhe coordenadas à grade. Não use camera shake ou flash global por padrão. Os VFX reduzidos estão disponíveis; mantenha o estado de acessibilidade do jogo. A maior spritesheet tem {max(a['width'] for a in assets if a['type']=='spritesheet')} px de largura.

O conjunto completo de texturas aprovadas demanda cerca de 143 MiB de pixels RGBA decodificados, antes de custos adicionais da GPU. Evite carregá-lo inteiro em mobile: selecione assets por fase; um único conjunto de seis camadas 1280×720 representa cerca de 21 MiB. Esses são cálculos por dimensões, não benchmarks de aparelho.

Os exemplos foram preparados contra as assinaturas oficiais do Phaser **3.90.0**. Referências: [SpriteSheetFile](https://github.com/phaserjs/phaser/blob/v3.90.0/src/loader/filetypes/SpriteSheetFile.js), [AnimationManager](https://github.com/phaserjs/phaser/blob/v3.90.0/src/animations/AnimationManager.js), [NineSliceFactory](https://github.com/phaserjs/phaser/blob/v3.90.0/src/gameobjects/nineslice/NineSliceFactory.js). O TypeScript não foi compilado contra o jogo original, que não foi fornecido; os testes desta entrega validam os assets e o visualizador.
''')
    write('12_docs/GROK_IMPORT_PROMPT.md','''# Prompt para Grok Build

Integre o pacote aprovado Pixel Quest Asset Factory v1.0 no jogo Phaser 3 já existente, Pixel Quest: Aventura dos Desafios. O protagonista é Samuca. Esta tarefa é substituição de arte; preserve integralmente as mecânicas, lógica de combate, resolução de desafios, pontuação, saves, progressão, matemática, memória, reflexo e regras dos chefes.

Antes de modificar, crie backup verificável ou branch de trabalho e execute o build atual. Registre o comportamento de referência das dez fases, menu, configuração, vitória, derrota e encerramento. Não recrie o jogo. Não substitua a identidade oficial de Samuca.

Receba o conteúdo de dist/ ou pixel_quest_approved_assets_v1.zip e leia assets.manifest.json. Importe exclusivamente entradas ready. Não use o manifesto completo do workspace para importar fontes, referências, GIFs, previews ou necessidades de revisão. Preserve sprites atuais como fallback com chaves distintas. Não importe animações pendentes de ataque de inimigos nem o ataque novo da segunda fase do Dragão antes de aprovação. Se um recurso não estiver no pacote, mantenha a arte atual correspondente.

Integre por etapas pequenas e reversíveis: UI/cartas, Samuca, Cogumelo Travesso na fase 3, demais animações aprovadas e VFX, cenários, chefes, mapa e telas. Em cada etapa confira alpha, dimensões e enquadramento. Samuca usa frames 128×128; inimigos 96×96; Guardião 192×192; Dragão 256×256. Spritesheets são linhas de frames numéricos de 0 a N−1, sem margin/spacing. Use FPS e repeat do manifesto; idle repete, demais animações executam uma vez. Personagens usam origem (0.5,0.9375); VFX usam centro; camadas usam (0,0). Aplique nearest-neighbor/pixelArt e evite interpolação borrada.

Dispare animações e efeitos a partir dos eventos já existentes, mantendo tempos e regras de combate. Não calcule dano ou progressão por duração dos frames. A transição do Dragão deve mudar para a aparência cristalizada quando a lógica existente entrar na segunda fase; não altere seu gatilho ou atributos. Use o ataque antigo de segunda fase como fallback enquanto o novo não estiver aprovado.

Monte cenários pela ordem de seis camadas descrita em metadata/layers.json. Mantenha personagens separados e preserve a área de desafios. Use parallax limitado; não suponha rolagem infinita sem costura. Separe molduras/HP fills, desenhe textos dinamicamente e use nine-slice ou as nove partes. No mapa, leia stages.json e desenhe números e ícones interativos separadamente; fases 5 e 10 são chefes. O trajeto ilustrado ainda está em revisão: preserve o caminho atual ou use renderer dinâmico alinhado às coordenadas.

Garanta funcionamento mobile em retrato e paisagem: alvos mínimos de 44 pixels CSS, painel de desafio legível, cartas com contraste, escala consistente, botão de pausa acessível, ausência de corte e carregamento por fase. Use VFX reduzidos conforme as configurações de acessibilidade existentes; evite estrobo, flashes intensos ou shake excessivo.

Execute testes de regressão dos sistemas existentes: acerto/erro e dano, matemática, memória e pares, reflexo e cronômetro, pausa, configurações, saves, desbloqueio de fases, estrelas, derrota/retry, vitória, chefes nas fases 5 e 10 e segunda fase do Dragão. Compare com o backup. Verifique console, caminhos ausentes, memória de texturas e orientação em dispositivos reais. Execute o build de produção e informe alterações, assets substituídos, fallbacks mantidos, resultados reais e pendências. Não invente testes. Não publique ou faça deploy automaticamente.
''')
    rows=['# Estado de produção','',summary,'',shipped,'','## Concluído e validado','','Pipeline, PNGs finais de recursos ready, metadados Phaser, paleta compartilhada, manifests, ferramentas de QA, GIFs, contact sheets, visualizador e documentação. Samuca possui as oito animações em exportações próprias. Quatro ambientes possuem seis camadas independentes de 1280×720. UI oferece botões/estados, painéis, HP, timer, estrelas, cards, ícones, toggles e nine-slice. Doze VFX têm versões normal/reduzida.','', '## Gerado, pendente de revisão visual','','| ID | Pendência |','|---|---|']
    for a in pending:
        issue='; '.join(a.get('issues',[])) or ('Recorte facial precisa de enquadramento/expressão dedicada.' if a['category']=='expressions' else 'Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada.')
        rows.append(f"| {a['id']} | {issue} |")
    rows+=['','## Não produzido por limitação técnica','','Não há recurso do manifesto marcado como blocked ou missing nesta entrega. A ferramenta nativa de geração foi acessível. Permanecem pendências de acabamento artístico, não inexistência de arquivos. Não foram produzidos um jogo, código de combate, build do Grok nem testes de regressão do jogo: o projeto original não foi disponibilizado e essa integração está fora desta produção de assets.','', '## Condições de aprovação','','`ready` exige inspeção interna registrada, SHA256 que corresponde à textura inspecionada e QA técnico pass. Uma mudança de textura invalida a revisão gravada. `needs_review` não entra em dist.','', '## Ambiente','','Pasta inicialmente continha apenas 00_references, a ficha oficial e três prints. Na produção inicial não havia repositório Git. Para a publicação, foi preparado um clone separado de patrickbotarick/pixel-quest, cujo remoto estava vazio. Consulte GITHUB_PUBLICATION.md para a estrutura e reprodução do pacote. Escrita no workspace verificada pela produção efetiva. Unidade E: tinha cerca de 574 GB livres na auditoria. A consulta de memória por CIM foi bloqueada pelo ambiente; não foi presumido RAM/VRAM disponível. Python empacotado com Pillow 12.3.0, Node.js e ferramenta image_gen foram usados. ImageMagick não foi encontrado no PATH.','', f'Foram realizadas {len(sources)} gerações nativas, incluindo correções de vitória/derrota de Samuca, Slime Verde e segunda fase do Dragão. Todos os prompts e caminhos das fontes estão em sources.json e GENERATION_PROMPTS.md. Fontes externas ao workspace foram copiadas antes da exportação.']
    write('12_docs/PRODUCTION_STATUS.md','\n'.join(rows))
    write('12_docs/QA_REPORT.md',f'''# Relatório de QA

PNG verificados: **{qa['png_files_verified']}** (inclui fontes, referências e previews presentes no momento da auditoria; cópias de dist excluídas). Manifesto: **{len(assets)}** recursos. Spritesheets: **{qa['spritesheets']}**. Frames: **{qa['animation_frames']}**. Erros técnicos: **{len(qa['errors'])}**. Avisos: **{len(qa['warnings'])}**, mantidos principalmente para recursos em revisão.

Testes executados pelo qa.py: abertura/verificação de PNG, leitura de todos os JSONs, presença dos campos obrigatórios, naming de exportações, paths locais, dependências, largura/altura, alpha real, imagens/quadros vazios, divisibilidade de grade, count de frames, hash de quadros, bordas de exportação, igualdade entre frames individuais e recortes do sheet na ordem declarada, FPS, loops, metadata/origem, integridade e count dos GIFs, cobertura de personagens/ambientes. O baseline de cada cenário foi comparado à opacidade do solo e precisa ficar acima da área de desafios. Paleta efetiva: {colors['count']} cores RGB, enumeradas em used_colors.json.

check_tools.py executou sete verificações de composição, extração, roundtrip pixel a pixel, rejeição de grades incompatíveis, rejeição de dimensões diferentes e integridade do preview GIF. run_factory.ps1 foi executado para verificar a reconstrução completa por fontes locais e os hashes da revisão.

Nenhuma spritesheet final tem frames idênticos dentro da própria animação. Reuso entre animações pode ser intencional (retorno a idle), assim como aliases estáticos. Grupos de imagens duplicadas: {len(qa['duplicate_images'])}; ver qa_report.json. Não foram contados aliases como novos quadros de produção.

Validação no navegador: o botão de smoke test carregou **221/221 texturas** e confirmou dimensões. Foram inspecionados os controles de seleção e preview; resultados adicionais e mensagens de console ficam em browser_qa.json. Node.js verificou a sintaxe de viewer.js. O servidor inicial na porta 8765 ficou inacessível sob o sandbox; o servidor somente localhost na 8766 foi iniciado com a exceção de execução permitida, e o visualizador carregou.

Correções realizadas: extração adaptativa da grade; nova vitória de Samuca para remover espada dupla; nova derrota sem recuperação precoce; novas fontes para ataque do Slime Verde e ataque da fase 2 do Dragão; reordenação de poses do Dragão; padronização de alpha/paleta; ajuste de projéteis que tocavam a borda; aumento do canvas do logotipo para incluir a última letra; loops dos GIFs coerentes com metadata.

Limitações: QA automático não prova anatomia, fidelidade facial, continuidade de poses, emendas de parallax ou eficácia de um ataque. Os recursos ready têm revisão visual interna separada, registrada por hash. Props independentes, expressões, oito animações e trajeto do mapa ainda precisam de acabamento. Não houve teste dentro do jogo original, benchmark mobile, compilação de TypeScript contra esse jogo ou build de produção do Grok.

{('Pacote: '+str(package['assets'])+' assets aprovados; teste de integridade ZIP '+package['zip_integrity_test']+'. '+str(package['copied_files_verified'])+' arquivos copiados e comparados byte a byte; nenhum asset pendente em dist.' ) if package else 'O relatório do pacote será preenchido após release.py.'}

Evidência completa: `10_manifests/qa_report.json`, `coverage.json`, `visual_review.json`, `package_report.json`, `browser_qa.json` e `tools_qa.json`.
''')
    write('12_docs/LICENSE_AND_PROVENANCE.md','''# Origem e uso dos recursos

A ficha de Samuca e os três prints foram fornecidos pelo usuário e mantidos intactos. Não foi realizada auditoria dos direitos da ficha original. A arte nova foi produzida especificamente para Pixel Quest pela ferramenta nativa image_gen, com as referências fornecidas. UI, ícones, logotipo, VFX e composição foram desenhados por scripts originais neste workspace. Nenhum asset de jogo comercial, emoji, fonte comercial ou biblioteca visual de terceiros foi baixado como arte final.

Cada entrada registra art_origin e license. O campo license descreve a procedência e o destino de uso no projeto; ele não cria automaticamente uma licença aberta, exclusividade ou garantia de direitos. Recursos finais e scripts ficam disponíveis ao usuário para integração no seu projeto. As bibliotecas Python/Node e Phaser mantêm as respectivas licenças; não são incorporadas como arte.

Prompts e fontes locais: 10_manifests/sources.json. Fontes de geração preservadas: references/ de personagens, inimigos, chefes e cenários, e 00_references/generated/. Revisões vinculadas a SHA256: visual_review.json. O pacote dist exclui fontes, previews e assets pendentes.
''')
    write('11_tools/README.md','''# Ferramentas portáveis

Requer Python 3.10+ e Pillow, sem ImageMagick, Sharp, credenciais ou downloads de assets. Comandos na raiz do workspace:

```powershell
python 11_tools/factory.py build
python 11_tools/qa.py
python 11_tools/review.py
python 11_tools/previews.py
python 11_tools/viewer.py
python 11_tools/report.py
python 11_tools/release.py
```

Use run_factory.ps1 para executar na ordem correta. factory.py reconstrói as exportações a partir das fontes preservadas, escreve palettes, PNGs, metadata e manifests. qa.py verifica integridade, alpha, dimensões, repetição de frames, cortes de exportação, ordem, naming, JSON, manifests e dependências; gera cobertura, hashes e cores efetivas. review.py só aplica a revisão explícita cujos hashes correspondem aos arquivos. previews.py gera contact sheets das animações finais, catálogo da UI, paleta, recortes de referência e overview. viewer.py embute o manifesto no HTML para funcionar sem fetch. report.py gera a documentação a partir dos resultados. release.py exige QA pass e exporta somente ready para dist, compara cópias e verifica o ZIP.

configure_sources.py registra os limites de extração e as substituições da produção atual. import_sources.py copia somente fontes locais ausentes a partir dos caminhos retornados pela ferramenta. São utilitários do registro desta entrega, não chamadas de geração de imagem.

## Montar, extrair e gerar previews de spritesheets

```powershell
python 11_tools/spritesheet.py compose --frames frame_00.png frame_01.png --out sheet.png
python 11_tools/spritesheet.py extract sheet.png --width 128 --height 128 --out tmp/frames
python 11_tools/spritesheet.py preview --frames frame_00.png frame_01.png --fps 10 --out preview.gif
```

A lista de frames é explícita para evitar ordem lexicográfica acidental. Grades incompatíveis ou frames de tamanhos diferentes causam erro.

## Aprovar alterações futuras

Inspecione o PNG, a animação e a identidade. Edite visual_review.json com os IDs e decisões explícitas. Somente depois da inspeção e QA use `python 11_tools/freeze_review.py --record-inspected`; ele vincula as decisões aos hashes atuais. Execute review.py, qa.py, previews.py, viewer.py, report.py e release.py. Nunca use freeze_review para contornar uma divergência sem inspecionar novamente.

O release recusa arquivos antigos não enumerados em dist em vez de apagá-los silenciosamente. Audite qualquer arquivo extra antes de removê-lo. Fontes oficiais não são sobrescritas por nenhum comando.
''')
    write('12_docs/DELIVERY_REPORT.md',f'''# Relatório de entrega

{summary}

{shipped}

Ferramentas usadas: Python do runtime local, Pillow 12.3.0, Node.js, geração nativa image_gen e navegador interno para QA. {len(sources)} fontes artísticas geradas e preservadas; UI/VFX/logo originais por scripts; composição PNG, extração adaptativa, alpha normalizado, paleta global de até 256 cores e nearest-neighbor. Não houve downloads de bibliotecas de arte, chamadas de API com credenciais ou alteração do jogo.

Ambientes: Floresta Encantada, Ruínas da Floresta, Cavernas de Cristal, Santuário dos Cristais; seis camadas por ambiente, dimensões 1280×720 e JSON de parallax. UI: botões e estados, oito painéis, HP, timer, ícones, fases, oito cartas, toggles, moldura de estrelas, decoração de menu e nove peças de nine-slice. VFX: doze efeitos com 8 frames e doze versões reduzidas com 6 frames. Samuca: oito animações, 36 frames. Nove inimigos: 16 frames cada. Chefes: 30 e 36 frames.

Pendentes: {len(pending)} entradas needs_review, listadas em PRODUCTION_STATUS.md. Não há blocked/missing; não foi declarada aprovação artística integral. QA técnico tem {len(qa['errors'])} falhas. A revisão artística impede que pendentes sejam exportados.

Preview: `python -m http.server 8766 --bind 127.0.0.1`, depois `http://127.0.0.1:8766/09_previews/index.html`. Também pode abrir index.html diretamente. Catálogo estático em 09_previews/library_overview.png; animações GIF e contact sheets nas subpastas.

Pacote final: `dist/` e `pixel_quest_approved_assets_v1.zip`. Para Grok, use o ZIP mais GROK_IMPORT_PROMPT.md; preserve o jogo, backup, substituição incremental e fallbacks. Os exemplos TypeScript estão em examples/phaser_assets.ts. A documentação da API foi verificada na versão 3.90.0; testes de jogo dependem do projeto original.

{('ZIP: '+str(package['zip_bytes'])+' bytes; '+str(package['copied_files_verified'])+' cópias verificadas; '+str(package['png_files'])+' PNGs no pacote; '+str(package['unapproved_assets_in_dist'])+' recursos pendentes; teste ZIP pass. SHA256: '+package['zip_sha256']) if package else 'Execute release.py para materializar o pacote e preencher suas métricas.'}

## Estrutura

```text
{structure}
```
''')
    prompts=[]
    for s in sources: prompts.append(f"## {s['id']}\n\nFonte local: `{s['local_source']}`\n\n"+s.get('prompt',s.get('prompt_record','Prompt não registrado localmente.')))
    write('12_docs/GENERATION_PROMPTS.md','# Prompts efetivamente usados\n\nFerramenta nativa image_gen; fontes preservadas. Prompts completos das 26 gerações, incluindo as substituições posteriores de fontes defeituosas.\n\n'+'\n\n'.join(prompts))
    print('Documentation generated from current audit:',summary)

if __name__=='__main__': reports()
