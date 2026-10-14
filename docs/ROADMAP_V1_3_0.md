# Pixel Quest v1.3.0 — proposta de 30 batalhas

Este documento é planejamento. Nenhum sistema de ondas integra a v1.2.0.

## Estrutura proposta

- Manter dez fases principais e os quatro biomas existentes.
- Cada fase terá três ondas, com uma batalha por onda: trinta batalhas no total.
- Reutilizar os inimigos, sprites, cenários e efeitos aprovados da Asset Factory.
- Manter os chefes nas fases 5 e 10, preferencialmente na terceira onda.
- Concluir uma fase apenas após a terceira vitória; não retornar ao mapa entre ondas.
- Mostrar "Onda 1/3", "Onda 2/3" e "Onda 3/3" no HUD, com uma transição curta e clara.

## Decisões a validar antes de implementar

| Área | Proposta e validação necessária |
| --- | --- |
| Duração | Sessões curtas para crianças de 5 a 8 anos; medir duração real antes de aumentar número/HP de inimigos |
| Recuperação | Definir recuperação parcial ou total de vida entre ondas, com playtest; não presumir que três combates com HP atual sejam adequados |
| Dificuldade | Distribuir as combinações atuais de inimigos e desafios gradualmente; evitar concentrar carga cognitiva e boss na mesma sequência longa |
| Derrota | Definir se a retomada começa na onda atual ou na fase inteira; explicar a escolha com poucas palavras |
| Pausa | Congelar cronômetros e animações de transição; preservar alvo, desafio e estado da onda sem eventos duplicados |
| Estrelas | Definir agregação das três ondas antes de alterar os critérios; separar avaliação da fase de feedback de cada batalha |
| Chefes | Preservar fases e animações do Guardião e do Dragão; a derrota do chefe deve ser a conclusão da terceira onda |

## Progressão e saves

Planejar um schema de save com versão explícita e migração retrocompatível. Saves v1 existentes devem continuar com fases desbloqueadas, estrelas, preferências e campanha concluída intactas. Não converter uma fase já concluída em fase bloqueada por falta de ondas no formato antigo.

A retomada de uma campanha nova deve registrar fase e onda separadamente. A migração precisa ser idempotente, validar dados incompletos/corrompidos e preservar o backup do save. Não substituir as chaves atuais até definir e testar o caminho de recuperação.

## Organização sugerida

Adicionar definições de ondas à configuração das fases e um coordenador de progressão entre batalhas. Manter matemática, memória, reflexo e cálculo de dano independentes dessa coordenação. O HUD deve consumir fase/onda atuais; a vitória intermediária deve continuar para a próxima onda sem disparar a conclusão da fase ou o encerramento.

## Critérios para iniciar a expansão

1. Aprovar a v1.2.0 após revisão visual e playtest em celular físico.
2. Definir duração-alvo, política de recuperação/derrota e critérios de estrelas.
3. Especificar o save e sua migração com exemplos reais do formato v1.
4. Cobrir as três ondas, chefes, pausas, retomada e encerramento em testes de lógica e navegador.
5. Testar trinta batalhas com o público-alvo antes de considerar distribuição.

Os 38 recursos artísticos em revisão continuam excluídos até aprovação própria; a expansão não é motivo para promovê-los automaticamente.
