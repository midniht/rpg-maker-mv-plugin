//=============================================================================
// MiP_Addon_PrisonManager.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - Prison Manager
 * v0.7.1
 *
 * @author 深宵(Miyoi)
 *
 * @help 监牢管理
 *
 * 插件指令：
 * MiP_Prison showCharacter                   # 当前地图是监牢场景，处理是否显示角色
 * MiP_Prison showPrisoner                    # 当前地图不是监牢场景，处理是否显示角色
 * MiP_Prison arrestCharacter                 # 将当前事件反向检索到的角色逮捕
 * MiP_Prison releaseCharacter                # 将当前事件反向检索到的角色释放
 * MiP_Prison lockdownCharacter [禁闭室编号]  # 将当前事件反向检索到的角色关禁闭 (1, 2, 3)
 * MiP_Prison punishCharacter                 # TODO
 *
 * @param 监牢
 * @type select
 * @option
 * @value
 * @default
 *
 * @param 「监禁中」状态
 * @parent 监牢
 * @desc 绑定表示「角色当前正处于监禁中」的「状态」。
 * @type state
 * @default
 *
 * @param 显示「监禁中」角色的独立开关
 * @parent 监牢
 * @desc 当前场景存在「监禁角色事件」时，生效的「事件页」中
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
 * @default B
 *
 * @param 监牢角色事件备注标记
 * @parent 监牢
 * @desc 当前场景存在「监牢角色事件」时，事件的「备注」标记。
 * （用例：在事件的「备注」中加入 <event:is_prisoner>。）
 * @type combo
 * @option is_prisoner
 * @default is_prisoner
 *
 * @param 禁闭室
 * @type select
 * @option
 * @value
 * @default
 *
 * @param 显示「禁闭中」角色的独立开关
 * @parent 禁闭室
 * @desc 当前场景存在「禁闭角色事件」时，生效的「事件页」中
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
 * @default C
 *
 * @param 禁闭室事件备注标记
 * @parent 禁闭室
 * @desc 当前场景存在「禁闭室事件」时，事件的「备注」标记。
 * （用例：在事件的「备注」中加入 <event:is_lockdown>。）
 * @type combo
 * @option is_lockdown
 * @default is_lockdown
 */

/**
 * @function 自动执行的业务逻辑放进匿名闭包
 * @description 内部代码运行在局部的作用域 防止内部变量污染到全局
 */
(() => {
  const old_SceneManager_onSceneStart = SceneManager.onSceneStart; // 临时保存之前的场景启动事件函数
  // 重载场景启动事件函数
  SceneManager.onSceneStart = function () {
    old_SceneManager_onSceneStart.call(this);
    if (!MiyoiPlugins) {
      throw new Error(
        [
          "MiP_Addon_PrisonManager 插件:",
          "必需的核心依赖库缺失",
          "请先启用核心依赖插件 MiP_Core_Library",
          "(或者关闭 / 卸载本插件)",
        ].join("<br>")
      );
    }
  };

  if (MiyoiPlugins) {
    (($) => {
      class PrisonManager extends MiyoiPlugins.AddonBase {
        /**
         * @function constructor
         * @description 构造函数
         * @param {*} config 传入的配置
         */
        constructor(config = {}) {
          super({
            name: "MiP_Addon_PrisonManager",
            version: "0.7.1",
          });
          this._config["imprison_state"] = Number(
            config["Imprison State"] || config["「监禁中」状态"]
          );
          this._config["prisoner_event_self_switch_choice"] =
            config["Prisoner Event Self Switch Choice"] ||
            config["显示「监禁中」角色的独立开关"];
          this._config["prisoner_event_note_tag"] =
            config["Prisoner Event Note Tag"] || config["监牢角色事件备注标记"];
          this._config["lockdown_event_self_switch_choice"] =
            config["Lockdown Event Self Switch Choice"] ||
            config["显示「禁闭中」角色的独立开关"];
          this._config["lockdown_event_note_tag"] =
            config["Lockdown Event Note Tag"] || config["禁闭室事件备注标记"];
          this._lockdownCells = {};
        }

        /**
         * @function canShowCharacter
         * @param {number} eventId
         * @param {boolean} atPrison
         * @returns
         */
        _canShowCharacter(eventId, atPrison) {
          const targetActor =
            MiyoiPlugins.Utility.getRelatedActorByEventId(eventId);
          const isPrisoner = targetActor
            .states()
            .map((state) => state.id)
            .includes(this._config["imprison_state"]);
          return !isPrisoner ^ atPrison;
        }

        /**
         * @function handleShowCharacter
         * @param {number} mapId
         * @param {number} eventId
         * @param {boolean} atPrison
         * @returns {boolean} 是否已启用独立开关
         */
        handleShowCharacter(mapId, eventId, atPrison = false) {
          if (this._canShowCharacter(eventId, atPrison)) {
            const effectiveSelfSwitchChoice = atPrison
              ? this._config["prisoner_event_self_switch_choice"]
              : MiyoiPlugins.getConfig("character_event_self_switch_choice");
            $gameSelfSwitches.setValue(
              [mapId, eventId, effectiveSelfSwitchChoice],
              true
            ); // 打开当前事件的独立开关让下一页生效
            return true;
          } else {
            $gameMap.eraseEvent(eventId); // 暂时消除事件 防止自动执行的事件陷入死循环
          }
          return false;
        }

        arrestCharacter(mapId, eventId) {
          MiyoiPlugins.Utility.getRelatedActorByEventId(eventId).addState(
            this._config["imprison_state"]
          ); // 附加监禁状态
          $gameSelfSwitches.setValue(
            [
              mapId,
              eventId,
              MiyoiPlugins.getConfig("character_event_self_switch_choice"),
            ],
            false
          ); // 关闭当前事件的独立开关让第一页的检测器生效
          this.debug(
            `捕获角色 关闭当前地图场景 ${$gameMap.displayName()}(ID:${mapId}) 的事件 ${
              MiyoiPlugins.Utility.getEventById(eventId).event().name
            }(ID:${eventId}) 的独立开关`,
            MiyoiPlugins.getConfig("character_event_self_switch_choice")
          );
          return true;
        }

        releaseCharacter(mapId, eventId) {
          MiyoiPlugins.Utility.getRelatedActorByEventId(eventId).eraseState(
            this._config["imprison_state"]
          ); // 解除监禁状态
          $gameSelfSwitches.setValue(
            [mapId, eventId, this._config["prisoner_event_self_switch_choice"]],
            false
          ); // 关闭当前事件的独立开关让第一页的检测器生效
          this.debug(
            `释放角色 关闭地图 ${mapId} 的事件 ${eventId} 的独立开关`,
            this._config["prisoner_event_self_switch_choice"]
          );
          return true;
        }

        lockdownCharacter(mapId, eventId, cellId) {
          // 旧人被顶替 清空数据
          if (this._lockdownCells[cellId]) {
            $gameSelfSwitches.setValue(
              [
                this._lockdownCells[cellId].mapIdOfActorEvent,
                this._lockdownCells[cellId].eventIdOfActorEvent,
                this._config["lockdown_event_self_switch_choice"],
              ],
              false
            ); // 关闭 禁闭室事件 的独立开关让当前 禁闭室 的事件页的检测器失效
            this._lockdownCells[cellId] = undefined;
          }

          // 更新新人
          const targetActor =
            MiyoiPlugins.Utility.getRelatedActorByEventId(eventId);
          this._lockdownCells[cellId] = {
            prisonerId: targetActor.actorId(),
            prisonerName: targetActor.name(),
            mapIdOfActorEvent: mapId,
            eventIdOfActorEvent: eventId,
          };
          $gameSelfSwitches.setValue(
            [
              this._lockdownCells[cellId].mapIdOfActorEvent,
              this._lockdownCells[cellId].eventIdOfActorEvent,
              this._config["lockdown_event_self_switch_choice"],
            ],
            true
          ); // 打开 角色事件 的独立开关让 禁闭室 那个事件页的检测器生效 即禁用囚犯原来的事件

          const lockdownCellEvent = $gameMap
            .events()
            .filter(
              (event) =>
                event.event().meta.event ===
                  this._config["lockdown_event_note_tag"] &&
                event.event().meta.cid === cellId
            )
            .pop();
          this.debug(`成功匹配到禁闭室 ${cellId} 事件`, lockdownCellEvent);
          $gameSelfSwitches.setValue(
            [
              lockdownCellEvent._mapId,
              lockdownCellEvent.eventId(),
              this._config["lockdown_event_self_switch_choice"],
            ],
            true
          ); // 打开 禁闭室事件 的独立开关让 禁闭室 那个事件页的检测器生效
          MiyoiPlugins.Utility.setCharacterEvent(
            targetActor.actorId(),
            lockdownCellEvent.eventId()
            // true,
            // MiyoiPlugins.Utility.getActiveEventPageIndexBySelfSwitchChoice(
            //   lockdownCellEvent.eventId(),
            //   this._config["lockdown_event_self_switch_choice"]
            // )
          ); // 让禁闭室事件更新为当前被关禁闭的角色图像

          return true;
        }

        punishCharacter() {
          this.log(
            "禁闭室当前状态",
            Object.values(this._lockdownCells).map((cell) => cell)
          );
          return false;
        }
      }

      const thisPluginParameters = PluginManager.parameters(
        "MiP_Addon_PrisonManager"
      ); // 加载本插件预设好的参数
      const thisPluginInstance = new PrisonManager(thisPluginParameters); // 实例化本插件定义好的功能类
      $.prisonManager = thisPluginInstance; // 挂载到全局窗口

      const old_Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded; // 临时保存之前的地图加载函数
      // 重载地图加载函数
      Scene_Map.prototype.onMapLoaded = function () {
        old_Scene_Map_onMapLoaded.call(this);
        // 刷新监禁中角色事件图像

        const newPrisonerEvents = $gameMap
          .events()
          .filter(
            (event) =>
              event.event().meta.plugin ===
                MiyoiPlugins.getConfig("plugin_meta_note_tag") &&
              event.event().meta.event ===
                thisPluginInstance._config["prisoner_event_note_tag"]
          ) // 所有囚犯角色事件
          .filter(
            (event) =>
              !$gameSelfSwitches.value(
                `${event._mapId},${event.eventId()},${
                  thisPluginInstance._config[
                    "lockdown_event_self_switch_choice"
                  ]
                }`
              )
          ); // 排除禁闭室中的角色
        const newPrisonerImages = MiyoiPlugins.Utility.setChosenCharacterEvents(
          newPrisonerEvents,
          thisPluginInstance._config["prisoner_event_self_switch_choice"]
        ); // 刷新囚犯角色事件的图像
        thisPluginInstance.debug(
          `场景地图已加载 onMapLoaded() ${$gameMap.displayName()} 已刷新囚徒图像:`,
          newPrisonerImages
        );
      };

      const old_Game_Interpreter_PluginCommand =
        Game_Interpreter.prototype.pluginCommand; // 临时保存之前的插件指令
      // 重载插件指令
      Game_Interpreter.prototype.pluginCommand = function (command, args) {
        old_Game_Interpreter_PluginCommand.call(this, command, args); // 继承之前的插件指令
        // 创建新的插件指令
        if (command === "MiP_Prison") {
          if (!args || args.length < 1)
            throw new RangeError(
              `${thisPluginInstance.addonName}: 插件命令的参数数量错误 ${args}`
            );
          switch (args[0]) {
            case "showCharacter":
              thisPluginInstance.handleShowCharacter(
                this._mapId,
                this.eventId()
              );
              break;
            case "showPrisoner":
              thisPluginInstance.handleShowCharacter(
                this._mapId,
                this.eventId(),
                true
              );
              break;
            case "arrestCharacter":
              thisPluginInstance.arrestCharacter(this._mapId, this.eventId());
              break;
            case "releaseCharacter":
              thisPluginInstance.releaseCharacter(this._mapId, this.eventId());
              break;
            case "lockdownCharacter":
              thisPluginInstance.lockdownCharacter(
                this._mapId,
                this.eventId(),
                args[1]
              );
              break;
            case "punishCharacter":
              thisPluginInstance.punishCharacter();
              break;
            default:
              thisPluginInstance.error("未定义的插件指令", args);
              break;
          }
        }
      };
    })(MiyoiPlugins.addons || (MiyoiPlugins.addons = {}));
  }
})();
