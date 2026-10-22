# v0.1.0 验证范围

已通过：

- Node 内置测试 5 项：配置与范围校验、配置持久化、CDP 回环限制、管理器写请求来源校验、无宿主时保持禁用、载荷构建。
- Headless Edge + Playwright：管理页配置同步到预览、原画/Q版、背景切换、断线提示。
- 模拟宿主 DOM：应用、点击互动、热重载不重复注入、保留聊天文字和未发送草稿、移除人物/样式并停止应用。
- 预览在 320 / 390 / 736 / 1024 宽度下无横向溢出。
- 技能 frontmatter 校验、Node 语法检查、Windows 启动器语法、发行 ZIP 清单。

未验证：用户真实 Codex 客户端中的界面覆盖、调试启动器实际启用、多窗口一致性、macOS/Linux 桌面宿主。没有为测试关闭或重启用户当前应用。

`npm test` 可重复运行核心测试。`docs/ci/validate.yml` 提供可选 GitHub Actions 模板；需要启用时复制到 `.github/workflows/validate.yml`。首版没有请求额外的 workflow 授权。
