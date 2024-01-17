//=============================================================================
// MP_PrisonController.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - Prison Controller
 * v0.7.0
 *
 * @author 深宵(Miyoi)
 *
 * @help
 * 监牢管理
 *
 * Plugin Command:
 *   MP_PrisonControll handleShowCharacter 1      # 当前场景是监牢，处理是否显示角色
 *   MP_PrisonControll handleShowCharacter 0      # 当前场景不是监牢，处理是否显示角色
 *   MP_PrisonControll joinParty                  # 当前事件的角色加入队伍
 *   MP_PrisonControll leaveParty                 # 当前事件的角色离开队伍
 *   MP_PrisonControll arrestActor                # 将当前事件的角色逮捕
 *   MP_PrisonControll releaseActor               # 将当前事件的角色释放
 *   MP_PrisonControll punishActor [禁闭室编号]  # 将当前事件的角色关禁闭 (1, 2, 3)
 *
 * @param 队伍管理
 * @default
 *
 * @param 指定「队伍中」状态
 * @parent 队伍管理
 * @desc 绑定表示「角色当前正处于队伍中」的「状态」。
 * @type state
 * @default
 *
 * @param 离队技能
 * @parent 队伍管理
 * @desc 绑定表示「离开队伍」的「技能」。
 * @type skill
 * @default
 *
 * @param 角色登场
 * @default
 *
 * @param 显示角色的独立开关
 * @parent 角色登场
 * @desc 当前场景显示角色时使用的独立开关。
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
 * @param 世界角色事件后缀
 * @parent 角色登场
 * @desc 位于世界中时，代表「角色」的事件名称后缀。
 * @type string
 * @default 的世界位置
 *
 * @param 指定「监禁中」状态
 * @parent 角色登场
 * @desc 绑定表示「角色当前正处于监禁中」的「状态」。
 * @type state
 * @default
 *
 * @param 监牢角色事件后缀
 * @parent 角色登场
 * @desc 角色位于监牢中时，代表「角色」的事件名称后缀。
 * @type string
 * @default 的监牢位置
 *
 * @param 禁闭室
 * @default
 *
 * @param 禁闭室的独立开关
 * @parent 禁闭室
 * @desc 监牢场景禁闭室使用的独立开关。
 * @type select
 * @option 独立开关 A
 * @value A
 * @option 独立开关 B
 * @value B
 * @option 独立开关 C
 * @value C
 * @option 独立开关 D
 * @value D
 * @default B
 *
 * @param 禁闭室事件前缀
 * @parent 禁闭室
 * @desc 角色位于禁闭室中时，代表「禁闭室」的事件名称前缀。
 * @type string
 * @default 禁闭室
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
      console.log(`${this.now()} [${this.pluginName}]`, ...args);
      return;
    }

    /**
     * @function 构造函数
     * @param {*} config 传入的配置
     */
    constructor(config = {}) {
      this.version = "0.7.0";
      this.pluginName = "MP_PrisonController";
      this._solitaryConfinementCells = {
        1: undefined,
        2: undefined,
        3: undefined,
      };

      // 加载参数
      this._config = {};
      this._config["in_party_state"] = Number(
        config["In Party State"] || config["指定「队伍中」状态"]
      );
      this._config["leave_party_skill"] = Number(
        config["Leave Party Skill"] || config["离队技能"]
      );
      this._config["character_self_switch"] =
        config["Character Self Switch"] || config["显示角色的独立开关"];
      this._config["free_actor_event_suffix"] =
        config["Free Actor Event Suffix"] || config["世界角色事件后缀"];
      this._config["imprison_state"] = Number(
        config["Imprison State"] || config["指定「监禁中」状态"]
      );
      this._config["prison_actor_event_suffix"] =
        config["Prison Actor Event Suffix"] || config["监牢角色事件后缀"];
      this._config["cell_self_switch"] =
        config["Cell Self Switch"] || config["禁闭室的独立开关"];
      this._config["solitary_confinement_event_prefix"] =
        config["Solitary Confinement Event Prefix"] || config["禁闭室事件前缀"];

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
     * @param {boolean} strictMode
     * @returns {string} actorName
     */
    getActorNameFromEventNameByEventId(
      eventId,
      atPrison = false,
      strictMode = false
    ) {
      const strictSeparator = atPrison
        ? this._config["prison_actor_event_suffix"]
        : this._config["free_actor_event_suffix"];
      const theEventName = $gameMap.event(eventId).event().name;
      return theEventName.split(strictMode ? strictSeparator : "的")[0];
    }

    /**
     * @function getActorIdFromEventNameByEventId
     * @param {number} eventId
     * @param {boolean} atPrison
     * @param {boolean} strictMode
     * @returns {number} actorId
     */
    getActorIdFromEventNameByEventId(
      eventId,
      atPrison = false,
      strictMode = false
    ) {
      const expectedActorName = this.getActorNameFromEventNameByEventId(
        eventId,
        atPrison,
        strictMode
      );
      const targetActorId = $dataActors
        .filter((actor) => actor && actor.name === expectedActorName)
        .map((actor) => actor.id)
        .pop();
      if (!targetActorId) {
        throw new RangeError(
          `${this._prefix}: 试图通过事件名称 "${
            $gameMap.event(eventId).event().name
          }" 匹配角色数据失败 请确认当前地图场景的确${
            atPrison ? "" : "不"
          }是监牢(本事件执行的插件指令 handleShowCharacter 的参数)`
        );
      }
      return targetActorId;
    }

    getPartyStates() {
      return $gameParty.aliveMembers().map((actor) =>
        [
          actor.name(),
          actor
            .states()
            .map((state) => state.name)
            .join(", "),
        ].join(": ")
      );
    }

    getAllActorStates() {
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

    joinParty(gameInterpreter) {
      const targetActorId = this.getActorIdFromEventNameByEventId(
        gameInterpreter.eventId()
      );
      $gameActors.actor(targetActorId).addState(this._config["in_party_state"]); // 入队前附加状态
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

    leaveParty() {
      $gameParty
        .members()
        .filter(
          (actor) =>
            actor.lastMenuSkill() &&
            actor.lastMenuSkill().id === this._config["leave_party_skill"]
        )
        .map((actor) => {
          $gameActors
            .actor(actor.actorId())
            .eraseState(this._config["in_party_state"]); // 离队前解除状态
          $gameParty.removeActor(actor.actorId()); // 执行离队操作
        });
      return true;
    }

    arrestActor(gameInterpreter) {
      const targetActorId = this.getActorIdFromEventNameByEventId(
        gameInterpreter.eventId()
      );
      $gameActors.actor(targetActorId).addState(this._config["imprison_state"]); // 附加监禁状态
      $gameSelfSwitches.setValue(
        [
          gameInterpreter._mapId,
          gameInterpreter.eventId(),
          this._config["character_self_switch"],
        ],
        false
      ); // 关闭当前事件的独立开关让第一页的检测器生效
      return true;
    }

    releaseActor(gameInterpreter) {
      const targetActorId = this.getActorIdFromEventNameByEventId(
        gameInterpreter.eventId()
      );
      $gameActors
        .actor(targetActorId)
        .eraseState(this._config["imprison_state"]); // 解除监禁状态
      $gameSelfSwitches.setValue(
        [
          gameInterpreter._mapId,
          gameInterpreter.eventId(),
          this._config["character_self_switch"],
        ],
        false
      ); // 关闭当前事件的独立开关让第一页的检测器生效
      return true;
    }

    punishActor(gameInterpreter, cellNumber) {
      const targetActorId = this.getActorIdFromEventNameByEventId(
        gameInterpreter.eventId()
      );
      const targetActor = $gameActors.actor(targetActorId);

      // 顶替旧人
      if (this._solitaryConfinementCells[cellNumber]) {
        $gameSelfSwitches.setValue(
          [
            this._solitaryConfinementCells[cellNumber].mapIdOfActorEvent,
            this._solitaryConfinementCells[cellNumber].eventIdOfActorEvent,
            this._config["cell_self_switch"],
          ],
          false
        );
        this._solitaryConfinementCells[cellNumber] = undefined;
      }

      this._solitaryConfinementCells[cellNumber] = {
        prisonerId: targetActor.actorId(),
        prisonerName: targetActor.name(),
        mapIdOfActorEvent: gameInterpreter._mapId,
        eventIdOfActorEvent: gameInterpreter.eventId(),
      };
      $gameSelfSwitches.setValue(
        [
          this._solitaryConfinementCells[cellNumber].mapIdOfActorEvent,
          this._solitaryConfinementCells[cellNumber].eventIdOfActorEvent,
          this._config["cell_self_switch"],
        ],
        true
      ); // 打开 角色事件 的独立开关让 禁闭室 那个事件页的检测器生效
      const targetCellEvent = $gameMap
        .events()
        .filter(
          (event) =>
            event.event().name ===
            `${this._config["solitary_confinement_event_prefix"]}${cellNumber}`
        )
        .pop();
      $gameSelfSwitches.setValue(
        [
          targetCellEvent._mapId,
          targetCellEvent.eventId(),
          this._config["cell_self_switch"],
        ],
        true
      ); // 打开 禁闭室事件 的独立开关让 禁闭室 那个事件页的检测器生效

      // 更新 禁闭室事件 的 角色事件页 的图像(行走图)
      // const characterEventPage = 1;
      // targetCellEvent.event().pages[characterEventPage].image.characterName =
      //   targetActor.characterName();
      // targetCellEvent.event().pages[characterEventPage].image.pattern = 1; // 默认第二帧
      this.log("debug 刷新事件之前", targetCellEvent._pageIndex);
      targetCellEvent.refresh();
      this.log("debug 刷新事件之后", targetCellEvent._pageIndex);
      targetCellEvent.setImage(targetActor.characterName(), 0);

      return false;
    }

    /**
     * @function canShowCharacter
     * @param {number} eventId
     * @param {boolean} atPrison
     * @returns
     */
    canShowCharacter(eventId, atPrison = false) {
      const targetActorId = this.getActorIdFromEventNameByEventId(
        eventId,
        atPrison,
        true
      );
      const targetActor = $gameActors.actor(targetActorId);
      if (!targetActor) {
        console.error("当前所有角色数据", $gameActors);
        throw new ReferenceError(
          `${this._prefix}: 没有找到 ID 为 ${targetActorId} 的角色数据 (有可能是事件 ${eventId} 的名称没有正确按照插件参数设置好的格式命名)`
        );
      }
      const isImprison = targetActor
        .states()
        .map((state) => state.id)
        .includes(this._config["imprison_state"]);
      return !isImprison ^ atPrison;
    }

    /**
     * @function handleShowCharacter
     * @param {*} gameInterpreter
     * @param {boolean} atPrison
     * @returns {boolean} 是否已启用独立开关
     */
    handleShowCharacter(gameInterpreter, atPrison = false) {
      if (this.canShowCharacter(gameInterpreter.eventId(), atPrison)) {
        $gameSelfSwitches.setValue(
          [
            gameInterpreter._mapId,
            gameInterpreter.eventId(),
            this._config["character_self_switch"],
          ],
          true
        ); // 打开当前事件的独立开关让下一页生效

        // 使用代码自动修改 事件页 绑定的图像(行走图)
        const targetActorEvent = $gameMap.event(gameInterpreter.eventId());
        const targetActor = $gameActors.actor(
          this.getActorIdFromEventNameByEventId(
            gameInterpreter.eventId(),
            atPrison,
            true
          )
        );
        const characterEventPage = 1;
        targetActorEvent.event().pages[characterEventPage].image.characterName =
          targetActor.characterName();
        targetActorEvent.event().pages[characterEventPage].image.pattern = 1; // 默认第二帧
        targetActorEvent.refresh();

        return true;
      } else {
        $gameMap.eraseEvent(gameInterpreter.eventId()); // 暂时消除事件 防止自动执行的事件陷入死循环
      }
      return false;
    }
  }

  const thisPluginParameters = PluginManager.parameters("MP_PrisonController"); // 加载本插件预设好的参数
  const thisPluginInstance = new PrisonController(thisPluginParameters); // 实例化本插件定义好的功能类

  const old_Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded; // 临时保存之前的地图加载函数
  // 重载地图加载函数
  Scene_Map.prototype.onMapLoaded = function () {
    old_Scene_Map_onMapLoaded.call(this);

    // 修改事件图像
    thisPluginInstance.log(
      "debug hook onMapLoaded() 函数",
      $gameMap.events().map((event) => event.event())
    );
    // $gameMap.event(eventId).setImage("图片文件名", 图像索引);
  };

  const old_Game_Interpreter_PluginCommand =
    Game_Interpreter.prototype.pluginCommand; // 临时保存之前的插件指令
  // 重载插件指令
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    old_Game_Interpreter_PluginCommand.call(this, command, args); // 继承之前的插件指令
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
          thisPluginInstance.leaveParty();
          break;
        case "arrestActor":
          thisPluginInstance.arrestActor(this);
          break;
        case "releaseActor":
          thisPluginInstance.releaseActor(this);
          break;
        case "punishActor":
          thisPluginInstance.punishActor(this, Number(args[1]));
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
