from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'10_manifests/assets.manifest.json').read_text(encoding='utf-8'))
(root/'09_previews/viewer_data.js').write_text('window.PIXEL_QUEST_ASSETS = '+json.dumps(data,ensure_ascii=False)+';\n',encoding='utf-8')
print('Viewer data written:',len(data['assets']),'entries')
