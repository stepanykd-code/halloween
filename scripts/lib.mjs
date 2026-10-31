import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../',import.meta.url));
export async function assetFiles(){
  const code=await readFile(new URL('../game.mjs',import.meta.url),'utf8');
  return [...new Set([...code.matchAll(/['"]\.\/(assets\/[^'"]+)['"]/g)].map(match=>match[1]))].sort();
}
export const modules=['dialogue-data.mjs','dialogue.mjs','engine.mjs','phone-rig.mjs','controls.mjs','parallax.mjs','ghost-hands.mjs','followers.mjs','screamer-rig.mjs','screamer.mjs','slavik-ability.mjs','girls-ability.mjs','spell-projectiles.mjs','pumpkin-boss-rig.mjs','pumpkin-boss.mjs','pumpkin-dialogue.mjs','boss-arena-party.mjs','game.mjs'];
export async function siteFiles(){return ['index.html','style.css',...modules,'.nojekyll',...await assetFiles()];}
