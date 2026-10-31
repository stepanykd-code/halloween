import {DIALOGUE_DATA} from './dialogue-data.mjs';
export function createHalushunDialogue(dialogue,{isAvailable=()=>true,random=Math.random}={}){
  const last=new Map();let cursor=0,chat=0;
  function line(speaker,trigger){const key=speaker+'.'+trigger,all=DIALOGUE_DATA.lines.filter(l=>l.speaker===speaker&&l.trigger===trigger),fresh=all.filter(l=>l.id!==last.get(key)),pool=fresh.length?fresh:all;if(!pool.length)return null;const item=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];last.set(key,item.id);return item;}
  function hero(){const pool=['slavik','dasha','katya'].filter(isAvailable);return pool.length?pool[cursor++%pool.length]:null;}
  function say(lines,id,force=false){return dialogue.playLines(lines,{id:'halushun-'+id,force,interruptAbilities:force});}
  function conversation(id,force=true){const c=DIALOGUE_DATA.conversations.find(c=>c.id===id);return c?say(c.turns,id,force):false;}
  function hintLine(next){if(!next)return null;const speaker=[next.character,'slavik','katya','dasha'].find(isAvailable);return speaker?line(speaker,'halushun-next-'+next.character+'-'+next.slot):null;}
  function hint(next,force=false){return say([hintLine(next)],'hint',force);}
  function handle(e){
    if(e.type==='intro')return conversation('halushun-intro');
    if(e.type==='defeated')return conversation('halushun-victory');
    if(e.type==='defeating')return say([line('halushun','halushun-defeating')],'defeating',true);
    if(e.type==='hint')return hint(e.next);
    if(e.type==='chat')return conversation('halushun-chat-'+(chat++%3+1),false);
    if(e.type==='taunt'||e.type==='extra-fed'||e.type==='contact')return say([line('halushun','halushun-'+e.type)],e.type);
    if(e.type==='fed'){const speaker=hero();return say([speaker?line(speaker,'halushun-duck'):null,line('halushun','halushun-fed')],'fed',true);}
    if(e.type==='duplicate')return say([line('halushun','halushun-duplicate'),hintLine(e.next)],'duplicate',true);
    if(e.type==='success')return say([line('halushun','halushun-success'),line(e.character,'halushun-success'),hintLine(e.next)],'success',true);
    if(e.type==='failed')return say([line(e.character,'halushun-failed'),line('halushun','halushun-failed'),hintLine(e.next)],'failed',true);
    if(e.type==='steam-hit')return say([line(e.character,'halushun-hit')],'hit',true);
    return false;
  }
  return {handle,hint,duck(force=false){const speaker=hero();return speaker?say([line(speaker,'halushun-duck')],'duck',force):false;},reset(){last.clear();cursor=0;chat=0;}};
}
