export const SLAVIK_ABILITY=Object.freeze({duration:4.4,shoulder:[164,178],hand:[152,311],circle:[350,190],scale:1});
// The approved drawing poses are unchanged. Skip its long static hold and
// play the existing fade/arm return during the last 600 ms of the game cast.
export function abilityAnimationTime(time){
 const t=Math.max(0,Math.min(2,time));
 return t<=1.4?t:2.7+(t-1.4)/.6*1.7;
}
const abilitySmooth=t=>{t=Math.max(0,Math.min(1,t));return Math.max(0,Math.min(1,t*t*t*(t*(t*6-15)+10)));};
export function slavikAbilityPose(time){
 const t=((time%4.4)+4.4)%4.4;
 const reach=abilitySmooth((t-.35)/.75)*(1-abilitySmooth((t-3.1)/.8));
 return {angle:-Math.PI/2*reach,ring:abilitySmooth((t-1.05)/.35)*(1-abilitySmooth((t-2.7)/.4)),reach};
}
const abilityArmPolygon=[[158,155],[177,157],[187,177],[184,207],[178,232],[176,260],[173,286],[172,310],[168,327],[145,328],[134,320],[130,298],[124,282],[124,255],[126,230],[129,208],[133,186],[143,166]];
function abilityArmPath(c){c.moveTo(...abilityArmPolygon[0]);for(const p of abilityArmPolygon.slice(1))c.lineTo(...p);c.closePath();}
export function drawAbilityIndex(c,reach){
 const open=abilitySmooth((reach-.15)/.65),alpha=abilitySmooth((reach-.08)/.12);
 if(alpha<=0)return;
 const end=319+19*open;
 c.save();c.globalAlpha=alpha;
 const skin=c.createLinearGradient(158,0,166,0);skin.addColorStop(0,'#e9a77f');skin.addColorStop(.45,'#ffd0aa');skin.addColorStop(1,'#efb28b');
 c.fillStyle=skin;c.strokeStyle='#915c40';c.lineWidth=1.1;c.lineJoin='round';
 c.beginPath();c.moveTo(159,315);c.bezierCurveTo(158.5,321,159,end-5,159.8,end-1.8);c.bezierCurveTo(160.5,end+1.4,165.2,end+1.4,165.5,end-2);c.lineTo(165.7,318);c.quadraticCurveTo(164,315,159,315);c.closePath();c.fill();c.stroke();
 if(open>.5){c.strokeStyle='#c18a69';c.lineWidth=.6;c.beginPath();c.moveTo(160.3,327);c.lineTo(164.5,327);c.stroke();}
 c.restore();
}
export function createSlavikAbilityRig(image){
 function layer(){const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;return [canvas,canvas.getContext('2d')];}
 const [arm,a]=layer();a.beginPath();abilityArmPath(a);a.clip();a.drawImage(image,0,0,384,512,0,0,384,512);
 const [body,b]=layer();
 b.save();b.beginPath();abilityArmPath(b);b.clip();
 // Repair only the occluded area, using clean cloth at the SAME source Y.
 // The old upper donor crossed the black hood cord; the lower donor crossed
 // the pocket. Separate donors keep both details from repeating on the side.
 b.save();b.beginPath();b.moveTo(165,165);b.bezierCurveTo(151,179,149,198,149,215);b.bezierCurveTo(148,236,146,260,148,278);b.quadraticCurveTo(148,285,156,286);b.lineTo(189,286);b.lineTo(189,165);b.closePath();b.clip();
 b.drawImage(image,186,165,10,60,145,165,45,60);
 b.drawImage(image,197,225,11,62,145,225,45,62);
 const side=b.createLinearGradient(146,0,185,0);side.addColorStop(0,'rgba(5,26,43,.20)');side.addColorStop(.6,'rgba(5,26,43,.04)');side.addColorStop(1,'rgba(5,26,43,0)');b.fillStyle=side;b.fillRect(145,165,45,122);b.restore();
 // Follow the near leg instead of leaving the rectangular donor edge below
 // the coat. All pixels outside the original arm mask remain untouched.
 b.save();b.beginPath();b.moveTo(163,285);b.lineTo(184,285);b.lineTo(183,341);b.lineTo(159,341);b.bezierCurveTo(159,324,160,304,163,285);b.closePath();b.clip();
 // Match the actual adjacent trouser cloth row by row, rather than bringing
 // a lighter front-leg patch into the shaded side previously under the hand.
 const [cloth,cc]=layer();cc.drawImage(image,0,0,384,512,0,0,384,512);const pixels=cc.getImageData(0,0,384,512).data;
 for(let y=286;y<342;y++){
  const sample=x=>{const i=(y*384+x)*4;return [pixels[i],pixels[i+1],pixels[i+2]];};
  const near=sample(174),middle=sample(178),inside=sample(182);
  const shade=middle.map((v,i)=>Math.round((v+inside[i])*.46));
  const tone=b.createLinearGradient(159,0,176,0);tone.addColorStop(0,'rgb('+shade.join(',')+')');tone.addColorStop(1,'rgb('+near.join(',')+')');b.fillStyle=tone;b.fillRect(153,y,32,1);
 }
 b.restore();
 b.restore();
 b.save();b.beginPath();b.rect(0,0,384,512);abilityArmPath(b);b.clip('evenodd');b.drawImage(image,0,0,384,512,0,0,384,512);b.restore();
 // Continue just the existing pocket tip by five pixels; retain its upper
 // shape, position, the original arm outline and all animation timing.
 b.save();b.lineCap='butt';b.strokeStyle='#17242b';b.lineWidth=4;b.beginPath();b.moveTo(177,255);b.lineTo(174,260.5);b.stroke();b.strokeStyle='#4e5960';b.lineWidth=1.5;b.beginPath();b.moveTo(177,255);b.lineTo(174.4,259.8);b.stroke();b.restore();
 return {draw(c,time){const pose=slavikAbilityPose(time);if(pose.reach<1e-8)c.drawImage(image,0,0,384,512,0,0,384,512);else{c.drawImage(body,0,0);c.save();c.translate(...SLAVIK_ABILITY.shoulder);c.rotate(pose.angle);c.drawImage(arm,-SLAVIK_ABILITY.shoulder[0],-SLAVIK_ABILITY.shoulder[1]);c.translate(-SLAVIK_ABILITY.shoulder[0],-SLAVIK_ABILITY.shoulder[1]);drawAbilityIndex(c,pose.reach);c.restore();}return pose;}};
}
export function drawSlavikMagicCircle(c,time,opacity){
 if(opacity<=0)return;
 c.save();c.translate(...SLAVIK_ABILITY.circle);c.globalAlpha=opacity;c.scale(.32,1);
 c.shadowColor='#79dfff';c.shadowBlur=14;c.strokeStyle='#b8f3ff';c.lineWidth=2.5;
 for(const radius of [66,75]){c.beginPath();c.ellipse(0,0,radius,radius,0,0,Math.PI*2);c.stroke();}
 c.rotate(time*.3);c.lineWidth=1.4;
 for(let i=0;i<12;i++){const t=i*Math.PI/6;c.save();c.rotate(t);c.beginPath();c.moveTo(0,-67);c.lineTo(4,-59);c.lineTo(0,-53);c.lineTo(-4,-59);c.closePath();c.stroke();c.restore();}
 for(let i=0;i<2;i++){c.save();c.rotate(i*Math.PI);c.beginPath();for(let j=0;j<3;j++){const a=j*Math.PI*2/3;const x=Math.sin(a)*48,y=-Math.cos(a)*48;j?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.stroke();c.restore();}
 c.restore();
}
