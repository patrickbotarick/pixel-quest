# Pixel Quest v1.2.0 — interface e memória

## Resultado

Atualização do jogo existente, mantendo identidade Fantasy Pixel Art 16-bit, dez fases, inimigos, HP, dificuldade, dano 20/5/0, estrelas, save v1, áudio, preload e monorepositório. A expansão de trinta batalhas foi apenas documentada em [ROADMAP_V1_3_0.md](ROADMAP_V1_3_0.md).

Branch de revisão: `fix/v1.2-ui-memory-polish`. Não integrar automaticamente à main.

## Auditoria e recuperação

O trabalho começou na main limpa, em `a170f1f311ae9d5ba4ec668dc759711b5f5a84ee`, sem alterações locais não publicadas. O remoto oficial foi conferido. Antes de editar, passaram os 286 testes existentes, typecheck e build de referência. A branch local `recovery/pre-v1.2-ui-memory` aponta para esse commit e oferece recuperação verificável sem reset destrutivo.

A interface é Phaser dentro do shell React/TanStack Start, com fontes locais e Vite/Nitro. A investigação percorreu os containers, a display list da cena, profundidade, ordem dos filhos, alpha, visibilidade, nove partes, hit areas e transições. Não foi necessário criar outra aplicação, alterar dependências ou substituir assets.

## Causas reais

### Painel opaco acima do conteúdo

Configurações e Como Jogar criavam painéis nine-slice no nível da cena, em depth 1, enquanto o container do corpo permanecia em depth 0. Vitória e Derrota tinham painéis em depth 2 e botões em containers de depth 0. O painel oficial possui preenchimento opaco; por isso cobria texto e botões. O input do Phaser permanecia ativo, permitindo clicar em controles que o renderer não mostrava.

O depth de um filho não promove o seu container acima de outro objeto no nível da cena. Não havia uma máscara cortando os controles ou uma textura ausente: a causa principal era a hierarquia de composição.

`addUiPanel` cria uma única entrada de UI na display list. Dentro dela, o frame é o primeiro filho e o container de conteúdo é o segundo. Texto, controles e navegação são filhos desse conteúdo. Assim, o fundo fica atrás por contrato de composição; não se aumentou indiscriminadamente o depth de cada objeto. O mesmo helper foi aplicado às telas de pausa e encerramento para manter o contrato consistente.

### Área de toque das cartas deslocada

A carta era um Container centralizado com `setSize`, mas seu hit rectangle começava em `(-w/2, -h/2)`. O InputManager do Phaser já adiciona `displayOriginX/Y` no teste de input. A origem era, portanto, aplicada duas vezes, deslocando a área clicável para cima/esquerda da imagem. A nova hit area começa em `(0, 0)` e mantém largura/altura calculadas. Testes clicam nos quadrantes superior esquerdo e inferior direito das cartas para detectar esse defeito, em vez de testar somente o centro.

### Objetos e listeners de UI

O Graphics de fallback do UiButton permanecia solto na cena quando a textura oficial estava presente. Ele agora pertence ao root do botão e é destruído junto com ele. O teste de Configurações confirmou que reconstruir controles não acumula Graphics na display list. O listener de wake do menu também é removido no shutdown, evitando acúmulo após voltar do encerramento e recriar o menu.

## Telas corrigidas

| Tela | Comportamento final |
| --- | --- |
| Configurações | título, música, efeitos, redução de movimento, volume, tela cheia e VOLTAR visíveis; preferências persistentes; knob alinhado à faixa real do volume |
| Como Jogar | seis páginas curtas: ataque, matemática, memória, reflexo, acerto/erro e objetivo; ANTERIOR/PRÓXIMO e VOLTAR permanente |
| Vitória | FASE CONCLUÍDA!, nome, três estrelas, mensagem curta, PRÓXIMA FASE e VOLTAR AO MAPA visíveis |
| Vitória da fase 10 | mensagem dos cristais e VER O FINAL encaminhando ao encerramento |
| Derrota | texto, tentativa, opção de ajuda e MAPA visíveis |
| Pausa | controles no mesmo painel; continuar/reiniciar/configurações/mapa preservados; eventos sem duplicação |
| Mapa | número de fase concluída separado do visto verde oficial; número/estrelas incluídos no alvo de toque; fases e progressão preservadas |
| Encerramento | painel legível, celebração com Samuca, estrelas, MENU PRINCIPAL e MAPA DAS FASES; ambas as saídas preservam o save |

UiButton mantém as texturas oficiais normal/hover/pressionado/desabilitado. Foram acrescentados estados explícitos de habilitação e foco, sem criar controles HTML concorrentes. O foco programático usa o feedback de hover; esta atualização não introduz um novo sistema global de navegação por Tab/gamepad.

## Layout da memória

`memoryGrid` é uma função sem Phaser, baseada na área útil recebida e no fator real de escala CSS do canvas. Quatro cartas usam 4×1; seis usam 6×1. A proporção visual é exatamente 68:84. O espaço disponível é distribuído entre as cartas e as margens, sem deformar as imagens oficiais.

Na área de desafio atual, a altura visual passou de aproximadamente 69 para 150 unidades do mundo; a largura proporcional passou de aproximadamente 56 para 121. Em 667×375, isso equivale a cerca de 63×78 pixels CSS, uma melhora visível sobre as cartas anteriores. As áreas interativas têm pelo menos 44 pixels CSS nas seis resoluções solicitadas e não se sobrepõem.

Um campo estreito com altura suficiente escolhe 3×2 quando esse fallback melhora o menor lado da área de toque. Se não houver altura física para atingir 44 pixels, a função informa essa limitação e não torna as cartas ainda menores dividindo-as em duas linhas. O retrato mantém o aviso de orientação horizontal e a experiência anterior.

O evento resize reposiciona as mesmas cartas, redimensiona imagem/hit area e atualiza bordas. Não recria o desafio nem reinicia a prévia ou o cronômetro. Frente, verso e ícones permanecem filhos do container da carta, inclusive durante o flip.

Feedback visual: verso oficial preservado; borda clara no hover/seleção, borda dourada para carta aberta e borda verde com marca para par encontrado. Não foram alterados pares, prévia de 3 segundos, cronômetros de 25/30 segundos, bloqueio de 560 ms por par incorreto, animação de flip, transição de turnos ou dano.

## Samuca

A barra de vida mostra SAMUCA. Vitórias comuns alternam mensagens curtas e determinísticas por fase. A fase 5 informa "Samuca recuperou o primeiro cristal!" e a fase 10, "Samuca salvou os cristais da imaginação!". O encerramento celebra "VOCÊ E O SAMUCA SALVARAM O REINO!", preservando a história de retorno dos cristais. Nomes internos de tipos e variáveis hero não foram traduzidos nem usados para alterar regras.

## Arquivos alterados

- `game/src/game/ui/widgets.ts`: painel composto e estados/lifecycle de botão.
- `game/src/game/ui/sceneCopy.ts`: instruções e mensagens de celebração.
- `game/src/game/scenes/SettingsScene.ts`, `HowToScene.ts`, `VictoryScene.ts`, `GameOverScene.ts`, `PauseScene.ts`, `EndingScene.ts`: composição e conteúdo visível.
- `game/src/game/scenes/MainMenuScene.ts`: limpeza do listener de wake.
- `game/src/game/scenes/StageSelectScene.ts`: separação entre número/visto de conclusão e área de toque do mapa.
- `game/src/game/scenes/BattleScene.ts`: nome Samuca, layout/reflow, highlights e hit areas das cartas.
- `game/src/game/logic/panelLayout.ts`: layout horizontal proporcional e fallback responsivo.
- `game/src/game/logic/rules.test.ts`: expectativas do layout atualizado; testes de regras preservados.
- `game/src/game/logic/uiLayout.test.ts`: catorze casos adicionais de layout/targets/fallback.
- `game/src/game/createGame.ts`: fixture de observação opt-in, apenas em desenvolvimento com `?qa=ui`.
- `game/scripts/game-ui-regression.mjs` e `game/package.json`: comando de regressão real em navegador.
- Este relatório e o roadmap v1.3.0.

Nenhum arquivo da biblioteca `assets/`, textura em `game/public/`, configuração de fases, módulo de regras de combate, áudio, save ou lockfile foi modificado.

## Testes e evidência

Ambiente validado: Windows, Node 24.11.1, npm 11.6.2, Chrome instalado, Phaser 3.90 do lockfile existente.

| Verificação | Resultado |
| --- | --- |
| `npm test` | 199 testes de scripts + 101 de TypeScript: 300 aprovados, sem falhas ou skips |
| `npm run typecheck` | passou |
| `npm run lint` | passou; dois avisos anteriores de variáveis/imports não usados |
| `npm run check:assets` | 171 recursos pedidos completos, 183 aprovados no manifesto, nenhuma diferença ou importação das 38 revisões |
| `npm run build` | passou; Vercel/Nitro; avisos de tamanho de chunk/diretivas do bundle permanecem não bloqueantes |
| `npm run test:browser` | seis resoluções aprovadas; 135 capturas reais, evidência de pixels e zero erros de console/página |
| `npm run test:browser -- --production` | seis resoluções aprovadas; controles visíveis no build; fixture de desenvolvimento ausente da produção |
| `npm run test:browser -- --map-only` | seis resoluções aprovadas; 12 capturas; dez números sem sobreposição com o visto e toque no número abrindo a fase |
| `npm run test:browser -- --production --map-only` | seis resoluções aprovadas; 12 capturas; números renderizados e navegação pelo toque no build |
| Smoke de inicialização em dev e produção | desktop 1280×800 e retrato 390×844, HTTP 200, sem overflow ou erros de console/página, aviso de rotação preservado e sem divergência entre ambientes |

Resoluções: 1920×1080, 1366×768, 1280×720, 1024×768, 844×390 e 667×375. Os dois casos de celular usam emulação com touch e toques reais pelo driver. Capturas foram inspecionadas visualmente em desktop e no menor formato horizontal, além de asserções de viewport, proporção, pixels visíveis e hit targets.

A suíte abre contextos novos e usa saves de teste v1; não limpa nem modifica o armazenamento do navegador do usuário. O fixture de desenvolvimento permite abrir cenas para cobertura das telas finais e selecionar desafios determinísticos. Ele não altera o jogo sem a opção de QA e é removido do build de produção.

Cobertura adicional em navegador: persistência de música/efeitos/movimento/volume, slider arrastado, próximo combate e mapa, chefe da fase 5/10, duas saídas do encerramento e recarga da página sem mudança no save, SAMUCA renderizado, memória com quatro/seis cartas, frente dentro do container, acerto de todos os pares, erro/bloqueio, toques nas bordas, prévia de 3 segundos, timeout real de 25 segundos, matemática aplicando 20 e 5, memória sem acerto aplicando 0, reflexo recebendo Espaço, três ciclos de pausa sem listeners duplicados e timer congelado, além de resize com flip animado e prévia sem reinício.

As regras de chefes/fase 2, estrelas, saves antigos, dano e minigames também permanecem cobertas pelos testes de lógica existentes. Esta validação não equivale a jogar uma campanha completa de dez fases com uma criança.

## Capturas disponíveis

Artefatos locais, ignorados pelo Git, em `game/screenshots/v1.2/`:

| Exemplo desktop | Exemplo celular |
| --- | --- |
| `dev/settings-1280x720.png` | `dev/settings-667x375.png` |
| `dev/howto-3-1280x720.png` | `dev/howto-3-667x375.png` |
| `dev/victory-1280x720.png` | `dev/victory-667x375.png` |
| `dev/memory4-preview-1280x720.png` | `dev/memory4-preview-667x375.png` |
| `dev/memory6-closed-1280x720.png` | `dev/memory6-closed-667x375.png` |
| `dev/ending-1280x720.png` | `dev/ending-667x375.png` |

Há também capturas de pares, erro, timeout, pausa, derrota, mapa, reflexo, configurações persistidas e resize. `dev-map/` e `production-map/` guardam a verificação específica dos números de fases concluídas, incluindo toque no número para abrir a batalha. As capturas do mapa corrigido em 1280×720 e 667×375, além da batalha aberta pelo número no build, foram inspecionadas visualmente. Cada uma das quatro pastas contém seu `verdict.json`, com o resultado e a evidência de pixels por texto. São 171 capturas nessa matriz completa; elas são reconstruíveis, não parte do bundle nem do clone remoto.

## Reproduzir e revisar

Dentro de `game/`:

```powershell
npm run dev
# Em outro terminal, com o dev ativo:
npm test
npm run typecheck
npm run lint
npm run check:assets
npm run test:browser
npm run test:browser -- --map-only
npm run build
npm run preview:restart
npm run test:browser -- --production
npm run test:browser -- --production --map-only
npm run smoke -- http://127.0.0.1:8080/ screenshots/v1.2/local-dev.png
npm run smoke -- http://127.0.0.1:8081/ screenshots/v1.2/local-production.png --baseline screenshots/v1.2/local-dev.json
npm run preview:stop
```

O Windows usa Chrome instalado. Em Linux, a suíte usa Chromium do Playwright. Não é necessário atualizar bibliotecas ou promover assets para executar esses testes.

## Pendências e próximas prioridades

- Fazer playtest em aparelho físico e com o público-alvo; houve emulação de viewport/touch, não medição de desempenho, áudio e latência em celular real.
- Revisar o fluxo completo de dez fases antes de distribuir publicamente; a suíte usa fixtures para cobrir as cenas finais e conserva os testes existentes de progressão.
- Avaliar navegação global por teclado/gamepad em uma tarefa de acessibilidade específica; o foco visual do componente já tem estado explícito.
- As 38 revisões artísticas continuam separadas, sem promoção automática.
- A expansão de trinta batalhas depende das decisões e validações do roadmap; não está implementada.

## Git

Base e recuperação: `a170f1f311ae9d5ba4ec668dc759711b5f5a84ee`.

Branch: `fix/v1.2-ui-memory-polish`.

Mensagem do commit: `fix(game): restore UI visibility and improve memory gameplay`.

Entrega destinada à revisão nessa branch, com push para o remoto oficial depois das verificações. Main preservada, sem merge automático e sem force push. O SHA final pode ser consultado com `git log -1 --format=%H`; este relatório integra o próprio commit, evitando uma referência circular ao seu SHA.
