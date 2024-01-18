//=============================================================================
// MiP_Common_BrandNewPluginTemplate.js
//=============================================================================

/*:
 * @plugindesc 对插件的描述
 * v0.1.0
 *
 * @author 插件作者的名字
 *
 * @help 插件的帮助信息 - 应该如何使用该插件
 *
 * @param JS 原生支持的基础类型
 * @default
 *
 * @param 一个文本参数
 * @parent JS 原生支持的基础类型
 * @desc 这是一个文本参数，甲乙AB12。
 * @type string
 * @default 默认值
 *
 * @param 一个长文本参数
 * @parent JS 原生支持的基础类型
 * @desc 这是一个长文本参数，甲乙丙丁ABCD1234。
 * @type note
 * @default "默认值"
 *
 * @param 一个数值参数
 * @parent JS 原生支持的基础类型
 * @desc 这是一个数字参数，12345678。
 * @type number
 * @min 0
 * @max 100
 * @default 60
 *
 * @param 一个布尔值参数
 * @parent JS 原生支持的基础类型
 * @desc 这是一个布尔值参数，「启用/禁用」可以替换为其他的描述，如「开启/关闭」「男/女」。
 * @type boolean
 * @on 启用
 * @off 禁用
 * @default false
 *
 * @param RM 官方数据库游戏对象
 * @default
 *
 * @param 一个角色参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个角色参数。
 * @type actor
 * @default 1
 *
 * @param 一个职业参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个职业参数。
 * @type class
 * @default 1
 *
 * @param 一个技能参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个技能参数。
 * @type skill
 * @default 1
 *
 * @param 一个物品参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个物品参数。
 * @type item
 * @default 1
 *
 * @param 一个武器参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个武器参数。
 * @type weapon
 * @default 1
 *
 * @param 一个护甲参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个护甲参数。
 * @type armor
 * @default 1
 *
 * @param 一个敌人参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个敌人参数。
 * @type enemy
 * @default 1
 *
 * @param 一个敌群参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个敌群参数。
 * @type troop
 * @default 1
 *
 * @param 一个状态参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个状态参数。
 * @type state
 * @default 1
 *
 * @param 一个动画参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个动画参数。
 * @type animation
 * @default 1
 *
 * @param 一个图块参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个图块（即 tilemap）参数。
 * @type tileset
 * @default 1
 *
 * @param 一个公共事件参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个公共事件参数。
 * @type common_event
 * @default 1
 *
 * @param 一个变量参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个变量参数。
 * @type variable
 * @default 1
 *
 * @param 一个开关参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个开关参数。
 * @type switch
 * @default 1
 *
 * @param 一个文件参数
 * @parent RM 官方数据库游戏对象
 * @desc 这是一个文件参数。
 * @type file
 * @dir audio/se/
 * @default Cat
 *
 * @param RM 官方实现的数据结构
 * @default
 *
 * @param 一个选项参数
 * @parent RM 官方实现的数据结构
 * @desc 这是一个选项参数，n 选 1。
 * @type select
 * @option 选项 A
 * @value 已选中 A
 * @option 选项 B
 * @value 已选中 B
 * @option 选项 C
 * @value 已选中 C
 * @default 已选中 A
 *
 * @param 一个可编辑选项的参数
 * @parent RM 官方实现的数据结构
 * @desc 这是一个可编辑选项的参数。
 * @type combo
 * @option Arfthur
 * @option Barkley
 * @option Charles
 * @default Arfthur
 *
 * @param 一个数组参数
 * @parent RM 官方实现的数据结构
 * @desc 这是一个特定类型的数组。
 * @type number[]
 * @min 1
 * @max 255
 * @default []
 *
 * @param 一个对象参数
 * @parent RM 官方实现的数据结构
 * @desc 这是一个对象参数。
 * @type struct<objectName>
 */

/*~struct~objectName:
 * @param key1
 * @param key2
 * @param key3
 * @type number
 * @min 0
 * @max 100
 * @default 20
 */

/**
 * @class BrandNewPluginDemo
 * @description 本插件封装好的功能类
 */
class BrandNewPluginDemo {
  /**
   * @function now
   * @returns "YYYY-MM-DD HH:MM:SS" 格式的当前时间
   */
  now() {
    const p = (rawValue, targetLength = 2, padString = "0") => {
      return rawValue.toString().padStart(targetLength, padString);
    };
    const t = new Date();
    return [
      [t.getFullYear(), p(t.getMonth() + 1), p(t.getDate())].join("-"),
      [p(t.getHours()), p(t.getMinutes()), p(t.getSeconds())].join(":"),
    ].join(" ");
  }

  /**
   * @function log
   * @returns 打印本插件专用格式的 log
   */
  log(...args) {
    console.log(`${this.now()} [${this.pluginName}]`, ...args);
    return;
  }

  /**
   * @function 构造函数
   * @returns 当前类的实例
   */
  constructor(config = {}) {
    this.version = "0.1.0";
    this.pluginName = "一个新插件示例";

    // 加载参数
    const temp = Object.entries(config);
    this._config = {};
    for (let [key, value] of temp) {
      this._config[key] = value;
    }

    this.log(`插件实例化成功 当前版本 v${this.version}`);
  }

  /**
   * @function test
   * @returns 简单测试
   */
  test() {
    this.log(`当前配置为`, this._config);
    return "测试完成";
  }
}

/**
 * @function 自动执行的业务逻辑放进匿名闭包
 * @description 内部代码运行在局部的作用域 防止本插件内部的变量污染到全局
 */
(function () {
  const thisPluginParameters = PluginManager.parameters(
    "MiP_Common_BrandNewPluginTemplate"
  ); // 加载本插件预设好的参数
  const thisPluginInstance = new BrandNewPluginDemo(thisPluginParameters); // 实例化本插件定义好的功能类
  thisPluginInstance.test(); // 测试实例

  const old_Game_Interpreter_PluginCommand =
    Game_Interpreter.prototype.pluginCommand; // 临时保存之前的插件指令
  // 重载插件指令
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    old_Game_Interpreter_PluginCommand.call(this, command, args); // 继承之前的插件指令
    // 创建新的插件指令
    if (command === "console_log") {
      console.log(args);
    } else if (command === "alert") {
      alert(args);
    }
  };
})();
