# Pixel Quest — desenvolvimento local

Este é o monorepositório oficial `patrickbotarick/pixel-quest` no Windows.

- Jogo em `game/`; Asset Factory em `assets/`; documentação em `docs/`.
- Leia `game/AGENTS.project.md`: substitui as premissas Linux/Grok do AGENTS exportado.
- Preserve fontes e aprovações da fábrica; não promova `needs_review` automaticamente.
- Não atualize dependências sem necessidade. Instale pelo lockfile em `game/`.
- Para mudanças, rode `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:assets` e `npm run build` em `game/`.
- Verifique o jogo no navegador em desenvolvimento e no preview de produção; build sozinho não prova funcionamento.
- Nunca versionar `.migration-backup/`, `.env`, caches, node_modules, logs ou builds.
- Preserve saves. Não use force push, reset --hard, merges de históricos distintos ou outro remoto.
- Arte e mecânicas não fazem parte da migração; use os recursos existentes.
