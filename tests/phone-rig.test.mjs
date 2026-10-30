import assert from 'node:assert/strict';
import {phoneArmAngle,PHONE_RIGS} from '../phone-rig.mjs';
for(const [character,config] of Object.entries(PHONE_RIGS)){
for(const duration of [3000,4000,5000]){
  let previous=0;
  for(let time=0;time<=duration;time++){
    const returning=time>=duration-640;
    const angle=phoneArmAngle({character,phoneTime:time,phoneDuration:duration,phoneReturning:returning});
    assert(Number.isFinite(angle)&&angle>=0&&angle<=config.maxAngle);
    assert(Math.abs(angle-previous)<.001,'arm motion jumps between adjacent times');
    if(time<=1250||time>=duration-460)assert.equal(angle,0);
    previous=angle;
  }
}
const [cx,cy,cw,ch]=config.armCrop;
assert(cx>=0&&cy>=0&&cx+cw<=768&&cy+ch<=1024);
for(let i=0;i<=32;i++){
  const angle=config.baseAngle+config.maxAngle*i/32;
  for(const x of [cx,cx+cw])for(const y of [cy,cy+ch]){
    const dx=(x-config.armPivot[0])*config.scale*config.armScale,dy=(y-config.armPivot[1])*config.scale*config.armScale;
    const px=config.x+config.bodyPivot[0]*config.scale+Math.cos(angle)*dx-Math.sin(angle)*dy;
    const py=config.y+config.bodyPivot[1]*config.scale+Math.sin(angle)*dx+Math.cos(angle)*dy;
    assert(px>0&&px<384&&py>=145&&py<config.lowerStart,character+' arm enters the fixed head or legs');
  }
}
}
assert(phoneArmAngle({phoneTime:1725,phoneDuration:5000,phoneReturning:false})>.06,'missing swipe stroke');
console.log('Passed for all three characters: continuous elbow motion, fixed angle limits, stationary entry, smooth put-away for 3–5 second episodes; moving arms stay clear of fixed heads and legs.');
