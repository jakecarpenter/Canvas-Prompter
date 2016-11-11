RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

var PROMPTER = function (options) {
	//declare our variables.
	var options, keys, frameRate, script, orientation, width, height, textStyles = {}, textClasses = {}, caret = {},
	progress = {}, paused, overlayStale, scriptStale, currentPercent,
	scrollPosY, scrollSpeed, containerElement, scriptCanvas, scriptContext, overlayCanvas, overlayContext, draw, scriptify,
	scriptOpen, readline = 20, readlineY, scriptHeight, lineHeight, currentLine = "9999999999999", numLines = 0;

	//if no options, great we'll do it all by ourself.
	options = options || {};

	keys = options.keys || {
		//setup the default keys.
		// x = 88, y = 89, 32 = space, 38 = up, u = 85, i = 73
		88: "flipHorizontal", // x
		89: "flipVertical", // y
		32: "stopStart", // space bar
		39: "getScript", // right arrow
		85: "decreaseFontSize", // u
		73: "increaseFontSize", // i
		187: 'increaseSpeed',
		189: 'decreaseSpeed',
		86: 'resetScript',
		83: 'scriptify',
		77: 'maximize', //make the prompter full window.
		78: 'toggleCaret',
		36: 'scriptHome',
		35: 'scriptEnd',
		70: 'bigForwardStep',
		71: 'littleForwardStep',
		72: 'littleBackwardStep',
		74: 'bigBackwardStep',
		34: 'nextMarker',
		33: 'lastMarker'
	};

	//how often do we redraw: (in milliseconds)
	frameRate = 40;

	//first, what text are we showing the user?
	script = scriptify("no script loaded.");

	//orietation is for tablet devices.
	orientation = options.orientation || 90;

	//default width & height, get monkeyed with when orientation changes.
	width = options.width || 900;
	height = options.height || 650;

	//initial text settings, can be changed anytime. classes are base, information, notice, important
	addTextStyle = function(name, style){

		var newStyle = {};
		//make sure we have the impartnat parts.
		if(!style.hasOwnProperty('height') ||
			 !style.hasOwnProperty('color') ||
			 !style.hasOwnProperty('background' ||
		 	 name == undefined)) {
			return false;
		}
		var weight = (style.hasOwnProperty('weight') && style.weight != undefined)? style.weight : "bold";
		var font = (style.hasOwnProperty('font') && style.font != undefined)? style.font : "sans-serif";
		newStyle.x = 5;
		newStyle.height = style.height;
		newStyle.font = weight + " " + style.height + "px " + font;
		newStyle.style = style.color;
		newStyle.background = style.background;
		textStyles[name] = newStyle;
	}

	//text classes
	addTextClass = function(name, klass) {
		if(!klass.hasOwnProperty('start') ||
			 !klass.hasOwnProperty('end') ||
			 !klass.hasOwnProperty('style' ||
		 	 name == undefined)) {
			return false;
		}

		textClasses[name] = klass;
	}
	//addTextClass("information", {"start": "<", "end": ">", "style": "information", "fullWidth": false})
//caret/guidline setup.
	setupCaret = function(cOptions){
			cOptions = cOptions || {};
			caret.color = caret.color || cOptions.color || "yellow";
			caret.x = caret.x || cOptions.x || 10;
			caret.y = readlineY || 0;
			caret.height = caret.height || cOptions.height || 40;
			caret.width = caret.width || cOptions.width || 40;
			caret.visible = caret.visible || cOptions.visible;
			caret.readline = caret.readline || cOptions.readline;
	}

	//progress indication
	progress.text = false;
	progress.bar = false;

	//if there was a container element specified, use it, otherwise make our own
	containerElement = options.container || function(){
		var c = document.createElement('div');
		c.setAttribute('id', 'prompterContainer');
		document.body.appendChild(c);
		return c;
	}();

	//we're going to use two canvases, one for the script text, and one for the overlay.

	// script canvas element stuff.
	scriptCanvas = function(){
		var c = document.createElement('canvas');
		c.setAttribute('id', 'scriptCanvas');
		c.setAttribute('class', 'scriptCan');
		c.setAttribute('height', height);
		c.setAttribute('width', width);
		containerElement.appendChild(c);
		return c;
	}();

	// overlay canvas element stuff.
	overlayCanvas = function(){
		var c = document.createElement('canvas');
		c.setAttribute('id', 'overlayCanvas');
		c.setAttribute('class', 'overlayCan');
		c.setAttribute('height', height);
		c.setAttribute('width', width);
		containerElement.appendChild(c);
		return c;
	}();

	scriptContext = scriptCanvas.getContext('2d');
	overlayContext = overlayCanvas.getContext('2d');

	//drawing/refreshing stuff here
	//we start out paused.
	paused = true;

	//we need to know if our overlay or script setup has changed and needs a redraw (ie, its stale)
	overlayStale = true;
	scriptStale = true;

	//position of top of text while scrolling
	scrollPosY = 0;
	scrollSpeed = -1;

	//draw is where the magic happens.
	draw = function(){

		if(overlayStale == true){
			//reset the caret
			setupCaret()
			//clean the slate if something has changed.
			overlayContext.clearRect(0,0,width, height);

			//if we're using a caret, draw it.
			if(caret.visible == true) {
				drawCaret();
			}
			//same with readlines
			if(caret.readline == true){
				drawReadlines();
			}



			//we've redrawn/refigured the overlay, so its no longer stale
			overlayStale = false;
		}

		if(scriptStale === true){
			scriptText = getLines(width - caret.width - 10, script);
			controls.scriptHome();
			scriptStale = false;
		}

		//if we are at the beginning or end of text, stop
		if(scrollPosY > readlineY + lineHeight/2){
			scrollPosY = readlineY + lineHeight/2;
		}
		if(scrollPosY < -scriptHeight + readlineY + lineHeight){
			scrollPosY = -scriptHeight + readlineY + lineHeight;
		}



		//clear the canvas
		scriptContext.clearRect(0,0,width, height);

		var lineOffsetY = 0;

		for(var line in scriptText){
			var scrollY =  scrollPosY + lineOffsetY;
			var currentX = textStyles["base"].x + caret.width;



			//only show lines that are on the screen
			if(scrollY > height + (textStyles["base"].height * 1.25)){
				continue;
			}
			if(
				scrollY > 0 - (textStyles["base"].height * 1.25) && //top of text
				scrollY < height + textStyles["base"].height //bottom of text
			){

			//determine if this line is at the readline. if so, log it
			if(scrollY < readlineY + lineHeight / 2 && scrollY > readlineY - lineHeight / 2){
				if(currentLine != line){
					// console.log(scriptText[line]) // this would be for CC
					// console.log((line / numLines) * 100) // this shows percentate
					currentPercentComplete = (line / numLines) * 100
					currentLine = line
				}
			}


				for(var word in scriptText[line]){
					// if the word is a space, skip it.
					if(scriptText[line][word].word == " " && +word == 0){
						continue;
					}
					//if the text has a background, draw it:
					scriptContext.fillStyle = textStyles[scriptText[line][word].class].background;
					scriptContext.fillRect(currentX, scrollY - (textStyles[scriptText[line][word].class].height), scriptText[line][word].width,(textStyles[scriptText[line][word].class].height*1.1));

					//setup text:
					scriptContext.font = textStyles[scriptText[line][word].class].font;
					scriptContext.fillStyle = textStyles[scriptText[line][word].class].style;
					scriptContext.textBaseline = textStyles[scriptText[line][word].class].baseline;

					//draw the text
					scriptContext.fillText(scriptText[line][word].word, currentX, scrollY);
					currentX+=scriptText[line][word].width;
				}
				//scriptContext.fillText(scriptText[line], text.x + caret.width, scrollY);

			}

			lineOffsetY += textStyles["base"].height * 1.1;

		}
		//update percentages.
		getCompletion();
				//if we want the progress bar:
		if(progress.bar == true){
			drawProgress();
		}	
		//if we want the percentage complete:
		if(progress.text == true){
			drawPercent();
		}
	};

	//a function to set the canvas size, at anytime
	var setCanvasSize = function(newWidth, newHeight){

		overlayCanvas.setAttribute('height',newHeight);
		overlayCanvas.setAttribute('width',newWidth);

		scriptCanvas.setAttribute('height',newHeight);
		scriptCanvas.setAttribute('width',newWidth);

		height = newHeight;
		width = newWidth;
	}

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
		getScript: function(scriptPath){
			// script = scriptify(getRemoteScript(options.script.url, true));
			scriptOpen()
		},
		increaseSpeed: function(){
			scrollSpeed -= 1;
		},
		decreaseSpeed: function(){
			scrollSpeed += 1;
		},
		resetScript: function(){
			scrollPosY = readlineY;
			paused = true;
			scrollSpeed = -1;
		},
		maximize: function(){
			setCanvasSize(document.body.clientWidth,document.body.clientHeight);
			overlayStale = true;
			scriptStale = true;
			readlineY = document.body.clientHeight * (readline/100);
		},
		increaseFontSize: function(){
			for(style in textStyles){
				textStyles[style].font = textStyles[style].font.replace(textStyles[style].height +"px", (textStyles[style].height += 2)+"px");
			}
			scriptStale = true;
		},
		decreaseFontSize: function(){
			for(style in textStyles){
				textStyles[style].font = textStyles[style].font.replace(textStyles[style].height +"px", (textStyles[style].height -= 2)+"px");
			}
			scriptStale = true;
		},
		toggleCaret: function(){
			caret.visible = !caret.visible;
			overlayStale = true;
			return caret.visible;
		},
		toggleReadline: function(){
			caret.readline = !caret.readline;
			overlayStale = true;
			return caret.readline;
		},
		toggleProgress: function(){
			progress.bar = !progress.bar;
			overlayStale = true;
			
			return progress.bar;
		},
		togglePercent: function(){
			progress.text = !progress.text;
			overlayStale = true;			
			return progress.text;
		},
		scriptHome: function(){
			scrollPosY = readlineY + (lineHeight / 2);
		},
		scriptEnd: function(){
			scrollPosY = -scriptHeight + readlineY + (lineHeight * 1.4)
		},
		bigForwardStep: function(){
			scrollPosY -= 6
		},
		littleForwardStep: function(){
			scrollPosY -= 2
		},
		bigBackwardStep: function(){
			scrollPosY += 6
		},
		littleBackwardStep: function(){
			scrollPosY += 2
		},
		nextMarker: function(){

		},
		previousMarker: function(){

		}

	}

	drawCaret = function(){
		//draw a caret
		overlayContext.fillStyle = caret.color;
		overlayContext.beginPath();
		overlayContext.moveTo(caret.x, caret.y - (caret.height/2));
		overlayContext.lineTo(caret.x + caret.width, caret.y);
		overlayContext.lineTo(caret.x, caret.y + (caret.height/2));
		overlayContext.fill();
	}
	drawReadlines = function(){
		overlayContext.strokeStyle="#FFFFFF";
		overlayContext.beginPath();
		overlayContext.moveTo(0,readlineY - (lineHeight /2));
		overlayContext.lineTo(width,readlineY - (lineHeight /2));
		overlayContext.moveTo(0,readlineY);
		overlayContext.lineTo(width,readlineY);
		overlayContext.moveTo(0,readlineY + (lineHeight /2));
		overlayContext.lineTo(width,readlineY + (lineHeight /2));
		overlayContext.stroke();
	}

	drawProgress = function(){
		overlayContext.fillStyle = "yellow";
		overlayContext.clearRect(0, height - 12, width, 12);
		overlayContext.fillRect(0, height - 12, (width * currentPercent), 12);
	}

	drawPercent = function(){
		overlayContext.clearRect(10, height - 47, 25, 25);
		overlayContext.font = "sans-serif";
		overlayContext.fillStyle = "white";
		overlayContext.fillText((Math.round(currentPercent*100)),10, height - 22, 25)
	}

	getCompletion = function(){
		var total = Math.abs(-scriptHeight + readlineY + (lineHeight * 1.4));
		var home = readlineY + (lineHeight / 2);
		var current = scrollPosY - home;
		currentPercent = Math.abs(current/total);
	}

	getLines = function(width, script){
		//seperate obj to keep track of lines.
		var lines = {};

		//seomthing to keep track of line width
		var lineWidth = 0;

		//counters
		var i = 0;
		var lastClass = "base";

		for(word in script){
			//we need a way to start a new line
			var carriageReturn = function(){
				i++;
				lineWidth = 0;
			}

			//what kind of text are we working with here?
			var wordClass = script[word].class;

			//if the class changes to from important to something else or vice versa, newline
			if(wordClass.fullWidth == true){
				carriageReturn();
			}


			lines[i] = lines[i] || {};
			lines[i][word] = script[word];

			//we've got to measeure the text with the appropriate font.
			scriptContext.font = textStyles[wordClass].font || text.base.font;
			scriptContext.fillStyle = textStyles[wordClass].style;
			scriptContext.textBaseline = textStyles[wordClass].baseline;

			//measure and store width
			lines[i][word].width = scriptContext.measureText(script[word].word).width
			lineWidth+= lines[i][word].width;

			//if we are close to the edge, newline.
			if(lineWidth >= width - (0.25*width)){
				carriageReturn();
			}

			lastClass = wordClass;
		}
		scriptHeight = i * (textStyles["base"].height*1.1);
		numLines = i;
		return lines;
	}

	/*
	 * convert the script string to an object that we can more easily process into a preetty script.
	 */
	function scriptify(scriptString){

		scriptString = scriptString || "load a script";

		var script = {};

		//split the string on spaces
		var tempArray = scriptString.split(/( |<<|>>|\[|\]|\{|\})/im);

		//set the default world class.
		var wordClass = "base";

		for(var i = 0 ; i < tempArray.length; i++){
			/*determine the script class
			*/
			var endings = [];
			var marker = false;
			for(var textClass in textClasses){
				tClass = textClasses[textClass];
				if(tClass.hasOwnProperty("start") && tClass.hasOwnProperty("end") && tClass.start != undefined && tClass.end != undefined){
					endings.push(tClass.end)
					 if(tempArray[i].search(new RegExp(RegExp.escape(tClass.start)), "img") >= 0){
						 	marker = tClass.marker
			 				wordClass = textClass;
						}
				}
			}

			//add the class and word to the line
			if(tempArray[i] != ""){
				script[i] = {
					'word': "" + tempArray[i],
					'class': wordClass,
				}
			}

			//if we recieve an end tag, go back to base class /\}|>>|\]/
			var endExp = new RegExp(endings.join("|"))
			if(tempArray[i].search(endExp) >= 0){
 				wordClass = "base";
			}


		}

		//return the processed object
		return script;
	}

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


	var animate = function(){
		requestAnimationFrame(draw);
		!paused ? scrollPosY += scrollSpeed : null ;
		window.setTimeout(animate, frameRate);
	};

	//set up script open handler
	var onScriptOpen = function(fn){
		scriptOpen = fn;
		return true;
	}

	var setScript = function(rawScript){
		script = scriptify(rawScript)
		scriptStale = true;
	}

	//initialization code.
	var init = function(){
		document.onkeydown = handleKeyPress;
		addTextStyle("base",{"height": 64, "color": "white", "background":"black"});
	  addTextStyle("information",{"height": 64, "color": "yellow", "background":"black"});
	  addTextStyle("notice",{"height": 64, "color": "pink", "background":"black"});
	  addTextStyle("important",{"height": 64, "color": "black", "background":"white"});

	  addTextClass("information", {"start": "<", "end": ">", "style": "information", "fullWidth": false})
	  addTextClass("notice", {"start": "{", "end": "}", "style": "information", "fullWidth": false})
	  addTextClass("important", {"start": "[", "end": "]", "style": "information", "fullWidth": true, "marker":true})

		setupCaret({"color": "green", "height": 50, "width": 50, "x": 5})
		lineHeight = textStyles["base"].height*1.1
		animate()
		controls.toggleCaret();
		controls.togglePercent();
		controls.toggleProgress();
	};

	init();
	return {
		init: init,
		maximize: controls.maximize,
		updateScript: scriptify,
		onScriptOpen: onScriptOpen,
		setScript: setScript,
		controls: controls
	};
}
