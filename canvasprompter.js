var PROMPTER = function(options){
	//if no options, great we'll do it all by ourself.
	var options = options || {};
		options.text = options.text || {};
		options.caret = options.caret || {};
		options.keys = options.keys || {
			//setup the default keys.
			// x = 88, y = 89, 32 = space, 38 = up
			88: "flipHorizontal",
			89: "flipVertical",
			32: "stopStart",
			39: "getScript",
			85: "decreaseFontSize", //not yet implemented
			73: "increaseFontSize", //not yet implemented
			187: 'increaseSpeed',
			189: 'decreaseSpeed',
			27: 'resetScript'
		};
		
		options.script = options.script || {};
	
	//first, what text are we showing the user?
	var script = options.script.text || 
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed augue sem,"+
	"porta id pharetra sit amet, dignissim egestas orci. Duis iaculis luctus"+
	"vehicula. Fusce orci sapien, pharetra ac molestie eu, tincidunt sed ipsum. "+
	"Integer sit amet dolor eu est viverra ultrices. Suspendisse potenti. "+
	"Nullam semper neque quis odio laoreet consectetur egestas eros pretium. "+
	"Praesent accumsan dictum pretium. Morbi tristique nulla sit amet nisl "+
	"lacinia et cursus neque molestie. ";
	
	//orietation is for tablet devices.
	var orientation = options.orientation || 90;
	
	//default width & height, get monkeyed with when orientation changes.
	var width = options.width || 900;
	var height = options.height || 650;
	
	//initial text settings, can be changed anytime.
	var text = options.text || {};
		text.x = 5;
		text.height = 44;
		text.font = options.text.font || "bold "+ text.height +"px sans-serif";
		text.baseline = options.text.baseline || "top";
		text.style = "#fff";

	//caret/guidline setup.
	var caret = options.caret || {};
		caret.color = "yellow";
		caret.x = 10;
		caret.y = 200;
		caret.height = 40;
		caret.width = 40;
		caret.visible = options.caret.visible || true;
		
	//key setup
	var keys = options.keys;
	
	//if there was a container element specified, use it, otherwise make our own
	var containerElement = options.container || function(){
		var c = document.createElement('div');
		c.setAttribute('id', 'prompterContainer');
		document.body.appendChild(c);
		return c;
	}();
	
	//motion stuff
	var paused = true;
	
	//we need to know if our overlay or script setup has changed and needs a redraw (ie, its stale)
	var overlayStale = true;
	var scriptStale = true;
	
	//we're going to use two canvases, one for the script text, and one for the overlay.		
			
	// script canvas element stuff.
	var scriptCanvas = options.scriptCanvas || function(){
		var c = document.createElement('canvas');
		c.setAttribute('id', 'scriptCanvas');
		c.setAttribute('class', 'scriptCan');
		c.setAttribute('height', height);
		c.setAttribute('width', width);
		containerElement.appendChild(c);
		return c;
	}();
				
	var scriptContext = scriptCanvas.getContext('2d');
	
	// overlay canvas element stuff.
	var overlayCanvas = options.overlayCanvas || function(){
		var c = document.createElement('canvas');
		c.setAttribute('id', 'overlayCanvas');
		c.setAttribute('class', 'overlayCan');
		c.setAttribute('height', height);
		c.setAttribute('width', width);
		containerElement.appendChild(c);
		return c;
	}();
				
	var overlayContext = overlayCanvas.getContext('2d');
	
	//drawing/refreshing stuff here
	
	//position of top of text while scrolling
	var scrollPosY = 0;
	var scrollSpeed = -1;
	
	//draw is where the magic happens.
	function draw(){
		
		if(overlayStale == true){
			overlayContext.clearRect(0,0,width, height);
			
			//if we're using a caret, draw it.
			if(caret.visible === true) {
				drawCaret();
			}
			
			//we've redrawn/refigured the overlay, so its no longer stale
			overlayStale = false;
		}
		
		if(scriptStale === true){
			scriptText = textLines(script, width - caret.width - 10);
		}
		
		//clear the canvas
		scriptContext.clearRect(0,0,width, height);
		
		//setup text: 
		scriptContext.font = text.font;
		scriptContext.fillStyle = text.style;
		scriptContext.textBaseline = text.baseline;

		var lineOffsetY = 0;
		
		for(var line in scriptText){
			var scrollY =  scrollPosY + lineOffsetY;
			
			//only show lines that are on the screen
			if(scrollY > 0 - text.height){
				scriptContext.fillText(scriptText[line], text.x + caret.width, scrollY);
			}
			if(scrollY > height){
				continue;
			}
			lineOffsetY += text.height;	
			
		}
		
		//set the starting position for the next frame
		if(!paused){
			scrollPosY += scrollSpeed;
		}
		
	};
	
	//all of our bindable control functions:
	var controls = {
		flipHorizontal: function(){
			overlayContext.scale(-1,1);
			overlayContext.translate(-overlayCanvas.width,0);
			overlayStale = true;
			
			scriptContext.scale(-1,1);
			scriptContext.translate(-scriptCanvas.width,0);
		},
		flipVertical: function(){
			overlayContext.scale(1,-1);
			overlayContext.translate(0,-overlayCanvas.height);
			overlayStale = true;
			
			scriptContext.scale(1,-1);
		   	scriptContext.translate(0,-scriptCanvas.height);

		},
		stopStart: function(){
			paused = !paused;
		},
		getScript: function(){
			getRemoteScript(options.script.url, true);
		},
		increaseSpeed: function(){
			scrollSpeed -= 1;
		},
		decreaseSpeed: function(){
			scrollSpeed += 1;
		},
		resetScript: function(){
			scrollPosY = 0;
			paused = true;
			scrollSpeed = -1;
		}
	}

	//utility stuff here
	function getXMLHttp() {
	  var xmlHttp;
	
	  try {
	    //good browsers
	    xmlHttp = new XMLHttpRequest();
	  }
	  catch(e){
	    //e'rthing else
	    try {
	      xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
	    }
	    catch(e){
	      try{
	        xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
	      }
	      catch(e){
	        alert("Your browser does not support AJAX!");
	        return false;
	      }
	    }
	  }
	  return xmlHttp;
	}
	
	function drawCaret(){
		//draw a caret
		overlayContext.fillStyle = caret.color;
		overlayContext.beginPath();
		overlayContext.moveTo(caret.x, caret.y - (caret.height/2));
		overlayContext.lineTo(caret.x + caret.width, caret.y);
		overlayContext.lineTo(caret.x, caret.y + (caret.height/2));
		overlayContext.fill();
	}
	
	/**
	 * This stuff is borrowed from a stack overflow answer: http://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
	 * originally answered by mizar and edited by Paul Woolcock
	 * Divide an entire phrase in an array of phrases, all with the max pixel length given.
	 * The words are initially separated by the space char.
	 * @param phrase
	 * @param length
	 * @return
	 */
	var textLines = function (phrase,maxPxLength) {
	    var wordArray = phrase.split(" "),
	        phraseArray=[],
	        lastPhrase="",
	        l=maxPxLength,
	        measure=0;
	    for (var i=0;i<wordArray.length;i++) {
	        
	        var word=wordArray[i];
	        
	        measure=scriptContext.measureText(lastPhrase+word).width;
	        	        
	        if (measure<l) {
	            lastPhrase+=(" "+word);
	        }
	        else {
	            phraseArray.push(lastPhrase);
	            lastPhrase=word;
	        }
	        
	        if (i===wordArray.length-1) {
	            phraseArray.push(lastPhrase);
	            break;
	        }
	    }
	    return phraseArray;
	}
	
	function setFontSize(size){
		text.height = size || text.height;
		text.font = "bold "+ text.height +"px sans-serif";
	}
	
	//remote text fetching, set use to true or set with setText
	function getRemoteScript(url, use){
		var xmlHttp = getXMLHttp();
		
		xmlHttp.onreadystatechange = function(){
		  if(xmlHttp.readyState == 4) {
		    if(use === true){
		    	script = xmlHttp.responseText;
		    }
		    else{
   			    return xmlHttp.responseText;
		    }
		  }
		}
		
		xmlHttp.open("GET", url, true); 
		xmlHttp.send(null);	
	} 

	//view stuff here
	
	//key event stuff here
	//the commands we'll use. none by default.

	var handleKeyPress = function(e){
		e = e || window.event;
		key = e.keyCode;
		if(typeof controls[keys[key]] === 'function'){
			controls[keys[key]]();
		}
		//for dev purposes, tell us the keycodes.
		console.log(e.keyCode);
	};
	
	//initialization code.
	function init(){
		document.onkeydown = handleKeyPress;

		window.setInterval(draw, 30);
		console.log(options);
		console.log(keys);
	};
	
	init();
	
	return this;
	/*return {
		init: init,
		bindKey: bindKey,
		flipHorizontal: flipHorizontal,
		flipVertical: flipVertical,
		stopStart: stopStart,
		caret: caret,
		draw: draw,
		increaseFontSize: function(){setFontSize(text.height + 1); scriptStale = true;},
		decreaseFontSize: function(){setFontSize(text.height -1); scriptStale = true;},
		setText: function(text){script = text;},
		getRemoteScript: getRemoteScript,
	};*/
	

}
