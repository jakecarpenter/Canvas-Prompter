angular
  .module('prompter', [])
  .controller('SettingsController', SettingsController)
  .service('PrompterService', PrompterService)

  function SettingsController($scope, PrompterService){
    window.addEventListener('keydown', function(event){
      (event.keyCode == 112)? $scope.visible = !$scope.visible: null ;
      $scope.$apply()
    })

    PrompterService.tMe()

    $scope.keys = PrompterService.defs;
  }

  function PrompterService(){
    var keymap = window.keymap || undefined;
    var prompter = window.prompter || window.PROMPTER || false;

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
    console.log(keyDefs)
    return {
      defs: keyDefs,
      tMe: function(){
        prompter.keys[84] = "stopStart";
        prompter.keys[32] = undefined;
      }
    }
  }
