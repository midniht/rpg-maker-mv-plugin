//=============================================================================
// MP_DialogueManager.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - Dialogue Manager
 * v0.3.0
 *
 * @author 深宵(Miyoi)
 *
 * @help
 *
 * 角色对话管理器
 *
 * Plugin Command:
 *   MP_Dialogue init             # 初始化插件（仅在游戏开始时执行一次）
 *   MP_Dialogue say 要说的话    # 弹出带立绘的角色对白
 */

/**
 * @function 自动执行的业务逻辑放进匿名闭包
 * @description 内部代码运行在局部的作用域 防止本插件内部的变量污染到全局
 */
(function () {
  /**
   * @class DialogueManager
   * @description 本插件封装好的功能类
   */
  class DialogueManager {
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
     * @description 打印本插件专用格式的 log
     * @param  {...any} args 打印的不定参数
     * @returns
     */
    log(...args) {
      console.log(`${this.now()} [${this._prefix}]`, ...args);
      return;
    }

    /**
     * @function 构造函数
     * @param {*} config 传入的配置
     */
    constructor(config = {}) {
      this.version = "0.3.0";
      this._prefix = "MP_DialogueManager";

      // 加载参数
      const temp = Object.entries(config);
      this._config = {};
      for (let [key, value] of temp) {
        this._config[key] = value;
      }

      this._characterData = {};

      this.log(`插件实例化成功 当前版本 v${this.version}`);
    }

    /**
     * @function test
     * @description 简单测试
     * @returns 根据需要变化
     */
    test() {
      this.log(`当前配置为`, this._config, this._chosenActors);
      return "测试完成";
    }

    loadCharacterData() {
      // TODO 读取游戏角色数据
      return true;
    }

    initPlugin() {
      this.loadCharacterData();
    }

    showCharacterPortrait(actor) {
      if (typeof actor === "string") {
        actor = Object.entries(this._characterData)
          .filter((k, v) => [k, v])
          .pop();
      } else if (typeof actor === "number") {
        actor = Object.entries(this._characterData)
          .filter((k, v) => [k, v])
          .pop();
      } else {
        throw new TypeError(
          `${thisPluginInstance._prefix}: 指定的角色参数 (${actor}) 类型错误 需要角色 ID 或角色名`
        );
      }
      console.warn("todo 从插件数据中获取绑定好的角色信息(立绘等)", actor);
      return false;
    }

    clearCharacterPortrait() {
      return false;
    }

    showDialogue(gameInterpreter, text = []) {
      text = text.length === 0 ? ["我是 %%%。"] : text;
      const actorName = $gameMap
        .event(gameInterpreter.eventId())
        .event()
        .name.split("的")[0];

      // 显示立绘
      this.showCharacterPortrait(actorName);

      // 显示台词
      const talkerName = `\\C[6]${actorName}\\C[0]`;
      $gameMessage.add(
        `\\}「${talkerName}」\\{\n${text.join(" ").replace(/%%%/g, talkerName)}`
      );

      // TODO 显示对话选项并进行对应处理

      // 清除立绘
      this.clearCharacterPortrait();

      return true;
    }
  }

  const thisPluginParameters = PluginManager.parameters("MP_DialogueManager"); // 加载本插件预设好的参数
  const thisPluginInstance = new DialogueManager(thisPluginParameters); // 实例化本插件定义好的功能类

  const oldPluginCommand = Game_Interpreter.prototype.pluginCommand; // 临时保存之前的插件指令
  // 重载插件指令
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    oldPluginCommand.call(this, command, args); // 继承之前的插件指令
    // 创建新的插件指令
    if (command === "MP_Dialogue") {
      if (!args || args.length < 1)
        throw new RangeError(
          `${thisPluginInstance._prefix}: 插件命令的参数错误 ${args}`
        );
      switch (args[0]) {
        case "init":
          thisPluginInstance.initPlugin();
          break;
        case "say":
          thisPluginInstance.showDialogue(this, [...args.slice(1)]);
          break;
        case "todo":
          break;
        default:
          thisPluginInstance.log("触发的插件指令参数", args);
          break;
      }
    }
  };
})();
