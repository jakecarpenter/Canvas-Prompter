angular
  .module('prompter', [])
  .controller('SettingsController', SettingsController)
  .service('PrompterService', PrompterService)
  .directive('keyTable', ['PrompterService', keyTableDirective])

  function SettingsController($scope, PrompterService){
    var handleSettingsToggle = function(event){
      $scope.visible = !$scope.visible;
      window.settingsVisible = $scope.visible;
      $scope.$apply()
    }

    window.addEventListener('keydown', function(event){
      if(event.keyCode == 112){
        window.dispatchEvent(new Event('settings-toggle'));
      }
    });

    window.addEventListener('settings-toggle', handleSettingsToggle)

    // key mappings
    $scope.keys = PrompterService.defs;
    // setting values
    $scope.settings = PrompterService.settings
    // console.log(PrompterService.settings)

    $scope.updateSetting = function(setting, value){
      PrompterService.set[setting](value);
    }
  }

  function PrompterService(){
    var keymap = window.keymap || undefined;
    var prompter = window.prompter || false;
    var keyDefs = [];
    for (var code in prompter.keys){
      var map = {}
      map.code = code;
      map.action = prompter.keys[code];
      for(var name in keymap){
        if(keymap[name]==code){
          map.name = name
        }
      }

      keyDefs.push(map);
    }
    //reprogram key map
    var updateKeys = function(keyArray){
      // first clear existing keys.
      for(var i = 0; i < 256; i++){
        prompter.keys[i] = undefined;
      }
      for(var i = 0, length = keyArray.length; i < length; i++){
        prompter.keys[keyArray[i].code] = keyArray[i].action;
      }
    }
    return {
      keymap: keymap,
      defs: keyDefs,
      updateKeys: updateKeys,
      settings: prompter.settings,
      set: prompter.set
    }
  }

  function keyTableDirective(PrompterService){
    return {
      restrict: "E",
      scope:{
        keys: "=keys"
      },
      templateUrl: "templates/key-table.html",
      link: function(scope, element, attr){
        scope.updateKey = function(e, f){
          PrompterService.updateKeys(scope.keys)
        }
        scope.allKeys = PrompterService.keymap
      }
    }

  }

            