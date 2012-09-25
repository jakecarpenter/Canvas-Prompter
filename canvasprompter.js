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
			27: 'resetScript',
			//development
			83: 'scriptify',
		};
		
		options.script = options.script || {};
	
	//first, what text are we showing the user?
	var script = scriptify("Lorem <<ipsum>> dolor {sit} amet, [*** consectetur adipiscing elit. ***] Sed augue sem,"+
	"porta id pharetra sit amet, dignissim egestas orci. Duis iaculis luctus"+
	"vehicula. Fusce orci sapien, pharetra ac molestie eu, tincidunt sed ipsum. "+
	"Integer sit amet dolor eu est viverra ultrices. Suspendisse potenti. "+
	"Nullam semper neque quis odio laoreet consectetur egestas eros pretium. "+
	"Praesent accumsan dictum pretium. Morbi tristique nulla sit amet nisl "+
	"lacinia et cursus neque molestie. ");
	
	//orietation is for tablet devices.
	var orientation = options.orientation || 90;
	
	//default width & height, get monkeyed with when orientation changes.
	var width = options.width || 900;
	var height = options.height || 650;
	
	//initial text settings, can be changed anytime. classes are base, information, notice, important
	var text =  {base:{},information:{},notice:{},important:{}};
		text.base.x = 5;
		text.base.height = 44;
		text.base.font = "bold "+ text.base.height +"px sans-serif";
		text.base.baseline = options.text.baseline || "top";
		text.base.style = "#fff";
		text.base.background = "#000";
		
		text.information.x = 5;
		text.information.height = 44;
		text.information.font = "bold "+ text.information.height +"px sans-serif";
		text.information.baseline = options.text.baseline || "top";
		text.information.style = "yellow";
		text.information.background = "#000";
		
		text.notice.x = 5;
		text.notice.height = 44;
		text.notice.font = "bold "+ text.notice.height +"px sans-serif";
		text.notice.baseline = options.text.baseline || "top";
		text.notice.style = "pink";
		text.notice.background = "#000";
		
		text.important.x = 5;
		text.important.height = 44;
		text.important.font = "bold "+ text.important.height +"px sans-serif";
		text.important.baseline = options.text.baseline || "top";
		text.important.style = "#000";
		text.important.background = "#fff";
		

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
	var draw = function(){
		
		if(overlayStale == true){
			//clean the slate if something has changed.
			overlayContext.clearRect(0,0,width, height);
			
			//if we're using a caret, draw it.
			if(caret.visible === true) {
				drawCaret();
			}
			
			//we've redrawn/refigured the overlay, so its no longer stale
			overlayStale = false;
		}
		
		if(scriptStale === true){
			scriptText = getLines(width - caret.width - 10, script);
			scriptStale = false;
		}
		
		//clear the canvas
		scriptContext.clearRect(0,0,width, height);

		var lineOffsetY = 0;

		for(var line in scriptText){
			var scrollY =  scrollPosY + lineOffsetY;
			var currentX = text.base.x + caret.width;
			
			//only show lines that are on the screen
			if(scrollY > 0 - text.base.height){
				
				for(var word in scriptText[line]){

					//setup text: 
					
					scriptContext.font = text[scriptText[line][word].class].font;
					scriptContext.fillStyle = text[scriptText[line][word].class].style;
					scriptContext.textBaseline = text[scriptText[line][word].class].baseline;
					
					/*
					 * need to implement BG coloring.
					 */					
					scriptContext.fillText(scriptText[line][word].word, currentX, scrollY);
					currentX+=scriptText[line][word].width;
				}
				//scriptContext.fillText(scriptText[line], text.x + caret.width, scrollY);
				
			}
			if(scrollY > height){
				continue;
			}
			lineOffsetY += text.base.height;	
			
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
		},
		scriptify: function(){
			console.log(scriptify(script));
			
		},
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
	
	function getLines(width, script){

		//seperate obj to keep track of lines.
		var lines = {};
		
		
		//seomthing to keep track of line width
		var lineWidth = 0;
		
		//counter
		var i = 0;
		
		for(word in script){
			lines[i] = lines[i] || {};
			lines[i][word] = script[word];
			
			scriptContext.font = text[script[word].class].font || text.base.font;
			scriptContext.fillStyle = text[script[word].class].style;
			scriptContext.textBaseline = text[script[word].class].baseline;
			
			lines[i][word].width = scriptContext.measureText(script[word].word).width
			lineWidth+= lines[i][word].width;
			//if we are close to the edge, newline.
			if(lineWidth >= width - 20){
				i++;
				lineWidth = 0;
			}
		}
		console.log(lines);
		return lines;
	}
	
	/*
	 * convert the script string to an object that we can more easily process into a preetty script.
	 */
	function scriptify(scriptString){
		
		var script = {};
		
		//split the string on spaces
		var tempArray = scriptString.split(/( |<<|>>|\[|\]|\{|\})/im);
		
		//set the default world class.
		var wordClass = "base";
		
		for(var i = 0 ; i < tempArray.length; i++){
			/*determine the script class
			* << starts INFO >>: Yellow Text
			* 
			* {is NOTICE} : Invert, no Line break
			* 
			* [IMPORTANT] : Implies Invert & Line Break
			* 
			*/
			

			//check for an open << tag
			if(tempArray[i].search(/<{2}/im) >= 0){
 				wordClass = "information";
			}
			
			//check for an open { tag
			if(tempArray[i].search(/\{/img) >= 0){
 				wordClass = "notice";
			}
			
			//check for an open [ tag
			if(tempArray[i].search(/\[/img) >= 0){
 				wordClass = "important";
			}
				
			if(tempArray[i] != ""){
				script[i] = {
					'word': "" + tempArray[i],
					'class': wordClass,
				}			
			}
			
			//if we recieve an end tag, go back to base class  
			if(tempArray[i].search(/\}|>>|\]/) >= 0){
 				wordClass = "base";
			}	

			
		}
		
		//return the processed object
		return script;
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
