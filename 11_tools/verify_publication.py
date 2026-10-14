"""Publication checks that write only a report; never regenerate or approve images."""
from pathlib import Path, PurePosixPath
from collections import Counter
import hashlib
import json
import re
import zipfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

def load(path):
    return json.loads(path.read_text(encoding='utf-8'))

def checked_path(root, rel):
    assert isinstance(rel, str) and rel, 'Empty path'
    assert not PurePosixPath(rel).is_absolute() and '\\' not in rel and ':' not in rel, 'Nonportable path: '+rel
    p = (root/rel).resolve()
    assert p.is_relative_to(root.resolve()) and p.is_file(), 'Missing/escaping path: '+rel
    return p

def verify():
    full = load(ROOT/'10_manifests/assets.manifest.json')
    assets = full['assets']
    by_id = {a['id']: a for a in assets}
    assert len(by_id) == len(assets), 'Duplicate IDs'
    checks = 0
    for a in assets:
        for rel in [a['path']]+a.get('individual_frames',[])+[a[k] for k in ['metadata_path','preview_path'] if a.get(k)]:
            checked_path(ROOT, rel)
            checks += 1
    sources = load(ROOT/'10_manifests/sources.json')
    for source in sources:
        checked_path(ROOT, source['local_source'])
        checked_path(ROOT, source['source'])
    review = load(ROOT/'10_manifests/visual_review.json')
    ready = {a['id'] for a in assets if a['production_status']=='ready'}
    pending = {a['id'] for a in assets if a['production_status']=='needs_review'}
    assert set(review['pending_ids']).issubset(pending), 'Explicit review holds missing from pending assets'
    assert set(review['approved_hashes']) == ready, 'Ready assets differ from recorded approvals'
    for id in ready:
        a = by_id[id]
        assert hashlib.sha256(checked_path(ROOT,a['path']).read_bytes()).hexdigest() == review['approved_hashes'][id], 'Approved texture changed: '+id
        assert all(dep in ready for dep in a['dependencies']), 'Unapproved dependency'
    viewer = (ROOT/'09_previews/viewer_data.js').read_text(encoding='utf-8')
    embedded = json.loads(viewer.split('=',1)[1].strip().removesuffix(';'))
    assert embedded == full, 'Viewer manifest differs'
    html = (ROOT/'09_previews/index.html').read_text(encoding='utf-8')
    for rel in re.findall(r'<script[^>]+src="([^"]+)"', html):
        checked_path(ROOT/'09_previews',rel)
    dist = ROOT/'dist'
    shipped = load(dist/'assets.manifest.json')
    assert {a['id'] for a in shipped['assets']} == ready, 'Release asset selection differs'
    for a in shipped['assets']:
        assert a['production_status']=='ready' and a['technical_status']=='pass'
        paths = [a['path']]+a.get('individual_frames',[])
        if a.get('metadata_path'):
            paths.append(a['metadata_path'])
        for rel in paths:
            assert checked_path(dist,rel).read_bytes()==checked_path(ROOT,rel).read_bytes(), 'Release copy differs: '+rel
    pngs = list(dist.rglob('*.png'))
    for p in pngs:
        with Image.open(p) as im:
            im.verify()
    zpath = ROOT/'pixel_quest_approved_assets_v1.zip'
    with zipfile.ZipFile(zpath) as z:
        assert z.testzip() is None, 'ZIP integrity failure'
        expected = {p.relative_to(dist).as_posix(): p for p in dist.rglob('*') if p.is_file()}
        assert set(z.namelist()) == set(expected), 'ZIP contents differ'
        for rel, p in expected.items():
            assert z.read(rel)==p.read_bytes(), 'ZIP member differs: '+rel
    report = {'all_passed':True, 'assets':len(assets), 'statuses':dict(Counter(a['production_status'] for a in assets)), 'relative_asset_paths':checks, 'portable_sources':len(sources), 'approved_hashes_verified':len(ready), 'viewer_manifest_matches':True, 'dist_pngs_verified':len(pngs), 'zip_entries_verified':len(expected), 'art_generation_executed':False}
    (ROOT/'10_manifests/publication_qa.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    verify()
