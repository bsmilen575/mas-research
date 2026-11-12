"""Reproduce the two descriptive figures from saved decisions; no API calls."""
from pathlib import Path
import json,re,collections
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
ROOT=Path('/Users/brookesmilen/Desktop/moral_agents/durability')
if not ROOT.exists(): ROOT=Path.cwd() / 'runs/2026-11-12'
OUT=ROOT/'aggregate';OUT.mkdir(exist_ok=True)
models=['gpt','claude','grok','jev'];names=['GPT-6 Astra','Claude Opus 5.5','Grok 4.7','Jev (typed decision API)']
windows=[1050000,1000000,500000,262144]
groups=[('Baseline', [('system','baseline','end','System instruction only'),('user','baseline','end','Instruction in user prompt only')]),('Context load',[('system','load','end','System instruction; context filled'),('user','load','start','Instruction at top of user prompt; context filled'),('user','load','end','Instruction at bottom of user prompt; context filled')]),('Compaction survival',[('system','compact_history_only','end','System instruction retained; history summarized'),('system','compact_whole_session','end','System instruction sent to summarizer; original removed'),('user','compact_whole_session','start','Instruction at top of user prompt before compaction'),('user','compact_whole_session','end','Instruction at bottom of user prompt before compaction')]),('Peer pressure',[('system','pressure','end','System instruction + opposing peer'),('user','pressure','end','Instruction in user prompt + opposing peer')])]
colors=['#487e9b','#ad6760','#c7b17a']
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False})
def read(phase):
 p=ROOT/phase/'results.jsonl'
 return [json.loads(x) for x in p.read_text().splitlines()] if p.exists() else []
smoke=read('smoke_2026-11-12')
def draw(rows,phase):
 fig,axs=plt.subplots(4,4,figsize=(19,12),gridspec_kw={'height_ratios':[2.4,3.4,4.4,2.4]})
 for gi,(bucket,configs) in enumerate(groups):
  for mi,(key,name) in enumerate(zip(models,names)):
   ax=axs[gi,mi]
   for i,(p,c,pos,label) in enumerate(configs):
    rr=[r for r in rows if (r['key'],r['placement'],r['condition'],r['position'])==(key,p,c,pos)]
    count=[sum(r['status']=='valid' and r['older'] is True for r in rr),sum(r['status']=='valid' and r['older'] is False for r in rr),sum(r['status']!='valid' for r in rr)]
    n=len(rr);left=0
    for val,col in zip(count,colors):
     width=100*val/n if n else 0;ax.barh(i,width,left=left,height=.52,color=col);left+=width
    ax.text(103,i,f'{count[0]}/{n}' if n else 'Not run',va='center',fontsize=9)
   ax.set_xlim(0,132);ax.set_ylim(len(configs)-.45,-.8);ax.set_xticks([0,50,100]);ax.set_xticklabels(['0%','50%','100%']);ax.spines['left'].set_visible(False);ax.spines['bottom'].set_color('#aaa');ax.tick_params(axis='y',length=0)
   ax.set_yticks(range(len(configs)));ax.set_yticklabels([x[3] for x in configs] if mi==0 else [])
   ax.grid(axis='x',color='#eee',lw=.7);ax.set_axisbelow(True)
   if gi==0:ax.set_title(name,pad=18,fontweight='bold',fontsize=12)
   if gi==1:
    nums=[r['input_tokens'] for r in smoke if r['key']==key and r['condition']=='load'];lo,hi=min(nums),max(nums)
    token=f'{lo:,}' if lo==hi else f'{lo:,}–{hi:,}'
    ax.text(0,1.06,f'{100*lo/windows[mi]:.1f}% full\n({token} input tokens)',transform=ax.transAxes,fontsize=9)
   if mi==0:ax.text(-.02,1.3,bucket,transform=ax.transAxes,fontweight='bold',fontsize=13,ha='right')
 fig.suptitle('Durability of the older-favoring instruction — '+('smoke test' if phase=='smoke' else 'partial age-pair expansion'),x=.03,ha='left',fontsize=17,y=.98)
 fig.text(.03,.943,'One dilemma, both A/B orders; 88 saved responses.' if phase=='smoke' else '132 additional responses; incomplete and uneven coverage. Smoke responses are excluded. No additional context-load trials.',fontsize=11)
 fig.text(.03,.915,'Bar length = percentage of saved responses. Labels = older-favoring answers / saved responses (including refusals).',fontsize=10)
 fig.legend([Patch(color=c) for c in colors],['Favored older people','Favored younger people','Refusal or invalid answer'],loc='lower left',bbox_to_anchor=(.025,.025),ncol=3,frameon=False)
 fig.text(.03,.012,'Compaction: Luna-generated summary. Peer pressure: two live exchanges with an Astra peer; Jev receives fixed opposing statements, without replies.',fontsize=9)
 fig.subplots_adjust(left=.36,right=.98,top=.865,bottom=.095,hspace=.65,wspace=.13)
 for ext in ['png','svg','pdf']:fig.savefig(OUT/f'{phase}_results.{ext}',dpi=130,bbox_inches='tight',facecolor='white')
 plt.close(fig)
draw(smoke,'smoke')
draw(read('age30_short_2026-11-12'),'expansion')
