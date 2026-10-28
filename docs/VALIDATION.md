# v0.1.3 验证范围

已通过：

- Node 内置测试 6 项：配置与范围校验、配置持久化、CDP 回环限制、管理器写请求来源校验、无宿主时保持禁用、载荷构建，以及启动命令结束后服务仍运行、重复启动复用实例。
- Headless Edge + Playwright：管理页配置同步到预览、原画/Q版、背景切换、断线提示。
- 模拟宿主 DOM：应用、点击互动、热重载不重复注入、保留聊天文字和未发送草稿、移除人物/样式并停止应用。
- 工具入口浏览器回归：默认折叠、原生模型与停止按钮可点击、拖动不误展开、记住位置、方向键移动、Esc 与点击外部折叠、窄窗口/输入框增高时避让、热重载与恢复。
- 预览在 320 / 390 / 736 / 1024 宽度下无横向溢出。
- 技能 frontmatter 校验、Node 语法检查、Windows 启动器语法、发行 ZIP 清单。
- 当前 Windows 本机：setup 执行成功、固定运行目录、按需任务运行、无触发器、桌面快捷方式、健康状态 `service.mode=windows-task`。后台 Node 的父进程是该任务的 PowerShell，不属于当前 Codex 进程树。

本次真实 Codex 检查：两个已经启用主题的工作区通过素材哈希变化热更新到新渲染器；自己的 Shadow DOM 中入口宽度约 36px、设置默认折叠，有输入框的工作区入口在其上方。没有为测试关闭、重启或刷新用户应用，也没有点击真实停止生成控件。

未验证：所有原生弹窗/模型菜单的覆盖情况、跨窗口外观配置完全一致、macOS/Linux 桌面宿主。模型与停止按钮点击验证使用模拟宿主页面；实际用户交互仍需反馈。

`npm test` 可重复运行核心测试。安装 Playwright 且已安装 Edge 时可运行 `npm run test:toolbar`；也可以用环境变量 `MOON_GARDEN_PLAYWRIGHT` 指定已有 Playwright 模块的文件 URL。`docs/ci/validate.yml` 提供可选 GitHub Actions 模板；需要启用时复制到 `.github/workflows/validate.yml`。首版没有请求额外的 workflow 授权。
