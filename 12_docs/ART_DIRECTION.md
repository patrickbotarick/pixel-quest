# Direção de arte

Identidade: fantasy pixel art 16-bit, Samuca chibi com cabelo castanho e mecha dourada, olhos expressivos, túnica azul com ouro, capa verde, botas marrons e espada curta. A fonte de identidade é a ficha oficial, preservada sem alterações. Os seis recortes de vistas/poses em `02_characters/samuca/references/` são referências com fundo, nunca sprites finais.

Luz principal no alto à esquerda; contorno escuro; sombras azuis/verdes; creme e ouro para os destaques. Floresta acolhedora e cristal mágico azul/violeta. Derrota amigável, sem violência gráfica.

Personagens e chefes: geração nativa com a ficha como referência de estilo; Samuca usa também a identidade da ficha. O ataque novo do Dragão recebeu a própria ficha gerada do Dragão como segunda referência. Exportações preservam fontes, normalizam alpha, encontram intervalos entre poses, removem pequenos fragmentos desconectados e usam nearest-neighbor. Nenhuma anatomia cortada foi reconstruída por código.

Samuca: 128×128 por frame, ampliado em relação à sugestão inicial de 96 para acomodar espada e capa. Inimigos: 96×96. Guardião: 192×192. Dragão: 256×256. Origem de personagem (0.5,0.9375). VFX: 128×128, origem central. Cenários: 1280×720, seis camadas reais independentes; props ocupam laterais. O apoio dos pés usa combat_baseline_y de cada layers.json, calibrado pela faixa opaca do terreno. Área de desafios reservada a partir de y=530.

As exportações usam até 256 cores RGB compartilhadas e nenhum dithering. Há 254 cores RGB efetivamente usadas; `10_manifests/used_colors.json` enumera todas em HEX, e `export_palette.json` contém a paleta completa de exportação. Transparência é separada da paleta RGB. Os sprites têm alpha binário; overlays podem ter alpha parcial.

## Cores mestras

| Nome | HEX |
|---|---|
| forest | #315C48 |
| green | #67C58D |
| blue | #24334C |
| magic | #5B9BE6 |
| gold | #F2C567 |
| red | #E66D67 |
| purple | #9368D7 |
| cream | #FFF2D6 |
| dark | #182437 |
| outline | #101B2B |
| gold_shadow | #98633F |
| steel | #BACDDC |
| white | #FFFFFF |
| cyan | #96E2DE |
| moss | #548361 |
| brown | #72452F |
| slate | #52627A |
| hover | #354C6B |
| disabled | #394759 |
| skin_highlight | #FFBFA2 |

As fontes originais de geração têm mais cores e não são destinadas ao preload. O logotipo usa glifos pixelados desenhados no script, sem fonte comercial. Textos de painéis, desafios, HP e números de fase devem ser renderizados dinamicamente pelo Phaser.

Os ambientes foram aprovados para parallax limitado. O terreno repete material original; as emendas não foram certificadas para rolagem infinita. Props avulsos e expressões recortadas precisam de acabamento antes de serem tratados como peças independentes.
