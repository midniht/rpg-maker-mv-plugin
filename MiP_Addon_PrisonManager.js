//=============================================================================
// MiP_Addon_PrisonManager.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - Prison Manager
 * v0.7.6
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
 * @param 「切换监禁状态」技能
 * @parent 监牢
 * @desc 绑定表示「切换监禁状态」的「（菜单画面使用场合）技能」。
 * @type skill
 * @default
 *
 * @param 「切换监禁状态」物品
 * @parent 监牢
 * @desc 绑定表示「切换监禁状态」的「（菜单画面使用场合）物品」。
 * @type item
 * @default
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
        ].join("<br>"),
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
            name: "MiP PrisonManager",
            version: "0.7.6",
          });
          this._config.imprison_state = Number(
            config["Imprison State"] || config["「监禁中」状态"],
          );
          this._config.prisoner_event_self_switch_choice =
            config["Prisoner Event Self Switch Choice"] ||
            config["显示「监禁中」角色的独立开关"];
          this._config.prisoner_event_note_tag =
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            config["Prisoner Event Note Tag"] || config["监牢角色事件备注标记"];
          this._config.switch_prison_skill = Number(
            config["Switch Prison Skill"] || config["「切换监禁状态」技能"],
          );
          this._config.switch_prison_item = Number(
            config["Switch Prison Item"] || config["「切换监禁状态」物品"],
          );
          this._config.lockdown_event_self_switch_choice =
            config["Lockdown Event Self Switch Choice"] ||
            config["显示「禁闭中」角色的独立开关"];
          this._config.lockdown_event_note_tag =
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            config["Lockdown Event Note Tag"] || config["禁闭室事件备注标记"];
          // this._prisoners = {};
          this._lockdownCells = {};
        }

        /**
         * @function _isPrisoner
         * @param {number} eventId
         * @returns
         */
        _isPrisoner(eventId) {
          const isPrisoner = MiyoiPlugins.Utility.getRelatedActorByEventId(
            eventId,
          )
            .states()
            .map((state) => state.id)
            .includes(this._config.imprison_state);
          return isPrisoner;
        }

        arrestCharacter(mapId, eventId) {
          MiyoiPlugins.Utility.getRelatedActorByEventId(eventId).addState(
            this._config.imprison_state,
          ); // 附加监禁状态
          $gameSelfSwitches.setValue(
            [mapId, eventId, this._config.prisoner_event_self_switch_choice],
            true,
          ); // 打开 *进行囚禁* 的 <一般角色事件> 的独立开关 to 禁用该事件
          this.debug(
            `捕获角色 关闭当前地图场景 ${$dataMap.displayName}(ID:${mapId}) 的事件 ${
              MiyoiPlugins.Utility.getEventById(eventId).event().name
            }(ID:${eventId}) 的独立开关`,
            this._config.prisoner_event_self_switch_choice,
          );
          return true;
        }

        releaseCharacter(mapId, eventId) {
          MiyoiPlugins.Utility.getRelatedActorByEventId(eventId).eraseState(
            this._config.imprison_state,
          ); // 解除监禁状态
          $gameSelfSwitches.setValue(
            [mapId, eventId, this._config.prisoner_event_self_switch_choice],
            false,
          ); // 关闭 *解除囚禁* 的 <囚徒角色事件> 的独立开关 to 禁用该事件
          this.debug(
            `释放角色 关闭地图 ${mapId} 的事件 ${eventId} 的独立开关`,
            this._config.prisoner_event_self_switch_choice,
          );
          return true;
        }

        _clearLockdown(cellId) {
          if (this._lockdownCells[cellId]) {
            const lockdownCellEvent = MiyoiPlugins.Utility.getPluginEvents()
              .filter(
                (event) =>
                  event.event().meta.event ===
                    thisPluginInstance._config.lockdown_event_note_tag &&
                  event.event().meta.cid === cellId,
              )
              .pop();
            $gameSelfSwitches.setValue(
              [
                lockdownCellEvent._mapId,
                lockdownCellEvent.eventId(),
                this._config.lockdown_event_self_switch_choice,
              ],
              false,
            ); // 关闭 *解除禁闭并重新成为囚徒* 的 <禁闭角色事件> 的独立开关 to 禁用该事件
            $gameSelfSwitches.setValue(
              [
                this._lockdownCells[cellId].mapIdOfActorEvent,
                this._lockdownCells[cellId].eventIdOfActorEvent,
                this._config.lockdown_event_self_switch_choice,
              ],
              false,
            ); // 关闭 *解除禁闭并重新成为囚徒* 的 <囚徒角色事件> 的独立开关 to 启用该事件
            this._lockdownCells[cellId] = undefined; // 清空禁闭室数据
            return true;
          }
          return false;
        }

        lockdownCharacter(mapId, eventId, cellId) {
          // 旧人被顶替 清空指定的禁闭室数据
          this._clearLockdown(cellId);

          // 更新新人
          const targetActor =
            MiyoiPlugins.Utility.getRelatedActorByEventId(eventId);
          this._lockdownCells[cellId] = {
            prisonerId: targetActor.actorId(),
            prisonerName: targetActor.name(),
            mapIdOfActorEvent: mapId,
            eventIdOfActorEvent: eventId, // 原来的囚徒事件
          }; // 保存新人数据到指定的禁闭室
          $gameSelfSwitches.setValue(
            [
              this._lockdownCells[cellId].mapIdOfActorEvent,
              this._lockdownCells[cellId].eventIdOfActorEvent,
              this._config.lockdown_event_self_switch_choice,
            ],
            true,
          ); // 打开 *正在禁闭中* 的 <囚徒角色事件> 的独立开关 to 禁用该事件

          const lockdownCellEvent = MiyoiPlugins.Utility.getPluginEvents()
            .filter(
              (event) =>
                event.event().meta.event ===
                  this._config.lockdown_event_note_tag &&
                // biome-ignore lint/complexity/useLiteralKeys: <explanation>
                event.event().meta["cid"] === cellId,
            )
            .pop();
          $gameSelfSwitches.setValue(
            [
              lockdownCellEvent._mapId,
              lockdownCellEvent.eventId(),
              this._config.lockdown_event_self_switch_choice,
            ],
            true,
          ); // 打开 *正在禁闭中* 的 <禁闭角色事件> 的独立开关 to 启用该事件
          MiyoiPlugins.Utility.setCharacterEvent(
            targetActor.actorId(),
            lockdownCellEvent.eventId(),
            true,
          ); // 让禁闭室事件的事件页图像设置为当前指定的囚徒图像

          return true;
        }

        unlockCharacter(eventId) {
          this._clearLockdown(
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            MiyoiPlugins.Utility.getEventById(eventId).event().meta["cid"],
          ); // 清理指定的禁闭室数据
          return true;
        }

        punishCharacter() {
          this.log(
            "禁闭室当前状态",
            Object.values(this._lockdownCells).map((cell) => cell),
          );
          return false;
        }
      }

      const thisPluginParameters = PluginManager.parameters(
        "MiP_Addon_PrisonManager",
      ); // 加载本插件预设好的参数
      const thisPluginInstance = new PrisonManager(thisPluginParameters); // 实例化本插件定义好的功能类
      $.prisonManager = thisPluginInstance; // 挂载到全局窗口

      const old_Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded; // 临时保存之前的地图加载函数
      // 重载地图加载函数
      Scene_Map.prototype.onMapLoaded = function () {
        const newPrisonerImages = $dataMap.events
          .filter(
            (eventData) =>
              // biome-ignore lint/complexity/useOptionalChain: <explanation>
              eventData &&
              eventData.meta &&
              eventData.meta.event ===
                thisPluginInstance._config.prisoner_event_note_tag,
          )
          .map((eventData) => {
            const actorId = MiyoiPlugins.Utility.getRelatedActorIdByEventId(
              eventData.id,
            );
            MiyoiPlugins.Utility.setCharacterEvent(
              actorId,
              eventData.id,
              true,
              MiyoiPlugins.Utility.getEventPageIndexBySelfSwitchChoice(
                thisPluginInstance._config.prisoner_event_self_switch_choice,
              ),
            );
            return {
              eventId: eventData.id,
              actorId: actorId,
              actorName: $dataActors[actorId].name,
              characterName: $dataActors[actorId].characterName,
              characterIndex: $dataActors[actorId].characterIndex,
            };
          }); // 修改所有囚徒角色事件的对应事件页图像
        thisPluginInstance.debug(
          `场景地图 <${$dataMap.displayName}> 已加载 onMapLoaded() 囚徒角色事件图像:`,
          newPrisonerImages,
        );
        old_Scene_Map_onMapLoaded.call(this); // 继续调用 Scene_Map.prototype.createDisplayObjects
      };

      const old_Scene_Map_isReady = Scene_Map.prototype.isReady;
      Scene_Map.prototype.isReady = function () {
        const isMapReady = old_Scene_Map_isReady.call(this);
        if (isMapReady) {
          MiyoiPlugins.Utility.getPluginEvents()
            .filter(
              (event) =>
                event.event().meta.event ===
                MiyoiPlugins.getConfig("character_event_note_tag"),
            )
            .map((event) => {
              if (thisPluginInstance._isPrisoner(event.eventId())) {
                $gameSelfSwitches.setValue(
                  [
                    event._mapId,
                    event.eventId(),
                    thisPluginInstance._config
                      .prisoner_event_self_switch_choice,
                  ],
                  true,
                ); // 打开 *作为囚徒* 的 <一般角色事件> 的独立开关 to 禁用该事件
              } else {
                $gameSelfSwitches.setValue(
                  [
                    event._mapId,
                    event.eventId(),
                    thisPluginInstance._config
                      .prisoner_event_self_switch_choice,
                  ],
                  false,
                ); // 关闭 *不是囚徒* 的 <一般角色事件> 的独立开关 to 启用该事件
              }
            });
          MiyoiPlugins.Utility.getPluginEvents()
            .filter(
              (event) =>
                event.event().meta.event ===
                thisPluginInstance._config.prisoner_event_note_tag,
            )
            .map((event) => {
              if (thisPluginInstance._isPrisoner(event.eventId())) {
                $gameSelfSwitches.setValue(
                  [
                    event._mapId,
                    event.eventId(),
                    thisPluginInstance._config
                      .prisoner_event_self_switch_choice,
                  ],
                  true,
                ); // 打开 *作为囚徒* 的 <囚徒角色事件> 的独立开关 to 启用该事件
              } else {
                $gameSelfSwitches.setValue(
                  [
                    event._mapId,
                    event.eventId(),
                    thisPluginInstance._config
                      .prisoner_event_self_switch_choice,
                  ],
                  false,
                ); // 关闭 *解除囚禁* 的 <囚徒角色事件> 的独立开关 to 禁用该事件
              }
            });
          thisPluginInstance.log(
            `场景地图 <${$gameMap.displayName()}> 已就绪 isReady() 所有事件 独立开关`,
            MiyoiPlugins.Utility.debugSelfSwitches(true),
          );

          // 处理禁闭中囚徒角色事件
          const lockdedPrisonerEvents =
            MiyoiPlugins.Utility.getPluginEvents().filter(
              (event) =>
                event.event().meta.event ===
                  thisPluginInstance._config.lockdown_event_note_tag &&
                // biome-ignore lint/complexity/useLiteralKeys: <explanation>
                thisPluginInstance._lockdownCells[event.event().meta["cid"]],
            ); // 所有正在生效中的禁闭中囚徒角色事件
          const newLockdownImages = lockdedPrisonerEvents.map((event) => {
            const actorId = MiyoiPlugins.Utility.getRelatedActorIdByEventId(
              event.eventId(),
            );
            console.warn("actorId", actorId);
            MiyoiPlugins.Utility.setCharacterEvent(
              actorId,
              event.eventId(),
              true,
              MiyoiPlugins.Utility.getEventPageIndexBySelfSwitchChoice(
                thisPluginInstance._config.lockdown_event_self_switch_choice,
              ),
            );
            return {
              eventId: event.eventId(),
              actorId: actorId,
              actorName: $dataActors[actorId].name,
              characterName: $dataActors[actorId].characterName,
              characterIndex: $dataActors[actorId].characterIndex,
            };
          }); // 修改所有禁闭角色事件的对应事件页图像
          // */

          thisPluginInstance.log(
            `场景地图 <${$gameMap.displayName()}> 已就绪 isReady() 禁闭室数据`,
            thisPluginInstance._lockdownCells,
            "事件数据",
            lockdedPrisonerEvents.map(
              (event) => event.pages[event.findProperPageIndex()],
            ),
            // "事件图像",
            // newLockdownImages,
          );
        }
        return isMapReady;
      };

      const old_Game_Action_apply = Game_Action.prototype.apply; // 临时保存之前的技能释放
      // 重载技能释放
      Game_Action.prototype.apply = function (targetActor) {
        if (
          (this.isSkill() &&
            this.item().id ===
              thisPluginInstance._config.switch_prison_skill) ||
          (this.isItem() &&
            this.item().id === thisPluginInstance._config.switch_prison_item)
        ) {
          if (targetActor.actorId() === $gameParty.leader().actorId()) return;
          const imprisonState = thisPluginInstance._config.imprison_state;
          if (targetActor._states.includes(imprisonState)) {
            // targetActor.eraseState(imprisonState); // 解除监禁状态
            thisPluginInstance.releaseCharacter();
          } else {
            // targetActor.addState(imprisonState); // 附加监禁状态
            thisPluginInstance.arrestCharacter();
          }
          return;
        }
        old_Game_Action_apply.call(this, targetActor);
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
              `${thisPluginInstance.addonName}: 插件命令的参数数量错误 ${args}`,
            );
          switch (args[0]) {
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
                args[1],
              );
              break;
            case "unlockCharacter":
              thisPluginInstance.unlockCharacter(this.eventId());
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
      // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    })(MiyoiPlugins.addons || (MiyoiPlugins.addons = {}));
  }
})();
