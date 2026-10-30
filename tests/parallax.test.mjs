import assert from 'node:assert/strict';
import {WORLD,createState,step} from '../engine.mjs';
import {cameraLeft,parallaxTiles,landmarkPlacement,PARALLAX_LAYERS,POLTAVA_LANDMARKS,moonPlacement,landmarkBatPose,BATS_PER_LANDMARK} from '../parallax.mjs';
assert.equal(WORLD.screens,10);assert.equal(WORLD.width,WORLD.screenWidth*WORLD.screens);
assert.deepEqual(PARALLAX_LAYERS.map(l=>l.speed),[.14,.5,1]);
for(const view of [1200,1600]){
 assert.equal(cameraLeft(WORLD.minX,view,WORLD.width),0);
 assert.equal(cameraLeft(WORLD.maxX,view,WORLD.width),WORLD.width-view);
 for(let camera=0;camera<=WORLD.width-view;camera+=137){
  for(const {speed} of PARALLAX_LAYERS){
   const positions=parallaxTiles(camera,view,1672*900/941,speed);
   assert(positions[0]-camera<=0);assert(positions.at(-1)+1672*900/941-camera>=view);
   for(let i=1;i<positions.length;i++)assert(positions[i]-positions[i-1]<1672*900/941);
  }
 }
}
assert.equal(new Set(POLTAVA_LANDMARKS.map(p=>p.id)).size,4);
for(const landmark of POLTAVA_LANDMARKS){
 const {source,destination}=landmarkPlacement(landmark,1672,941);
 assert(source[0]>=0&&source[1]>=0&&source[0]+source[2]<=1672&&source[1]+source[3]<=941);
 // At a landmark's route coordinate, its center aligns with the camera center.
 const camera=landmark.worldX-800;
 assert.equal(destination[0]+destination[2]/2-camera*.5,800);
 assert(landmark.worldX>WORLD.minX&&landmark.worldX<WORLD.maxX);
}
const walker=createState();for(let i=0;i<1500;i++)step(walker,1,.05);
assert.equal(walker.x,WORLD.maxX);assert.equal(cameraLeft(walker.x,1600,WORLD.width),14400);
for(let i=0;i<1500;i++)step(walker,-1,.05);assert.equal(walker.x,WORLD.minX);
console.log('Passed: ten-screen map, three distinct parallax rates, continuous tile coverage, four separate registered landmarks, camera limits and full traversal in both directions.');
for(const view of [1200,1600])for(const cameraY of [0,160])for(let camera=0;camera<=14400;camera+=123){
 const moon=moonPlacement(camera,view,cameraY);
 assert(moon.x-camera>=0&&moon.x-camera+moon.size<=view);
 assert(moon.y>=cameraY&&moon.y+moon.size<=900);
}
assert.equal(BATS_PER_LANDMARK,7);
for(const place of POLTAVA_LANDMARKS){
 for(let time=0;time<120;time+=.5){
  const flock=Array.from({length:BATS_PER_LANDMARK},(_,i)=>landmarkBatPose(place,i,time,0));
  assert(Math.max(...flock.map(b=>b.x))-Math.min(...flock.map(b=>b.x))>220,'Flock collapsed into one point');
  for(let i=0;i<BATS_PER_LANDMARK;i++){
   const pose=flock[i],next=landmarkBatPose(place,i,time+1/60,0),shift=landmarkBatPose(place,i,time,1000);
   assert(Number.isFinite(pose.x)&&Number.isFinite(pose.y)&&pose.y>=30);
   assert(Math.abs(next.x-pose.x)<3&&Math.abs(next.y-pose.y)<3,'Bat teleported');
   assert(Math.abs(shift.x-pose.x-500)<1e-6,'Bat detached from landmark parallax');
   assert.deepEqual(landmarkBatPose(place,i,0,0,0,true),landmarkBatPose(place,i,time,0,0,true));
  }
 }
}
console.log('Passed: one visible moon throughout the map, seven independent smoothly moving bats over each of four landmarks, correct camera anchoring and reduced-motion poses.');
