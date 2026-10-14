"""Portable compose / extract / preview commands for PNG frames."""
from pathlib import Path
import argparse,json
from PIL import Image

def main():
    p=argparse.ArgumentParser(); sub=p.add_subparsers(dest='command',required=True)
    a=sub.add_parser('compose'); a.add_argument('--frames',nargs='+',required=True); a.add_argument('--out',required=True)
    a=sub.add_parser('extract'); a.add_argument('sheet'); a.add_argument('--width',type=int,required=True); a.add_argument('--height',type=int,required=True); a.add_argument('--out',required=True)
    a=sub.add_parser('preview'); a.add_argument('--frames',nargs='+',required=True); a.add_argument('--fps',type=int,default=10); a.add_argument('--out',required=True)
    args=p.parse_args()
    if args.command=='extract':
        im=Image.open(args.sheet).convert('RGBA'); w,h=args.width,args.height
        if w<=0 or h<=0 or im.width%w or im.height%h: p.error('Grid does not divide image')
        out=Path(args.out); out.mkdir(parents=True,exist_ok=True); n=0
        for y in range(0,im.height,h):
            for x in range(0,im.width,w): im.crop((x,y,x+w,y+h)).save(out/f'frame_{n:03}.png'); n+=1
        print(n,'frames extracted'); return
    frames=[Image.open(f).convert('RGBA') for f in args.frames]
    if len({f.size for f in frames})!=1: p.error('Frame sizes differ')
    out=Path(args.out); out.parent.mkdir(parents=True,exist_ok=True)
    if args.command=='compose':
        w,h=frames[0].size; sheet=Image.new('RGBA',(w*len(frames),h))
        for n,f in enumerate(frames): sheet.paste(f,(w*n,0))
        sheet.save(out)
    else:
        if args.fps<=0: p.error('FPS must be positive')
        rgb=[]
        for f in frames:
            bg=Image.new('RGBA',f.size,'#182437'); bg.alpha_composite(f); rgb.append(bg.convert('RGB'))
        rgb[0].save(out,save_all=True,append_images=rgb[1:],duration=round(1000/args.fps),loop=0,disposal=2)
    print(str(out))

if __name__=='__main__': main()
