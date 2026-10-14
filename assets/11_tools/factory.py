"""Pixel Quest: deterministic PNG export and metadata. No game code is modified."""
from pathlib import Path
import argparse, hashlib, json, math, shutil
from collections import deque
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
P = {'forest':'#315C48','green':'#67C58D','blue':'#24334C','magic':'#5B9BE6','gold':'#F2C567','red':'#E66D67','purple':'#9368D7','cream':'#FFF2D6','dark':'#182437','outline':'#101B2B','gold_shadow':'#98633F','steel':'#BACDDC','white':'#FFFFFF','cyan':'#96E2DE','moss':'#548361','brown':'#72452F'}
P.update({'slate':'#52627A','hover':'#354C6B','disabled':'#394759','skin_highlight':'#FFBFA2'})
ASSETS=[]
ART_PALETTE=None

def create_shared_palette(sources):
    global ART_PALETTE
    mosaic=Image.new('RGB',(128*8,128*math.ceil(len(sources)/8)),P['dark'])
    for n,s in enumerate(sources):
        im=Image.open(ROOT/s['local_source']).convert('RGBA'); im.thumbnail((128,128),Image.Resampling.NEAREST)
        bg=Image.new('RGBA',im.size,P['dark']); bg.alpha_composite(im); mosaic.paste(bg.convert('RGB'),((n%8)*128,(n//8)*128))
    principal=[tuple(bytes.fromhex(v[1:])) for v in P.values()]
    quantized=mosaic.quantize(colors=256-len(principal),method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    palette=quantized.getpalette(); additional=[tuple(palette[i:i+3]) for i in range(0,(256-len(principal))*3,3)]
    allcolors=list(dict.fromkeys(principal+additional)); allcolors+= [allcolors[-1]]*(256-len(allcolors))
    ART_PALETTE=Image.new('P',(1,1)); ART_PALETTE.putpalette([v for color in allcolors for v in color])
    write_json('10_manifests/export_palette.json',{'maximum_colors':256,'dither':'none','colors':['#%02X%02X%02X'%c for c in dict.fromkeys(allcolors)],'method':'Master colors reserved; median-cut sampling from all generated source images'})

def limited_palette(im):
    if ART_PALETTE is None or im.mode!='RGBA': return im
    alpha=im.getchannel('A'); rgb=im.convert('RGB').quantize(palette=ART_PALETTE,dither=Image.Dither.NONE).convert('RGB')
    rgb.paste((0,0,0),mask=alpha.point(lambda a:255 if a==0 else 0)); rgb=rgb.convert('RGBA'); rgb.putalpha(alpha); return rgb

def write_json(path, data):
    path=ROOT/path; path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def save(im,path):
    path=ROOT/path; path.parent.mkdir(parents=True,exist_ok=True); limited_palette(im).save(path)

def add(id,name,category,path,im=None,kind='image',frames=1,fps=None,loop=False,origin=(.5,.5),status='ready',dependencies=None,**extra):
    if im is None and path: im=Image.open(ROOT/path)
    a=dict(id=id,name=name,category=category,path=path,type=kind,width=im.width if im else None,height=im.height if im else None,frames=frames,fps=fps,loop=loop,origin={'x':origin[0],'y':origin[1]},dependencies=dependencies or [],art_origin='Original deterministic pixel drawing; factory.py',license='Original project artwork; no third-party asset downloads',production_status=status)
    a.update(extra); ASSETS.append(a); return a

def binary_alpha(im,threshold=128):
    im=im.convert('RGBA'); im.putalpha(im.getchannel('A').point(lambda a:255 if a>=threshold else 0))
    # Zero hidden RGB to avoid fringes in atlas tools.
    out=Image.new('RGBA',im.size); out.paste(im,(0,0),im.getchannel('A')); return out

def remove_small_fragments(im):
    """Remove detached sampling debris; never paint or reconstruct anatomy."""
    w,h=im.size; alpha=bytearray(im.getchannel('A').tobytes()); visited=bytearray(w*h); groups=[]
    for i,v in enumerate(alpha):
        if not v or visited[i]: continue
        todo=deque([i]); visited[i]=1; pixels=[]
        while todo:
            j=todo.popleft(); pixels.append(j); x=j%w; y=j//w
            for k in ([j-1] if x else [])+([j+1] if x<w-1 else [])+([j-w] if y else [])+([j+w] if y<h-1 else []):
                if alpha[k] and not visited[k]: visited[k]=1; todo.append(k)
        groups.append(pixels)
    if not groups: return im
    limit=max(48,int(max(map(len,groups))*.008))
    for group in groups:
        if len(group)<limit:
            for i in group: alpha[i]=0
    out=im.copy(); out.putalpha(Image.frombytes('L',im.size,bytes(alpha))); clean=Image.new('RGBA',im.size); clean.paste(out,(0,0),out.getchannel('A')); return clean

def adaptive_cuts(im,count,axis):
    length=im.height if axis=='y' else im.width; alpha=im.getchannel('A'); values=[]
    for k in range(length):
        b=(0,k,im.width,k+1) if axis=='y' else (k,0,k+1,im.height)
        values.append(alpha.crop(b).histogram()[255])
    cuts=[0.0]
    for n in range(1,count):
        expected=length*n/count; radius=length/count*.19; lo=max(1,round(expected-radius)); hi=min(length-1,round(expected+radius))
        candidates=range(lo,hi+1); k=min(candidates,key=lambda j:(values[j],abs(j-expected)))
        cuts.append(k/length)
    return cuts+[1.0]

def sheet(frames):
    out=Image.new('RGBA',(frames[0].width*len(frames),frames[0].height))
    for i,im in enumerate(frames): out.paste(im,(i*im.width,0))
    return out

def animation(asset_id,name,category,base,frames,fps,loop,status='ready',source='Original deterministic pixel drawing; factory.py',issues=None):
    seq=[]
    for n,im in enumerate(frames):
        path=f'{base}/sprites/{asset_id}_{name}_{n:02}.png'; save(im,path); seq.append(path)
    strip=sheet(frames); path=f'{base}/animations/{asset_id}_{name}.png'; save(strip,path)
    uid=f'{asset_id}.{name}'
    a=add(uid,asset_id+' / '+name,category,path,strip,'spritesheet',len(frames),fps,loop,(.5,.5) if category=='vfx' else (.5,.9375),status,frame_width=frames[0].width,frame_height=frames[0].height,columns=len(frames),rows=1,individual_frames=seq,art_origin=source,issues=issues or [],rendering='nearest; binary alpha; no sheet spacing')
    meta={'key':uid,'texture_key':uid,'texture_path':path,'layout':'grid','frameConfig':{'frameWidth':frames[0].width,'frameHeight':frames[0].height,'startFrame':0,'endFrame':len(frames)-1,'margin':0,'spacing':0},'animation':{'key':uid,'start':0,'end':len(frames)-1,'frameRate':fps,'repeat':-1 if loop else 0},'origin':a['origin'],'individual_frames':seq,'production_status':status}
    metadata=f'{base}/metadata/{asset_id}_{name}.json'; write_json(metadata,meta); a['metadata_path']=metadata
    # GIF preview: lossless PNGs remain the integration sources.
    preview=[]
    for im in frames:
        bg=Image.new('RGBA',im.size,P['dark']); bg.alpha_composite(im); preview.append(bg.convert('RGB').resize((im.width*3,im.height*3),Image.Resampling.NEAREST))
    p=ROOT/f'09_previews/animations/{asset_id}_{name}.gif'; p.parent.mkdir(parents=True,exist_ok=True)
    preview[0].save(p,save_all=True,append_images=preview[1:],duration=round(1000/fps),disposal=2,**({'loop':0} if loop else {}))
    a['preview_path']=p.relative_to(ROOT).as_posix()
    return a

HERO=[('idle',4,7,True),('prepare',3,9,False),('advance',6,12,False),('attack',6,14,False),('hurt',3,10,False),('victory',6,9,False),('defeat',4,7,False),('return',4,10,False)]
ENEMY=[('idle',4,7,True),('attack',5,10,False),('hurt',3,10,False),('defeat',4,7,False)]
GOLEM=[('idle',4,6,True),('prepare',4,8,False),('ground_impact',6,10,False),('hurt',3,8,False),('posture_transition',4,8,False),('defeat',5,7,False),('entrance',4,7,False)]
DRAGON=[('idle',4,7,True),('prepare',4,8,False),('magic_attack',5,10,False),('hurt',3,8,False),('phase_transition',4,8,False),('phase2_idle',4,7,True),('phase2_attack',5,10,False),('defeat',7,7,False)]

def export_sources(sources):
    for s in sources:
        if s.get('kind','sprites')!='sprites': continue
        sid=s.get('asset_id',s['id']); base=f"{s['category']}/{sid}"
        src=ROOT/s['local_source']; raw=Image.open(src).convert('RGBA'); im=binary_alpha(raw)
        counts=s.get('row_counts',[s['columns']]*s['rows']); cells=[]; issues=[]
        ycuts=s.get('y_cuts',adaptive_cuts(im,s['rows'],'y'))
        for row,count in enumerate(counts):
            rowimage=im.crop((0,round(ycuts[row]*im.height),im.width,round(ycuts[row+1]*im.height)))
            cuts=s.get('row_cuts',{}).get(str(row),adaptive_cuts(rowimage,count,'x'))
            for col in range(count):
                box=(round(cuts[col]*im.width),round(ycuts[row]*im.height),round(cuts[col+1]*im.width),round(ycuts[row+1]*im.height))
                cell=remove_small_fragments(im.crop(box)); bbox=cell.getbbox()
                if not bbox: raise ValueError(f'{sid}: empty source cell {len(cells)}')
                edge=sum(cell.getchannel('A').crop(b).histogram()[255] for b in [(0,0,cell.width,1),(0,cell.height-1,cell.width,cell.height),(0,0,1,cell.height),(cell.width-1,0,cell.width,cell.height)])
                if edge>2: issues.append(f'Source cell {len(cells)} contains {edge} opaque border pixels; possible overlap/cut')
                cells.append(cell.crop(bbox))
        cells=[c for n,c in enumerate(cells) if n not in s.get('drop_indices',[])]
        if s.get('frame_order'): cells=[cells[n] for n in s['frame_order']]
        size=s['size']; scale=min((size-16)/max(c.width for c in cells),(size-16)/max(c.height for c in cells))
        scale=min(scale,s.get('scale_limit',scale))
        frames=[]
        for cell in cells:
            small=cell.resize((max(1,round(cell.width*scale)),max(1,round(cell.height*scale))),Image.Resampling.NEAREST)
            f=Image.new('RGBA',(size,size)); f.paste(small,((size-small.width)//2,round(size*.9375)-small.height)); frames.append(f)
        specs=s.get('specs',HERO if sid=='samuca' else GOLEM if sid=='stone_guardian' else DRAGON if sid=='shadow_dragon' else ENEMY)
        expected=sum(x[1] for x in specs)
        if expected!=len(frames): raise ValueError(f'{sid}: {len(frames)} frames expected {expected}')
        offset=0
        for name,count,fps,loop in specs:
            if name in s.get('skip_animations',[]): offset+=count; continue
            status='ready' if s.get('visual_approved',False) and not issues else 'needs_review'
            animation(sid,name,s['category'],base,frames[offset:offset+count],fps,loop,status,source='Built-in image_gen with official Samuca style reference; binary-alpha normalization and nearest resampling',issues=issues+s.get('issues',[])); offset+=count
        if not s.get('asset_id'):
            neutral=f'{base}/sprites/{sid}_neutral.png'; save(frames[0],neutral)
            add(sid+'.neutral',sid+' / neutral',s['category'],neutral,frames[0],status='needs_review',art_origin='Built-in image_gen',dependencies=[sid+'.idle'])
        contact=Image.new('RGB',(size*8,size*math.ceil(len(frames)/8)),P['dark'])
        for n,f in enumerate(frames): contact.paste(f,((n%8)*size,(n//8)*size),f)
        save(contact,f"09_previews/contact_sheets/{s['id']}.png")
        if sid=='samuca' and not s.get('asset_id'):
            # Genuine expressions cropped from different generated poses, not synthetic redraws.
            for label,index in [('happy',0),('determined',4),('surprised',21),('hurt',19),('victory',25)]:
                f=frames[index]; bb=f.getbbox(); face=f.crop((bb[0],bb[1],bb[2],min(bb[3],bb[1]+round((bb[3]-bb[1])*.55))))
                tile=Image.new('RGBA',(96,96)); face.thumbnail((80,80),Image.Resampling.NEAREST); tile.paste(face,((96-face.width)//2,(96-face.height)//2))
                path=f'{base}/expressions/samuca_{label}.png'; save(tile,path); add('samuca.expression.'+label,'Samuca / '+label,'expressions',path,tile,status='needs_review',art_origin='Cropped generated Samuca pose; verify expression and hair framing')

def pixel_panel(w,h,state='normal',accent=None):
    im=Image.new('RGBA',(w,h)); d=ImageDraw.Draw(im); accent=accent or P['gold']
    pts=[(4,0),(w-5,0),(w-1,4),(w-1,h-5),(w-5,h-1),(4,h-1),(0,h-5),(0,4)]
    d.polygon(pts,fill=P['outline']); d.polygon([(x+(2 if x<w/2 else -2),y+(2 if y<h/2 else -2)) for x,y in pts],fill=accent)
    fill=P['blue'] if state!='disabled' else '#394759'
    if state=='hover': fill='#354C6B'
    if state=='pressed': fill=P['dark']
    d.rectangle((4,4,w-5,h-5),fill=fill)
    d.line((6,5,w-7,5),fill=P['cream'] if state=='hover' else '#52627A')
    d.line((5,h-6,w-6,h-6),fill=P['outline'])
    for x in [5,w-9]:
        for y in [5,h-9]: d.rectangle((x,y,x+2,y+2),fill=accent)
    return im

def icon(name,size=32):
    im=Image.new('RGBA',(32,32)); d=ImageDraw.Draw(im); O=P['outline']; C=P['cream']; G=P['gold']
    if name=='sword':
        d.polygon([(7,23),(20,5),(26,2),(25,9),(12,26)],fill=O); d.polygon([(10,21),(21,7),(24,5),(23,9),(12,23)],fill=P['steel']); d.line((12,20,22,7),fill=C,width=2); d.line((6,20,16,27),fill=G,width=3); d.line((8,25,4,29),fill=P['brown'],width=3)
    elif name=='shield':
        d.polygon([(5,5),(16,2),(27,5),(25,20),(16,29),(7,20)],fill=O); d.polygon([(8,7),(16,5),(24,7),(22,19),(16,25),(10,19)],fill=G); d.polygon([(11,9),(16,8),(21,9),(20,18),(16,22),(12,18)],fill=P['magic']); d.line((16,10,16,20),fill=C,width=2)
    elif name=='crystal':
        d.polygon([(16,2),(26,10),(23,24),(16,30),(8,24),(5,10)],fill=O); d.polygon([(16,5),(23,11),(21,23),(16,27),(11,23),(8,11)],fill=P['purple']); d.polygon([(16,5),(16,25),(11,21),(9,11)],fill=P['magic']); d.line((16,6,21,11),fill=C,width=2)
    elif name in ['star','star_empty']:
        pts=[(16,2),(20,11),(30,12),(23,19),(25,29),(16,24),(7,29),(9,19),(2,12),(12,11)]
        d.polygon(pts,fill=O); d.polygon([(16+(x-16)*.75,16+(y-16)*.75) for x,y in pts],fill=G if name=='star' else '#52627A'); d.line((15,8,13,14,7,14),fill=C if name=='star' else P['steel'],width=2)
    elif name=='heart':
        pts=[(16,10),(11,5),(6,5),(3,8),(3,15),(16,28),(29,15),(29,8),(26,5),(21,5)]
        d.polygon(pts,fill=O); d.polygon([(16+(x-16)*.78,16+(y-16)*.78) for x,y in pts],fill=P['red']); d.rectangle((7,9,11,11),fill='#FFBFA2')
    elif name=='potion':
        d.rectangle((12,3,20,7),fill=P['brown']); d.rectangle((11,7,21,13),fill=O); d.polygon([(11,12),(5,18),(5,27),(9,30),(23,30),(27,27),(27,18),(21,12)],fill=O); d.polygon([(12,15),(8,20),(8,26),(11,27),(22,27),(24,25),(24,20),(20,15)],fill=P['red']); d.rectangle((13,8,18,15),fill=P['steel']); d.line((10,20,10,24),fill=C,width=2)
    elif name=='pause':
        for x in [8,20]: d.rectangle((x,6,x+5,26),fill=G); d.line((x,6,x+4,6),fill=C)
    elif name=='timer':
        d.ellipse((4,6,28,30),fill=O); d.ellipse((7,9,25,27),fill=G); d.ellipse((10,12,22,24),fill=P['blue']); d.rectangle((12,1,20,4),fill=G); d.line((16,13,16,18,21,18),fill=C,width=2)
    elif name=='target':
        d.rectangle((5,5,26,26),outline=G,width=2)
        for b in [(11,4,20,7),(11,24,20,28),(4,11,7,20),(24,11,28,20)]: d.rectangle(b,fill=(0,0,0,0))
        d.line((12,16,20,16),fill=C); d.line((16,12,16,20),fill=C)
    elif name=='lock':
        d.arc((8,2,24,20),180,360,fill=G,width=4); d.rectangle((5,13,27,29),fill=O); d.rectangle((8,16,24,26),fill=G); d.rectangle((15,19,18,23),fill=P['dark'])
    elif name=='check': d.line((5,16,12,23,27,7),fill=O,width=6); d.line((5,15,12,22,27,6),fill=P['green'],width=3)
    elif name=='gear':
        d.ellipse((6,6,26,26),fill=G)
        for a in range(0,360,45):
            x=16+12*math.cos(math.radians(a)); y=16+12*math.sin(math.radians(a)); d.rectangle((x-3,y-3,x+3,y+3),fill=G)
        d.ellipse((11,11,21,21),fill=P['dark'])
    elif name=='retry':
        d.arc((5,5,27,27),30,310,fill=G,width=3); d.polygon([(4,5),(4,15),(14,7)],fill=G)
    elif name=='sound':
        d.polygon([(4,12),(10,12),(17,5),(17,27),(10,21),(4,21)],fill=G); d.arc((14,6,29,26),280,80,fill=C,width=2)
    elif name=='moon': d.ellipse((5,3,27,27),fill=G); d.ellipse((13,0,30,21),fill=(0,0,0,0))
    return im.resize((size,size),Image.Resampling.NEAREST)

def make_ui():
    def emit(id,group,im,**kw):
        path=f'06_ui/{group}/{id}.png'; save(im,path); return add('ui.'+id,id,'ui',path,im,**kw)
    for kind in ['primary','secondary']:
        for state in ['normal','hover','pressed','disabled']:
            emit(f'button_{kind}_{state}','buttons',pixel_panel(240,64,state,P['gold'] if kind=='primary' else P['magic']),nine_slice={'left':12,'right':12,'top':12,'bottom':12},safe_content={'x':20,'y':14,'width':200,'height':36})
    for name,w,h in [('battle',640,160),('math',640,180),('memory',640,200),('reflex',640,180),('menu',400,320),('victory',480,256),('defeat',480,240),('settings',480,320)]:
        emit('panel_'+name,'battle_hud' if name=='battle' else 'overlays',pixel_panel(w,h),nine_slice={'left':12,'right':12,'top':12,'bottom':12},safe_content={'x':20,'y':20,'width':w-40,'height':h-40})
    for name in ['sword','shield','crystal','star','star_empty','heart','potion','pause','timer','target','lock','check','gear','retry','sound','moon']:
        emit(name,'icons',icon(name,32))
    for who,w in [('hero',192),('enemy',160),('boss',384)]:
        emit('hp_'+who+'_frame','progress',pixel_panel(w,24),nine_slice={'left':6,'right':6,'top':6,'bottom':6})
        fill=Image.new('RGBA',(w-16,8),P['red']); ImageDraw.Draw(fill).line((0,0,w-17,0),fill='#FFBFA2'); emit('hp_'+who+'_fill','progress',fill,requires_alpha=False)
    emit('timer_track','progress',pixel_panel(320,20),nine_slice={'left':6,'right':6,'top':6,'bottom':6})
    emit('timer_fill','progress',Image.new('RGBA',(304,4),P['green']),requires_alpha=False)
    for state in ['normal','locked','completed','boss']:
        im=pixel_panel(64,64,accent=P['purple'] if state=='boss' else P['gold']); overlay=icon('lock' if state=='locked' else 'check' if state=='completed' else 'crystal' if state=='boss' else 'star'); im.alpha_composite(overlay,(16,16)); emit('stage_'+state,'stage_select',im,number_anchor={'x':32,'y':32})
    for name in ['front','back','sword','shield','crystal','star','heart','potion']:
        im=pixel_panel(68,84,accent=P['gold']); d=ImageDraw.Draw(im)
        if name=='back':
            for y in range(12,74,8):
                for x in range(12,57,8): d.rectangle((x,y,x+2,y+2),fill='#354C6B')
            im.alpha_composite(icon('crystal',32),(18,26))
        elif name!='front': im.alpha_composite(icon(name,40),(14,22))
        emit('card_'+name,'cards',im,display_width=69)
    for state in ['off','on']:
        im=pixel_panel(64,28,accent=P['green'] if state=='on' else '#52627A'); d=ImageDraw.Draw(im); x=38 if state=='on' else 6; d.rectangle((x,6,x+19,21),fill=P['cream']); emit('toggle_'+state,'overlays',im)
    emit('stars_frame','overlays',pixel_panel(224,72),nine_slice={'left':12,'right':12,'top':12,'bottom':12})
    # Corners, horizontal/vertical edges and fill are independently reusable.
    tile=pixel_panel(36,36)
    cuts={'top_left':(0,0,12,12),'top':(12,0,24,12),'top_right':(24,0,36,12),'left':(0,12,12,24),'fill':(12,12,24,24),'right':(24,12,36,24),'bottom_left':(0,24,12,36),'bottom':(12,24,24,36),'bottom_right':(24,24,36,36)}
    for name,box in cuts.items(): emit('slice_'+name,'buttons/nine_slice',tile.crop(box),requires_alpha=False)

def vfx_frame(name,t,n,size=128,reduced=False):
    im=Image.new('RGBA',(size,size)); d=ImageDraw.Draw(im); q=t/(n-1); cx=cy=size/2
    def star(x,y,r,color): d.polygon([(x,y-r),(x+r*.3,y-r*.3),(x+r,y),(x+r*.3,y+r*.3),(x,y+r),(x-r*.3,y+r*.3),(x-r,y),(x-r*.3,y-r*.3)],fill=color)
    if name in ['sword_slash','strong_attack','weak_attack']:
        radius=(34 if name=='weak_attack' else 49)*(0.65+.35*math.sin(q*math.pi)); a0=-145+q*160; span=85 if name=='weak_attack' else 150
        color=P['gold'] if name=='strong_attack' else P['magic'] if name=='weak_attack' else P['steel']
        pts=[]
        for k in range(20):
            a=math.radians(a0+span*k/19); pts.append((cx+radius*math.cos(a),cy+radius*math.sin(a)))
        for k in range(19,-1,-1):
            a=math.radians(a0+span*k/19); inner=radius-(2+8*math.sin(math.pi*k/19))*(1-q*.6); pts.append((cx+inner*math.cos(a),cy+inner*math.sin(a)))
        d.polygon(pts,fill=color); d.arc((cx-radius,cy-radius,cx+radius,cy+radius),a0,a0+span,fill=P['cream'],width=2)
        if name=='strong_attack':
            for k in range(4): star(cx+math.cos(k*1.7+q)*radius,cy+math.sin(k*1.7+q)*radius,2+2*math.sin(q*math.pi),P['gold'])
    elif name=='golem_attack':
        r=8+q*44; d.ellipse((cx-r,88-r*.2,cx+r,88+r*.2),outline=P['gold_shadow'],width=3)
        for k in range(10 if not reduced else 5):
            a=k*2.4; x=cx+math.cos(a)*(8+q*45); y=83-math.sin(q*math.pi)*22-(k%3)*4; rr=2+(k%3); d.polygon([(x-rr,y),(x,y-rr*2),(x+rr,y-rr),(x+rr,y+rr),(x-rr,y+rr)],fill=P['brown']); d.line((x-rr,y,x,y-rr*2),fill=P['steel'])
    elif name in ['dragon_attack','dragon_special']:
        r=13+22*math.sin(q*math.pi); x=54+q*38; color=P['purple'] if name=='dragon_attack' else P['cyan']; d.ellipse((x-r,cy-r,x+r,cy+r),fill=color); d.ellipse((x-r*.55,cy-r*.55,x+r*.55,cy+r*.55),fill=P['magic']); star(x,cy,r*.7,P['cream'])
        for k in range(5 if not reduced else 2): d.line((x-r-5-k*4,cy+(k-2)*5,x-r-14-k*4,cy+(k-2)*5),fill=color,width=2)
    else:
        color=P['red'] if name=='hero_damage' else P['purple'] if name in ['enemy_defeat','crystal_recovered'] else P['gold'] if name in ['star_earned','victory'] else P['magic']
        count=12 if name=='victory' else 8
        if reduced: count//=2
        for k in range(count):
            a=k*math.tau/count+.25; r=8+q*(40 if name!='victory' else 48); x=cx+math.cos(a)*r; y=cy+math.sin(a)*r+q*q*8; rad=max(1,round(5*(1-q)+1)); star(x,y,rad,color)
        if name in ['star_earned','crystal_recovered']:
            ico=icon('star' if name=='star_earned' else 'crystal',32); im.alpha_composite(ico,(48,48-round(6*math.sin(q*math.pi))))
        else: star(cx,cy,max(1,18*(1-q)),P['cream'])
    # Work on a 64-pixel grid to keep clusters consistent at logical resolution.
    return im.resize((size//2,size//2),Image.Resampling.NEAREST).resize((size,size),Image.Resampling.NEAREST)

def make_vfx():
    for name in ['sword_slash','strong_attack','weak_attack','magic_impact','hero_damage','enemy_defeat','golem_attack','dragon_attack','dragon_special','star_earned','victory','crystal_recovered']:
        frames=[vfx_frame(name,t,8) for t in range(8)]; a=animation(name,'effect','vfx',f'07_vfx/{name}',frames,14,False); a['origin']={'x':.5,'y':.5}
        a=animation(name,'reduced','vfx',f'07_vfx/{name}',[vfx_frame(name,t,6,reduced=True) for t in range(6)],12,False); a['origin']={'x':.5,'y':.5}; a['reduced_motion']=True

def export_images(sources):
    for s in sources:
        if s.get('kind')!='image': continue
        im=Image.open(ROOT/s['local_source']).convert('RGBA')
        if s.get('transparent'): im=binary_alpha(im)
        if s.get('target_size'):
            # Pixel grid sampled once, then expanded at an integer factor.
            w,h=s['target_size']; im=im.resize((w//4,h//4),Image.Resampling.NEAREST).resize((w,h),Image.Resampling.NEAREST)
        path=s['export_path']; save(im,path)
        add(s['id'],s['id'],s['category'],path,im,status='needs_review',origin=(0,0),art_origin='Built-in image_gen; official Samuca reference supplied where relevant',issues=s.get('issues',[]),requires_alpha=s.get('transparent',False))

def make_environments(sources):
    names=['midground','scenery','ground','foreground','particles']
    for s in sources:
        if s.get('kind')!='props': continue
        env=s['environment']; src=binary_alpha(Image.open(ROOT/s['local_source']))
        props=[]
        for n,b in enumerate(s['boxes']):
            crop=src.crop(tuple(round(v*(src.width if i%2==0 else src.height)) for i,v in enumerate(b))); bb=crop.getbbox()
            if not bb: raise ValueError(f'{env}: empty prop {n}')
            crop=crop.crop(bb); path=f'05_environments/{env}/props/{env}_prop_{n:02}.png'; save(crop,path)
            add(f'{env}.prop_{n:02}',f'{env} / prop {n}','environments',path,crop,status='needs_review',origin=(.5,1),art_origin='Extracted built-in image_gen prop, custom recorded crop')
            props.append(crop)
        def fitted(n,w,h):
            p=props[n].copy(); p.thumbnail((w//4,h//4),Image.Resampling.NEAREST); return p.resize((p.width*4,p.height*4),Image.Resampling.NEAREST)
        layers=[Image.new('RGBA',(1280,720)) for _ in range(5)]
        for x in [0,1000]:
            p=fitted(0,280,380); layers[0].alpha_composite(p,(x,460-p.height))
        for x in [48,1060]:
            p=fitted(1,172,140); layers[1].alpha_composite(p,(x,492-p.height))
        # Tile the CENTER of the generated flat platform, keeping original pixel proportions.
        ground=props[2]; center=ground.crop((ground.width//4,0,ground.width*3//4,ground.height))
        center=center.resize((max(4,center.width//4)*4,max(4,center.height//4)*4),Image.Resampling.NEAREST)
        center.thumbnail((512,228),Image.Resampling.NEAREST)
        center=center.resize((max(4,center.width//4)*4,max(4,center.height//4)*4),Image.Resampling.NEAREST)
        ground_y=432
        # Extend natural stone/soil as a 2D material patch, retaining original pixel texture.
        # The complete generated platform is composited over it; never stretch a single row.
        material=center.crop((center.width//4,center.height//3,center.width*3//4,center.height*2//3))
        material.putalpha(255)
        for y in range(ground_y+center.height//3,720,material.height):
            for x in range(0,1280,material.width): layers[2].paste(material,(x,y))
        for x in range(0,1280,center.width): layers[2].alpha_composite(center,(x,ground_y))
        for x in [0,1076]:
            p=fitted(3,204,150); layers[3].alpha_composite(p,(x,566-p.height))
        p=fitted(4,380,220); layers[4].alpha_composite(p,(60,90)); layers[4].alpha_composite(p,(840,155))
        ray=fitted(5,480,300); ray.putalpha(ray.getchannel('A').point(lambda a:round(a*.2))); layers[4].alpha_composite(ray,(40,30))
        configs=[]
        for n,(name,layer) in enumerate(zip(names,layers),start=2):
            path=f'05_environments/{env}/layers/{n:02}_{name}.png'; save(layer,path)
            a=add(f'{env}.{name}',env+' / '+name,'environments',path,layer,status='needs_review',origin=(0,0),art_origin='Composition of generated props with documented crops and nearest scaling',parallax_factor=[.3,.65,1,1.08,.15][n-2],intentional_edge_content=name in ['ground','foreground'])
            configs.append({'id':a['id'],'path':path,'depth':n*10,'scroll_factor':a['parallax_factor']})
        distant=f'05_environments/{env}/layers/01_distant.png'; composite=Image.open(ROOT/distant).convert('RGBA')
        for layer in layers: composite.alpha_composite(layer)
        save(composite,f'09_previews/environments/{env}_composite.png')
        alpha=layers[2].getchannel('A')
        baseline=next(y for y in range(ground_y,530) if alpha.crop((0,y,1280,y+1)).histogram()[255]>1240)
        write_json(f'05_environments/{env}/metadata/layers.json',{'viewport':{'width':1280,'height':720},'combat_baseline_y':baseline,'baseline_method':'First row of terrain with more than97% opaque coverage across viewport','challenge_safe_area':{'x':0,'y':530,'width':1280,'height':190},'parallax_mode':'bounded camera movement; layers are not certified seamless','layers':[{'id':env+'.distant','path':distant,'depth':10,'scroll_factor':.1}]+configs})

def make_brand_world():
    glyph={'P':['11110','10001','10001','11110','10000','10000','10000'],'I':['11111','00100','00100','00100','00100','00100','11111'],'X':['10001','10001','01010','00100','01010','10001','10001'],'E':['11111','10000','10000','11110','10000','10000','11111'],'L':['10000','10000','10000','10000','10000','10000','11111'],'Q':['01110','10001','10001','10001','10101','10010','01101'],'U':['10001','10001','10001','10001','10001','10001','01110'],'S':['01111','10000','10000','01110','00001','00001','11110'],'T':['11111','00100','00100','00100','00100','00100','00100']}
    title='PIXEL QUEST'; logo=Image.new('RGBA',(432,68)); d=ImageDraw.Draw(logo)
    for n,ch in enumerate(title):
        if ch==' ': continue
        for y,row in enumerate(glyph[ch]):
            for x,val in enumerate(row):
                if val=='1':
                    xx=8+n*38+x*6; yy=8+y*6; d.rectangle((xx-3,yy-3,xx+8,yy+8),fill=P['outline'])
    for n,ch in enumerate(title):
        if ch==' ': continue
        for y,row in enumerate(glyph[ch]):
            for x,val in enumerate(row):
                if val=='1':
                    xx=8+n*38+x*6; yy=8+y*6; d.rectangle((xx,yy,xx+5,yy+5),fill=P['cream'] if y<2 else P['gold'] if y<5 else P['gold_shadow'])
    save(logo,'01_brand/logo/pixel_quest_logo.png'); add('brand.logo','Pixel Quest logo','brand','01_brand/logo/pixel_quest_logo.png',logo)
    points=[(145,568),(440,588),(100,340),(255,145),(475,280),(815,600),(1080,520),(1065,330),(790,200),(1150,165)]
    trail=Image.new('RGBA',(320,180)); d=ImageDraw.Draw(trail); small=[(round(x/4),round(y/4)) for x,y in points]; d.line(small,fill=P['gold_shadow'],width=5); d.line(small,fill=P['gold'],width=3)
    trail=trail.resize((1280,720),Image.Resampling.NEAREST); path='08_world/stage_map/path_overlay.png'; save(trail,path); add('world.stage_map.path','Stage path','world',path,trail,status='needs_review',origin=(0,0),issues=['Route crosses water/terrain; validate illustrated bridge alignment before integration'])
    write_json('08_world/stage_map/stages.json',{'viewport':{'width':1280,'height':720},'stages':[{'stage':n+1,'x':x,'y':y,'boss':n+1 in [5,10],'region':'forest' if n<5 else 'crystal','icon':'ui.stage_boss' if n+1 in [5,10] else 'ui.stage_normal','locked_icon':'ui.stage_locked','complete_icon':'ui.stage_completed'} for n,(x,y) in enumerate(points)],'numbers':'Render live text; never baked into background'})
    forest=Image.open(ROOT/'05_environments/enchanted_forest/layers/01_distant.png').convert('RGBA')
    for name in ['main_menu','victory','defeat','introduction']:
        out=forest.copy()
        if name in ['defeat','introduction']: out.alpha_composite(Image.new('RGBA',out.size,(24,36,55,105)))
        if name=='victory':
            for x,y in [(72,80),(160,190),(1032,98),(1130,220),(950,500)]: out.alpha_composite(icon('star',32),(x,y))
        path=f'06_ui/main_menu/{name}_background.png' if name=='main_menu' else f'08_world/{name}/background.png'; save(out,path)
        add('world.'+name+'.background',name+' background','world',path,out,status='needs_review',origin=(0,0),requires_alpha=False,art_origin='Original generated forest backdrop reused as cohesive screen art; tint/celebration composition')
    deco=Image.new('RGBA',(1280,720)); d=ImageDraw.Draw(deco)
    for x,y in [(80,50),(1220,50),(110,650),(1180,650)]: deco.alpha_composite(icon('crystal',32),(x,y))
    save(deco,'06_ui/main_menu/decorations.png'); add('ui.menu_decorations','Menu crystal decorations','ui','06_ui/main_menu/decorations.png',deco,origin=(0,0))
    write_json('06_ui/main_menu/layout.json',{'hero_area':{'x':80,'y':210,'width':400,'height':310},'logo_area':{'x':380,'y':60,'width':800,'height':136},'buttons_area':{'x':700,'y':250,'width':420,'height':340},'text':'Phaser dynamic text; title is separate logo PNG'})

def build():
    sources=json.loads((ROOT/'10_manifests/sources.json').read_text(encoding='utf-8'))
    create_shared_palette(sources)
    export_sources(sources); make_ui(); make_vfx(); export_images(sources); make_environments(sources); make_brand_world()
    write_json('10_manifests/palette.json',{'colors':[{'name':k,'hex':v} for k,v in P.items()],'note':'Master colors for deterministic UI/VFX. Generated art uses additional colors; see used_colors.json.'})
    write_json('10_manifests/assets.manifest.json',{'schema_version':'1.0','project':'Pixel Quest — Aventura dos Desafios','logical_viewport':{'width':1280,'height':720},'assets':ASSETS})
    print(json.dumps({'manifest_entries':len(ASSETS),'sheets':sum(a['type']=='spritesheet' for a in ASSETS),'frames':sum(a['frames'] for a in ASSETS if a['type']=='spritesheet')},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('command',choices=['build']); args=parser.parse_args(); build()
