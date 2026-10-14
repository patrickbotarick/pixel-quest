"""Bind the explicitly recorded visual decisions to inspected file hashes."""
from pathlib import Path
import argparse,json
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--record-inspected',action='store_true',required=True);p.parse_args()
mp=ROOT/'10_manifests/assets.manifest.json'; assets=json.loads(mp.read_text(encoding='utf-8'))['assets']
rp=ROOT/'10_manifests/visual_review.json'; r=json.loads(rp.read_text(encoding='utf-8'))
entities=set(r['approved_entities']+r['approved_partial_entities']); pending=set(r['pending_ids']); hashes={}
for a in assets:
    id=a['id']; approved=id not in pending and (a['category'] in ['ui','vfx','brand'] or (a['category'] in ['02_characters','03_enemies','04_bosses'] and id.split('.')[0] in entities) or (a['category']=='environments' and '.prop_' not in id) or a['category']=='world')
    if approved:
        if a.get('technical_status')!='pass' or not a.get('sha256'): raise ValueError('QA required before freezing '+id)
        hashes[id]=a['sha256']
r['approved_hashes']=hashes;rp.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('Bound',len(hashes),'inspected textures to SHA256 hashes')
