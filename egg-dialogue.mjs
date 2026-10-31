import {DIALOGUE_DATA} from './dialogue-data.mjs';
export function createEggDialogue(dialogue,{isAvailable=()=>true,random=Math.random}={}){
  const last=new Map();let heroIndex=0,chatIndex=0;
  function line(speaker,trigger){
    const key=speaker+'.'+trigger,all=DIALOGUE_DATA.lines.filter(l=>l.speaker===speaker&&l.trigger===trigger),fresh=all.filter(l=>l.id!==last.get(key)),pool=fresh.length?fresh:all;
    if(!pool.length)return null;const item=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];last.set(key,item.id);return item;
  }
  function hero(){const options=['slavik','dasha','katya'].filter(isAvailable);return options.length?options[heroIndex++%options.length]:null;}
  function say(lines,id,force=false){return dialogue.playLines(lines,{id:'egg-'+id,force,interruptAbilities:force});}
  function conversation(id,force=true){const c=DIALOGUE_DATA.conversations.find(c=>c.id===id);return c?say(c.turns,id,force):false;}
  function hint(force=false){const speaker=hero();return speaker?say([line(speaker,'egg-hint')],'hint',force):false;}
  function handle(event){
    if(event.type==='intro')return conversation('egg-intro');
    if(event.type==='defeated')return conversation('egg-victory');
    if(event.type==='defeating')return say([line('egg','egg-defeating')],'defeating',true);
    if(event.type==='taunt')return say([line('egg','egg-taunt')],'taunt');
    if(event.type==='bluff')return say([line('egg','egg-bluff')],'bluff');
    if(event.type==='warning')return say([line('egg','egg-warning')],'warning');
    if(event.type==='opening'){const speaker=hero();return speaker?say([line(speaker,'egg-opening')],'opening'):false;}
    if(event.type==='hint'||event.type==='missed')return hint();
    if(event.type==='correct')return say([line('egg','egg-correct'),line(event.character,'egg-correct')],'correct',true);
    if(event.type==='reflected')return say([line('egg','egg-reflected'),line(event.character,'egg-reflected')],'reflected',true);
    if(event.type==='contact')return say([line('egg','egg-contact')],'contact');
    if(event.type==='wave-hit'||event.type==='reflection-hit')return say([line(event.character,'egg-hit')],'hit');
    return false;
  }
  return {handle,hint,strategy:()=>conversation('egg-strategy-'+(chatIndex++%3+1)),reset(){last.clear();heroIndex=0;chatIndex=0;}};
}
