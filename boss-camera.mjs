export const BOSS_CAMERA_RETURN_SECONDS=3.2;

// The arena owns the camera until defeat finishes. Blend the complete view
// back afterward, including the wider arena framing on narrow screens.
export function createBossCameraReturn(){
  let wasLocked=false,current=null,from=null,age=0;
  function reset(){wasLocked=false;current=null;from=null;age=0;}
  function update(target,locked,seconds=0){
    if(locked){wasLocked=true;from=null;age=0;return current={...target};}
    const released=wasLocked;
    if(released){from=current?{...current}:{...target};age=0;wasLocked=false;}
    if(!from)return current={...target};
    if(!released)age=Math.min(BOSS_CAMERA_RETURN_SECONDS,age+Math.max(0,Math.min(.05,seconds)));
    const t=age/BOSS_CAMERA_RETURN_SECONDS,blend=t*t*(3-2*t);
    current=Object.fromEntries(['x','y','scale'].map(key=>[key,from[key]+(target[key]-from[key])*blend]));
    if(age>=BOSS_CAMERA_RETURN_SECONDS)from=null;
    return {...current};
  }
  return {reset,update,get returning(){return from!==null;}};
}
