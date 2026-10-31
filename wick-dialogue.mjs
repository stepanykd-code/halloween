import {DIALOGUE_DATA} from './dialogue-data.mjs';
export function createWickDialogue(dialogue,{isAvailable=()=>true,random=Math.random}={}){
  const last=new Map();let cursor=0;
  function line(speaker,trigger){const key=speaker+'.'+trigger,all=DIALOGUE_DATA.lines.filter(l=>l.speaker===speaker&&l.trigger===trigger),fresh=all.filter(l=>l.id!==last.get(key)),pool=fresh.length?fresh:all;if(!pool.length)return null;const item=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];last.set(key,item.id);return item;}
  function hero(){const pool=['slavik','dasha','katya'].filter(isAvailable);return pool.length?pool[cursor++%pool.length]:null;}
  function say(lines,id,force=false){return dialogue.playLines(lines,{id:'wick-'+id,force,interruptAbilities:force});}
  function conversation(id,force=true){const c=DIALOGUE_DATA.conversations.find(c=>c.id===id);return c?say(c.turns,id,force):false;}
  function hintLine(next){if(!next)return null;const speaker=[next.character,'slavik','katya','dasha'].find(isAvailable);return speaker?line(speaker,'wick-next-'+next.character+'-'+next.slot):null;}
  function hint(next,force=false){if(next)return say([hintLine(next)],'hint',force);const speaker=hero();return speaker?say([line(speaker,'wick-hint')],'hint',force):false;}
  function handle(e){
    if(e.type==='intro')return conversation('wick-intro');
    if(e.type==='defeated')return conversation('wick-victory');
    if(e.type==='defeating')return say([line('wick','wick-defeating')],'defeating',true);
    if(e.type==='stage-cleared')return conversation('wick-stage-'+e.stage);
    if(e.type==='last-seal')return conversation('wick-last-seal');
    if(e.type==='taunt')return say([line('wick','wick-taunt')],'taunt');
    if(e.type==='finale')return say([line('wick','wick-finale')],'finale');
    if(e.type==='opening')return hint(e.next,true);
    if(e.type==='hint'||e.type==='missed')return hint(e.next);
    if(e.type==='attack'){const speaker=hero();return speaker?say([line(speaker,'wick-'+e.kind)],'attack'):false;}
    if(e.type==='correct')return say([line('wick','wick-correct'),line(e.character,'wick-correct'),hintLine(e.next)],'correct',true);
    if(e.type==='wrong')return say([line('wick','wick-wrong'),hintLine(e.next)],'wrong',true);
    if(e.type==='failed')return say([line(e.character,'wick-failed'),line('wick','wick-failed')],'failed',true);
    if(e.type==='hit')return say([line(e.character,'wick-failed')],'hit',true);
    if(e.type==='contact')return say([line('wick','wick-contact')],'contact');
    return false;
  }
  return {handle,hint,reset(){last.clear();cursor=0;}};
}
