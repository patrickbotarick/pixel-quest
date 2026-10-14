# Migração Grok → Codex local

Data: 14/10/2026. Repositório único: `patrickbotarick/pixel-quest`.

## Auditoria e preservação

A pasta da loja continha uma exportação sem `.git`, sem `node_modules`, com os entrypoints, lockfile, scripts, assets e configurações necessários. Todos os arquivos eram inicialmente não versionados. Foram encontrados 1.618 arquivos, totalizando 23.518.163 bytes. Havia aproximadamente 530 GB livres no disco C: antes da cópia.

A exportação foi copiada para `.migration-backup/export/` e cada arquivo foi conferido por SHA-256 antes da importação. A importação inicial em `game/` também foi comparada contra esse inventário. Os arquivos originais foram depois movidos, sem exclusão, para `.migration-backup/original/`; as duas cópias foram novamente verificadas. O inventário local está em `.migration-backup/export-sha256.json`. Backups, caches e builds não foram incluídos no Git.

O remoto foi clonado temporariamente dentro da área autorizada, em `.migration-repo/`, mantendo a exportação intacta durante a preparação. Isso substituiu a sugestão de uma pasta irmã e evitou escrever fora do workspace. A `main` inicial era `96cd42c563252d048abeb32296c41ccba6e39e6d`, com a Asset Factory e sem alterações locais. A branch `feat/unify-game-and-assets` foi criada desse histórico. Após verificar a cópia, o checkout preparado passou a ocupar a pasta atual. Existe apenas um checkout Git ativo nesta pasta; o staging ficou vazio. Não houve git init, force push, reset --hard ou merge de históricos distintos.

O resultado está resumido em [AUDITORIA_MIGRACAO.json](AUDITORIA_MIGRACAO.json). A inspeção por padrões de credenciais não encontrou candidatos a segredos nos arquivos destinados ao Git; isso não é uma garantia absoluta de ausência de qualquer informação sensível. As versões das dependências resolvidas no lockfile permanecem idênticas.

## Estrutura unificada

```text
pixel-quest/
├── game/                   exportação executável, com ajustes locais
│   ├── src/
│   ├── public/
│   ├── server/
│   ├── scripts/
│   ├── migrations/
│   ├── .grok/
│   ├── package.json
│   └── package-lock.json
├── assets/                 00_references/ até 12_docs/
├── docs/
├── INICIAR_PIXEL_QUEST.bat
├── AGENTS.md
├── .gitignore
└── README.md
```

As treze pastas de produção artística saíram da raiz para `assets/`. O README original da biblioteca foi preservado em `assets/README.md`, com orientação atualizada sobre a pasta de execução. O README raiz agora descreve o monorepositório. A documentação histórica de publicação da fábrica foi contextualizada; links e ferramentas internos continuam relativos à raiz da fábrica.

## Arquitetura encontrada

| Área | Implementação |
| --- | --- |
| Shell e entrada | React 19, TanStack Start/Router, `src/router.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx` |
| Phaser | importação dinâmica no cliente; `src/game/createGame.ts`; viewport 1280×720, Scale.FIT |
| SSR | stub Phaser do Vite evita acesso a `window` no servidor |
| Preload | BootScene → PreloadScene; manifesto aprovado, mapa e metadados dos quatro biomas; texturas compartilhadas e carregamento por fase |
| Combate | BattleScene + BattleManager, TurnManager, enemyController, damage e progression |
| Desafios | mathChallenge, memoryChallenge, reflexChallenge, challengeManager e GameTimer |
| Save | localStorage, versão 1, backup e sanitização; sem conta/backend |
| Áudio | AudioManager com Web Audio e composição procedural; desbloqueio por gesto |
| Interface | cenas de menu, mapa, configuração, pausa, vitória, derrota e encerramento; UI Phaser |
| Fontes | Nunito e Press Start 2P locais, fornecidas por pacotes npm |
| Produção | Vite 8, Nitro preset Vercel, middleware PWA e recursos em `public/` |

## Dependências do Grok e ajustes

Nenhum helper de `src/lib`, conteúdo de `server/`, chrome de `public/__grok/` ou plugin PWA foi removido. O bridge e o AuthProvider permanecem no shell. O jogo não solicita login ou banco; `.grok/app-env.json` continua com auth e database desligados. `migrations/auth/0001_auth.sql` foi preservado, mas não é aplicado pelo bootstrap do jogo sem migrações na raiz. `db:migrate` permanece e informou que não havia DATABASE_URL; não houve criação/alteração de banco.

`.grok/` contém flags necessárias e documentação histórica, portanto foi mantido. Logs/status/artefatos temporários são ignorados. `.tanstack/` e `.vercel/` contêm arquivos gerados e não entram no Git; sua versão exportada permanece no backup. `artifacts/`, `screenshots/` e `.node_modules.lock` também permanecem preservados localmente, fora do versionamento.

Alterações necessárias à portabilidade:

- O wrapper do ambiente executa o entrypoint JavaScript do Vite pelo Node, evitando falha ao executar shims `.cmd` no Windows e mantendo argv/pastas com espaços.
- `startup.sh` usa a própria pasta, em vez de `/workspace`, e escreve o log local em `.grok/`.
- `preview:restart` e `preview:stop` usam `local-preview.mjs`. O supervisor Linux exportado continua preservado em `preview.mjs`. O novo supervisor só encerra seu processo identificado, recusando processos desconhecidos na porta.
- O iniciador compara o conteúdo JSON do lockfile, ignorando diferenças LF/CRLF de checkout. Falhas de instalação sempre resultam em exit 1, inclusive códigos Windows grandes que poderiam truncar para zero. Dois testes de regressão cobrem essas situações.
- O comando de testes usa aspas compatíveis com Windows. Os testes de symlink usam junction de diretório no Windows, sem alterar o comportamento testado.
- Os testes PWA usam uma pasta temporária isolada, impedindo que a identidade real Pixel Quest contamine expectativas do template.
- O smoke guarda arquivos dentro da pasta real do jogo, usa Chrome instalado no Windows e espera o menu pronto. As asserções dos testes de contrato foram ajustadas ao caminho portável.
- Dois `let` de layout e um de teste passaram a `const`; um catch intencional ganhou comentário. São ajustes de lint, sem mudança de regra ou apresentação.
- `check:assets` audita aprovação, IDs, bytes, frames, dimensões, animações, metadados e fallback.
- Nome/engines do pacote e lockfile foram ajustados; nenhum pacote foi atualizado.
- Espaços de fim de linha/linhas vazias no fim de quatro documentos de skills importados e dois testes foram normalizados para passar na verificação de whitespace do Git; o conteúdo original continua no backup.

Não houve geração de arte, novas mecânicas ou alteração visual. O build ainda avisa sobre o tamanho do chunk Phaser e diretivas `use client` do bundle; são avisos não bloqueantes. O lint mantém dois avisos anteriores de variáveis/imports não usados.

Dependências externas ativas: registry npm durante instalação e `https://grok.com/grok-app-builder/extensions.js` para o branding preservado. O jogo, suas texturas e fontes são locais. Helpers Grok de auth, conectores, banco e multiplayer permanecem no código exportado, mas não são utilizados por esta partida. Serviços opcionais exigiriam configuração separada.

## Biblioteca artística

Confirmados: 221 catalogados, 183 `ready`, 38 `needs_review`; 83 spritesheets e 414 frames no catálogo completo. A fábrica manteve fontes, referências, metadados, quadros individuais, previews, ferramentas e registros de revisão.

O manifesto do jogo contém os 183 aprovados e a seleção runtime solicita 171. Não faltava nenhum dos 171; não houve recuperação/cópia adicional de recursos em revisão. Foram comparados 632 arquivos de textura, quadros e metadata com a fábrica, além de mapa/metadados de cenários, sem diferenças. Todas as texturas aprovadas conferem com os SHA-256 registrados na revisão.

As 12 entradas aprovadas não solicitadas incluem os 11 estados neutral dos monstros/chefes e o fundo de introdução. O pacote aprovado já exportado foi preservado integralmente para conservar o contrato e os metadados; o preload não carrega essas 12 texturas. A produção artística inteira permanece fora de `game/public/` e não integra o bundle. O pacote aprovado ocupa cerca de 6,4 MB, sem incluir a biblioteca de produção.

Fallbacks herdados: ataques de slime verde/azul, espírito, criatura/morcego de cristal, fantasma e sentinela usam animações idle aprovadas; o ataque da fase 2 do dragão usa magic_attack aprovado. O trajeto pendente do mapa é desenhado pelo jogo. As 38 pendências não foram promovidas nem importadas automaticamente.

## Verificações executadas

Ambiente: Windows, Node 24.11.1, npm 11.6.2; dependências instaladas com `npm ci --ignore-scripts --no-audit --no-fund` a partir do lockfile. `npm ls --depth=0` também passou.

| Verificação | Resultado |
| --- | --- |
| Backup / importação inicial | 1.618 arquivos conferidos; zero divergências |
| `npm test` | 199 testes de scripts + 87 testes TS, 286 aprovados, zero falhas/skips |
| `npm run typecheck` | passou |
| `npm run lint` | passou; zero erros, dois avisos herdados |
| `npm run check:assets` | 171 pedidos completos; zero ausências/diferenças |
| `npm run build` | passou; Vercel/Nitro; banco não configurado e migração pulada |
| Smoke desenvolvimento | desktop 1280×800 e celular 390×844; conteúdo real, sem overflow ou erros de console/página |
| Smoke produção | desktop/celular limpos; sem divergência da baseline dev |
| Iniciador `.bat` | executado na pasta com espaços; não reinstalou o lockfile intacto; servidor iniciado |
| `assets/11_tools/qa.py` | 714 PNGs, 221 entradas; zero erros técnicos; nove avisos artísticos existentes |
| `check_tools.py` | sete verificações aprovadas, incluindo composição/extração e rejeição de inputs inválidos |
| `release.py` | 183 aprovados; 648 cópias conferidas; ZIP íntegro, não versionado |
| `verify_publication.py` | 801 paths, 26 fontes, 183 hashes, viewer e 649 entradas ZIP conferidos |

Na conferência pós-merge, o HMR precisou de reinício depois da troca para a main antiga, que removia temporariamente `game/src/`. Esse processo revelou uma reinstalação desnecessária por mudança LF/CRLF do lockfile e um arquivo nativo bloqueado por outro servidor deste jogo. O iniciador foi corrigido, os servidores identificados foram encerrados e as dependências restauradas pelo mesmo lockfile; nenhum save ou asset foi apagado. A execução e os testes foram repetidos depois da correção.

O build foi repetido após os últimos ajustes de fonte. O preview foi reiniciado para testar esse build, evitando validar saída anterior. Screenshots e verdicts locais ficam em `game/screenshots/`.

Verificação interativa realizada pelo navegador conectado: aplicação e menu, botão JOGAR, fase 1, Samuca, Slime Verde, tutorial, conta matemática, resposta correta pelo teclado, feedback BOA!, ataque/diminuição da barra do Slime, reação do inimigo/diminuição da barra do herói e nova conta; pausa, mapa e abertura da fase 1 pelo mapa também foram conferidos. Não houve erros de console nesta interação.

## Limites e problemas restantes

- Memória/reflexo foram cobertos nos testes de lógica, layout e recursos, mas não jogados até o fim pelo navegador nesta migração; aparecem em fases posteriores. Não foi feita uma campanha completa de dez fases.
- Celular foi validado em viewport emulado; acesso e latência em um aparelho físico/rede da empresa não foram conferidos. Não houve mudança de firewall ou tentativa de contornar regras da rede.
- Em retrato, o jogo preserva a orientação para girar o celular; a interface de combate foi projetada para horizontal.
- Não houve transferência de localStorage do site Grok. A exportação preserva arquivos, não dados do navegador de outra origem. O save original não foi apagado.
- Linux e a máquina de casa não foram executados fisicamente; caminhos e scripts são relativos. O runtime validado foi Node 24; o mínimo declarado é 22.12.
- A publicação do site em Vercel/HTTPS e o modo offline completo ficam para outra tarefa; o preset e o PWA foram preservados. Não há garantia de fases ainda não visitadas funcionarem offline.
- As 38 revisões artísticas e os fallbacks existentes continuam pendentes da Asset Factory.

## Iniciar e sincronizar

Execute `INICIAR_PIXEL_QUEST.bat`, ou rode `npm run dev` dentro de `game/`. Endereço: http://localhost:8080/. O iniciador informa os IPv4 disponíveis para testes na rede local. Preview de produção: `npm run build` e `npm run preview:restart` dentro de `game/`, em http://127.0.0.1:8081/.

Detalhes: [EXECUCAO_LOCAL.md](EXECUCAO_LOCAL.md) e [WORKFLOW_GIT.md](WORKFLOW_GIT.md).

## Git e publicação

Branch de trabalho: `feat/unify-game-and-assets`, a partir da main oficial citada acima.

Mensagem do commit de migração: `feat: migrate Pixel Quest game and unify asset repository`.

Commit SHA da migração: `a36b89018bc092fde37be2cd2547729a66992dab`.

Push da branch realizado com upstream `origin/feat/unify-game-and-assets`. A main foi integrada por fast-forward de `96cd42c` para `a36b890` e publicada. `git ls-remote` confirmou ambos os refs no SHA de migração. Não houve force push, conflito de conteúdo ou união de históricos distintos.

A primeira tentativa de fast-forward encontrou um `index.lock` vazio. Foi confirmada a ausência de processo Git ativo, a trava foi movida para `.migration-backup/stale-index.lock` e a operação foi repetida com sucesso; nenhum dado foi removido. O checkout voltou à branch de trabalho para este complemento documental.

O commit posterior corrige o iniciador para diferenças LF/CRLF e códigos de erro Windows, adiciona os dois testes de regressão e registra a publicação já confirmada. O SHA acima identifica o commit de implementação, evitando uma referência circular ao SHA do próprio relatório. Para obter o HEAD atual: `git rev-parse HEAD`. Estado de conclusão: branch de trabalho e main sincronizadas no remoto, sem alterações pendentes de código; exportação preservada e servidor local iniciado pelo `.bat`.

O remoto contém `game/`, `assets/`, `docs/`, ferramentas da fábrica, scripts do jogo e iniciador Windows. Caches, dependências instaladas, ZIP de distribuição e backup original continuam somente locais.
