# Ferramentas portáveis

Requer Python 3.10+ e Pillow, sem ImageMagick, Sharp, credenciais ou downloads de assets. Comandos na raiz do workspace:

```powershell
python 11_tools/factory.py build
python 11_tools/qa.py
python 11_tools/review.py
python 11_tools/previews.py
python 11_tools/viewer.py
python 11_tools/report.py
python 11_tools/release.py
```

Use run_factory.ps1 para executar na ordem correta. factory.py reconstrói as exportações a partir das fontes preservadas, escreve palettes, PNGs, metadata e manifests. qa.py verifica integridade, alpha, dimensões, repetição de frames, cortes de exportação, ordem, naming, JSON, manifests e dependências; gera cobertura, hashes e cores efetivas. review.py só aplica a revisão explícita cujos hashes correspondem aos arquivos. previews.py gera contact sheets das animações finais, catálogo da UI, paleta, recortes de referência e overview. viewer.py embute o manifesto no HTML para funcionar sem fetch. report.py gera a documentação a partir dos resultados. release.py exige QA pass e exporta somente ready para dist, compara cópias e verifica o ZIP.

configure_sources.py registra os limites de extração e as substituições da produção atual. import_sources.py copia somente fontes locais ausentes a partir dos caminhos retornados pela ferramenta. São utilitários do registro desta entrega, não chamadas de geração de imagem.

## Montar, extrair e gerar previews de spritesheets

```powershell
python 11_tools/spritesheet.py compose --frames frame_00.png frame_01.png --out sheet.png
python 11_tools/spritesheet.py extract sheet.png --width 128 --height 128 --out tmp/frames
python 11_tools/spritesheet.py preview --frames frame_00.png frame_01.png --fps 10 --out preview.gif
```

A lista de frames é explícita para evitar ordem lexicográfica acidental. Grades incompatíveis ou frames de tamanhos diferentes causam erro.

## Aprovar alterações futuras

Inspecione o PNG, a animação e a identidade. Edite visual_review.json com os IDs e decisões explícitas. Somente depois da inspeção e QA use `python 11_tools/freeze_review.py --record-inspected`; ele vincula as decisões aos hashes atuais. Execute review.py, qa.py, previews.py, viewer.py, report.py e release.py. Nunca use freeze_review para contornar uma divergência sem inspecionar novamente.

O release recusa arquivos antigos não enumerados em dist em vez de apagá-los silenciosamente. Audite qualquer arquivo extra antes de removê-lo. Fontes oficiais não são sobrescritas por nenhum comando.
