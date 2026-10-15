# Pixel Quest v1.2.0 — fechamento oficial

- Versão: **v1.2.0**.
- Data de fechamento: **15 de outubro de 2026**, America/Sao_Paulo.
- Repositório: https://github.com/patrickbotarick/pixel-quest.git.
- Branch de origem: `fix/v1.2-ui-memory-polish`.
- Commit funcional validado: `12a965625174d30844f0364f14be465688467991`.
- Main anterior: `a170f1f311ae9d5ba4ec668dc759711b5f5a84ee`.
- Commit definitivo, incluindo este documento: **`v1.2.0^{commit}`**.
- Tag anotada: `v1.2.0`, com mensagem `Pixel Quest v1.2.0 - UI, Memory and Gameplay Polish`.

Este documento integra o próprio commit de fechamento. A tag oficial identifica seu SHA completo sem uma referência circular no conteúdo:

```powershell
git rev-parse 'v1.2.0^{commit}'
git show --no-patch --format=fuller 'v1.2.0^{commit}'
```

O [relatório técnico](PIXEL_QUEST_V1_2_REPORT.md) registra a implementação e sua entrega inicial para revisão. Este documento registra o fechamento posterior, autorizado pelo usuário, e a integração na main.

## Correções e novidades

- Painéis de Configurações, Como Jogar, Vitória, Pausa, Derrota e Encerramento compostos com o fundo atrás do conteúdo; textos e botões visíveis.
- Configurações persistentes, navegação de instruções, próxima fase, retorno ao mapa e ambas as saídas do encerramento preservando progresso e estrelas.
- Memória com quatro ou seis cartas em uma linha, cartas maiores, proporção 68:84, feedback visual e áreas de toque corrigidas. Fallback 3×2 quando melhora os alvos em uma área estreita.
- Nome SAMUCA na batalha, celebrações variadas e mensagens especiais das fases 5 e 10.
- Números de fases concluídas separados do visto oficial; números e estrelas incluídos no alvo de toque do mapa.
- Limpeza de objetos/listeners de UI para evitar acúmulo após transições.
- Suíte de layout e regressão real em navegador, além do roadmap da v1.3.0.

Não houve nova funcionalidade durante o fechamento. O commit adicional contém somente este registro. Dez fases, inimigos, HP, dificuldade, combate em turnos, matemática, reflexo, dano 20/5/0, estrelas, save v1, áudio e recursos oficiais permanecem preservados. A expansão de trinta batalhas não integra esta versão.

## Auditoria Git e integração

A auditoria inicial encontrou a árvore limpa na branch de revisão, sincronizada com o remoto oficial. Main e origin/main apontavam para `a170f1f`; a revisão local e remota apontavam para `12a9656`. Havia exatamente um commit novo, sem divergência, e a tag v1.2.0 não existia localmente nem no remoto.

A integração usa exclusivamente fast-forward: atualização de main com `origin/main`, seguida de `git merge --ff-only fix/v1.2-ui-memory-polish`. O registro de fechamento é um commit documental posterior ao commit funcional, preparado na branch de origem antes da integração para manter a árvore limpa durante o fast-forward. A publicação abrange main e a tag anotada; não envolve deploy ou hospedagem web, force push, rebase, exclusão de branches ou alteração de tags existentes.

O histórico anterior e o commit funcional permanecem ancestrais do commit definitivo. Assets, arquivos públicos do jogo, lockfile e módulos de regras, fases e salvamento não recebem alterações nesta operação. Backups, saves pessoais, caches, dependências instaladas, logs, screenshots e builds não são incluídos no novo commit.

## Validação repetida no fechamento

Ambiente: Windows, Node 24.11.1, npm 11.6.2 e Chrome instalado, usando as dependências existentes.

| Verificação | Resultado |
| --- | --- |
| `npm test` | 300 aprovados: 199 de scripts e 101 de TypeScript; zero falhas e skips |
| `npm run typecheck` | aprovado |
| `npm run lint` | zero erros, somente os mesmos dois avisos anteriores |
| `npm run check:assets` | 632 arquivos verificados; 171 recursos solicitados, 183 aprovados no manifesto; zero ausentes ou divergentes |
| `npm run build` | aprovado; build local de produção, sem deploy |
| `npm run test:browser` | seis resoluções, 135 capturas, zero falhas |
| `npm run test:browser -- --production` | seis resoluções, 12 capturas, zero falhas; fixture de QA ausente no build |
| `npm run test:browser -- --map-only` | seis resoluções, 12 capturas, zero falhas |
| `npm run test:browser -- --production --map-only` | seis resoluções, 12 capturas, zero falhas |
| Smoke em desenvolvimento e produção | inicialização local, desktop e retrato, sem erros ou overflow e sem divergência entre ambientes |

Viewports da regressão: 1920×1080, 1366×768, 1280×720, 1024×768, 844×390 e 667×375. Os dois menores usam emulação touch. O smoke também verifica desktop 1280×800 e retrato 390×844, incluindo o aviso de orientação horizontal.

A suíte cobre controles visíveis, preferências persistentes, seis páginas de instruções, vitória e próxima fase/mapa, chefes, encerramento e persistência após recarga, SAMUCA, memória com quatro/seis cartas, pares, erro/bloqueio, bordas de toque, prévia de três segundos, timeout real, resize e flip, matemática e dano 20/5/0, reflexo, pausa e ausência de listeners duplicados. A lógica existente mantém cobertura de saves antigos, estrelas e progressão. Os contextos de navegador são isolados e não limpam o save pessoal.

Capturas reais foram novamente inspecionadas em desktop e no formato horizontal menor. As evidências ficam localmente em `game/screenshots/v1.2/`, com `verdict.json` nas pastas `dev/`, `production/`, `dev-map/` e `production-map/`. O smoke do fechamento usa `closing-dev.json` e `closing-production.json`. Logs desta execução têm prefixo `release-v1.2-` em `game/.grok/`. Esses artefatos são ignorados pelo Git e podem ser reproduzidos pelos comandos do relatório técnico.

Após o commit exclusivamente documental, conferir seu diff e a igualdade da árvore `game/` e `assets/` com `12a9656`. Os binários e o código testados são os mesmos da tag; não há mudança funcional que exija reconstrução após esse registro.

## Avisos conhecidos e pendências

- Dois avisos anteriores de lint: `outlinedOval` em `generateTextures.ts` e `label` em `PreloadScene.ts`; nenhum erro novo.
- Avisos anteriores de tamanho de chunk e diretivas de bibliotecas no build; não impedem sua conclusão.
- As 38 revisões artísticas continuam excluídas do runtime, sem promoção automática.
- Falta playtest em celular físico e com crianças de 5 a 8 anos, incluindo áudio, latência e duração das sessões. Emulação touch não substitui essa validação.
- A regressão usa fixtures para cenas finais; não representa uma campanha completa de dez fases com o público-alvo.
- Navegação global por teclado/gamepad fica para uma tarefa específica de acessibilidade.

## Próxima versão

A [v1.3.0](ROADMAP_V1_3_0.md) está apenas planejada: dez fases com três ondas, trinta batalhas, chefes nas fases 5 e 10, HUD de onda e transições curtas. Antes de implementar, definir duração-alvo, recuperação de vida, dificuldade, derrota, estrelas e migração retrocompatível dos saves. Reutilizar somente assets aprovados e validar a experiência com o público-alvo.

## Conferência da publicação

```powershell
git status
git branch -vv
git log -5 --oneline
git tag -l v1.2.0
git rev-parse HEAD origin/main 'v1.2.0^{commit}'
git ls-remote origin refs/heads/main refs/tags/v1.2.0 'refs/tags/v1.2.0^{}'
```

O critério de conclusão é árvore limpa em main, `HEAD` igual a `origin/main`, tag anotada local/remota apontando para esse mesmo commit e `12a9656` preservado no histórico. O SHA do objeto da tag anotada difere do SHA do commit; a comparação correta usa sua referência resolvida `^{}`.
