//=============================================================================
// MP_DialogueManager.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - Dialogue Manager
 * v0.3.1
 *
 * @author 深宵(Miyoi)
 *
 * @help
 *
 * 角色对话管理器
 *
 * Plugin Command:
 *   MP_Dialogue init                     # 初始化插件（仅在开始时执行一次）
 *   MP_Dialogue say [立绘差分] [台词]  # 弹出带立绘的角色对白
 *   MP_Dialogue clearImages              # 清除存在的所有立绘
 *
 * @param 立绘图片文件名前缀
 * @desc 指定立绘图片文件名的统一前缀（如果有的话）。
 * @type string
 * @default
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
      this.version = "0.3.1";
      this._prefix = "MP_DialogueManager";
      this._characterData = {}; // 游戏角色数据
      this._imageIdOffset = 77; // 图片 ID 偏移量 防止和其他图片冲突
      this._imageCursor = this._imageIdOffset; // 图片 ID 只能在 1 - 100 以内

      // 加载参数
      this._config = {};
      this._config["portrait_prefix"] =
        config["Portrait File Prefix"] || config["立绘图片文件名前缀"];

      this.log(`插件实例化成功 当前版本 v${this.version}`);
    }

    /**
     * @function test
     * @description 简单测试
     * @returns 根据需要变化
     */
    test() {
      this.log(`当前配置为`, this._config);
      return "测试完成";
    }

    loadCharacterData() {
      $dataActors.map((actor) => {
        if (actor) {
          this._characterData[actor.id] = {
            id: actor.id, // 角色 ID
            name: actor.name, // 角色名称
            nickname: actor.nickname, // 角色昵称
            classId: actor.classId, // 职业 ID
            profile: actor.profile, // 简介
            faceName: actor.faceName, // 脸图文件名
            faceIndex: actor.faceIndex, // 脸图序号
            characterName: actor.characterName, // 行走图文件名
            characterIndex: actor.characterIndex, // 行走图序号
            traits: {}, // 特性 (暂未使用)
            note: actor.note, // 备注
            images: {}, // 立绘
          };
        }
      });
      return true;
    }

    initPlugin() {
      this.loadCharacterData();
      this.log("插件初始化成功 读取到角色数据", this._characterData);
    }

    getCharacterData(actor) {
      if (typeof actor === "string") {
        actor = Object.entries(this._characterData)
          .filter((actorData, _) => actorData[1].name === actor)
          .pop()[1];
      } else if (typeof actor === "number") {
        actor = Object.entries(this._characterData)
          .filter((actorData, _) => actorData[1].id === actor)
          .pop()[1];
      } else {
        throw new TypeError(
          `${thisPluginInstance._prefix}: 指定的角色参数 (${actor}) 类型错误 需要角色 ID 或角色名`
        );
      }
      return actor;
    }

    showCharacterPortrait(characterData, portraitSuffix = "") {
      this.log(portraitSuffix);
      const pictureFileName = [
        this._config["portrait_prefix"],
        characterData.name,
        portraitSuffix,
      ]
        .filter((str) => typeof str === "string" && str !== "")
        .join("_");
      this._imageCursor += 1;
      $gameScreen.showPicture(
        this._imageCursor, // 图片编号 (ID)
        pictureFileName, // 图像文件名 (不含扩展名)
        0, // 原点: 0(左上), 1(中心)
        0, // 直接指定坐标的 X (单位为像素 px)
        Graphics.boxWidth / 10, // 直接指定坐标的 Y (单位为像素 px)
        50, // 缩放率的横向宽度 (单位百分比)
        50, // 缩放率的纵向高度 (单位百分比)
        255, // 合成方式的不透明度 (0 - 255)
        0 // 合成方式: 0(正常), 1(叠加), 2(正片叠底), 3(滤色)
      );
      return true;
    }

    clearCharacterPortrait() {
      for (; this._imageCursor > this._imageIdOffset; this._imageCursor--) {
        $gameScreen.erasePicture(this._imageCursor);
      }
      return true;
    }

    showDialogue(gameInterpreter, ...args) {
      const currentActor = this.getCharacterData(
        $gameMap.event(gameInterpreter.eventId()).event().name.split("的")[0]
      );

      // 显示立绘
      this.log("显示立绘", args);
      this.showCharacterPortrait(currentActor, args[0]);

      // 显示台词
      const inputText = args.length <= 1 ? ["我是 %%%。"] : [...args.slice(1)];
      const speakerName = `\\C[6]${currentActor.name}\\C[0]`;
      const parsedText = inputText.join(" ").replace(/%%%/g, speakerName);
      $gameMessage.add(`\\}「${speakerName}」\\{\n${parsedText}`);

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
          thisPluginInstance.showDialogue(this, ...args.slice(1));
          break;
        case "clearImages":
          thisPluginInstance.clearCharacterPortrait();
          break;
        default:
          thisPluginInstance.log("触发的插件指令参数", args);
          break;
      }
    }
  };
})();
