# 生成提示词记录

使用内置 image_gen 生成。背景为不透明图，两个角色均请求真实透明背景；原始 PNG 保留在 assets/。

## Background

Reference: GPT娘三视图.webp

Use case: stylized-concept. Asset type: 16:9 wide desktop-app wallpaper, no text or interface. Reference image 1 is ONLY a color/style reference of a silver white lavender dragon girl, do not draw the character. Create her serene lunar observatory / floating crystalline sanctuary: pearl-white marble terraces, very subtle silver filigree reminiscent of dragon wings, pale lavender aurora, delicate distant spires, soft moonlit clouds and a circular celestial ring at the far right. Elegant anime environment painting with fine detail and restrained bloom, silver-white, icy lilac and muted blue slate palette. Left two thirds should be open misty negative space with quiet tonal variation suitable behind chat interface. Put architecture and the moon ring mainly on the right and outer edges. Center stays calm, no bright hard edges through center. No people, no pets, no logo, no letters. Wide landscape composition.

## Portrait

References: gpt娘.webp; GPT娘三视图.webp

Use case: background-extraction. Edit target: reference image 1, the full-body silver-white dragon girl illustration. Supporting identity reference: image 2 three-view character sheet. Remove ONLY the plain white backdrop and the floating blue cloud face and its motion lines. Produce one clean full-body standing cutout on real transparent alpha, preserving the exact silver white long hair, lavender eyes, two horns, pointed ears, lilac bat wings, curled scaled tail, white flowing high-collar dress, knots, ornaments, footwear and original illustrated proportions, expression and pose. Preserve all white fabric and highlights as opaque, do not erase white subject areas. Complete body, wing tips, hair, horn tips and hem visible with small transparent margin. No redesign, no additional objects, no background, no checkerboard.

## Chibi

Reference: GPT娘卡通版.jpg

Use case: background-extraction. Edit target: supplied image of chibi silver-haired dragon girl figurine standing on wooden desk. Isolate precisely the existing cute chibi figure as a full-body transparent cutout. Remove wooden desk, computer and all room background and cast floor shadow. Preserve the character's 3D chibi figurine rendering style, exact folded-arms pose, smiling expression, lavender eyes, silver-white hair and horns, lavender wings and scaled tail, white long dress and knot ornaments. Whole figure including horn tips, wing tips, tail, dress and feet fully visible. Keep white character material opaque and cleanly detailed. Transparent alpha background, no replacement background, no floor, no checkerboard.
