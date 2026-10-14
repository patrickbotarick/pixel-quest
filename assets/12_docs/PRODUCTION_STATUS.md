# Estado de produção

221 recursos no manifesto; 183 ready; 38 needs_review; 83 spritesheets; 414 quadros de animação.

183 recursos aprovados, 75 spritesheets e 374 quadros no pacote de integração.

## Concluído e validado

Pipeline, PNGs finais de recursos ready, metadados Phaser, paleta compartilhada, manifests, ferramentas de QA, GIFs, contact sheets, visualizador e documentação. Samuca possui as oito animações em exportações próprias. Quatro ambientes possuem seis camadas independentes de 1280×720. UI oferece botões/estados, painéis, HP, timer, estrelas, cards, ícones, toggles e nine-slice. Doze VFX têm versões normal/reduzida.

## Gerado, pendente de revisão visual

| ID | Pendência |
|---|---|
| samuca.expression.happy | Recorte facial precisa de enquadramento/expressão dedicada. |
| samuca.expression.determined | Recorte facial precisa de enquadramento/expressão dedicada. |
| samuca.expression.surprised | Recorte facial precisa de enquadramento/expressão dedicada. |
| samuca.expression.hurt | Recorte facial precisa de enquadramento/expressão dedicada. |
| samuca.expression.victory | Recorte facial precisa de enquadramento/expressão dedicada. |
| slime_blue.attack | Source includes large water trails across cell boundaries; separate and retouch effects before approval. |
| forest_spirit.attack | Vine reach approaches source cell boundaries; inspect branch tips and remove baked motion marks. |
| crystal_creature.attack | Projectile streaks are baked into the source; detach projectile and confirm shard tips. |
| crystal_bat.attack | Baked cyan sweep and source boundary overlap need cleanup for a complete separated silhouette. |
| ghost.attack | Baked projectile/light swirls need extraction; confirm cloak edge during the cast. |
| crystal_sentinel.attack | Inspect spear tip and separate the cyan thrust trail from the source sprite. |
| slime_green.attack | Replacement removes cut body but differs in shading and volume from idle; unify before integration. |
| shadow_dragon.phase2_attack | Replacement articulation is clearer, but wingtip margins and scale continuity need retouching. |
| enchanted_forest.prop_00 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| enchanted_forest.prop_01 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| enchanted_forest.prop_02 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| enchanted_forest.prop_03 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| enchanted_forest.prop_04 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| enchanted_forest.prop_05 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| forest_ruins.prop_00 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| forest_ruins.prop_01 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| forest_ruins.prop_02 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| forest_ruins.prop_03 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| forest_ruins.prop_04 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| forest_ruins.prop_05 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_cave.prop_00 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_cave.prop_01 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_cave.prop_02 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_cave.prop_03 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_cave.prop_04 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_cave.prop_05 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_sanctuary.prop_00 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_sanctuary.prop_01 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_sanctuary.prop_02 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_sanctuary.prop_03 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_sanctuary.prop_04 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| crystal_sanctuary.prop_05 | Prop isolado precisa de margens, contorno e corte completos; camada composta já revisada. |
| world.stage_map.path | Straight trail overlay crosses water and landmarks; author a route aligned to bridges and clearings. |

## Não produzido por limitação técnica

Não há recurso do manifesto marcado como blocked ou missing nesta entrega. A ferramenta nativa de geração foi acessível. Permanecem pendências de acabamento artístico, não inexistência de arquivos. Não foram produzidos um jogo, código de combate, build do Grok nem testes de regressão do jogo: o projeto original não foi disponibilizado e essa integração está fora desta produção de assets.

## Condições de aprovação

`ready` exige inspeção interna registrada, SHA256 que corresponde à textura inspecionada e QA técnico pass. Uma mudança de textura invalida a revisão gravada. `needs_review` não entra em dist.

## Ambiente

Pasta inicialmente continha apenas 00_references, a ficha oficial e três prints. Na produção inicial não havia repositório Git. Para a publicação, foi preparado um clone separado de patrickbotarick/pixel-quest, cujo remoto estava vazio. Consulte GITHUB_PUBLICATION.md para a estrutura e reprodução do pacote. Escrita no workspace verificada pela produção efetiva. Unidade E: tinha cerca de 574 GB livres na auditoria. A consulta de memória por CIM foi bloqueada pelo ambiente; não foi presumido RAM/VRAM disponível. Python empacotado com Pillow 12.3.0, Node.js e ferramenta image_gen foram usados. ImageMagick não foi encontrado no PATH.

Foram realizadas 26 gerações nativas, incluindo correções de vitória/derrota de Samuca, Slime Verde e segunda fase do Dragão. Todos os prompts e caminhos das fontes estão em sources.json e GENERATION_PROMPTS.md. Fontes externas ao workspace foram copiadas antes da exportação.
