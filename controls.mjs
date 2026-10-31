// Each finger owns its own press. Releasing one never cancels another.
export function createTouchControls(buttons,{onActivity,onJump,onAbility=()=>{},onChange=()=>{}}){
  const held=new Map();
  const state=()=>{
    const actions=[...held.values()].map(value=>value.action);
    const left=actions.includes('left'),right=actions.includes('right');
    return {left,right,crouch:actions.includes('crouch'),axis:Number(right)-Number(left),active:held.size>0};
  };
  function update(){
    for(const [action,button] of Object.entries(buttons))button.classList.toggle('is-held',[...held.values()].some(value=>value.action===action));
    onChange(state());
  }
  function press(id,action,button){
    if(held.has(id)||button.disabled)return;
    held.set(id,{action,button});onActivity();update();
    if(action==='jump'||action==='forward')onJump(action);
    if(action==='ability'||action==='ability-secondary')onAbility(action==='ability'?'e':'r');
  }
  function release(id,button){if(held.get(id)?.button===button){held.delete(id);update();}}
  for(const [action,button] of Object.entries(buttons)){
    button.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      event.preventDefault();button.setPointerCapture(event.pointerId);
      press(event.pointerId,action,button);
    });
    for(const eventName of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(eventName,event=>release(event.pointerId,button));
    button.addEventListener('keydown',event=>{if(event.code==='Space'||event.code==='Enter'){event.preventDefault();press('keyboard:'+action,action,button);}});
    button.addEventListener('keyup',event=>{if(event.code==='Space'||event.code==='Enter'){event.preventDefault();release('keyboard:'+action,button);}});
    button.addEventListener('blur',()=>release('keyboard:'+action,button));
    button.addEventListener('contextmenu',event=>event.preventDefault());
    button.addEventListener('click',event=>{if(button.disabled)return;if(event.detail===0&&(action==='jump'||action==='forward')){onActivity();onJump(action);}else if(event.detail===0&&(action==='ability'||action==='ability-secondary')){onActivity();onAbility(action==='ability'?'e':'r');}});
  }
  return {getState:state,clear(){held.clear();update();}};
}
