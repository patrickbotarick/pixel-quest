# Pixel Quest: Aventura dos Desafios

Um único repositório para o jogo e a biblioteca artística oficial. A migração preserva o jogo v1.1B, sem novas mecânicas ou mudanças visuais.

```text
game/     React 19 + TanStack Start + Phaser 3; código e assets de execução
assets/   Asset Factory: referências, fontes, arte, previews, manifestos e ferramentas
docs/     execução local, workflow Git e relatório de migração
```

## Iniciar no Windows

Instale Node.js 22.12 ou superior (validado com 24.11.1) e execute **INICIAR_PIXEL_QUEST.bat**. Ele instala as versões do lockfile quando necessário e informa os endereços disponíveis. Abra http://localhost:8080/. Encerre com Ctrl+C.

Pelo terminal, na raiz do repositório:

```powershell
cd game
npm ci --ignore-scripts
npm run dev
```

Não precisa configurar banco, contas ou arquivos `.env`. O progresso fica no navegador, por origem; trocar de computador, navegador ou endereço não transfere o save. A exportação não contém o localStorage do site Grok. Consulte [execução e celular](docs/EXECUCAO_LOCAL.md).

## Verificar

Dentro de `game/`:

```powershell
npm test
npm run typecheck
npm run lint
npm run check:assets
npm run build
npm run preview:restart
npm run smoke -- http://127.0.0.1:8081/ screenshots/built.png
npm run preview:stop
```

O smoke usa Chrome instalado no Windows; em Linux, instale Chromium com `npx playwright install chromium`. O preview de produção atende somente http://127.0.0.1:8081/.

## Biblioteca artística

São 221 recursos catalogados: 183 aprovados e 38 em revisão. O jogo preserva o pacote aprovado de 183 entradas; pede 171 texturas durante a execução. Os arquivos usados foram comparados com os oficiais por ID, metadados, dimensões, frames e SHA-256. Recursos pendentes continuam excluídos e os fallbacks existentes continuam ativos.

O bundle usa somente `game/public/`; não inclui a produção inteira em `assets/`. Quadros individuais e metadados já exportados foram preservados. Veja [Asset Factory](assets/README.md) e [integração Phaser](assets/12_docs/PHASER_INTEGRATION.md). As ferramentas da fábrica continuam relativas à própria pasta `assets/`:

```powershell
cd assets
python -m pip install -r 11_tools/requirements.txt
python 11_tools/qa.py
python 11_tools/release.py
python 11_tools/verify_publication.py
```

Não é necessário regenerar arte para iniciar o jogo. `dist/` e o ZIP aprovado são reconstruíveis e ficam fora do Git.

## Desenvolvimento e publicação

Use apenas o [repositório oficial](https://github.com/patrickbotarick/pixel-quest). Siga [WORKFLOW_GIT.md](docs/WORKFLOW_GIT.md) nos dois computadores. Para uma futura publicação Vercel, configure **Root Directory = game**; o preset Vercel e os recursos PWA exportados permanecem preservados. Esta migração não publica o jogo em um serviço de hospedagem.

Auditoria, resultados e limites: [MIGRACAO_GROK_CODEX.md](docs/MIGRACAO_GROK_CODEX.md).
