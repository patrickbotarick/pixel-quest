# Ambiente local após migração

O `AGENTS.md` nesta pasta veio da exportação Grok e fica preservado como referência histórica. As instruções deste arquivo adaptam o contrato ao ambiente real:

- O projeto funciona em Windows e Linux; não pressupor `/workspace` ou ferramentas preinstaladas.
- Esta pasta é a raiz npm do jogo. Use `npm run dev`, com o wrapper `with-app-env.mjs`, em 0.0.0.0:8080.
- Windows: iniciador `../INICIAR_PIXEL_QUEST.bat`. Linux/Git Bash: `startup.sh` relativo à própria pasta.
- `preview:restart` usa o supervisor portável `local-preview.mjs`; nunca matar um processo desconhecido só por ocupar a porta.
- O smoke grava sob `screenshots/` e aguarda `__pqReady`, em vez de assumir que um canvas recém-criado já é um menu funcional.
- No Windows, o smoke usa o Chrome instalado. Ferramentas ausentes devem ter sua limitação registrada.
- Auth e database continuam desligados em `.grok/app-env.json`; não remover os helpers históricos nem ligar serviços externos para este jogo.
- Preserve middleware, bridge e branding PWA existentes; não alterar a apresentação na migração.
- A biblioteca oficial está em `../assets/`; somente `public/` integra a distribuição do jogo.
