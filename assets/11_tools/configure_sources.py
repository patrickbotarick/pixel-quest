from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
path=root/'10_manifests/sources.json'; sources=json.loads(path.read_text(encoding='utf-8'))
overrides=['samuca_victory','slime_green_attack','samuca_defeat','shadow_dragon_phase2_attack']
sources=[s for s in sources if s['id'] not in overrides]
v=json.loads((root/'10_manifests/victory_generation.json').read_text(encoding='utf-8')); v['size']=128; v['scale_limit']=.18; v['y_cuts']=[0,.52,1]; sources.append(v)
hero=next(s for s in sources if s['id']=='samuca'); hero['size']=128
hero['row_counts']=[6,6,6,7,6,6]
hero['y_cuts']=[y/1024 for y in [0,174,347,524,700,863,1024]]
hero['row_cuts']={'3':[x/1536 for x in [0,255,490,699,898,1115,1320,1536]],'4':[x/1536 for x in [0,250,465,700,950,1210,1536]],'5':[x/1536 for x in [0,280,530,790,1045,1280,1536]]}
hero['drop_indices']=[28]; hero['skip_animations']=['victory','defeat']
hero['issues']=[]
hero['prompt']="Create a production animation sprite sheet of SAMUCA strictly matching the small combat/neutral character from the supplied official reference. Premium 16-bit pixel art with crisp pixel clusters, brown hair, one small gold lock, expressive eyes, blue tunic gold trim green cape brown boots metallic short sword. Transparent background, no text, no grid lines, no shadow under feet, no decorative sheet. Exactly 6 columns by 6 rows, 36 equally spaced complete sprites, generous empty margins in each cell. All same body scale, ground baseline and facing right 3/4, sword and cape never clipped. Ordered left-to-right then top-to-bottom: frames 1-4 idle breathing with cape and hair motion; 5-7 attack preparation lowering stance pulling sword back; 8-13 advance with six clearly distinct leg poses; 14-19 sword attack anticipation swing follow-through recovery (no big VFX); 20-22 hurt with recoil and expression; 23-28 victory raising sword and cheering; 29-32 friendly collapse defeat; 33-36 return walking backward into neutral stance. Every frame visibly distinct, coherent anatomy and identity. Equal cell grid layout is essential; each sprite must fit isolated inside its cell. Target each cell 96x96 at export, designed with that detail level."
mushroom=next(s for s in sources if s['id']=='mushroom')
mushroom['prompt']="Use reference ONLY for crisp premium fantasy 16-bit pixel art style, palette and dark contours. Create one production sprite sheet for Pixel Quest's Cogumelo Travesso: mischievous expressive mushroom enemy, broad red cap with cream spots, beige face and stalk, little brown root feet, leaf accents. Friendly threat appropriate for children, distinct personality. Exactly 4 columns x 4 rows, 16 equal cells, each full isolated sprite centered with consistent scale and ground baseline, facing left 3/4. Transparent background no text no grid no shadows outside sprite. Read order: 1-4 idle (cap bounce, wink, roots move); 5-9 attack (crouch cap draws back, lean forward, headbutt lunge, overshoot, recovery); 10-12 damage (cap tilted, recoil, grimace); 13-16 defeat (cap droops, sits down, cap folds, gently collapses). Distinct body poses, not just translations/recolors, intact silhouettes, generous 15% blank margin per cell. No Samuca, no human protagonist. Designed for 96x96 exports."
golem=next(s for s in sources if s['id']=='stone_guardian')
golem['specs']=[['idle',4,6,True],['prepare',5,8,False],['ground_impact',5,10,False],['hurt',4,8,False],['posture_transition',6,8,False],['defeat',3,7,False],['entrance',3,7,False]]
golem['issues']=['Counts follow observed source poses; ground impact and entrance require temporal review']
dragon=next(s for s in sources if s['id']=='shadow_dragon')
dragon['frame_order']=[0,1,2,3,4,5,6,7,8,9,12,13,11,10,14,16,17,18,19,20,21,22,23,28,24,25,26,27,28,29,30,31,32,33,34,35]
dragon['skip_animations']=['phase2_attack']
dragon['issues']=['Wing/tail source boundaries and scaling of replacement phase2 attack require visual review']
green=next(s for s in sources if s['id']=='slime_green'); green['skip_animations']=['attack']
for file in ['green_attack_generation.json','hero_defeat_generation.json','dragon_phase2_attack_generation.json']:
    s=json.loads((root/'10_manifests'/file).read_text(encoding='utf-8'))
    if s['id']=='slime_green_attack': s['scale_limit']=.2
    if s['id']=='samuca_defeat': s['scale_limit']=.14
    sources.append(s)
for s in sources:
    if 'prompt' not in s: s['prompt_record']='Initial prompt summary: official Samuca style and identity; transparent animation sheet; requested pose sequence. Exact initial text is in chat tool history.'
path.write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Configured',len(sources),'source records')
