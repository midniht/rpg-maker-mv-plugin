//=============================================================================
// MiP_Common_CustomChineseFont.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - 自定义中文字体
 * v0.9.0
 *
 * @author 深宵(Miyoi)
 *
 * @help 自定义中文字体
 *
 * 用以修复
 * 「即便在 gamefont.css 中正确配置好中文字体，但实际上也不会生效」
 * 的问题。
 *
 * 需要提前将字体文件放置在位于根目录的 /fonts/ 路径下，
 * 并在右边的参数栏中提供准确的字体文件名。
 *
 * 配置好后，直接启动游戏即可确认效果。
 * （标题界面的字体仍为默认字体是正常的，不是 bug。）
 * （因为标题界面的显示时机在本插件生效之前。）
 *
 * @param 指定字体文件
 * @desc 准确的字体文件名，形如 font.ttf
 * 注意指定的文件应该 **已经** 存在于 /fonts/ 目录下。
 * @type string
 * @default
 */

(function () {
  // 获取插件参数指定的字体文件名
  const CustomGameFontFile = PluginManager.parameters(
    "MiP_Common_CustomChineseFont"
  )["指定字体文件"];

  // 如果设置了该参数
  if (CustomGameFontFile) {
    // 注入 CSS: 新的字体样式
    const newFontStyleElement = document.createElement("style");
    newFontStyleElement.textContent = `@font-face {
  font-family: CustomGameFont;
  src: url("fonts/${CustomGameFontFile}");
}`;
    document.head.appendChild(newFontStyleElement);

    // 劫持获取默认字体的函数: 设置为新的自定义字体
    Window_Base.prototype.standardFontFace = function () {
      return "CustomGameFont, SimHei, Heiti TC, sans-serif";
    };

    console.debug(
      `MiP_Common_CustomChineseFont [自定义中文字体] 新的字体 ${CustomGameFontFile} 已应用`
    );
  }
})();
