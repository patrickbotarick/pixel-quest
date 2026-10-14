from pathlib import Path
import json,shutil
root=Path(__file__).resolve().parents[1]
sources=json.loads((root/'10_manifests/sources.json').read_text(encoding='utf-8'))
for s in sources:
    dest=root/s['local_source']; dest.parent.mkdir(parents=True,exist_ok=True)
    if not dest.exists():
        source=root/s['source']
        if not source.is_file(): raise FileNotFoundError('Missing preserved source: '+s['local_source'])
        shutil.copy2(source,dest)
    print(s['id'],dest.stat().st_size)
