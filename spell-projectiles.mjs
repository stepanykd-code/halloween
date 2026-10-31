import {WORLD,CHARACTERS} from './engine.mjs';
import {SLAVIK_ABILITY} from './slavik-ability.mjs';
import {GIRLS_ABILITY} from './girls-ability.mjs';

export const SPELL_OPACITY=.5;
export const ABILITY_SPELLS=Object.freeze({
  slavik:Object.freeze({
    e:Object.freeze({id:'slavik-strength',name:'Сила',kind:'strength',width:300,speed:620,launchMs:1400,color:'#82dfff',accent:'#ffe4a2'}),
    r:Object.freeze({id:'slavik-calm',name:'Спокій',kind:'calm',width:290,speed:480,launchMs:1400,color:'#7cebdc',accent:'#d9fff3'})
  }),
  dasha:Object.freeze({
    e:Object.freeze({id:'dasha-pofih',name:'Пофіг',kind:'pofih',width:300,speed:440,launchMs:1400,color:'#c18aff',accent:'#e5ff9b'}),
    r:Object.freeze({id:'dasha-hatfu',name:'Ха-ть-фу',kind:'hatfu',width:320,speed:500,launchMs:1400,color:'#c18aff',accent:'#9effdf'})
  }),
  katya:Object.freeze({
    e:Object.freeze({id:'katya-claws',name:'Пазурі',kind:'claws',width:300,speed:680,launchMs:850,color:'#ff85ca',accent:'#ffdd85'}),
    r:Object.freeze({id:'katya-teeth',name:'Зуби',kind:'teeth',width:300,speed:610,launchMs:850,color:'#ff8abb',accent:'#ffe3a6'})
  })
});
export function abilitySpell(character,slot='e'){return ABILITY_SPELLS[character]?.[slot]??null;}
const spellTAU=Math.PI*2;
const spellSmooth=value=>{const v=Math.max(0,Math.min(1,value));return v*v*(3-2*v);};

export function spellOrigin(player){
  const circle=player.character==='slavik'?SLAVIK_ABILITY.circle:GIRLS_ABILITY[player.character].circle;
  const scale=.8*CHARACTERS[player.character].scale;
  return {x:player.x+player.facing*(circle[0]-192)*scale,y:WORLD.groundY+player.y+(circle[1]-480)*scale};
}

// The flight and all particles are functions of age, independent of frame rate.
// Text is never mirrored: only the flight direction and its trail change sides.
export function spellProjectilePose(projectile){
  const {spell,age:t,direction,origin}=projectile;
  const distance=spell.speed*t;
  let along=distance,y=0,rotation=0,pulse=1;
  switch(spell.kind){
    case 'strength':y=7*Math.sin(t*5);rotation=.018*Math.sin(t*7);pulse=1+.025*Math.sin(t*11);break;
    case 'calm':y=5*Math.sin(t*3.5);rotation=.012*Math.sin(t*3);pulse=1+.035*Math.sin(t*4);break;
    case 'pofih':along+=18*Math.sin(t*9);y=38*Math.sin(t*7.4)+13*Math.sin(t*16);rotation=.11*Math.sin(t*7.4);pulse=1+.045*Math.sin(t*12);break;
    case 'hatfu':along+=36*Math.sin(t*10);y=55*Math.sin(t*8)+15*Math.sin(t*17);rotation=.14*Math.sin(t*10);pulse=1+.055*Math.sin(t*15);break;
    case 'claws':{
      const arc=Math.min(1,distance/600);y=-70*Math.sin(Math.PI*arc);
      rotation=arc<1?direction*-.18*Math.cos(Math.PI*arc):0;pulse=1+.025*Math.sin(t*13);break;
    }
    case 'teeth':{
      const arc=Math.min(1,distance/570);y=55*Math.sin(Math.PI*arc);
      rotation=arc<1?direction*.16*Math.cos(Math.PI*arc):0;pulse=1+.035*Math.sin(t*10);break;
    }
  }
  const grow=.24+.76*spellSmooth(t/.2);
  return {x:origin.x+direction*along,y:origin.y+y,rotation,pulse:grow*pulse,appearance:spellSmooth(t/.07)};
}

export function createSpellProjectiles(){
  let projectiles=[],serial=0;
  const launched=new Map();
  function observe(players){
    for(const player of Object.values(players)){
      const spell=abilitySpell(player.character,player.abilitySlot);
      if(player.mode!=='ability'||!spell||!player.abilitySerial||player.abilityTime<spell.launchMs||launched.get(player.character)===player.abilitySerial)continue;
      launched.set(player.character,player.abilitySerial);
      projectiles.push({id:++serial,character:player.character,spell,direction:player.facing,origin:spellOrigin(player),age:Math.max(0,(player.abilityTime-spell.launchMs)/1000),width:spell.width*CHARACTERS[player.character].scale});
    }
  }
  function advance(seconds,view,onContact=()=>false){
    const dt=Math.max(0,Math.min(.05,Number.isFinite(seconds)?seconds:0));
    // Retain the whole emblem and its trailing particles until they leave the
    // visible screen. No invisible projectiles keep flying across the map.
    projectiles=projectiles.filter(projectile=>{
      const before=spellProjectilePose(projectile);projectile.age+=dt;
      const pose=spellProjectilePose(projectile),extent=projectile.width*.6+86;
      if(onContact(projectile,before,pose))return false;
      return projectile.age<12&&(projectile.direction>0?pose.x-extent<=view.x+view.width:pose.x+extent>=view.x);
    });
  }
  return {observe,advance,reset(){projectiles=[];launched.clear();serial=0;},get projectiles(){return projectiles;}};
}

export function createSpellProjectileRenderer(images){
  const layer=document.createElement('canvas');layer.width=960;layer.height=600;
  const c=layer.getContext('2d');
  function drawEffects(projectile,width,height,reducedMotion){
    const {spell,direction,age:t}=projectile,tail=-direction;
    const motion=reducedMotion?0:1;
    c.save();
    c.shadowColor=spell.color;c.shadowBlur=12;
    c.lineCap='round';c.lineJoin='round';
    if(spell.kind==='strength'){
      c.strokeStyle=spell.color;
      for(let i=0;i<5;i++){
        const flicker=.5+.5*Math.sin(t*15+i*2),y=(i-2)*height*.16;
        c.globalAlpha=.3+flicker*.4;c.lineWidth=i%2?1.5:3;
        c.beginPath();c.moveTo(tail*width*.18,y);c.lineTo(tail*(width*.53+30+22*flicker*motion),y+Math.sin(t*10+i)*5*motion);c.stroke();
      }
    }else if(spell.kind==='calm'){
      c.strokeStyle=spell.color;c.lineWidth=1.7;
      for(let i=0;i<3;i++){
        const phase=(t*.55+i/3)%1;c.globalAlpha=(1-phase)*.65;
        c.beginPath();c.ellipse(tail*width*.27,0,width*(.32+phase*.22),height*(.27+phase*.18),0,0,spellTAU);c.stroke();
      }
    }else if(spell.kind==='claws'||spell.kind==='teeth'){
      c.strokeStyle=spell.accent;
      const down=spell.kind==='claws'?-1:1;
      for(let i=0;i<(down<0?3:2);i++){
        const wave=Math.sin(t*9+i)*5*motion;c.globalAlpha=.5;c.lineWidth=2.5-i*.4;
        c.beginPath();c.moveTo(tail*width*.58,down*(height*.23+i*7));
        c.bezierCurveTo(tail*width*.24,down*(height*.55+wave),-tail*width*.12,down*(height*.52+wave),-tail*width*.34,down*height*.08);c.stroke();
      }
    }else{
      // Dasha leaves impudent bubbles or mint magic droplets in her wake.
      for(let i=0;i<8;i++){
        const phase=(t*(spell.kind==='hatfu'?1.15:.85)+i/8)%1;
        const x=tail*(width*.15+phase*(width*.4+38));
        const y=Math.sin(t*8+i*2.1)*height*.32*phase;
        c.globalAlpha=(1-phase)*.8;c.lineWidth=1.5;c.strokeStyle=i%2?spell.color:spell.accent;c.fillStyle=spell.accent;
        c.beginPath();c.ellipse(x,y,2.5+phase*6,spell.kind==='hatfu'?2.5+phase*3:2.5+phase*6,t+i,0,spellTAU);
        if(spell.kind==='hatfu')c.fill();else c.stroke();
      }
    }
    c.restore();
  }
  return {draw(context,projectiles,{reducedMotion=false}={}){
    for(const projectile of projectiles){
      const pose=spellProjectilePose(projectile),{spell,age:t}=projectile;
      const width=projectile.width,height=width*2/3;
      c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,layer.width,layer.height);
      c.setTransform(1.5,0,0,1.5,480,300);
      c.save();c.rotate(reducedMotion?0:pose.rotation);c.scale(pose.pulse,pose.pulse);
      drawEffects(projectile,width,height,reducedMotion);
      c.drawImage(images['spell-'+spell.id],-width/2,-height/2,width,height);
      c.save();c.shadowColor=spell.color;c.shadowBlur=8;
      // Small orbiting sparks animate the painting without deforming lettering.
      for(let i=0;i<6;i++){
        const angle=i*spellTAU/6+(reducedMotion?0:t*(spell.kind==='calm'?.65:1.8));
        const x=Math.cos(angle)*width*.41,y=Math.sin(angle)*height*.39;
        c.globalAlpha=.25+.5*(.5+.5*Math.sin(t*5+i));c.fillStyle=i%2?spell.color:spell.accent;
        c.beginPath();c.moveTo(x-3,y);c.lineTo(x,y-5);c.lineTo(x+3,y);c.lineTo(x,y+5);c.closePath();c.fill();
      }
      c.restore();c.restore();
      // Composite the entire effect ONCE at 50%, including overlapping glows,
      // symbols, text and particles. Mirrored travel never reverses the word.
      context.save();context.globalAlpha=SPELL_OPACITY*pose.appearance;
      context.drawImage(layer,pose.x-320,pose.y-200,640,400);context.restore();
    }
  },drawImpacts(context,impacts){
    for(const impact of impacts){
      const t=Math.min(1,impact.age/impact.duration),correct=impact.result==='correct',ease=spellSmooth(t);
      const offset=correct?0:-impact.direction*100*ease,y=correct?0:-35*Math.sin(t*Math.PI);
      c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,layer.width,layer.height);c.setTransform(1.5,0,0,1.5,480,300);
      c.save();c.translate(offset,y);c.rotate(correct?.08*Math.sin(t*8):impact.direction*t*.35);
      const scale=correct?(1+.16*Math.sin(Math.PI*Math.min(1,t*3)))*(1-ease*.9):1-.25*ease;
      c.scale(scale,scale);c.drawImage(images['spell-'+impact.spell.id],-impact.width/2,-impact.width/3,impact.width,impact.width*2/3);c.restore();
      c.strokeStyle=correct?'#b0ffbf':'#ff8495';c.fillStyle=correct?impact.spell.accent:'#ff8495';c.shadowColor=c.strokeStyle;c.shadowBlur=12;c.lineWidth=3;
      if(correct){
        for(let i=0;i<3;i++){const r=20+t*100+i*12;c.globalAlpha=(1-t)*(.8-i*.15);c.beginPath();c.ellipse(0,0,r*.45,r,0,t*3+i,t*3+i+Math.PI*1.6);c.stroke();}
        c.globalAlpha=1;for(let i=0;i<8;i++){const a=i*Math.PI/4+t*2,r=24+t*100;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+12),Math.sin(a)*(r+12));c.stroke();}
      }else{
        c.globalAlpha=1-t;c.beginPath();c.moveTo(-17,-20);c.lineTo(17,20);c.moveTo(17,-20);c.lineTo(-17,20);c.stroke();
        for(let i=0;i<7;i++){const a=i*spellTAU/7,r=20+t*85;c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);c.lineTo(Math.cos(a)*(r+10),Math.sin(a)*(r+10));c.stroke();}
      }
      c.globalAlpha=1;c.shadowBlur=0;
      context.save();context.globalAlpha=SPELL_OPACITY*(1-ease);context.drawImage(layer,impact.x-320,impact.y-200,640,400);context.restore();
    }
  }};
}
