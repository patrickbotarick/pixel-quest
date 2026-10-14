from pathlib import Path
import json,math
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'10_manifests/assets.manifest.json').read_text(encoding='utf-8'))
assets=data['assets']; anims=[a for a in assets if a['type']=='spritesheet']
entities=list(dict.fromkeys(a['id'].split('.')[0] for a in anims))
for entity in entities:
    rows=[a for a in anims if a['id'].startswith(entity+'.')]
    if entity=='samuca':
        order=['idle','prepare','advance','attack','hurt','victory','defeat','return']; rows.sort(key=lambda a:order.index(a['id'].split('.')[-1]))
    fw=max(a['frame_width'] for a in rows); fh=max(a['frame_height'] for a in rows); width=max(a['frames'] for a in rows)*fw
    out=Image.new('RGB',(width,len(rows)*(fh+24)),'#182437'); d=ImageDraw.Draw(out)
    for r,a in enumerate(rows):
        d.text((8,r*(fh+24)+4),f"{a['id']}  |  {a['frames']} frames  |  {a['fps']} FPS  |  {a['production_status']}",fill='#FFF2D6')
        for n,path in enumerate(a['individual_frames']):
            im=Image.open(ROOT/path).convert('RGBA'); out.paste(im,(n*fw,r*(fh+24)+24),im)
    dest=ROOT/f'09_previews/contact_sheets/{entity}.png'; dest.parent.mkdir(parents=True,exist_ok=True); out.save(dest)
ui=[a for a in assets if a['category']=='ui' and a['path']]
out=Image.new('RGB',(960,math.ceil(len(ui)/4)*112),'#182437'); d=ImageDraw.Draw(out)
for n,a in enumerate(ui):
    x=(n%4)*240;y=(n//4)*112; d.text((x+8,y+4),a['id'],fill='#FFF2D6'); im=Image.open(ROOT/a['path']).convert('RGBA'); im.thumbnail((224,80),Image.Resampling.NEAREST); out.paste(im,(x+(240-im.width)//2,y+24),im)
out.save(ROOT/'09_previews/ui_catalog.png')
# Reference-card crops remain references, never shipped as transparent sprites.
ref=Image.open(ROOT/'00_references/samuca_official_reference.png')
boxes={'front':(585,95,750,315),'right':(775,95,925,315),'back':(960,95,1115,315),'left':(1135,95,1295,315),'neutral_pose':(540,420,756,672),'combat_pose':(770,420,1018,672)}
for name,box in boxes.items(): ref.crop(box).save(ROOT/f'02_characters/samuca/references/samuca_official_{name}.png')
colors=json.loads((ROOT/'10_manifests/palette.json').read_text(encoding='utf-8'))['colors']
out=Image.new('RGB',(720,math.ceil(len(colors)/6)*80),'#182437'); d=ImageDraw.Draw(out)
for n,c in enumerate(colors):
    x=n%6*120;y=n//6*80;d.rectangle((x+8,y+6,x+111,y+43),fill=c['hex']);d.text((x+8,y+48),c['name'],fill='#FFF2D6');d.text((x+8,y+62),c['hex'],fill='#FFF2D6')
out.save(ROOT/'09_previews/palette.png')
# Representative animation frames, never counted as additional production frames.
out=Image.new('RGB',(1280,880),'#101B2B');d=ImageDraw.Draw(out)
logo=Image.open(ROOT/'01_brand/logo/pixel_quest_logo.png').convert('RGBA');out.paste(logo,(36,18),logo); d.text((450,38),'ASSET FACTORY v1.0 | Samuca + 9 enemies + 2 bosses',fill='#FFF2D6')
background=Image.open(ROOT/'09_previews/environments/enchanted_forest_composite.png').convert('RGB').resize((1280,360),Image.Resampling.NEAREST);out.paste(background,(0,98))
for key,x,size in [('samuca.idle',110,256),('mushroom.idle',380,192),('stone_guardian.idle',680,256),('shadow_dragon.phase2_idle',930,288)]:
    a=next(a for a in anims if a['id']==key); im=Image.open(ROOT/a['individual_frames'][0]).convert('RGBA').resize((size,size),Image.Resampling.NEAREST);out.paste(im,(x,450-size),im)
for n,entity in enumerate(['slime_green','slime_blue','mushroom','forest_bat','forest_spirit','crystal_creature','crystal_bat','ghost','crystal_sentinel']):
    a=next(a for a in anims if a['id']==entity+'.idle'); im=Image.open(ROOT/a['individual_frames'][0]).convert('RGBA');x=26+n*138;out.paste(im,(x,490),im);d.text((x,594),entity,fill='#FFF2D6')
for n,name in enumerate(['sword','shield','crystal','star','heart','potion','timer','gear']):
    im=Image.open(ROOT/f'06_ui/icons/{name}.png').convert('RGBA').resize((64,64),Image.Resampling.NEAREST);out.paste(im,(44+n*144,660),im);d.text((44+n*144,730),name,fill='#F2C567')
d.text((40,814),'Generated library preview. Integration uses only approved entries from dist/assets.manifest.json.',fill='#A9BAD0')
out.save(ROOT/'09_previews/library_overview.png')
def nine_slice(source,width,height,b=12):
    out=Image.new('RGBA',(width,height));sx=[0,b,source.width-b,source.width];sy=[0,b,source.height-b,source.height];tx=[0,b,width-b,width];ty=[0,b,height-b,height]
    for y in range(3):
        for x in range(3):
            part=source.crop((sx[x],sy[y],sx[x+1],sy[y+1])).resize((tx[x+1]-tx[x],ty[y+1]-ty[y]),Image.Resampling.NEAREST);out.paste(part,(tx[x],ty[y]))
    return out
for env,enemy,scale in [('enchanted_forest','mushroom.idle',2),('forest_ruins','stone_guardian.idle',2),('crystal_cave','crystal_sentinel.idle',2),('crystal_sanctuary','shadow_dragon.phase2_idle',1.5)]:
    bg=Image.open(ROOT/f'09_previews/environments/{env}_composite.png').convert('RGBA'); ground=json.loads((ROOT/f'05_environments/{env}/metadata/layers.json').read_text(encoding='utf-8'))['combat_baseline_y']
    for key,x,mult in [('samuca.idle',320,2),(enemy,900,scale)]:
        a=next(a for a in anims if a['id']==key); im=Image.open(ROOT/a['individual_frames'][0]).convert('RGBA');size=round(im.width*mult);im=im.resize((size,size),Image.Resampling.NEAREST)
        if key!='samuca.idle': im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        bg.alpha_composite(im,(x-size//2,ground-round(size*.9375)))
        hp=Image.open(ROOT/'06_ui/progress/hp_hero_frame.png').convert('RGBA'); bg.alpha_composite(hp,(x-hp.width//2,ground-round(size*.65)-28));fill=Image.open(ROOT/'06_ui/progress/hp_hero_fill.png').convert('RGBA');bg.alpha_composite(fill,(x-hp.width//2+8,ground-round(size*.65)-20))
    panel=nine_slice(Image.open(ROOT/'06_ui/overlays/panel_memory.png').convert('RGBA'),1264,174);bg.alpha_composite(panel,(8,538));d=ImageDraw.Draw(bg)
    d.text((24,20),'PIXEL QUEST | '+env.replace('_',' ').upper(),fill='#FFF2D6',font=ImageFont.load_default(size=24));d.text((28,552),'PREVIA DE INTEGRACAO | textos e desafios sao renderizados pelo Phaser',fill='#FFF2D6',font=ImageFont.load_default(size=18))
    for n,name in enumerate(['sword','shield','crystal','sword','shield','crystal']):
        card=Image.open(ROOT/f'06_ui/cards/card_{name}.png').convert('RGBA');bg.alpha_composite(card,(390+n*86,594))
    bg.convert('RGB').save(ROOT/f'09_previews/environments/{env}_integration_layout.png')
print('Final-animation contact sheets, UI catalog, reference crops and library overview saved.')
