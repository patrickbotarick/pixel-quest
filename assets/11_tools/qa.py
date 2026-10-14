"""Audit only. No asset is promoted to ready by this tool."""
from pathlib import Path
import hashlib,json,re,sys
from collections import Counter,defaultdict
from PIL import Image,ImageChops

ROOT=Path(__file__).resolve().parents[1]
REQUIRED={'samuca':{'idle':4,'prepare':3,'advance':6,'attack':6,'hurt':3,'victory':6,'defeat':4,'return':4}}
for enemy in ['slime_green','slime_blue','mushroom','forest_bat','forest_spirit','crystal_creature','crystal_bat','ghost','crystal_sentinel']:
    REQUIRED[enemy]={'idle':4,'attack':5,'hurt':3,'defeat':4}
REQUIRED['stone_guardian']={name:None for name in ['idle','prepare','ground_impact','hurt','posture_transition','defeat','entrance']}
REQUIRED['shadow_dragon']={name:None for name in ['idle','prepare','magic_attack','hurt','phase_transition','phase2_idle','phase2_attack','defeat']}

def audit():
    manifest=json.loads((ROOT/'10_manifests/assets.manifest.json').read_text(encoding='utf-8')); assets=manifest['assets']
    errors=[]; warnings=[]; results=[]; hashes=defaultdict(list); colors=set(); ids=Counter(a['id'] for a in assets)
    for id,count in ids.items():
        if count!=1: errors.append(f'Duplicate asset id: {id}')
    # Verify every saved PNG, including original references and previews, without applying final-asset alpha rules to references.
    pngs=list(ROOT.rglob('*.png')); pngs=[p for p in pngs if 'dist' not in p.relative_to(ROOT).parts]
    for path in pngs:
        try:
            with Image.open(path) as im: im.verify()
        except Exception as e: errors.append(f'Invalid PNG {path.relative_to(ROOT)}: {e}')
    for path in ROOT.rglob('*.json'):
        if 'dist' in path.relative_to(ROOT).parts: continue
        try: json.loads(path.read_text(encoding='utf-8'))
        except Exception as e: errors.append(f'Invalid JSON {path.relative_to(ROOT)}: {e}')
    for a in assets:
        ae=[]; aw=[]; id=a['id']; status=a['production_status']
        required=['id','name','category','path','type','width','height','frames','fps','loop','origin','dependencies','art_origin','license','production_status']
        for key in required:
            if key not in a: ae.append('Required field missing: '+key)
        if not all(0<=v<=1 for v in a['origin'].values()): ae.append('Origin is outside normalized range')
        if status not in ['ready','needs_review','blocked','missing']: ae.append('Unknown production status')
        if status in ['blocked','missing']:
            if a.get('path'): ae.append('Unproduced entry has a path')
            results.append({'id':id,'errors':ae,'warnings':a.get('issues',[]),'checked':False}); continue
        rel=a['path']; path=ROOT/rel
        if not path.exists():
            ae.append('File missing'); results.append({'id':id,'errors':ae,'warnings':aw,'checked':False}); errors.extend(id+': '+e for e in ae); continue
        if not re.fullmatch(r'[a-z0-9_]+\.png',path.name): ae.append('Naming convention violation')
        if not path.resolve().is_relative_to(ROOT): ae.append('Path escapes workspace')
        with Image.open(path) as image:
            image.load(); im=image.convert('RGBA')
            if image.format!='PNG': ae.append('Final file is not PNG')
            if im.size!=(a['width'],a['height']): ae.append('Manifest dimensions disagree')
            needs_alpha=a.get('requires_alpha',a['type']=='spritesheet' or a['category'] in ['ui','brand','expressions'])
            alpha=im.getchannel('A'); amin,amax=alpha.getextrema()
            if amax==0: ae.append('Entire image is transparent')
            if needs_alpha and (image.mode!='RGBA' or amin!=0): ae.append('Missing usable transparency')
            hashes[hashlib.sha256(im.tobytes()).hexdigest()].append(id)
            for count,color in im.getcolors(im.width*im.height) or []:
                if color[3]>0: colors.add('#%02X%02X%02X'%color[:3])
            if a['type']=='spritesheet':
                fw,fh=a['frame_width'],a['frame_height']; n=a['frames']
                if im.width!=fw*n or im.height!=fh: ae.append('Grid dimensions do not match frame count')
                if not a['fps'] or a['fps']<=0: ae.append('Invalid FPS')
                frame_hash=[]; boxes=[]; deltas=[]
                for f in range(n):
                    frame=im.crop((f*fw,0,(f+1)*fw,fh)); bb=frame.getbbox(); boxes.append(bb)
                    if not bb: ae.append(f'Frame {f} empty')
                    elif bb[0]==0 or bb[1]==0 or bb[2]==fw or bb[3]==fh: ae.append(f'Frame {f} touches export edge')
                    frame_hash.append(hashlib.sha256(frame.tobytes()).hexdigest())
                    individual=ROOT/a['individual_frames'][f]
                    if not individual.exists(): ae.append(f'Frame file {f} missing')
                    else:
                        raw=Image.open(individual).convert('RGBA')
                        if raw.size!=(fw,fh): ae.append(f'Frame {f} dimensions differ')
                        if raw.tobytes()!=frame.tobytes(): ae.append(f'Frame {f} differs from sheet or order is incorrect')
                    if f:
                        diff=ImageChops.difference(frame,im.crop(((f-1)*fw,0,f*fw,fh))).convert('RGB')
                        changed=sum(count for count,c in diff.getcolors(fw*fh) or [] if c!=(0,0,0)); deltas.append(round(changed/(fw*fh),4))
                if len(set(frame_hash))!=n: ae.append('Repeated identical animation frames')
                preview_path=ROOT/a['preview_path']
                if not preview_path.exists(): ae.append('GIF preview missing')
                else:
                    try:
                        with Image.open(preview_path) as gif:
                            if gif.n_frames!=n: ae.append('GIF frame count differs')
                            if a['loop'] and gif.info.get('loop')!=0: ae.append('GIF loop differs')
                            if not a['loop'] and 'loop' in gif.info: ae.append('Single-execution GIF loops unexpectedly')
                            for k in range(gif.n_frames): gif.seek(k);gif.load()
                    except Exception as e: ae.append('Invalid GIF: '+str(e))
                if deltas and min(deltas)<.001: aw.append('Very small inter-frame change; inspect movement')
                mp=ROOT/a['metadata_path']
                if not mp.exists(): ae.append('Animation metadata missing')
                else:
                    meta=json.loads(mp.read_text(encoding='utf-8'))
                    if meta['frameConfig']['endFrame']!=n-1: ae.append('Metadata last frame incorrect')
                    if meta['animation']['repeat']!=(-1 if a['loop'] else 0): ae.append('Loop metadata differs')
                    if meta['origin']!=a['origin']: ae.append('Origin differs between manifest and metadata')
                    if meta['texture_path']!=rel: ae.append('Metadata texture path differs')
                a['motion_analysis']={'unique_frames':len(set(frame_hash)),'changed_pixel_fraction':deltas,'bounding_boxes':boxes}
        for dep in a.get('dependencies',[]):
            if dep not in ids: ae.append('Missing dependency: '+dep)
        if a.get('issues'):
            aw.extend(a['issues'])
            if status=='ready': ae.append('Ready asset has unresolved production issues')
        a['sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
        a['technical_status']='pass' if not ae else 'fail'
        results.append({'id':id,'errors':ae,'warnings':aw,'checked':True})
        errors.extend(id+': '+e for e in ae); warnings.extend(id+': '+w for w in aw)
    coverage=[]
    lookup={a['id']:a for a in assets}
    for entity,anims in REQUIRED.items():
        for name,count in anims.items():
            a=lookup.get(entity+'.'+name); ok=a is not None and (count is None or a['frames']==count)
            if not ok: errors.append('Required animation missing or wrong count: '+entity+'.'+name)
            coverage.append({'requirement':entity+'.'+name,'expected_frames':count,'actual_frames':a['frames'] if a else 0,'status':a['production_status'] if a else 'missing','fulfilled':ok and a['production_status']=='ready'})
    for env in ['enchanted_forest','forest_ruins','crystal_cave','crystal_sanctuary']:
        meta=json.loads((ROOT/f'05_environments/{env}/metadata/layers.json').read_text(encoding='utf-8'))
        baseline=meta['combat_baseline_y']; safe=meta['challenge_safe_area']['y']
        if baseline>=safe: errors.append(env+': combat feet are behind challenge panel')
        ground=Image.open(ROOT/f'05_environments/{env}/layers/04_ground.png').convert('RGBA')
        if ground.getchannel('A').crop((0,baseline,1280,baseline+1)).histogram()[255]<1240: errors.append(env+': documented baseline does not match terrain opacity')
        for layer in ['distant','midground','scenery','ground','foreground','particles']:
            id=env+'.'+layer; a=lookup.get(id)
            if not a or (a['width'],a['height'])!=(1280,720): errors.append('Missing or incorrectly dimensioned layer: '+id)
            coverage.append({'requirement':id,'status':a['production_status'] if a else 'missing','fulfilled':bool(a and a['production_status']=='ready')})
    duplicate_groups=[v for v in hashes.values() if len(v)>1]
    counts=Counter(a['production_status'] for a in assets)
    report={'schema_version':'1.0','png_files_verified':len(pngs),'manifest_entries':len(assets),'spritesheets':sum(a['type']=='spritesheet' for a in assets),'animation_frames':sum(a['frames'] for a in assets if a['type']=='spritesheet'),'status_counts':dict(counts),'errors':errors,'warnings':warnings,'duplicate_images':duplicate_groups,'duplicates_note':'Static aliases and UI states can share pixels; repeated animation frames are errors.','assets':results,'coverage':coverage,'all_technical_checks_passed':not errors,'visual_approval_is_separate':True,'limitations':['Anatomical fidelity, pose semantics, parallax seams and clipped source anatomy require visual inspection.','No supplied game code was run; Phaser integration examples are prepared, not a game regression test.']}
    out=ROOT/'10_manifests/qa_report.json'; out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'10_manifests/coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'10_manifests/used_colors.json').write_text(json.dumps({'count':len(colors),'colors':sorted(colors),'scope':'All nontransparent RGB colors in manifest PNGs; original references excluded.'},indent=2)+'\n',encoding='utf-8')
    (ROOT/'10_manifests/assets.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:report[k] for k in ['png_files_verified','manifest_entries','spritesheets','animation_frames','status_counts','all_technical_checks_passed']},indent=2))
    print('ERRORS',len(errors),'WARNINGS',len(warnings))
    for error in errors[:25]: print(error)
    return report

if __name__=='__main__': sys.exit(0 if audit()['all_technical_checks_passed'] else 1)
