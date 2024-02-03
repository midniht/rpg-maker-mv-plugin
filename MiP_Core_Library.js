//=============================================================================
// MiP_Core_Library.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - Core Library
 * v0.5.4
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
 * @param 角色事件备注标记
 * @parent 角色登场
 * @desc 当前场景存在「角色事件」时，事件的「备注」标记。
 * （用例：在事件的「备注」中加入 <event:is_character>。）
 * @type combo
 * @option is_character
 * @default is_character
 */

if (!window.MiyoiPlugins) window.MiyoiPlugins = {}; // 初始化命名空间

/**
 * @class Utility
 * @description 静态工具类
 */
MiyoiPlugins.Utility = class {
  constructor() {
    throw new Error("This is a static class");
  }

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
   * @function debugActorStates
   * @description 调试角色状态
   * @param {boolean} [allActor=false] 默认只有当前队伍中角色
   * @returns {any[]} 角色格式化后的当前状态
   */
  static debugActorStates(allActor = false) {
    const actorList = allActor
      ? $gameActors._data.filter((actor) => actor)
      : $gameParty.allMembers();
    return actorList.map((actor) => {
      return {
        actor: `[${actor.actorId()}]${actor.name()}`,
        state: actor
          .states()
          .map((state) => state.name)
          .join(", "),
      };
    });
  }

  /**
   * @function debugSelfSwitches
   * @description 调试独立开关数据
   * @param {boolean} [allMap=false] 默认只有当前地图中的独立开关
   * @returns {any[]} 独立开关相关数据
   */
  static debugSelfSwitches(allMap = false) {
    const selfSwitchesMapList = Object.entries($gameSelfSwitches._data).filter(
      ([keyString, _]) =>
        allMap ? true : Number(keyString.split(",")[0]) === $gameMap.mapId(),
    ); // 当心过图(切换地图)时报错
    return selfSwitchesMapList
      .map(([keyString, selfSwitchStatus]) => {
        const token = keyString.split(",");
        const selfSwitchInfo = {
          mapId: Number(token[0]),
          mapName: "其他地图",
          eventId: Number(token[1]),
          eventName: "未知事件",
          actorId: -1,
          selfSwitchChoice: token[2],
          selfSwitchStatus: selfSwitchStatus,
        };
        if (selfSwitchInfo.mapId === $gameMap.mapId()) {
          selfSwitchInfo.mapName = $gameMap.displayName();
          selfSwitchInfo.eventName = MiyoiPlugins.Utility.getEventById(
            selfSwitchInfo.eventId,
          ).event().name;
          selfSwitchInfo.actorId =
            MiyoiPlugins.Utility.getRelatedActorIdByEventId(
              selfSwitchInfo.eventId,
            );
          selfSwitchInfo.actorName = MiyoiPlugins.Utility.getActorNameById(
            selfSwitchInfo.actorId,
          );
        }
        return selfSwitchInfo;
      })
      .map((info) => {
        const eventOfActor =
          info.actorId >= 0 ? ` ([${info.actorId}]${info.actorName})` : "";
        return {
          map: `[${info.mapId}]${info.mapName}`,
          event: `[${info.eventId}]${info.eventName}${eventOfActor}`,
          selfSwitch: `${info.selfSwitchChoice} = ${info.selfSwitchStatus}`,
        };
      });
  }

  /**
   * @function debugActorEventPagesImage
   * @description 通过 静态地图数据 获取当前的 (由本插件管理的)事件的图像(行走图)设置
   * @returns {any[]} 由插件管理的事件的图像设置列表
   */
  static debugActorEventPagesImage(dataObject = $dataMap) {
    return dataObject.events
      .filter(
        (eventData) =>
          eventData &&
          eventData.meta.plugin ===
            MiyoiPlugins.getConfig("plugin_meta_note_tag"),
      )
      .filter(
        (eventData) =>
          MiyoiPlugins.Utility.getRelatedActorIdByEventId(eventData.id) >= 0,
      )
      .map((eventData) => {
        return {
          id: eventData.id,
          name: eventData.name,
          actorName: MiyoiPlugins.Utility.getActorNameById(eventData.id),
          pagesImage: eventData.pages
            .map((page) => {
              const pageImageData = {
                characterName: page.image.characterName,
                characterIndex: page.image.characterIndex,
                pattern: page.image.pattern,
              };
              return pageImageData;
            })
            .map(
              (image) =>
                `${image.characterName || "none"}[${image.characterIndex}](${
                  image.pattern
                })`,
            )
            .join(", "),
        };
      });
  }

  /**
   * @function isInParty
   * @description 通过角色 ID 检查是否正处于队伍中
   * @param {number} actorId 角色 ID
   * @param {boolean} [byState=false] 通过状态检测
   * @returns {boolean} 是否处于队伍中
   */
  static isInParty(actorId, byState = false) {
    let inParty = false;
    if (byState) {
      inParty = MiyoiPlugins.Utility.getActorById(actorId)
        .states()
        .map((state) => state.id)
        .includes(MiyoiPlugins.getConfig("in_party_state"));
    } else {
      inParty = $gameParty
        .allMembers()
        .map((actor) => actor.actorId())
        .includes(actorId);
    }
    return inParty;
  }

  /**
   * @function getPluginEvents
   * @description 通过备注(note)解析到 meta 属性里的标记 检索本插件专属的事件
   * @returns {any[]} 标记了 交给本插件管理 的事件数组
   */
  static getPluginEvents() {
    return $gameMap
      .events()
      .filter(
        (event) =>
          event.event().meta.plugin ===
          MiyoiPlugins.getConfig("plugin_meta_note_tag"),
      );
  }

  /**
   * @function getActorNameById
   * @description 通过角色 ID 检索角色名称
   * @param {number} actorId
   * @returns {any} 找到的角色对象
   */
  static getActorNameById(actorId) {
    const actorData = $dataActors[actorId];
    if (actorData) {
      return actorData.name;
    }
    return undefined;
  }

  /**
   * @function getActorById
   * @description 通过角色 ID 检索角色对象
   * @param {number} actorId
   * @returns {any} 找到的角色对象
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
   * @returns {any} 找到的角色对象
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
   * @returns {any} 找到的角色对象
   */
  static getActorByAnyway(actorMark) {
    let targetActor = undefined;
    if (typeof actorMark === "number") {
      targetActor = MiyoiPlugins.Utility.getActorById(actorMark);
    } else if (typeof actorMark === "string") {
      targetActor = MiyoiPlugins.Utility.getActorByName(actorMark);
    } else {
      throw new TypeError(
        `指定的角色参数 (${actorMark}) 类型错误 需要角色 ID 或角色名称`,
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
    const eventData = $dataMap.events[eventId];
    if (!eventData) {
      throw new RangeError(
        `当前地图 ${
          $dataMap.displayName
        }(${$gameMap.mapId()}) 没有找到事件 ${eventId}`,
      );
    }
    let relatedActorId = eventData.pages
      .filter((page) => page.conditions.actorValid)
      .map((page) => page.conditions.actorId)
      .pop(); // 根据每一个事件页的 角色是否在队伍中(出现条件) 检索角色 ID;
    const event = $gameMap.event(eventId);
    if (!relatedActorId && event && event.findProperPageIndex() >= 0) {
      relatedActorId = $dataActors
        .filter((actorData) => {
          const eventActivePageImage =
            event.event().pages[event.findProperPageIndex()].image;
          // console.warn(
          //   `TODO 以图搜人 事件[${event.eventId()}] 事件页[${event.findProperPageIndex()}]`,
          //   eventActivePageImage
          // );
          return (
            actorData &&
            actorData.characterName === eventActivePageImage.characterName &&
            actorData.characterIndex === eventActivePageImage.characterIndex
          );
        })
        .map((actorData) => actorData.id)
        .pop(); // 根据当前激活的事件页(已经设置好)的图像反向检索角色 ID
      console.warn("TODO 以图搜人 检索到 actorId", relatedActorId);
    }
    return relatedActorId ? relatedActorId : -1;
  }

  /**
   * @function getRelatedActorByEventId
   * @description 通过事件 ID 反向检索相关（被出现条件标记）的角色对象
   * @param {number} eventId
   * @returns {any} 相关的角色对象
   */
  static getRelatedActorByEventId(eventId) {
    const actorId = MiyoiPlugins.Utility.getRelatedActorIdByEventId(eventId);
    return actorId >= 0
      ? MiyoiPlugins.Utility.getActorById(actorId)
      : undefined;
  }

  /**
   * @function getEventById
   * @description 通过事件 ID 检索事件对象
   * @param {number} eventId
   * @returns {any} 找到的事件对象
   */
  static getEventById(eventId) {
    return $gameMap.event(eventId);
  }

  /**
   * @function getEventPageIndexBySelfSwitchChoice
   * @description 通过指定的独立开关检索事件页序号
   * @param {number} eventId
   * @param {string} selfSwitchChoice
   * @returns {number} 事件页序号
   */
  static getEventPageIndexBySelfSwitchChoice(eventId, selfSwitchChoice) {
    let pageIndex = -1;
    const theEventData = $dataMap.events[eventId];
    if (!theEventData) return pageIndex;
    theEventData.pages.map((page, index) => {
      if (page.conditions.selfSwitchCh === selfSwitchChoice) {
        // if (page.conditions.selfSwitchValid || pageIndex < 0) pageIndex = index;
        pageIndex = index; // 如果同时有多个事件页满足条件 最终结果一定是最后一个 符合事件页的优先级逻辑
      }
    });
    return pageIndex;
  }

  /**
   * @function setCharacterEvent
   * @description 将指定 事件 的指定 事件页 的图像设置为指定角色
   * @param {number} actorId 角色 ID (获取角色图像)
   * @param {number} eventId 事件 ID (指定角色事件)
   * @param {boolean} [usePage=false] 是否使用修改事件页数据的方式
   * @param {number} [pageIndex=-1] 指定事件页的下标
   * @returns {any} 修改后的事件页数据
   */
  static setCharacterEvent(actorId, eventId, usePage = false, pageIndex = -1) {
    const targetActorData = $dataActors[actorId];
    if (usePage) {
      const characterEventData = $dataMap.events[eventId];
      if (!characterEventData)
        throw new Error(
          `当前地图 ${$dataMap.displayName} 没有找到 事件[${eventId}]`,
        );
      const validPageIndex = pageIndex >= 0 ? pageIndex : 0;
      characterEventData.pages[validPageIndex].image.characterName =
        targetActorData.characterName;
      characterEventData.pages[validPageIndex].image.characterIndex =
        targetActorData.characterIndex;
      characterEventData.pages[validPageIndex].image.pattern = 1; // 默认第二帧
      return characterEventData.pages[validPageIndex];
    }
    const characterEvent = MiyoiPlugins.Utility.getEventById(eventId);
    if (!characterEvent)
      throw new Error(
        `当前地图 ${$gameMap.displayName()} 没有找到 事件[${eventId}]`,
      );
    characterEvent.setImage(
      characterEvent.characterName(),
      characterEvent.characterIndex(),
    ); // 让角色事件更新图像
    // characterEvent.refresh(); // TODO 貌似没起作用
    // Game_Event.findProperPageIndex() 检索当前 **符合条件** 的事件页
    return characterEvent.event().pages[characterEvent.findProperPageIndex()];
  }

  /**
   * @function setChosenCharacterEventsByModifyPage
   * @description 通过直接修改事件 page 数据
   *   将当前地图场景下所有 角色事件 的图像设置为对应的角色
   *   设置 **初始化时** 所有事件的 _对应事件页_ 的图像
   * @param {any[]} eventList 事件数组
   * @param {number} [pageIndex=-1] 事件页下标
   * @returns {any[]} 新事件的图像相关数据
   */
  static setChosenCharacterEventsByModifyPage(eventList, pageIndex = -1) {
    const newCharacterImages = eventList.map((event) => {
      const actor = MiyoiPlugins.Utility.getRelatedActorByEventId(
        event.eventId(),
      );
      console.warn("修改事件页图像", event, actor);
      MiyoiPlugins.Utility.setCharacterEvent(
        actor.actorId(),
        event.eventId(),
        true,
        pageIndex >= 0 ? pageIndex : 0, // 如果没有指定就默认第一页
      );
      return {
        eventId: event.eventId(),
        actorId: actor.actorId(),
        actorName: actor.name(),
        characterName: actor.characterName(),
        characterIndex: actor.characterIndex(),
      };
    });
    return newCharacterImages;
  }

  /**
   * @function setChosenCharacterEventsBySetImage
   * @description 通过 Game_CharacterBase.prototype.setImage() 方法
   *   将当前地图场景下所有 角色事件 的图像设置为对应的角色
   *   设置 **每次重载当前地图场景后** 已生效事件的 _当前事件页_ 的图像
   * @param {any[]} eventList 事件数组
   * @param {string} [eventSelfSwitchChoice=""] 独立开关
   * @returns {any[]} 新事件的图像相关数据
   */
  static setChosenCharacterEventsBySetImage(
    eventList,
    eventSelfSwitchChoice = "",
  ) {
    const validEventList =
      eventSelfSwitchChoice === ""
        ? eventList
        : eventList.filter(
            (event) =>
              $gameSelfSwitches.value(
                [event._mapId, event.eventId(), eventSelfSwitchChoice].join(
                  ",",
                ),
              ) &&
              event.findProperPageIndex() ===
                MiyoiPlugins.Utility.getEventPageIndexBySelfSwitchChoice(
                  event.eventId(),
                  eventSelfSwitchChoice,
                ),
          ); // todo 临时使用 检测独立开关 & 当前激活的事件页
    const newCharacterImages = validEventList.map((event) => {
      const actor = MiyoiPlugins.Utility.getRelatedActorByEventId(
        event.eventId(),
      );
      MiyoiPlugins.Utility.setCharacterEvent(actor.actorId(), event.eventId());
      return {
        eventId: event.eventId(),
        actorId: actor.actorId(),
        actorName: actor.name(),
        characterName: actor.characterName(),
        characterIndex: actor.characterIndex(),
      };
    });
    return newCharacterImages;
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
  constructor({ name = "MiP Core", version = "0.1.0", ...config } = {}) {
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
  getLogPrefix(logLevel = "debug") {
    return `${[
      MiyoiPlugins.Utility.now(),
      this.addonName,
      logLevel.toUpperCase(),
    ].join(" | ")} |`;
  }

  /**
   * @function debug
   * @description 打印本插件专用格式的 debug
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  debug(...args) {
    console.debug(this.getLogPrefix("debug"), ...args);
    return;
  }

  /**
   * @function log
   * @description 打印本插件专用格式的 log
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  log(...args) {
    console.log(this.getLogPrefix("todo"), ...args);
    return;
  }

  /**
   * @function info
   * @description 打印本插件专用格式的 info
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  info(...args) {
    console.info(this.getLogPrefix("info"), ...args);
    return;
  }

  /**
   * @function warn
   * @description 打印本插件专用格式的 warn
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  warn(...args) {
    console.warn(this.getLogPrefix("warn"), ...args);
    return;
  }

  /**
   * @function error
   * @description 打印本插件专用格式的 error
   * @param  {...any} args 打印的不定参数
   * @returns
   */
  error(...args) {
    console.error(this.getLogPrefix("error"), ...args);
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
      MiyoiPlugins.getConfig("in_party_state"),
    ); // 入队前附加状态
    $gameParty.addActor(targetActorId); // 执行入队操作

    // 可以换成 入队后附加状态 写法如下
    /*
    this.log(
      "入队后附加状态:",
      $gameActors.actor(targetActorId) ===
        $gameParty
          .allMembers()
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
            MiyoiPlugins.getConfig("leave_party_skill"),
      ) // 遍历全队 筛选出所有上次使用的菜单技能是「离开队伍」的角色
      .map((actor) => {
        actor.eraseState(MiyoiPlugins.getConfig("in_party_state")); // 离队前解除状态
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
    this.log("当前配置为", this._config);
    return true;
  }
};

/**
 * @function getConfig
 * @description 获取核心依赖(即本插件)的配置项
 * @param {string} configName
 * @returns {any} 对应的配置项内容
 */
MiyoiPlugins.getConfig = function (configName) {
  if (configName in this._data.config) {
    return this._data.config[configName];
  }
  return undefined;
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
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      globalPluginParameters["插件专属备注标记"],
    in_party_state: Number(
      globalPluginParameters["In Party State"] ||
        globalPluginParameters["「队伍中」状态"],
    ),
    leave_party_skill: Number(
      globalPluginParameters["Leave Party Skill"] ||
        globalPluginParameters["「离开队伍」技能"],
    ),
    character_event_note_tag:
      globalPluginParameters["Character Event Note Tag"] ||
      // biome-ignore lint/complexity/useLiteralKeys: <explanation>
      globalPluginParameters["角色事件备注标记"],
  };

  $.actorBindEvents = {};

  const thisPluginInstance = new MiyoiPlugins.AddonBase();

  MiyoiPlugins.isReady = () => {
    return thisPluginInstance.test("a", 1, "b", 2, "c", 3);
  };

  const old_Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded; // 临时保存之前的地图加载函数
  // 重载地图加载函数
  Scene_Map.prototype.onMapLoaded = function () {
    const newCharacterImages = $dataMap.events
      .filter(
        (eventData) =>
          // biome-ignore lint/complexity/useOptionalChain: <explanation>
          eventData &&
          eventData.meta &&
          eventData.meta.event === $.config.character_event_note_tag,
      )
      .map((eventData) => {
        const actorId = MiyoiPlugins.Utility.getRelatedActorIdByEventId(
          eventData.id,
        );
        MiyoiPlugins.Utility.setCharacterEvent(
          actorId,
          eventData.id,
          true,
          0, // TODO 默认指定第一页
        );
        return {
          eventId: eventData.id,
          actorId: actorId,
          actorName: $dataActors[actorId].name,
          characterName: $dataActors[actorId].characterName,
          characterIndex: $dataActors[actorId].characterIndex,
        };
      }); // 修改所有一般角色事件的对应事件页图像
    thisPluginInstance.debug(
      `场景地图 <${$dataMap.displayName}> 已加载 onMapLoaded() 一般角色事件图像:`,
      newCharacterImages /*.map(
        (data) =>
          `当前地图的 事件[${data.eventId}] 的图像 (角色[${data.actorId}]=${data.actorName}) ` +
          `已更新为 ${data.characterName}[${data.characterIndex}]`,
      ), // */,
    );
    /*
    const strangeMapId = $gameMap.mapId();
    thisPluginInstance.warn(
      "注意此时 $gameMap.mapId() 返回值为奇怪的下标",
      $gameMap.mapId(),
      `$dataMapInfos[${strangeMapId}]=`,
      { ...$dataMapInfos[strangeMapId] },
    );
    // */

    old_Scene_Map_onMapLoaded.call(this); // 继续调用 Scene_Map.prototype.createDisplayObjects
  };

  const old_Scene_Map_isReady = Scene_Map.prototype.isReady;
  Scene_Map.prototype.isReady = function () {
    const isMapReady = old_Scene_Map_isReady.call(this);
    if (isMapReady) {
      const currentMapId = $gameMap.mapId();
      if (!MiyoiPlugins._data.actorBindEvents[currentMapId]) {
        MiyoiPlugins._data.actorBindEvents[currentMapId] = {
          mapId: currentMapId,
          name: $dataMapInfos
            .filter((mapInfo) => mapInfo && mapInfo.id === currentMapId)
            .map((mapInfo) => mapInfo.name)
            .pop(),
          displayName: $dataMap.displayName,
          events: MiyoiPlugins.Utility.getPluginEvents()
            .map((event) => {
              const relatedActor =
                MiyoiPlugins.Utility.getRelatedActorByEventId(event.eventId());
              if (relatedActor) {
                return {
                  eventId: event.eventId(),
                  eventName: event.event().name,
                  actorId: relatedActor.actorId(),
                  actorName: relatedActor.name(),
                };
              }
              return undefined;
            })
            .filter((actorEvent) => actorEvent),
        };
        thisPluginInstance.warn("角色事件 插件自带数据库 初始化", {
          ...MiyoiPlugins._data.actorBindEvents, // 简单深拷贝
        });
      }
    }
    return isMapReady;
  };

  const old_Game_Action_apply = Game_Action.prototype.apply; // 临时保存之前的技能释放
  // 重载技能释放
  Game_Action.prototype.apply = function (target) {
    console.log("TODO 捕获到 Game_Action", this);
    // 在 RPG Maker MV 中 技能的范围为 "无" 意味着技能不会选择目标
    // 因此在默认情况下 技能释放事件 Game_Action.prototype.apply 可能不会被触发
    if (
      this.isSkill() &&
      this.item().id === MiyoiPlugins.getConfig("leave_party_skill")
    ) {
      const skill = this.item();
      console.log("离队技能已释放：", skill, target);
      return;
    }
    old_Game_Action_apply.call(this, target);
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
          `${thisPluginInstance.addonName}: 插件命令的参数数量错误 ${args}`,
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
  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
})(MiyoiPlugins._data || (MiyoiPlugins._data = {}));

// console.log(
//   "MiP_Core_Library 插件核心依赖库初始化",
//   MiyoiPlugins._data.isReady(),
//   MiyoiPlugins
// );
