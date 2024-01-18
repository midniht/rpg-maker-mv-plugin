//=============================================================================
// MiP_Core_Library.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - Core Library
 * v0.3.0
 *
 * @author 深宵(Miyoi)
 *
 * @help 核心依赖库
 *
 * 插件指令：
 * MiP_Party joinParty     # 令当前事件反向检索到的角色加入队伍
 * MiP_Party leaveParty    # 令当前事件反向检索到的角色离开队伍
 *
 * @param 插件专属备注标记
 * @desc MiP 插件（Miyoi's Plugins）专属的「备注」特征标记。
 * （用例：在各种「备注」中加入 <plugin:miyoidesu>。）
 * @type combo
 * @option miyoidesu
 * @default miyoidesu
 *
 * @param 队伍管理
 * @type select
 * @option
 * @value
 * @default
 *
 * @param 「队伍中」状态
 * @parent 队伍管理
 * @desc 绑定表示「角色当前正处于队伍中」的「状态」。
 * @type state
 * @default
 *
 * @param 「离开队伍」技能
 * @parent 队伍管理
 * @desc 绑定表示「离开队伍」的「（菜单画面使用场合）技能」。
 * @type skill
 * @default
 *
 * @param 角色登场
 * @type select
 * @option
 * @value
 * @default
 *
 * @param 显示角色的独立开关
 * @parent 角色登场
 * @desc 当前场景存在「角色事件」时，生效的「事件页」中
 * 「出现条件」设置的「独立开关」。
 * @type select
 * @option 独立开关 A
 * @value A
 * @option 独立开关 B
 * @value B
 * @option 独立开关 C
 * @value C
 * @option 独立开关 D
 * @value D
 * @default A
 *
 * @param 角色事件备注标记
 * @parent 角色登场
 * @desc 当前场景存在「角色事件」时，事件的「备注」标记。
 * （用例：在事件的「备注」中加入 <event:is_character>。）
 * @type combo
 * @option is_character
 * @default is_character
 */

window.MiyoiPlugins || (window.MiyoiPlugins = {}); // 初始化命名空间

/**
 * @class Utility
 * @description 静态工具类
 */
MiyoiPlugins.Utility = class {
  /**
   * @function now
   * @returns "YYYY-MM-DD HH:MM:SS" 格式的当前时间
   */
  static now() {
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
   * @function getAllActorStates
   * @description 获取所有角色的状态
   * @returns {string[]} 所有角色格式化后的当前状态
   */
  static getAllActorStates() {
    return $gameActors._data.map((actor) =>
      [
        actor.name(),
        actor
          .states()
          .map((state) => state.name)
          .join(", "),
      ].join(": ")
    );
  }

  /**
   * @function getPartyStates
   * @description 获取全队角色的状态
   * @returns {string[]} 全队角色格式化后的当前状态
   */
  static getPartyStates() {
    return $gameParty.allMembers().map((actor) =>
      [
        actor.name(),
        actor
          .states()
          .map((state) => state.name)
          .join(", "),
      ].join(": ")
    );
  }

  /**
   * @function getActorById
   * @description 通过角色 ID 检索角色对象
   * @param {number} actorId
   * @returns {object} 找到的角色对象
   */
  static getActorById(actorId) {
    const targetActor = $gameActors.actor(actorId);
    if (!targetActor) {
      console.error("当前所有角色数据", $gameActors);
      throw new RangeError(`没有找到 ID 为 ${actorId} 的角色数据`);
    }
    return targetActor;
  }

  /**
   * @function getActorByName
   * @description 通过角色名称检索角色对象
   * @param {string} actorName
   * @returns {object} 找到的角色对象
   */
  static getActorByName(actorName) {
    const targetActor = $dataActors
      .filter((actor) => actor && actor.name === actorName)
      .pop();
    if (!targetActor) {
      console.error("当前所有角色数据", $gameActors);
      throw new RangeError(`没有找到名称为 ${actorName} 的角色数据`);
    }
    return targetActor;
  }

  /**
   * @function getActorByAnyway
   * @description 通过角色特征检索角色对象
   * @param {number|string} actorMark
   * @returns {object} 找到的角色对象
   */
  static getActorByAnyway(actorMark) {
    let targetActor = undefined;
    if (typeof actorMark === "number") {
      targetActor = MiyoiPlugins.Utility.getActorById(actorMark);
    } else if (typeof actorMark === "string") {
      targetActor = MiyoiPlugins.Utility.getActorByName(actorMark);
    } else {
      throw new TypeError(
        `指定的角色参数 (${actorMark}) 类型错误 需要角色 ID 或角色名称`
      );
    }
    return targetActor;
  }

  /**
   * @function getRelatedActorIdByEventId
   * @description 通过事件 ID 反向检索相关（被出现条件标记）的角色 ID
   * @param {number} eventId
   * @returns {number} 相关的角色 ID
   */
  static getRelatedActorIdByEventId(eventId) {
    return $gameMap
      .event(eventId)
      .event()
      .pages.filter((page) => page.conditions.actorValid)
      .map((page) => page.conditions.actorId)
      .pop();
  }

  /**
   * @function getRelatedActorByEventId
   * @description 通过事件 ID 反向检索相关（被出现条件标记）的角色对象
   * @param {number} eventId
   * @returns {object} 相关的角色对象
   */
  static getRelatedActorByEventId(eventId) {
    return MiyoiPlugins.Utility.getActorById(
      MiyoiPlugins.Utility.getRelatedActorIdByEventId(eventId)
    );
  }

  /**
   * @function getEventById
   * @description 通过事件 ID 检索事件对象
   * @param {number} eventId
   * @returns {object} 找到的事件对象
   */
  static getEventById(eventId) {
    return $gameMap.event(eventId);
  }

  /**
   * @function getPluginEvents
   * @description 通过备注(note)解析到 meta 属性里的标记 检索本插件专属的事件
   * @returns {object[]} 标记了 交给本插件管理 的事件数组
   */
  static getPluginEvents() {
    return $gameMap
      .events()
      .filter(
        (event) =>
          event.event().meta.plugin ===
          MiyoiPlugins.getConfig("plugin_meta_note_tag")
      );
  }
};

/**
 * @class AddonBase
 * @description 子插件基类
 */
MiyoiPlugins.AddonBase = class {
  /**
   * @function constructor
   * @description 构造函数
   * @param {*} config 传入的配置
   */
  constructor({ name = "MiP_AddonBase", version = "0.1.0", ...config } = {}) {
    this.addonName = name;
    this.addonVersion = version;
    this._config = { ...config };
    this.info(`插件加载成功 当前版本 v${this.addonVersion}`);
  }

  /**
   * @function getLogPrefix
   * @description 生成 log 前缀
   * @returns {string} 时间 & 插件名前缀
   */
  getLogPrefix() {
    return `${MiyoiPlugins.Utility.now()} | ${this.addonName} |`;
  }

  /**
   * @function debug
   * @description 打印本插件专用格式的 debug
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  debug(...args) {
    console.debug(this.getLogPrefix() + " DEBUG |", ...args);
    return;
  }

  /**
   * @function log
   * @description 打印本插件专用格式的 log
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  log(...args) {
    console.log(this.getLogPrefix() + " TODO |", ...args);
    return;
  }

  /**
   * @function info
   * @description 打印本插件专用格式的 info
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  info(...args) {
    console.info(this.getLogPrefix() + " INFO |", ...args);
    return;
  }

  /**
   * @function warn
   * @description 打印本插件专用格式的 warn
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  warn(...args) {
    console.warn(this.getLogPrefix() + " WARN |", ...args);
    return;
  }

  /**
   * @function error
   * @description 打印本插件专用格式的 error
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  error(...args) {
    console.error(this.getLogPrefix() + " ERROR |", ...args);
    return;
  }

  /**
   * @function joinParty
   * @description 使当前事件反向检索到的角色加入队伍
   * @param {number} eventId
   * @returns {boolean} 操作执行结果
   */
  joinParty(eventId) {
    const targetActorId =
      MiyoiPlugins.Utility.getRelatedActorIdByEventId(eventId);
    MiyoiPlugins.Utility.getActorById(targetActorId).addState(
      MiyoiPlugins.getConfig("in_party_state")
    ); // 入队前附加状态
    $gameParty.addActor(targetActorId); // 执行入队操作

    // 可以换成 入队后附加状态 写法如下
    /*
    this.log(
      "入队后附加状态:",
      $gameActors.actor(targetActorId) ===
        $gameParty
          .members()
          .filter((actor) => actor.actorId() === targetActorId)
          .pop()
    );
    */

    return true;
  }

  /**
   * @function leaveParty
   * @description 使当前事件反向检索到的角色离开队伍
   * @returns {boolean} 操作执行结果
   */
  leaveParty() {
    $gameParty
      .members()
      .filter(
        (actor) =>
          actor.lastMenuSkill() &&
          actor.lastMenuSkill().id ===
            MiyoiPlugins.getConfig("leave_party_skill")
      ) // 遍历全队 筛选出所有上次使用的菜单技能是「离开队伍」的角色
      .map((actor) => {
        MiyoiPlugins.Utility.getActorById(actor.actorId()).eraseState(
          this._config["in_party_state"]
        ); // 离队前解除状态
        $gameParty.removeActor(actor.actorId()); // 执行离队操作
      });
    return true;
  }

  /**
   * @function test
   * @description 简单测试
   * @param  {...any} args 根据需要变化
   * @returns {*} 根据需要变化
   */
  test(...args) {
    if (args.length > 0) this.log("传入 test() 的参数为", args);
    this.log(`当前配置为`, this._config);
    return true;
  }
};

/**
 * @function 自动执行的业务逻辑放进匿名闭包
 * @description 内部代码运行在局部的作用域 防止内部变量污染到全局
 */
(($) => {
  const globalPluginParameters = PluginManager.parameters("MiP_Core_Library"); // 加载命名空间内的全局参数
  $.config = {
    plugin_meta_note_tag:
      globalPluginParameters["Plugins' Meta Note Tag"] ||
      globalPluginParameters["插件专属备注标记"],
    in_party_state: Number(
      globalPluginParameters["In Party State"] ||
        globalPluginParameters["「队伍中」状态"]
    ),
    leave_party_skill: Number(
      globalPluginParameters["Leave Party Skill"] ||
        globalPluginParameters["「离开队伍」技能"]
    ),
    character_event_self_switch:
      globalPluginParameters["Character Event Self Switch"] ||
      globalPluginParameters["显示角色的独立开关"],
    character_event_note_tag:
      globalPluginParameters["Character Event Note Tag"] ||
      globalPluginParameters["角色事件备注标记"],
  };

  const thisPluginInstance = new MiyoiPlugins.AddonBase();

  MiyoiPlugins.isReady = () => {
    return thisPluginInstance.test("a", 1, "b", 2, "c", 3);
  };

  const old_Game_Interpreter_PluginCommand =
    Game_Interpreter.prototype.pluginCommand; // 临时保存之前的插件指令
  // 重载插件指令
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    old_Game_Interpreter_PluginCommand.call(this, command, args); // 继承之前的插件指令
    // 创建新的插件指令
    if (command === "MiP_Party") {
      if (!args || args.length < 1)
        throw new RangeError(
          `${thisPluginInstance.addonName}: 插件命令的参数数量错误 ${args}`
        );
      switch (args[0]) {
        case "joinParty":
          thisPluginInstance.joinParty(this.eventId());
          break;
        case "leaveParty":
          thisPluginInstance.leaveParty();
          break;
        default:
          thisPluginInstance.error("未定义的插件指令", args);
          break;
      }
    }
  };

  const old_Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded; // 临时保存之前的地图加载函数
  // 重载地图加载函数
  Scene_Map.prototype.onMapLoaded = function () {
    old_Scene_Map_onMapLoaded.call(this);

    // 修改角色事件图像
    thisPluginInstance.log(
      `加载场景地图 ${$gameMap.displayName()} onMapLoaded()`,
      $gameMap
        .events()
        .filter(
          (event) =>
            event.event().meta.plugin === $.config["plugin_meta_note_tag"] &&
            event.event().meta.event === $.config["character_event_note_tag"] &&
            $gameSelfSwitches.value(
              `${event._mapId},${event.eventId()},${
                $.config["character_event_self_switch"]
              }`
            )
        )
        .map((event) => {
          const actor = MiyoiPlugins.Utility.getRelatedActorByEventId(
            event.eventId()
          );
          $gameMap
            .event(event.eventId())
            .setImage(actor.characterName(), actor.characterIndex());
          return [actor.name(), actor.characterName(), actor.characterIndex()];
        })
    );
  };
})(MiyoiPlugins._data || (MiyoiPlugins._data = {}));

MiyoiPlugins.getConfig = function (configName) {
  if (configName in this._data.config) {
    return this._data.config[configName];
  }
  return null;
};

// console.log(
//   "MiP_Core_Library 插件核心依赖库初始化",
//   MiyoiPlugins._data.isReady(),
//   MiyoiPlugins
// );
