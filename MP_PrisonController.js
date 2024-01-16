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
 *   MP_PrisonControll joinParty             # 当前事件的角色加入队伍
 *   MP_PrisonControll leaveParty              # 当前事件的角色离开队伍
 *
 * @param 指定「队伍中」状态
 * @desc 绑定表示「角色当前正处于队伍中」的「状态」。
 * @type state
 * @default
 *
 * @param 世界角色事件后缀
 * @desc 位于世界中时，代表「角色」的事件名称后缀。
 * @type string
 * @default 的世界位置
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
      this._config["in_party_state"] = Number(
        config["in_party_state"] || config["指定「队伍中」状态"]
      );
      this._config["free_actor_event_suffix"] =
        config["free_actor_event_suffix"] || config["世界角色事件后缀"];
      this._config["imprison_state"] = Number(
        config["imprison_state"] || config["指定「监禁中」状态"]
      );
      this._config["prison_actor_event_suffix"] =
        config["prison_actor_event_suffix"] || config["监牢角色事件后缀"];

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
     * @function getActorNameFromEventNameByEventId
     * @param {number} eventId
     * @param {boolean} atPrison
     * @returns {string} actorName
     */
    getActorNameFromEventNameByEventId(eventId, atPrison = false) {
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
     * @function getActorIdFromEventNameByEventId
     * @param {number} eventId
     * @param {boolean} atPrison
     * @returns {number} actorId
     */
    getActorIdFromEventNameByEventId(eventId, atPrison = false) {
      return $dataActors
        .filter(
          (actor) =>
            actor &&
            actor.name ===
              this.getActorNameFromEventNameByEventId(eventId, atPrison)
        )
        .map((actor) => actor.id)
        .pop();
    }

    joinParty(gameInterpreter) {
      const actorId = this.getActorIdFromEventNameByEventId(
        gameInterpreter.eventId()
      );

      // 入队前附加状态
      $gameActors.actor(actorId).addState(this._config["in_party_state"]);

      // 执行入队操作
      $gameParty.addActor(actorId);

      // 可以换成 入队后附加状态 写法如下
      /*
      this.log(
        "入队后附加状态:",
        $gameActors.actor(actorId) ===
          $gameParty
            .members()
            .filter((actor) => actor.actorId() === actorId)
            .pop()
      );
      */

      return false;
    }

    leaveParty(gameInterpreter) {
      // TODO 离队前解除状态
      // this.log("离队时 公共事件:", gameInterpreter);
      // 难以在公共事件中获取到对应的 actorID (调用该公共事件的出处)
      // 因此在 离开队伍 技能中直接提前设置好状态 再调用公共事件
      // $gameActors.actor(actorID).eraseState(this._config["in_party_state"]);

      // 执行离队操作
      this.log(
        "当前队友的状态:",
        $gameParty.aliveMembers().map((actor) =>
          [
            actor.name(),
            actor
              .states()
              .map((state) => state.name)
              .join(", "),
          ].join(": ")
        )
      );
      $gameParty
        .members()
        .slice(1) // 排除主角
        .filter(
          (actor) =>
            !actor
              .states()
              .map((state) => state.id)
              .includes(this._config["in_party_state"])
        )
        .map((actor) => $gameParty.removeActor(actor.actorId()));

      return false;
    }

    arrestActor() {
      return false;
    }

    releaseActor() {
      return false;
    }

    /**
     * @function canShowCharacter
     * @param {number} eventId
     * @param {boolean} atPrison
     * @returns
     */
    canShowCharacter(eventId, atPrison = false) {
      const actorId = this.getActorIdFromEventNameByEventId(eventId, atPrison);
      if (!actorId) {
        throw new RangeError(
          `${this._prefix}: 试图通过事件名称 "${
            $gameMap.event(eventId).event().name
          }" 匹配角色数据失败 请确认当前地图场景的确${
            atPrison ? "" : "不"
          }是监牢(本事件执行的插件指令 handleShowCharacter 的参数)`
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
        /*
        console.log($gameMap.event(gameInterpreter.eventId()));
        $gameMap
          .event(gameInterpreter.eventId())
          .setImage(
            $gameMap
              .event(gameInterpreter.eventId())
              .event()
              .name.split("的")[0],
            0
          );
        */

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
        case "joinParty":
          thisPluginInstance.joinParty(this);
          break;
        case "leaveParty":
          thisPluginInstance.leaveParty(this);
          break;
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
          thisPluginInstance.log("未定义的插件指令", args);
          break;
      }
    }
  };
})();
