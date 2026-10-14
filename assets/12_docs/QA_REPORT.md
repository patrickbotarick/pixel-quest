# Relatório de QA

PNG verificados: **714** (inclui fontes, referências e previews presentes no momento da auditoria; cópias de dist excluídas). Manifesto: **221** recursos. Spritesheets: **83**. Frames: **414**. Erros técnicos: **0**. Avisos: **9**, mantidos principalmente para recursos em revisão.

Testes executados pelo qa.py: abertura/verificação de PNG, leitura de todos os JSONs, presença dos campos obrigatórios, naming de exportações, paths locais, dependências, largura/altura, alpha real, imagens/quadros vazios, divisibilidade de grade, count de frames, hash de quadros, bordas de exportação, igualdade entre frames individuais e recortes do sheet na ordem declarada, FPS, loops, metadata/origem, integridade e count dos GIFs, cobertura de personagens/ambientes. O baseline de cada cenário foi comparado à opacidade do solo e precisa ficar acima da área de desafios. Paleta efetiva: 254 cores RGB, enumeradas em used_colors.json.

check_tools.py executou sete verificações de composição, extração, roundtrip pixel a pixel, rejeição de grades incompatíveis, rejeição de dimensões diferentes e integridade do preview GIF. run_factory.ps1 foi executado para verificar a reconstrução completa por fontes locais e os hashes da revisão.

Nenhuma spritesheet final tem frames idênticos dentro da própria animação. Reuso entre animações pode ser intencional (retorno a idle), assim como aliases estáticos. Grupos de imagens duplicadas: 2; ver qa_report.json. Não foram contados aliases como novos quadros de produção.

Validação no navegador: o botão de smoke test carregou **221/221 texturas** e confirmou dimensões. Foram inspecionados os controles de seleção e preview; resultados adicionais e mensagens de console ficam em browser_qa.json. Node.js verificou a sintaxe de viewer.js. O servidor inicial na porta 8765 ficou inacessível sob o sandbox; o servidor somente localhost na 8766 foi iniciado com a exceção de execução permitida, e o visualizador carregou.

Correções realizadas: extração adaptativa da grade; nova vitória de Samuca para remover espada dupla; nova derrota sem recuperação precoce; novas fontes para ataque do Slime Verde e ataque da fase 2 do Dragão; reordenação de poses do Dragão; padronização de alpha/paleta; ajuste de projéteis que tocavam a borda; aumento do canvas do logotipo para incluir a última letra; loops dos GIFs coerentes com metadata.

Limitações: QA automático não prova anatomia, fidelidade facial, continuidade de poses, emendas de parallax ou eficácia de um ataque. Os recursos ready têm revisão visual interna separada, registrada por hash. Props independentes, expressões, oito animações e trajeto do mapa ainda precisam de acabamento. Não houve teste dentro do jogo original, benchmark mobile, compilação de TypeScript contra esse jogo ou build de produção do Grok.

Pacote: 183 assets aprovados; teste de integridade ZIP pass. 648 arquivos copiados e comparados byte a byte; nenhum asset pendente em dist.

Evidência completa: `10_manifests/qa_report.json`, `coverage.json`, `visual_review.json`, `package_report.json`, `browser_qa.json` e `tools_qa.json`.
