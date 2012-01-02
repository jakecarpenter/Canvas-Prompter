var PROMPTER = function(options){
	//if no options, great we'll do it all by ourself.
	var options = options || {};
	
	//orietation is for tablet devices.
	var orientation = options.orientation || 90;
	
	//default width & height, get monkeyed with when orientation changes.
	var width = options.width || 1024;
	var height = options.height || 748;
				
	//if there was a container element specified, use it, otherwise make our own
	var containerElement = options.container || function(){
		var c = document.createElement('div');
		c.setAttribute('id', 'prompterContainer');
		document.body.appendChild(c);
		return c;
	}();
	
	//we're going to use two canvases, one for the script text, and one for the overlay.		
			
	// script canvas element stuff.
	var scriptCanvas = options.scriptCanvas || function(){
		var c = document.createElement('canvas');
		c.setAttribute('id', 'scriptCanvas');
		c.setAttribute('class', 'scriptCan');
		c.setAttribute('height', height);
		c.setAttribute('width', width);
		//c.setAttribute('z-index', 0);
		containerElement.appendChild(c);
		return c;
	}();
				
	var scriptContext = scriptCanvas.getContext('2d');
	
	// script canvas element stuff.
	var overlayCanvas = options.overlayCanvas || function(){
		var c = document.createElement('canvas');
		c.setAttribute('id', 'overlayCanvas');
		c.setAttribute('class', 'overlayCan');
		c.setAttribute('height', height);
		c.setAttribute('width', width);
		//c.setAttribute('z-index', 0);
		containerElement.appendChild(c);
		return c;
	}();
				
	var overlayContext = overlayCanvas.getContext('2d');
	
	//drawing/refreshing stuff here
	//draw is where the magic happens.
	var draw = function(){
		
	};
	
	var flipHorizontal = function(){
		overlayCanvas.scale(-1,1);
		overlayCanvas.translate(-overlayCanvas.width,0);
		
		scriptCanvas.scale(-1,1);
		scriptCanvas.translate(-scriptCanvas.width,0);
	};
	
	var flipVertical = function(){
		overlayCanvas.scale(1,-1);
		overlayCanvas.translate(0,-overlayCanvas.height);
		
		scriptCanvas.scale(1,-1);
	   	scriptCanvas.translate(0,-scriptCanvas.height);
	};
	
	//utility stuff here
	
	//view stuff here
	
	//event stuff here
	var bindKey = function(keycode, func){
		
	};
	

}
