//=============================================================================
// MiP_Addon_DialogueManager.js
//=============================================================================

/*:
 * @plugindesc Miyoi's Plugin - Dialogue Manager
 * v0.5.0
 *
 * @author 深宵(Miyoi)
 *
 * @help 角色对话管理器
 *
 * 插件指令：
 * MiP_Dialogue say [立绘差分] [自定义对话文本]    # 显示带立绘的角色对白
 * MiP_Dialogue clearImages                        # 清除当前存在的所有立绘
 *
 * @param 立绘图片文件名前缀
 * @desc 指定立绘图片文件名的统一前缀（如果有的话）。
 * @type string
 * @default
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
          "MiP_Addon_DialogueManager 插件:",
          "必需的核心依赖库缺失",
          "请先启用核心依赖插件 MiP_Core_Library",
          "(或者关闭 / 卸载本插件)",
        ].join("<br>")
      );
    }
  };

  if (MiyoiPlugins) {
    (($) => {
      class DialogueManager extends MiyoiPlugins.AddonBase {
        /**
         * @function constructor
         * @description 构造函数
         * @param {*} config 传入的配置
         */
        constructor(config = {}) {
          super({
            name: "MiP_Addon_DialogueManager",
            version: "0.5.0",
          });
          this._config["portrait_prefix"] =
            config["Portrait File Prefix"] || config["立绘图片文件名前缀"];
          this._characterData = {}; // 游戏角色数据
          this._imageCacheOffset = 77; // 图片 ID 偏移量 防止和其他图片冲突
          this._imageCacheCursor = this._imageCacheOffset; // 图片 ID 只能在 1 - 100 以内
        }

        showCharacterPortrait(theCharacter, differentialSuffix = "") {
          const parametersArray = Object.entries(theCharacter.actor().meta)
            .filter(([key, _]) =>
              key.toString().toLowerCase().startsWith("image")
            )
            .filter(([_, value]) => value.split(",")[0] === differentialSuffix)
            .map(([_, value]) =>
              value
                .split(",")
                .slice(1)
                .map((argv) => Number(argv))
            )
            .pop();
          const pictureFilename = [
            this._config["portrait_prefix"],
            theCharacter.name(),
            differentialSuffix,
          ]
            .filter((str) => typeof str === "string" && str !== "")
            .join("_");
          if (!parametersArray) {
            throw new ReferenceError(
              [
                `${this.addonName}:`,
                `没有找到指定(${differentialSuffix})的立绘图片`,
                `/img/pictures/${pictureFilename}.png`,
              ].join("<br>")
            );
          }
          const pictureParameters = {
            filename: pictureFilename,
            origin: parametersArray[0],
            x:
              parametersArray[1] >= 1
                ? parametersArray[1]
                : parseInt(parametersArray[1] * Graphics.width),
            y:
              parametersArray[2] >= 1
                ? parametersArray[2]
                : parseInt(parametersArray[2] * Graphics.width),
            scaleX: parametersArray[3],
            scaleY: parametersArray[4],
            opacity: parametersArray[5],
            blendMode: parametersArray[6],
          };
          this.debug(theCharacter.name(), "的差分立绘", pictureParameters);

          this._imageCacheCursor += 1;
          $gameScreen.showPicture(
            this._imageCacheCursor, // 图片编号 (ID)
            pictureParameters.filename, // 图像文件名 (不含扩展名)
            pictureParameters.origin, // 原点: 0(左上), 1(中心)
            pictureParameters.x, // 直接指定坐标的 X (单位为像素 px)
            pictureParameters.y, // 直接指定坐标的 Y (单位为像素 px)
            pictureParameters.scaleX, // 缩放率的横向宽度 (单位百分比)
            pictureParameters.scaleY, // 缩放率的纵向高度 (单位百分比)
            pictureParameters.opacity, // 合成方式的不透明度 (0 - 255)
            pictureParameters.blendMode // 合成方式: 0(正常), 1(叠加), 2(正片叠底), 3(滤色)
          );
          return true;
        }

        clearCharacterPortrait() {
          for (
            ;
            this._imageCacheCursor > this._imageCacheOffset;
            this._imageCacheCursor--
          ) {
            $gameScreen.erasePicture(this._imageCacheCursor);
          }
          return true;
        }

        _getCharacterLines(actorId) {
          const targetActor = MiyoiPlugins.Utility.getActorByAnyway(actorId);
          const CharacterLines = {};
          Object.entries(targetActor.actor().meta)
            .filter(([key, _]) =>
              key.toString().toLowerCase().startsWith("line")
            )
            .map(([key, line]) => {
              if (key.toLowerCase().endsWith("_raw")) {
                key = key.slice(0, -"_raw".length);
                if (CharacterLines[key] && CharacterLines[key].length > 0)
                  CharacterLines[key].push(line.replace(/\\n/g, "\n"));
              } else {
                CharacterLines[key] = [line.replace(/\\n/g, "\n")];
              }
            });
          Object.entries(CharacterLines).map(([key, line]) => {
            CharacterLines[key] =
              line.length >= 2
                ? `${line[0]}\n\\}\\C[8]「${line[1]}」\\C[0]\\{`
                : line[0];
          });
          return CharacterLines;
        }

        showCharacterLine(theCharacter, customLine) {
          const lineList = this._getCharacterLines(theCharacter.actorId());
          this.debug(theCharacter.name(), "的台本", lineList);
          // onlyLines[Math.floor(Math.random() * onlyLines.length)];
          const speakerName = theCharacter.actor().meta.textColor
            ? `\\C[${
                theCharacter.actor().meta.textColor
              }]${theCharacter.name()}\\C[0]`
            : theCharacter.name();
          let parsedText =
            customLine.length > 0 ? customLine.join(" ") : "我是%%%。";
          const matchesKeyword = parsedText.match(/%([^%]+)%/g); // 替换台本中有的关键词简写
          if (matchesKeyword !== null) {
            parsedText = matchesKeyword
              .map((matchedKeyword) => matchedKeyword.slice(1, -1))
              .filter((keyword) => keyword in lineList)
              .reduce(
                (accumulator, currentKeyword) =>
                  accumulator.replace(
                    `%${currentKeyword}%`,
                    lineList[currentKeyword]
                  ),
                parsedText
              );
          }
          parsedText = parsedText
            .replace(new RegExp(theCharacter.name(), "g"), speakerName) // 尝试高亮发言角色的名称
            .replace(/%%%/g, speakerName); // 替换角色名称简写(即 %%%)
          $gameMessage.add(`\\}「${speakerName}」\\{\n${parsedText}`);
          return true;
        }

        showDialogue(eventId, ...args) {
          const currentActor =
            MiyoiPlugins.Utility.getRelatedActorByEventId(eventId);
          this.clearCharacterPortrait(); // 清除之前的立绘
          this.showCharacterPortrait(currentActor, args[0]); // 显示当前的立绘
          this.showCharacterLine(currentActor, [...args.slice(1)]); // 显示台词
          return true;
        }
      }

      const thisPluginParameters = PluginManager.parameters(
        "MiP_Addon_DialogueManager"
      ); // 加载本插件预设好的参数
      const thisPluginInstance = new DialogueManager(thisPluginParameters); // 实例化本插件定义好的功能类
      $.dialogueManager = thisPluginInstance; // 挂载到全局窗口

      const old_Game_Interpreter_PluginCommand =
        Game_Interpreter.prototype.pluginCommand; // 临时保存之前的插件指令
      // 重载插件指令
      Game_Interpreter.prototype.pluginCommand = function (command, args) {
        old_Game_Interpreter_PluginCommand.call(this, command, args); // 继承之前的插件指令
        // 创建新的插件指令
        if (command === "MiP_Dialogue") {
          if (!args || args.length < 1)
            throw new RangeError(
              `${thisPluginInstance.addonName}: 插件命令的参数数量错误 ${args}`
            );
          switch (args[0]) {
            case "say":
              thisPluginInstance.showDialogue(this.eventId(), ...args.slice(1));
              this.setWaitMode("message");
              // TODO 跟在事件执行 显示文字 的表现不一致
              // 无法和事件里的 显示选项 直接结合
              break;
            case "clearImages":
              thisPluginInstance.clearCharacterPortrait();
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
