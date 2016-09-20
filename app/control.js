angular
  .module('prompter', [])
  .controller('SettingsController', SettingsController)
  .service('PrompterService', PrompterService)

  function SettingsController($scope, PrompterService){
    window.addEventListener('keydown', function(event){
      (event.keyCode == 113)? $scope.visible = !$scope.visible: null ;
      $scope.$apply()
    })

    PrompterService.tMe()

    $scope.message = "hello"
  }

  function PrompterService(){
    var prompter = window.prompter || window.PROMPTER || false;
    console.log(prompter)
    return {
      tMe: function(){
        prompter.keys[84] = "stopStart";
        prompter.keys[32] = undefined;
      }
    }
  }
