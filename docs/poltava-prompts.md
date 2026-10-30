# Нічна Полтава — промпти

Використано вбудований image_gen, чотири окремі запити. Референс/основа для переробки: попередній `assets/halloween-background.webp`. Нові малюнки збережені окремо, оригінал лишився.

Кожний повний промпт — спільна частина плюс відповідний розділ нижче. Для far прозорість вимкнена; для middle, ground і landmarks увімкнена.

## Спільна частина

Use case: stylized-concept. Rework the attached game background as production artwork for the SAME hand-painted anime/2.5D Halloween adventure, now set in Poltava, Ukraine. Preserve its sophisticated painted outlines, rich midnight indigo/purple shadows, subtle violet mist, amber lantern light and orange autumn foliage. Not photorealistic, not pixel art. No people, no characters, no captions, no logos or watermark. Side-scrolling camera, straight horizontal horizon, level ground. Architecture must be Ukrainian Poltava, never medieval German timber houses, gothic castles, alpine mountains or Big Ben.

## Far

Output ONE wide landscape background tile, about 16:9. This is ONLY the farthest parallax layer: richly painted starlit indigo sky with wisps of violet clouds, faint amber haze at the horizon, very distant low silhouettes of Poltava houses and gentle wooded hills above the Vorskla valley confined to the bottom quarter. Most of the image is calm open night sky. Seamlessly repeatable left-to-right: left and right edges have matching values and horizon. NO moon or other large unique focal object, NO nearby trees, NO buildings in middle or foreground, NO street or paving. Fill the whole canvas with opaque artwork; keep bottom hazy indigo, not black.

## Middle

Output ONE wide 16:9 game layer on a genuinely TRANSPARENT background. All sky and the top 38 percent must be fully transparent. Only a continuous low Poltava city strip in the lower half: several modest one- and two-storey early-20th-century stucco/neoclassical houses, pale ochre walls, green/gray tiled roofs, warm windows, small front gardens and occasional autumn trees. Broad open gaps between groups of houses reveal transparent sky and a distant layer behind. Buildings stand on a common baseline at 78 percent canvas height, with only a narrow low ground/fog strip ending at 82 percent; everything below that is transparent too. Keep the buildings medium distant, not gigantic close-ups. No named landmarks here, no skyline spires, NO cobbled street in front, no large lamp posts in the foreground. Left and right edges align to repeat horizontally with inconspicuous open garden gaps. Must be a clean alpha cutout layer, not a checkerboard illustration.

## Ground

Output ONE wide 16:9 foreground ground tile on a genuinely TRANSPARENT background. Upper 66 percent of canvas is COMPLETELY empty alpha: no sky, no houses, no trees or tall objects. From y=66 percent down to bottom: a beautiful flat horizontal Poltava pedestrian promenade paved in irregular old gray-violet cobblestones, subtle warm lantern reflections, with sparse orange fallen leaves and a low stone edge at the very bottom. Character feet will contact the paving at y=84 percent. The entire walking strip must remain level and open across the image. A few SMALL glowing Halloween pumpkins may sit at the distant rear edge y=67–72 percent only, never tall enough to cover a walking character. Broad horizontal side-on composition, not a street vanishing into depth. Texture seamless on left and right edges, same paving and lighting at both edges. No stairs, no holes, no road markings, no perspective convergence. Alpha above the rear paving edge, opaque stone below. Not a full scene.

## Landmarks

Output ONE transparent game sprite atlas containing exactly FOUR separate Poltava landmark cutouts in a clean 2 by 2 grid of EQUAL rectangular cells. No grid lines and no text. Every object stays fully inside its own cell with at least 6 percent clear padding on each side; all objects share a baseline at 92 percent of their own cell height. No sky, no background rectangle. Top-left: Poltava Monument of Glory in Corpus Park, a tall dark green/bronze cylindrical column on a stepped granite pedestal crowned by a small golden eagle, with a couple of low orange shrubs. Top-right: the recognizable Poltava Local History Museum/former zemstvo by Vasyl Krychevskyi, broad pale ochre Ukrainian Art Nouveau building, asymmetrical steep terracotta and green tiled roofs, distinctive towers, ornate Ukrainian ceramic facade patterns, warm glowing windows. Bottom-left: Ivan Kotliarevskyi homestead, authentic low whitewashed Ukrainian house with thick straw-thatched sloping roof, small dark windows glowing amber, woven wattle fence and two small autumn orchard trees; not a tall manor. Bottom-right: the White Arbor/Bila Altanka on Ivanova Hill, an OPEN roofless horseshoe-shaped white neoclassical colonnade with exactly EIGHT white Doric columns supporting a shallow curved white entablature, a low white balustrade on a curved terrace; no dome and no gazebo roof. All four at a slightly elevated side-facing 3/4 view suitable for background scenery; consistent light direction and scale-independent painterly details. True transparent negative space around and inside the colonnade. No extra buildings.

## Реєстрація в грі

Фактичне розміщення об’єктів у згенерованому атласі відрізняється від рівної сітки. Тому гра використовує перевірені окремі прямокутники й точки основи з `metadata.json`, а не ділить зображення навпіл по висоті. Стиль пам’яток і маршрут ілюстративні.
