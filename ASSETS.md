# 素材记录

- `assets/background.webp`：使用内置 image_gen，参考用户提供的 GPT娘三视图配色生成；银白浮空建筑、淡紫云海、月环。
- `assets/portrait.webp`：根据用户提供的 `gpt娘.webp` 和三视图生成透明原画立绘。
- `assets/chibi.webp`：根据用户提供的 `GPT娘卡通版.jpg` 生成透明 Q版人物。
- `assets/icon.svg`：使用同一人物素材嵌入的插件缩略图。
- `docs/screenshots/*`：本项目本地预览截图。

本次发布由用户请求并授权。角色参考图的原始作者、来源及独立许可尚未在项目中核实；项目代码的 MIT 许可不代表授予角色、美术、标志或原始参考素材的权利。使用者可以替换为自己制作或有权使用的素材。项目不宣称拥有 OpenAI 标志或与 OpenAI 存在官方关系。

完整生成提示词见 [docs/generation-prompts.md](docs/generation-prompts.md)。原始参考文件、用户本地路径和聊天记录不随仓库上传。
## v0.2.0 的 3D 模型

原画与 Q 版 GLB 由用户提供并要求发布到自己的 GitHub，按 `models/manifest.json` 中的尺寸和 SHA-256 识别。模型作为 Release 资产分发，不放进源码 Git 历史，也不把代码 MIT 许可扩展到角色与模型素材。没有独立核实生成平台的条款或角色原始权利归属，后续使用需保留相应来源与许可记录。

运行时使用 Three.js 0.187.0（MIT），源码及 LICENSE 位于 `vendor/`。3D 解析、轨道旋转来自该库；静态模型没有新增骨骼或动画。
