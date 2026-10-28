# GPT娘 · 月白云庭：GitHub 插件市场安装与配置指南

适用版本：**0.1.2 及以后**。主要支持 Windows 上的 Codex / ChatGPT 桌面端。

> 安装插件、启动管理器、应用主题是三个不同步骤。看到插件已启用，不代表主题已经应用。请以第 5 步的成功判定为准。

## 1. 从插件市场安装

1. 打开 Codex 的插件目录/插件市场。
2. 添加 GitHub 来源：`https://github.com/SongMG110/gpt-moon-garden`。
3. 选择来源「GPT娘 · 月白云庭」，安装同名插件，并确认已启用。
4. 版本应为 **0.1.2 或更新**。已安装 0.1.0 的用户需要先刷新 GitHub 来源并更新/重新安装。
5. 如果当前聊天没有加载插件，新建一个聊天，再选择 `@GPT娘 · 月白云庭`。

如果用终端安装，等价命令为：

```powershell
codex plugin marketplace add SongMG110/gpt-moon-garden
codex plugin add gpt-moon-garden@moon-garden
```

仓库公开，不需要把 GitHub 密码或访问令牌提供给插件。GitHub 插件市场安装也不代表已上架 OpenAI 官方公共插件目录。

## 2. 让插件配置这台电脑

在聊天中选择 `@GPT娘 · 月白云庭`，发送：

> 请为我的 Windows 配置月白云庭：运行插件的 setup，安装固定运行器、启动管理器，并创建桌面启动快捷方式。不要关闭当前 Codex。

插件会执行自己的 `node scripts/setup.mjs`，使用 Node.js 22+；有需要时可使用 Codex 提供的 Node 运行时。无须安装 npm 依赖。

配置程序会：

- 把运行文件放到 `%LOCALAPPDATA%\GPTMoonGarden\app`，避免依赖带版本号的插件缓存目录。
- 注册当前用户的 Windows **按需任务** `GPTMoonGarden.Manager`，使管理器独立于聊天进程运行。
- 启动管理器并检查 `http://127.0.0.1:46321` 是否可访问。
- 在桌面创建 **GPT Moon Garden** 快捷方式。

它不要求管理员密码，不注册开机、登录或定时触发器，不结束 Codex，不修改官方安装文件。后续按需启动由这个任务承载。

配置成功应出现 `configured: true`，管理页可访问，桌面有快捷方式。此时 `hostConnected: false` 或 `applied: 0` 可以是正常现象：还未进行首次主题启用。

从 Releases 下载 ZIP 的用户：解压后双击 `Setup.cmd`，效果相同。

## 3. 首次真正启用主题

1. 先保存正在进行的工作。
2. 在 Codex 菜单使用 **文件 → 退出**，正常退出客户端。仅最小化、关掉侧栏浏览器或关掉一个窗口，不一定结束后台客户端。
3. 双击桌面的 **GPT Moon Garden** 快捷方式。**这次不要点原来的普通 Codex 图标。**
4. 启动器会确保管理器运行，在客户端尚未运行时启动 Codex，等待本机连接，并自动尝试应用。启动窗口会显示进度。
5. 最长等待约 90 秒。看到 `Theme applied to ... workspace(s)` 才表示该次应用成功；如果显示失败，请先阅读启动窗口中的具体原因。

这一过程使用本机 CDP 调试接口，默认地址为 `127.0.0.1:9335`。这是实现全局换肤所需的社区适配方式；官方插件安装本身不会替你开启这个接口。

启动器检测到 Codex 已经运行但没有接口时，会拒绝继续，提示正常退出，不会强行结束或重启它。

## 4. 选择外观

打开管理器：<http://127.0.0.1:46321/>。

| 设置 | 作用 |
|---|---|
| 原画立绘 / Q版伙伴 | 切换人物样式 |
| 月白云庭 / 暮紫星庭 | 切换明暗氛围 |
| 人物大小、背景浓度 | 调整人物占位和背景效果 |
| 显示人物、互动动效 | 控制人物显示和简单动效 |
| 应用到 Codex | 已有连接时手动应用 |
| 恢复默认 | 停用并移除本插件注入的外观 |

独立预览中的人物切换只影响演示。要改变真实 Codex，请使用管理器或真实界面的「✧」小圆入口（v0.1.4 起）。入口初始在右侧中部，默认收起；可以拖动并记住位置，也可以聚焦后用方向键微调。点击入口展开外观设置，点击外部、右上角 × 或按 Esc 即可折叠。入口及面板会避开输入框下方的模型与停止按钮区域。

## 5. 怎样确认配置真的完成

需要同时满足：

1. 管理页能够打开。
2. 真实 Codex 窗口出现背景/人物；不只是预览画面变化。
3. 打开 <http://127.0.0.1:46321/api/status>，状态包括：

```json
{
  "version": "0.1.2",
  "config": { "enabled": true },
  "status": { "connected": true, "applied": 1 },
  "service": { "mode": "windows-task" }
}
```

`applied` 大于等于 1 即可，实际 JSON 会包含更多字段。**管理页能开、插件显示已启用、或者 `configured: true`，都不能单独证明主题已应用。**

## 6. 以后怎么打开与更新

日常启动请用桌面的 **GPT Moon Garden** 快捷方式。用普通 Codex 图标启动时，可能没有本机接口，因而不能恢复全局主题。

更新 GitHub 来源后，更新插件，再告诉它：

> 请更新月白云庭的固定运行器，重新运行 setup；保留我的配置，不要重启 Codex。

终端更新来源可用：

```powershell
codex plugin marketplace upgrade moon-garden
codex plugin add gpt-moon-garden@moon-garden
```

运行器的固定位置与插件缓存是两份文件。**只更新插件缓存，不会自动替换已经配置到固定目录的运行器**；重新 setup 会复制新文件、重启本插件管理器并保留外观设置。外观素材和渲染样式支持热更新；宿主应用、技能清单和控制器代码升级不能一概承诺零重新加载。

## 7. 常见问题

| 现象 | 原因与处理 |
|---|---|
| 装了插件但界面没变化 | 按第 2、3 步配置运行器并从专用入口首次启用；插件安装不等于应用主题 |
| 管理页无法访问 | 让插件重新执行 setup。检查任务 `GPTMoonGarden.Manager` 是否运行；不需要重装 Codex |
| 管理页正常，但 `connected=false` | 当前 Codex 没有本机接口；正常退出后，从 GPT Moon Garden 快捷方式打开 |
| 启动器一直说应用仍在运行 | 使用“文件 → 退出”，并检查是否有其他 Codex 窗口；启动器不会替你结束后台进程 |
| 桌面没有快捷方式 | 可以运行 `%LOCALAPPDATA%\GPTMoonGarden\app\Enable.cmd`，或重新执行 setup |
| 插件市场仍是 0.1.0 | 刷新 `moon-garden` GitHub 来源，再更新/重新安装插件；必要时在新聊天加载 |
| Windows 任务注册被拒绝 | 把具体错误交给维护者或管理员；不要关闭防护或修改执行策略。可先使用前台管理器，并保留其控制台窗口 |
| 能连接，但 `applied=0` | 可能是当前 Codex 版本的界面/调试适配尚不兼容。保留状态和错误报告，不要把预览当成应用成功 |
| 恢复后再次出现 | 确认管理器中已停用；不要再次运行启用快捷方式 |

日志位置：

```text
%LOCALAPPDATA%\GPTMoonGarden\controller.log
%LOCALAPPDATA%\GPTMoonGarden\controller-error.log
```

反馈时提供插件版本、Codex 版本、`/api/status` 的状态和错误文字即可。不要发送账号令牌、密码或聊天正文。

## 8. 恢复与卸载

先在管理器点“恢复默认”。它只移除本插件自己的样式、人物层和监听器，不删除聊天、登录信息或模型配置。

卸载插件后，如不再需要固定运行器，可在 Windows 任务计划程序中停止并删除 **GPTMoonGarden.Manager**，删除桌面 **GPT Moon Garden** 快捷方式。保留 `%LOCALAPPDATA%\GPTMoonGarden` 可以保留个人设置；不要误删其他目录。

本地调试接口只应在可信本机环境使用，不要向公网或局域网开放。真实客户端兼容性仍为实验性质。

## 相关链接

- 项目与问题反馈：<https://github.com/SongMG110/gpt-moon-garden>
- 发行包：<https://github.com/SongMG110/gpt-moon-garden/releases>
- OpenAI 官方插件打包与 GitHub 市场说明：<https://developers.openai.com/plugins/build/plugins>
- OpenAI 官方插件命令说明：<https://learn.chatgpt.com/docs/developer-commands>

本指南中的 Windows 固定运行器与按需任务是月白云庭自身的实现，不是 OpenAI 官方插件通用要求。
