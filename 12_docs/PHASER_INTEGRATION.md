# Integração futura com Phaser 3

183 recursos aprovados, 75 spritesheets e 374 quadros no pacote de integração.

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

Carregue apenas o ambiente e inimigos necessários à fase. Remova texturas antigas quando não usadas por outras Scenes. Prefira `pixelArt: true`, `antialias: false`, `roundPixels: true`; alinhe coordenadas à grade. Não use camera shake ou flash global por padrão. Os VFX reduzidos estão disponíveis; mantenha o estado de acessibilidade do jogo. A maior spritesheet tem 1792 px de largura.

O conjunto completo de texturas aprovadas demanda cerca de 143 MiB de pixels RGBA decodificados, antes de custos adicionais da GPU. Evite carregá-lo inteiro em mobile: selecione assets por fase; um único conjunto de seis camadas 1280×720 representa cerca de 21 MiB. Esses são cálculos por dimensões, não benchmarks de aparelho.

Os exemplos foram preparados contra as assinaturas oficiais do Phaser **3.90.0**. Referências: [SpriteSheetFile](https://github.com/phaserjs/phaser/blob/v3.90.0/src/loader/filetypes/SpriteSheetFile.js), [AnimationManager](https://github.com/phaserjs/phaser/blob/v3.90.0/src/animations/AnimationManager.js), [NineSliceFactory](https://github.com/phaserjs/phaser/blob/v3.90.0/src/gameobjects/nineslice/NineSliceFactory.js). O TypeScript não foi compilado contra o jogo original, que não foi fornecido; os testes desta entrega validam os assets e o visualizador.
