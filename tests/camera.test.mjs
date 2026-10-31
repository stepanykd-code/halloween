import assert from 'node:assert/strict';
import {createBossCameraReturn,BOSS_CAMERA_RETURN_SECONDS} from '../boss-camera.mjs';
import {PUMPKIN_ENCOUNTER} from '../pumpkin-boss.mjs';
import {EGG_ENCOUNTER} from '../egg-boss.mjs';
import {HALUSHUN_ENCOUNTER} from '../halushun-boss.mjs';
import {WICK_ENCOUNTER} from '../wick-boss.mjs';
import {PUMPKIN_BOSS_ANIMATIONS} from '../pumpkin-boss-rig.mjs';
import {EGG_BOSS_ANIMATIONS} from '../egg-boss-rig.mjs';
import {OBJECT_BOSS_ANIMATIONS} from '../object-boss-animation.mjs';

for(const [encounter,animation] of [[PUMPKIN_ENCOUNTER,PUMPKIN_BOSS_ANIMATIONS],[EGG_ENCOUNTER,EGG_BOSS_ANIMATIONS],[HALUSHUN_ENCOUNTER,OBJECT_BOSS_ANIMATIONS],[WICK_ENCOUNTER,OBJECT_BOSS_ANIMATIONS]]){
  assert.equal(encounter.inactiveAt,animation.defeat.duration);
  for(const scale of [.5,1]){
    const camera=createBossCameraReturn(),arena={x:encounter.x-1200,y:-100,scale},hero={x:encounter.x-1800,y:120,scale:.75};
    for(let i=0;i<600;i++)assert.deepEqual(camera.update(arena,true,1/60),arena);
    assert.deepEqual(camera.update(hero,false,1/60),arena,'Unlock must not jump position or zoom');
    assert(camera.returning);
    let previous=arena;
    for(let i=0;i<Math.ceil(BOSS_CAMERA_RETURN_SECONDS*60)+1;i++){
      const view=camera.update(hero,false,1/60);
      assert(view.x<=previous.x&&view.x>=hero.x);
      assert(Math.abs(view.x-previous.x)<5,'Camera return should move gently');
      assert(Math.abs(view.scale-previous.scale)<.003);
      previous=view;
    }
    assert.deepEqual(previous,hero);assert(!camera.returning);
    const movingCamera=createBossCameraReturn();movingCamera.update(arena,true);movingCamera.update(hero,false);
    for(let i=0;i<240;i++){
      hero.x+=2;const view=movingCamera.update(hero,false,1/60);
      assert(Number.isFinite(view.x)&&view.scale>0);
    }
    assert.deepEqual(movingCamera.update(hero,false),hero,'Return follows the current active hero');
    camera.update(arena,true);camera.update(hero,false);camera.reset();
    assert.deepEqual(camera.update(hero,false),hero);assert(!camera.returning);
  }
}
console.log('Passed: all four bosses wait for full defeat; camera unlock starts without position/zoom jump, returns gently for 3.2 seconds, follows the current hero and resets cleanly.');
