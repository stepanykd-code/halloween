import {DIALOGUE_DATA} from './dialogue-data.mjs';
export function createPumpkinDialogue(dialogue,{isAvailable=()=>true,random=Math.random}={}){
  const last=new Map();
  function line(speaker,trigger){
    const key=speaker+'.'+trigger,all=DIALOGUE_DATA.lines.filter(l=>l.speaker===speaker&&l.trigger===trigger),fresh=all.filter(l=>l.id!==last.get(key)),pool=fresh.length?fresh:all;
    if(!pool.length)return null;const chosen=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];last.set(key,chosen.id);return chosen;
  }
  function hintLine(next){
    if(!next)return null;const speaker=[next.character,'slavik','katya','dasha'].find(isAvailable);
    return speaker?line(speaker,'boss-next-'+next.character+'-'+next.slot):null;
  }
  function conversation(id,force=true){const c=DIALOGUE_DATA.conversations.find(c=>c.id===id);return c?dialogue.playLines(c.turns,{id,force,interruptAbilities:force}):false;}
  function hint(next,force=false){
    return dialogue.playLines([hintLine(next)],{id:'boss-hint',force,interruptAbilities:force});
  }
  function handle(event){
    if(event.type==='intro')return conversation('boss-intro');
    if(event.type==='defeated')return conversation('boss-victory');
    if(event.type==='taunt')return dialogue.playLines([line('pumpkin','boss-taunt')],{id:'boss-taunt'});
    if(event.type==='hint')return hint(event.next);
    if(event.type==='contact')return dialogue.playLines([line('pumpkin','boss-contact')],{id:'boss-contact'});
    if(event.type==='defeating')return dialogue.playLines([line('pumpkin','boss-defeating')],{id:'boss-defeating',force:true,interruptAbilities:true});
    if(event.type==='correct'||event.type==='wrong')return dialogue.playLines([line('pumpkin','boss-'+event.type),line(event.character,'boss-'+event.type),hintLine(event.next)],{id:'boss-'+event.type,force:true,interruptAbilities:true});
    return false;
  }
  return {handle,hint,strategy:()=>conversation('boss-strategy'),reset(){last.clear();}};
}
