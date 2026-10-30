import assert from 'node:assert/strict';
import {createTouchControls} from '../controls.mjs';
import {createState,requestTouchJump,step,WORLD,CHARACTERS} from '../engine.mjs';
class Button extends EventTarget{
  held=false;captures=[];
  classList={toggle:(_name,value)=>{this.held=!!value;}};
  setPointerCapture(id){this.captures.push(id);}
  emit(type,data={}){const event=new Event(type,{cancelable:true});Object.assign(event,{button:0,detail:1,...data});this.dispatchEvent(event);return event;}
}
const buttons=Object.fromEntries(['left','right','crouch','jump','forward'].map(action=>[action,new Button()]));
let player=createState(),activity=0,jumpCalls=0,controls;
controls=createTouchControls(buttons,{onActivity:()=>activity++,onJump:action=>{jumpCalls++;requestTouchJump(player,action,controls.getState().axis);}});
buttons.left.emit('pointerdown',{pointerId:10,isPrimary:true});
const second=buttons.forward.emit('pointerdown',{pointerId:11,isPrimary:false});
assert(second.defaultPrevented);assert.equal(player.jumpVelocity,-WORLD.airSpeed);assert(player.airborne);
buttons.forward.emit('pointerup',{pointerId:11});
assert(buttons.left.held);assert.equal(controls.getState().axis,-1);
buttons.left.emit('pointercancel',{pointerId:10});assert(!controls.getState().active);
assert.equal(jumpCalls,1);buttons.forward.emit('click',{detail:1});assert.equal(jumpCalls,1);
for(const character of Object.keys(CHARACTERS))for(const direction of [-1,1]){
  controls.clear();player=createState(character);player.x=800;player.facing=direction;
  buttons.forward.emit('pointerdown',{pointerId:20,isPrimary:false});buttons.forward.emit('pointerup',{pointerId:20});
  assert.equal(player.jumpVelocity,direction*WORLD.airSpeed);
  const start=player.x;while(player.airborne)step(player,0,1/120);
  assert((player.x-start)*direction>390,'one button does not jump forward from rest');
  controls.clear();player=createState(character);
  buttons.right.emit('pointerdown',{pointerId:30});buttons.jump.emit('pointerdown',{pointerId:31,isPrimary:false});
  buttons.jump.emit('pointerup',{pointerId:31});const x=player.x;
  while(player.airborne){step(player,controls.getState().axis,1/120);assert.equal(player.x,x,'in-place jump drifts while direction is held');}
  assert.equal(player.jumpInPlace,false);step(player,1,.05);assert(player.x>x);
  buttons.right.emit('lostpointercapture',{pointerId:30});assert(!controls.getState().active);
}
controls.clear();player=createState();
buttons.right.emit('pointerdown',{pointerId:40});buttons.crouch.emit('pointerdown',{pointerId:41,isPrimary:false});
buttons.right.emit('pointerup',{pointerId:40});assert(controls.getState().crouch);assert.equal(controls.getState().axis,0);
controls.clear();assert(!buttons.crouch.held);assert(!controls.getState().active);
const before=jumpCalls;
buttons.jump.emit('keydown',{code:'Space'});buttons.jump.emit('keydown',{code:'Space',repeat:true});
assert.equal(jumpCalls,before+1);buttons.jump.emit('keyup',{code:'Space'});assert(!controls.getState().active);
assert(activity>0);
console.log('Passed: simultaneous non-primary touches, independent release/cancellation, one-press forward jumps in either facing, locked in-place jumps while direction is held, crouch+move, keyboard repeat and clear on blur/switch.');
