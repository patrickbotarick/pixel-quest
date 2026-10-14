"""Apply recorded, explicit internal visual decisions; no auto approval by counts."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'10_manifests/assets.manifest.json'; manifest=json.loads(path.read_text(encoding='utf-8'))
review=json.loads((ROOT/'10_manifests/visual_review.json').read_text(encoding='utf-8'))
pending=set(review['pending_ids']); entities=set(review['approved_entities']+review['approved_partial_entities'])
for a in manifest['assets']:
    id=a['id']; approved=False
    if id in pending:
        a['production_status']='needs_review'; a['issues']=[review['pending_notes'][id]]
    elif a['category'] in ['02_characters','03_enemies','04_bosses'] and id.split('.')[0] in entities: approved=True
    elif a['category']=='environments' and '.prop_' not in id: approved=review['approve_environment_layers']
    elif a['category']=='world' and id!='world.stage_map.path': approved=review['approve_world_backgrounds']
    elif a['category'] in ['ui','vfx','brand']: approved=True
    if approved:
        if a.get('technical_status')!='pass': raise ValueError('Cannot approve technically invalid asset: '+id)
        if review.get('approved_hashes',{}).get(id)!=a.get('sha256'): raise ValueError('Visual review does not match current texture: '+id)
        a['resolved_source_observations']=a.get('issues',[]); a['issues']=[]; a['production_status']='ready'
        a['visual_review']={'reviewer':review['reviewer'],'evidence':'10_manifests/visual_review.json','scope':'Exported pixel art, silhouette, identity, composition; bounded parallax only'}
    if a['type']=='spritesheet':
        mp=ROOT/a['metadata_path']; meta=json.loads(mp.read_text(encoding='utf-8')); meta['production_status']=a['production_status']; mp.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Applied recorded visual review.')
