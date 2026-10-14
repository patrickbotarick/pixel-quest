# Guia de animações

Spritesheets em uma linha, sem margem nem espaçamento, quadros numéricos de 0 a N−1. Frames individuais ficam em `sprites/`; JSONs em `metadata/`. Os JSONs descrevem a carga e a animação; **não são JSONs de atlas** nem devem ser passados diretamente a `load.animation`. Use o exemplo TypeScript.

Loops: idle dos personagens e segunda fase do Dragão. Preparação, ataque, dano, vitória, derrota, retorno e VFX são execuções únicas. GIFs de preview têm loop infinito apenas para animações marcadas como loop; previews de execução única terminam.

Samuca possui 36 quadros finais; inimigos, 16 cada; Guardião, 30; Dragão, 36. As poses novas substituem fontes defeituosas, sem aumentar artificialmente o número de frames finais. A ordem do Dragão foi ajustada pela leitura das poses reais. Os counts do Guardião foram ajustados ao conteúdo observado, pois o pedido não fixou números por animação.

| Animação | Frames | FPS | Loop | Estado |
|---|---:|---:|---|---|
| samuca.idle | 4 | 7 | sim | ready |
| samuca.prepare | 3 | 9 | não | ready |
| samuca.advance | 6 | 12 | não | ready |
| samuca.attack | 6 | 14 | não | ready |
| samuca.hurt | 3 | 10 | não | ready |
| samuca.return | 4 | 10 | não | ready |
| mushroom.idle | 4 | 7 | sim | ready |
| mushroom.attack | 5 | 10 | não | ready |
| mushroom.hurt | 3 | 10 | não | ready |
| mushroom.defeat | 4 | 7 | não | ready |
| slime_green.idle | 4 | 7 | sim | ready |
| slime_green.hurt | 3 | 10 | não | ready |
| slime_green.defeat | 4 | 7 | não | ready |
| slime_blue.idle | 4 | 7 | sim | ready |
| slime_blue.attack | 5 | 10 | não | needs_review |
| slime_blue.hurt | 3 | 10 | não | ready |
| slime_blue.defeat | 4 | 7 | não | ready |
| forest_bat.idle | 4 | 7 | sim | ready |
| forest_bat.attack | 5 | 10 | não | ready |
| forest_bat.hurt | 3 | 10 | não | ready |
| forest_bat.defeat | 4 | 7 | não | ready |
| forest_spirit.idle | 4 | 7 | sim | ready |
| forest_spirit.attack | 5 | 10 | não | needs_review |
| forest_spirit.hurt | 3 | 10 | não | ready |
| forest_spirit.defeat | 4 | 7 | não | ready |
| crystal_creature.idle | 4 | 7 | sim | ready |
| crystal_creature.attack | 5 | 10 | não | needs_review |
| crystal_creature.hurt | 3 | 10 | não | ready |
| crystal_creature.defeat | 4 | 7 | não | ready |
| crystal_bat.idle | 4 | 7 | sim | ready |
| crystal_bat.attack | 5 | 10 | não | needs_review |
| crystal_bat.hurt | 3 | 10 | não | ready |
| crystal_bat.defeat | 4 | 7 | não | ready |
| ghost.idle | 4 | 7 | sim | ready |
| ghost.attack | 5 | 10 | não | needs_review |
| ghost.hurt | 3 | 10 | não | ready |
| ghost.defeat | 4 | 7 | não | ready |
| crystal_sentinel.idle | 4 | 7 | sim | ready |
| crystal_sentinel.attack | 5 | 10 | não | needs_review |
| crystal_sentinel.hurt | 3 | 10 | não | ready |
| crystal_sentinel.defeat | 4 | 7 | não | ready |
| stone_guardian.idle | 4 | 6 | sim | ready |
| stone_guardian.prepare | 5 | 8 | não | ready |
| stone_guardian.ground_impact | 5 | 10 | não | ready |
| stone_guardian.hurt | 4 | 8 | não | ready |
| stone_guardian.posture_transition | 6 | 8 | não | ready |
| stone_guardian.defeat | 3 | 7 | não | ready |
| stone_guardian.entrance | 3 | 7 | não | ready |
| shadow_dragon.idle | 4 | 7 | sim | ready |
| shadow_dragon.prepare | 4 | 8 | não | ready |
| shadow_dragon.magic_attack | 5 | 10 | não | ready |
| shadow_dragon.hurt | 3 | 8 | não | ready |
| shadow_dragon.phase_transition | 4 | 8 | não | ready |
| shadow_dragon.phase2_idle | 4 | 7 | sim | ready |
| shadow_dragon.defeat | 7 | 7 | não | ready |
| samuca.victory | 6 | 9 | não | ready |
| slime_green.attack | 5 | 10 | não | needs_review |
| samuca.defeat | 4 | 7 | não | ready |
| shadow_dragon.phase2_attack | 5 | 10 | não | needs_review |
| sword_slash.effect | 8 | 14 | não | ready |
| sword_slash.reduced | 6 | 12 | não | ready |
| strong_attack.effect | 8 | 14 | não | ready |
| strong_attack.reduced | 6 | 12 | não | ready |
| weak_attack.effect | 8 | 14 | não | ready |
| weak_attack.reduced | 6 | 12 | não | ready |
| magic_impact.effect | 8 | 14 | não | ready |
| magic_impact.reduced | 6 | 12 | não | ready |
| hero_damage.effect | 8 | 14 | não | ready |
| hero_damage.reduced | 6 | 12 | não | ready |
| enemy_defeat.effect | 8 | 14 | não | ready |
| enemy_defeat.reduced | 6 | 12 | não | ready |
| golem_attack.effect | 8 | 14 | não | ready |
| golem_attack.reduced | 6 | 12 | não | ready |
| dragon_attack.effect | 8 | 14 | não | ready |
| dragon_attack.reduced | 6 | 12 | não | ready |
| dragon_special.effect | 8 | 14 | não | ready |
| dragon_special.reduced | 6 | 12 | não | ready |
| star_earned.effect | 8 | 14 | não | ready |
| star_earned.reduced | 6 | 12 | não | ready |
| victory.effect | 8 | 14 | não | ready |
| victory.reduced | 6 | 12 | não | ready |
| crystal_recovered.effect | 8 | 14 | não | ready |
| crystal_recovered.reduced | 6 | 12 | não | ready |

VFX de espada, impacto, dano, dissolução, Golem, Dragão, estrela, vitória e cristal são separados dos personagens. Cada efeito possui 8 quadros normais e 6 reduzidos. As versões reduzidas usam menos quadros; impactos, projéteis e celebrações também têm menos partículas. Elas não substituem testes de acessibilidade no jogo integrado. Alguns ataques de inimigos ainda têm rastros embutidos e estão em revisão.

Eventos de jogo devem disparar as animações. Nunca calcule dano, sucesso de desafio ou progressão pela duração de uma animação visual.
