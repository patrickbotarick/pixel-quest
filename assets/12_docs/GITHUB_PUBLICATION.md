# Publicação e reprodução

Repositório: https://github.com/patrickbotarick/pixel-quest

O remoto foi auditado em 14/10/2026: estava vazio, sem commits, branches ou código do jogo. A biblioteca foi importada em um clone separado, mantendo `00_references/` a `12_docs/` na raiz. A branch de trabalho é `feat/pixel-quest-asset-factory-v1`; `main` será criada no mesmo primeiro commit. Não havia histórico anterior para realizar um fast-forward entre commits.

Os 221 recursos estão no manifesto completo: 183 `ready` e 38 `needs_review`. A revisão visual registrada é interna; não representa aprovação final do proprietário. Os PNGs fornecidos foram preservados sem nova geração artística. Fontes geradas, referências fornecidas, quadros individuais, spritesheets, previews e ferramentas estão versionados. A origem e as condições de uso estão em `LICENSE_AND_PROVENANCE.md`.

## Organização atual

Após a migração local de 14/10/2026, a biblioteca fica em `assets/` e o jogo em `game/`. O relato do primeiro commit acima é histórico. Consulte `../../docs/MIGRACAO_GROK_CODEX.md` e `../../docs/WORKFLOW_GIT.md`. A integração visual v1.1B já veio na exportação do jogo; os 38 recursos pendentes continuam em revisão.

## Gerar o pacote aprovado

Dentro de `assets/`, com Python 3.10+:

```powershell
python -m pip install -r 11_tools/requirements.txt
python 11_tools/qa.py
python 11_tools/check_tools.py
python 11_tools/release.py
python 11_tools/verify_publication.py
```

`release.py` copia somente recursos `ready` com QA aprovado para `dist/` e cria `pixel_quest_approved_assets_v1.zip`. Verifica cada cópia e a integridade do ZIP. Os dois são ignorados pelo Git para evitar duplicação. Não é necessário executar `factory.py build`, `freeze_review.py` nem chamar um gerador de imagens para gerar esse pacote.

O registro atual de fontes é `10_manifests/sources.json`; todos os `local_source` são relativos e estão presentes. O snapshot inicial `production_inputs.json` foi excluído do versionamento por ser redundante. Os registros das quatro correções continuam incluídos porque `configure_sources.py` os utiliza. `run_factory.ps1` recompõe exportações a partir das fontes; use-o somente quando quiser reconstruir a produção e revalidar as aprovações vinculadas a hashes.

## Verificações

`qa.py` valida PNGs, JSON, cobertura, dimensões, alpha, quadros, metadados e dependências. `check_tools.py` verifica composição, extração, round-trip e rejeição de entradas inválidas. `verify_publication.py` valida caminhos portáveis, fontes, hashes aprovados, dados do viewer e conteúdo do pacote. Resultados da auditoria de publicação ficam em `10_manifests/publication_qa.json`.

O viewer abre em `09_previews/index.html`, inclusive por arquivo local. Alternativamente: `python -m http.server 8766 --bind 127.0.0.1` e http://127.0.0.1:8766/09_previews/index.html. Não depende de `dist/`.

Não se incluem caches, runtimes, dependências instaladas, segredos, ZIP nem cópias de distribuição. Nenhum arquivo da biblioteca chega a 50 MiB; não é necessário LFS. Limites conferidos na documentação oficial: [arquivos grandes no GitHub](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).

Esta biblioteca e o jogo estão no mesmo repositório; a revisão dos 38 recursos pendentes permanece separada da migração.
