from pathlib import Path
import json,subprocess,sys,tempfile
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
tmp=ROOT/'tmp';tmp.mkdir(exist_ok=True)
results=[]
with tempfile.TemporaryDirectory(prefix='tools_qa_',dir=tmp) as temp:
    folder=Path(temp).resolve()
    if not folder.is_relative_to(tmp.resolve()): raise ValueError('Unsafe temporary path')
    frames=[ROOT/f'02_characters/samuca/sprites/samuca_idle_{n:02}.png' for n in range(2)]
    tool=ROOT/'11_tools/spritesheet.py'; composed=folder/'roundtrip.png'; extracted=folder/'frames'
    def call(name,args,success):
        r=subprocess.run([sys.executable,str(tool)]+list(map(str,args)),capture_output=True,text=True,cwd=ROOT)
        passed=(r.returncode==0)==success;results.append({'test':name,'pass':passed,'exit_code':r.returncode});
        if not passed: raise AssertionError(name+' '+r.stderr)
    call('compose_equal_frames',['compose','--frames',*frames,'--out',composed],True)
    call('extract_uniform_grid',['extract',composed,'--width',128,'--height',128,'--out',extracted],True)
    same=all(Image.open(frames[n]).convert('RGBA').tobytes()==Image.open(extracted/f'frame_{n:03}.png').convert('RGBA').tobytes() for n in range(2)); results.append({'test':'compose_extract_pixel_roundtrip','pass':same})
    if not same: raise AssertionError('Roundtrip pixels differ')
    call('reject_incompatible_grid',['extract',composed,'--width',127,'--height',128,'--out',extracted],False)
    call('reject_mixed_frame_sizes',['compose','--frames',frames[0],ROOT/'03_enemies/mushroom/sprites/mushroom_idle_00.png','--out',composed],False)
    gif=folder/'preview.gif';call('preview_generation',['preview','--frames',*frames,'--fps',10,'--out',gif],True)
    with Image.open(gif) as im: count=im.n_frames; im.seek(1);im.load()
    results.append({'test':'preview_integrity_two_frames','pass':count==2})
report={'all_passed':all(r['pass'] for r in results),'results':results,'temporary_cleanup':'isolated TemporaryDirectory within workspace/tmp; resolved path checked before cleanup'}
(ROOT/'10_manifests/tools_qa.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2))
