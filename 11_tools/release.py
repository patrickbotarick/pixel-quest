"""Create a verified integration bundle using only ready + technically passed entries."""
from pathlib import Path
import hashlib,json,shutil,zipfile
ROOT=Path(__file__).resolve().parents[1]

def release():
    full=json.loads((ROOT/'10_manifests/assets.manifest.json').read_text(encoding='utf-8'))
    qa=json.loads((ROOT/'10_manifests/qa_report.json').read_text(encoding='utf-8'))
    if not qa['all_technical_checks_passed']: raise ValueError('Technical QA must pass before release')
    selected=[dict(a) for a in full['assets'] if a['production_status']=='ready' and a.get('technical_status')=='pass']
    ids={a['id'] for a in selected}
    for a in selected:
        if not all(dep in ids for dep in a['dependencies']): raise ValueError('Unapproved dependency: '+a['id'])
    dist=ROOT/'dist'; dist.mkdir(exist_ok=True); copied=set()
    def copy(rel):
        source=ROOT/rel; dest=dist/rel
        if not source.is_file(): raise ValueError('Missing release source: '+rel)
        if not dest.resolve().is_relative_to(dist.resolve()): raise ValueError('Unsafe release destination')
        dest.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(source,dest); copied.add(rel)
        if source.read_bytes()!=dest.read_bytes(): raise ValueError('Copy differs: '+rel)
    for a in selected:
        for rel in [a['path']]+a.get('individual_frames',[])+([a['metadata_path']] if a.get('metadata_path') else []): copy(rel)
        a.pop('preview_path',None)
    for rel in ['10_manifests/palette.json','10_manifests/export_palette.json','10_manifests/used_colors.json','10_manifests/visual_review.json','08_world/stage_map/stages.json','06_ui/main_menu/layout.json']:
        copy(rel)
    for env in ['enchanted_forest','forest_ruins','crystal_cave','crystal_sanctuary']: copy(f'05_environments/{env}/metadata/layers.json')
    full['assets']=selected; full['bundle_kind']='approved integration assets only'
    (dist/'assets.manifest.json').write_text(json.dumps(full,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); copied.add('assets.manifest.json')
    for name in ['PHASER_INTEGRATION.md','GROK_IMPORT_PROMPT.md','ANIMATION_GUIDE.md','LICENSE_AND_PROVENANCE.md']:
        rel='12_docs/'+name
        if (ROOT/rel).exists(): copy(rel)
    if (ROOT/'12_docs/examples/phaser_assets.ts').exists(): copy('12_docs/examples/phaser_assets.ts')
    # Any old file must be listed rather than silently carried into a later release.
    extras=[p.relative_to(dist).as_posix() for p in dist.rglob('*') if p.is_file() and p.relative_to(dist).as_posix() not in copied and p.name!='package_report.json']
    if extras: raise ValueError('Stale files in dist; audit before removal: '+str(extras))
    report={'assets':len(selected),'spritesheets':sum(a['type']=='spritesheet' for a in selected),'animation_frames':sum(a['frames'] for a in selected if a['type']=='spritesheet'),'png_files':len(list(dist.rglob('*.png'))),'copied_files_verified':len(copied),'file_bytes':sum(p.stat().st_size for p in dist.rglob('*') if p.is_file()),'decoded_texture_bytes_estimate':sum(a['width']*a['height']*4 for a in selected),'unapproved_assets_in_dist':0,'missing_paths':0}
    (dist/'package_report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    zip_path=ROOT/'pixel_quest_approved_assets_v1.zip'
    with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(dist.rglob('*')):
            if p.is_file(): z.write(p,p.relative_to(dist).as_posix())
    with zipfile.ZipFile(zip_path) as z:
        bad=z.testzip()
        if bad: raise ValueError('Invalid ZIP member: '+bad)
    report['zip_bytes']=zip_path.stat().st_size; report['zip_sha256']=hashlib.sha256(zip_path.read_bytes()).hexdigest(); report['zip_integrity_test']='pass'
    (ROOT/'10_manifests/package_report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2));return report

if __name__=='__main__': release()
