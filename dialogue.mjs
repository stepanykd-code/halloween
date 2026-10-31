import {DIALOGUE_DATA} from './dialogue-data.mjs';

export function speechDuration(text){return Math.max(2600,Math.min(8500,1600+text.length*48));}
export function createDialogueDirector({random=Math.random,isAvailable=()=>true}={}){
  let clock=0,current=null,queue=[],waitingUntil=0,nextAmbientAt=1600,nextEventAt=0,lastConversation='',openingPending=true;
  const lastLines=new Map();
  const between=(a,b)=>a+Math.max(0,Math.min(1,random()))*(b-a);
  function pick(items,previous){const choices=items.filter(item=>item.id!==previous);const pool=choices.length?choices:items;return pool[Math.min(pool.length-1,Math.floor(Math.max(0,random())*pool.length))];}
  function availableConversation(c){return c.turns.every(turn=>isAvailable(turn.speaker));}
  function startConversation(trigger='ambient',force=false){
    if(!force&&(current||queue.length))return false;
    const choices=DIALOGUE_DATA.conversations.filter(c=>c.trigger===trigger&&availableConversation(c));
    if(!choices.length)return false;
    const conversation=pick(choices,lastConversation);lastConversation=conversation.id;
    if(trigger==='intro')openingPending=false;
    queue=conversation.turns.map(line=>({...line,conversationId:conversation.id}));current=null;waitingUntil=clock+(queue[0].pauseBeforeMs??0);
    nextAmbientAt=Infinity;return true;
  }
  function onEvent(speaker,trigger,{priority=false}={}){
    if(!isAvailable(speaker)||(!priority&&(current||queue.length||clock<nextEventAt)))return false;
    // Keep explicit ability feedback visible over ambient danger warnings.
    // A new ability or an actual fall can still interrupt it immediately.
    const feedback=current??queue[0];
    if(feedback?.trigger?.startsWith('ability-')&&!trigger.startsWith('ability-')&&!trigger.startsWith('boss-')&&!['hands-hit','fall'].includes(trigger))return false;
    // Slavik often chooses silence; his siblings/friend speak more readily.
    if(speaker==='slavik'&&!priority&&trigger!=='fall'&&random()>.4)return false;
    const choices=DIALOGUE_DATA.lines.filter(line=>line.speaker===speaker&&line.trigger===trigger);
    if(!choices.length)return false;
    if(priority){current=null;queue=[];openingPending=false;}
    const key=speaker+'.'+trigger,line=pick(choices,lastLines.get(key));lastLines.set(key,line.id);
    queue=[line];waitingUntil=clock;nextEventAt=clock+11000;nextAmbientAt=Infinity;return true;
  }
  function playLines(lines,{id='scene',force=false,interruptAbilities=false}={}){
    if(!force&&(current||queue.length))return false;
    const feedback=current??queue[0];
    if(!interruptAbilities&&feedback?.trigger?.startsWith('ability-'))return false;
    const turns=lines.filter(line=>line&&isAvailable(line.speaker));if(!turns.length)return false;
    current=null;queue=turns.map(line=>({...line,conversationId:id}));waitingUntil=clock;
    openingPending=false;nextAmbientAt=Infinity;nextEventAt=clock+11000;return true;
  }
  function advance(ms){
    clock+=Math.max(0,Math.min(Number.isFinite(ms)?ms:0,100));
    if(current&&!isAvailable(current.speaker)){current=null;queue=[];nextAmbientAt=clock+between(14000,24000);}
    if(current&&clock>=current.until){
      current=null;
      waitingUntil=clock+650+(queue[0]?.pauseBeforeMs??0);
      if(!queue.length)nextAmbientAt=clock+between(18000,30000);
    }
    if(!current&&queue.length&&clock>=waitingUntil){
      const line=queue.shift();
      if(isAvailable(line.speaker))current={...line,startedAt:clock,until:clock+speechDuration(line.text)};
      else{queue=[];nextAmbientAt=clock+between(14000,24000);}
    }
    if(!current&&!queue.length&&clock>=nextAmbientAt){
      if(openingPending){
        if(!startConversation('intro'))nextAmbientAt=clock+250;
      }else if(!startConversation('ambient')){
        const candidates=['dasha','katya','dasha','katya','slavik'].filter(isAvailable);
        if(candidates.length){const speaker=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];nextEventAt=0;onEvent(speaker,'idle');}
        if(!queue.length)nextAmbientAt=clock+between(14000,24000);
      }
    }
    return current;
  }
  function reset(){clock=0;current=null;queue=[];waitingUntil=0;nextAmbientAt=1600;nextEventAt=0;lastConversation='';openingPending=true;lastLines.clear();}
  return {advance,onEvent,startConversation,playLines,reset,getCurrent:()=>current};
}
