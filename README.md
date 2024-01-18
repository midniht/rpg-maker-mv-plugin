# Miyoi's RPG Maker MV/MZ Plugins

依赖关系如下：
```goat
Miyoi's Plugins
 │
 ├─ MiP_Core_Library.js
 │  ├─ MiP_Addon_DialogueManager.js
 │  └─ MiP_Addon_PrisonManager.js
 │
 ├─ MiP_Common_BrandNewPluginTemplate.js
 └─ MiP_Common_CustomChineseFont.js
```

> 如果觉得每次都要输入「插件指令」很麻烦，建议善用「数据库」中的「公共事件」。

## Miyoi's Plugin - Core Library

> `MiP_Core_Library.js`\
> 系列自制插件的核心依赖库，包括静态的通用工具类 `MiyoiPlugins.Utility` & 一些极其常用和基础的功能。

- [x] 通过 _生效的 `事件`_（代表「角色」）的那一个 `事件页` 中 `出现条件` 设置的 `角色` 反向检索「角色 ID」
- [x] 队伍管理：通过「数据库」里「技能」和「状态」的联动实现「入队 / 离队」操作

**Plugin Command 插件指令**：

```
MiP_Party joinParty     # 令当前事件反向检索到的角色加入队伍
MiP_Party leaveParty    # 令当前事件反向检索到的角色离开队伍
```

### Miyoi's Plugin - Dialogue Manager

> `MiP_Addon_DialogueManager.js`\
> 依赖于 `MiP_Core_Library.js` 运行，必须先安装并启用该依赖插件。\
> 一个自制的对话管理器。

- [x] 通过「数据库」里「角色」的 _备注_（即 _note_；会自动解析 tag 到对应的 `meta` 属性里）实现快速自定义角色信息：
    - 角色专属颜色
    - 角色立绘图片信息
    - 角色固定台词
- [x] 通过「角色 ID」自动获取「自定义的角色信息」渲染立绘和对话后显示
- [ ] TODO: 渲染立绘图片附带后期（如色调等）处理

用例，「数据库」中某个「角色」的「备注」如下：
```
<textColor:23>
<image1:一般,0,0,0.1,50,50,255,0>
<image2:微笑,0,0,80,65,65,255,0>
<line1:因为我的歌声，就是我内心的呐喊！>
<line1_raw:だって、私の歌は心の叫びだから!>
```

使用「插件指令」`MiP_Dialogue say 一般 我是小闭灯。`，则实际上会显示图片：
- 文件名：`[角色名称]_一般`（来自「插件指令」的 `一般` 匹配到 `image1`）
- 原点：左上角（来自 `image1` 的 `0`）
- X 坐标：`0`（来自 `image1` 的 `0`）
- Y 坐标：`10% 游戏窗口当前高度`（来自 `image1` 的 `0.1`）
- 缩放的横向宽度：`50%`（来自 `image1` 的 `50`）
- 缩放的纵向高度：`50%`（来自 `image1` 的 `50`）
- 不透明度：`255`（来自 `image1` 的 `255`）
- 合成方式：`正常`（来自 `image1` 的 `0`）

并以「`[角色名称]`」的口吻（染色为 `23`，来自 `textColor`）说出 `我是小闭灯。`。

**Plugin Command 插件指令**：

```
MiP_Dialogue say [立绘差分] [自定义对话文本]    # 显示带立绘的角色对白
MiP_Dialogue clearImages                    # 清除当前存在的所有立绘
```

### Miyoi's Plugin - Prison Manager

> `MiP_Addon_PrisonManager.js`\
> 依赖于 `MiP_Core_Library.js` 运行，必须先安装并启用该依赖插件。\
> 一个自制的监牢管理器。

- [x] 通过「当前地图」里「事件」的 _备注_（即 _note_；会自动解析 tag 到对应的 `meta` 属性里）实现识别「作为角色」的事件
- [ ] TODO: 禁闭室相关

**Plugin Command 插件指令**：

```
MiP_Prison showCharacter                   # 当前地图是监牢场景，处理是否显示角色
MiP_Prison showPrisoner                    # 当前地图不是监牢场景，处理是否显示角色
MiP_Prison arrestCharacter                 # 将当前事件反向检索到的角色逮捕
MiP_Prison releaseCharacter                # 将当前事件反向检索到的角色释放
MiP_Prison lockdownCharacter [禁闭室编号]    # 将当前事件反向检索到的角色关禁闭 (1, 2, 3)
MiP_Prison punishCharacter                 # TODO
```

## Miyoi's Plugin - Brand New Plugin Template

> `MiP_Common_BrandNewPluginTemplate.js`\
> 一个新插件的示例模板，启用即可看到效果，内含所有类型的参数形式。

## Miyoi's Plugin - 自定义中文字体

> `MiP_Common_CustomChineseFont.js`\
> 自定义中文字体。
