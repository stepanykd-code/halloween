import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../',import.meta.url));
export async function assetFiles(){
  const code=await readFile(new URL('../game.mjs',import.meta.url),'utf8');
  return [...new Set([...code.matchAll(/['"]\.\/(assets\/[^'"]+)['"]/g)].map(match=>match[1]))].sort();
}
export const modules=["slavik-ability.mjs","girls-ability.mjs","ghost-hands.mjs","parallax.mjs","dialogue-data.mjs","dialogue.mjs","engine.mjs","spell-projectiles.mjs","pumpkin-boss-rig.mjs","pumpkin-boss.mjs","pumpkin-dialogue.mjs","boss-arena-party.mjs","boss-camera.mjs","egg-boss-rig.mjs","egg-boss.mjs","egg-dialogue.mjs","object-boss-animation.mjs","halushun-boss-rig.mjs","halushun-boss.mjs","halushun-dialogue.mjs","wick-boss-rig.mjs","wick-boss.mjs","wick-dialogue.mjs","screamer-rig.mjs","screamer.mjs","followers.mjs","phone-rig.mjs","controls.mjs","game.mjs"];
export async function siteFiles(){return ['index.html','style.css',...modules,'.nojekyll',...await assetFiles()];}
