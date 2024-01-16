//=============================================================================
// MP_PartyController.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - Prison Controller
 * v0.5.0
 *
 * @author 深宵(Miyoi)
 *
 * @help
 * 监牢管理
 *
 * Plugin Command:
 *   MP_PrisonControll handleShowCharacter 1    # 当前场景是监牢，处理是否显示角色
 *   MP_PrisonControll handleShowCharacter 0    # 当前场景不是监牢，处理是否显示角色
 *
 * @param 指定「监禁中」状态
 * @desc 绑定表示「角色当前正处于监禁中」的「状态」。
 * @type state
 * @default
 *
 * @param 监牢角色事件后缀
 * @desc 位于监牢中时，代表「角色」的事件名称后缀。
 * @type string
 * @default 的监牢位置
 *
 * @param 世界角色事件后缀
 * @desc 位于世界中时，代表「角色」的事件名称后缀。
 * @type string
 * @default 的世界位置
 */

(function () {
  /**
   * @class PrisonController
   * @description 本插件封装好的功能类
   */
  class PrisonController {
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
      this.version = "0.5.0";
      this._prefix = "MP_PrisonController";

      // 加载参数
      this._config = {};
      this._config["imprison_state"] = Number(
        config["imprison_state"] || config["指定「监禁中」状态"]
      );
      this._config["prison_actor_event_suffix"] =
        config["prison_actor_event_suffix"] || config["监牢角色事件后缀"];
      this._config["free_actor_event_suffix"] =
        config["free_actor_event_suffix"] || config["世界角色事件后缀"];

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

    /**
     * @function getActorNameFromEventName
     * @param {number} eventId
     * @param {boolean} atPrison
     * @returns {string} actorName
     */
    getActorNameFromEventName(eventId, atPrison = false) {
      return $gameMap
        .event(eventId)
        .event()
        .name.split(
          atPrison
            ? this._config["prison_actor_event_suffix"]
            : this._config["free_actor_event_suffix"]
        )[0];
    }

    /**
     * @function getActorIdFromEventName
     * @param {number} eventId
     * @param {boolean} atPrison
     * @returns {number} actorId
     */
    getActorIdFromEventName(eventId, atPrison = false) {
      return $dataActors
        .filter(
          (actor) =>
            actor &&
            actor.name === this.getActorNameFromEventName(eventId, atPrison)
        )
        .map((actor) => actor.id)
        .pop();
    }

    /**
     * @function canShowCharacter
     * @param {number} eventId
     * @param {boolean} atPrison
     * @returns
     */
    canShowCharacter(eventId, atPrison = false) {
      const actorId = this.getActorIdFromEventName(eventId, atPrison);
      if (!actorId) {
        throw new RangeError(
          `${this._prefix}: 试图通过事件名称 ${
            $gameMap.event(eventId).event().name
          } 匹配角色数据失败`
        );
      }
      const actor = $gameActors.actor(actorId);
      if (!actor) {
        console.warn("当前所有角色数据", $gameActors);
        throw new ReferenceError(
          `${this._prefix}: 没有找到 ID 为 ${actorId} 的角色数据 (有可能是事件 ${eventId} 的名称没有正确按照插件参数设置好的格式命名)`
        );
      }
      const isImprison = actor._states.includes(this._config["imprison_state"]);
      return !isImprison ^ atPrison;
    }

    /**
     * @function handleShowCharacter
     * @param {*} gameInterpreter
     * @param {boolean} atPrison
     * @returns {boolean} 是否已启用独立开关 A
     */
    handleShowCharacter(gameInterpreter, atPrison = false) {
      if (this.canShowCharacter(gameInterpreter.eventId(), atPrison)) {
        $gameSelfSwitches.setValue(
          [gameInterpreter._mapId, gameInterpreter.eventId(), "A"],
          true
        ); // 打开当前事件的独立开关 A 让下一页生效

        /**
         * @todo 使用代码自动修改事件页绑定的图像
         */
        // console.log($gameMap.event(gameInterpreter.eventId()));
        // $gameMap
        //   .event(gameInterpreter.eventId())
        //   .setImage(
        //     $gameMap
        //       .event(gameInterpreter.eventId())
        //       .event()
        //       .name.split("的")[0],
        //     0
        //   );

        return true;
      } else {
        $gameMap.eraseEvent(gameInterpreter.eventId()); // 暂时消除事件 防止自动执行的事件陷入死循环
      }
      return false;
    }
  }

  const thisPluginParameters = PluginManager.parameters("MP_PrisonController"); // 加载本插件预设好的参数
  const thisPluginInstance = new PrisonController(thisPluginParameters); // 实例化本插件定义好的功能类

  const oldPluginCommand = Game_Interpreter.prototype.pluginCommand; // 临时保存之前的插件指令
  // 重载插件指令
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    oldPluginCommand.call(this, command, args); // 继承之前的插件指令
    // 创建新的插件指令
    if (command === "MP_PrisonControll") {
      if (!args || args.length < 1)
        throw new RangeError(
          `${thisPluginInstance._prefix}: 插件命令的参数错误 ${args}`
        );
      switch (args[0]) {
        case "canShowCharacter":
          thisPluginInstance.log("触发的插件指令参数", args);
          thisPluginInstance.log(
            "角色是否应该登场",
            thisPluginInstance.canShowCharacter(
              this.eventId(),
              Boolean(Number(args[1]))
            )
          );
          break;
        case "handleShowCharacter":
          thisPluginInstance.handleShowCharacter(
            this,
            Boolean(Number(args[1]))
          );
          break;
        default:
          thisPluginInstance.log("触发的插件指令参数", args);
          break;
      }
    }
  };
})();
