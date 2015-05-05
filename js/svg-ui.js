var currentSvgTranslation, currentSvgScale, currentWindowSize, currentConfigTextareaRatio
var zoom
var highlightedErrorLine = -1, textareaLineHeight
var lineTextareaWidth = 32
var oldGraphCenter
var scaleBoundaries = [.2, 2]

function initializeUI(){
  currentConfigTextareaRatio = graphitConfig.textareaRatio
  currentSvgScale = graphitConfig.zoomScale
  currentWindowSize = getWindowSize()

  svg = d3.select("svg")
  svgGroup = d3.select("#svgGroup")

  // aspects
  if (isIE()) {
    $(".showForIE").show()
  }else{
    $(".hideForIE").show()
  }
  $("#config-textarea").css("width", Math.round($(document).width() * graphitConfig.textareaRatio ))
  resizeContainers()
  updateLineNumbers();
  
  setupHoverActionText("#graph-fullscreen", "Fullscreen")
  setupHoverActionText("#saveImageLink", "Download")
  setupHoverActionText(".file-upload", "Upload")
  setupHoverActionText("#permalink", "Create permanent link")
  setupHoverActionText("#more-info", "Help")

  textareaLineHeight = parseInt( $("#lines-textarea").css('line-height') )
  $("#errorLine").css('height', textareaLineHeight)
  
  if (!graphitConfig.fullScreenTextarea) {
    $("#config-textarea").css("border-right", "1px dashed #aaa")
  }

  // EVENT: file select
  document.getElementById('loadGraphFile').addEventListener('change', handleFileSelect, false);
  // EVENT: window resize
  $( window ).resize( onWindowResize )
  // EVENT: zoom
  zoom = d3.behavior.zoom().scaleExtent(scaleBoundaries).on("zoom", onZoomSvg );
  svg.call(zoom);
  // EVENT: textarea resize
  $( "#config-textarea" ).resize( function(){
    currentConfigTextareaRatio = $("#config-textarea").width() / $(document).width() 
  } );
  // EVENT: textarea scroll
  $( "#config-textarea" ).scroll( onConfigScroll );
  // EVENT: escape key
  $(document).keyup(function(e){
    if(e.keyCode === 27) $("#detailsPopup").hide()
  });
  // EVENT: permalink
  $("#permalink").on("click", function () { $(this).select(); });
  
  $("body").show()
}

function toggleFullScreenGraph(forceFullScreen) {
  var notFullScreen = !fullscreen
	if (forceFullScreen || notFullScreen) {
		oldGraphCenter = getGraphCenter()
		$("svg").css("z-index","100")
		centerGraph(optimalGraphCenter(true))
    fullscreen = true
	} else {
		$("svg").css("z-index","")
		centerGraph(oldGraphCenter)
    fullscreen = false
	}
}

function closeIEWarning(){
  $('#ie-warning').hide()
}

function toggleMoreInfo(){
  $('#graphit-info').toggle()
  $('#action-bar-bg').toggle()
}

function setupHoverActionText(selector, text){
  $(selector).hover(function(){
      $("#actionDetails").text(text)
    },function(){
      $("#actionDetails").text("")
  })
}

function updateLineNumbers(){
  var maxLines = $("#config-textarea").val().split(/\r*\n/).length;
  var linesContent = ""
  for (var i=1; i<=maxLines; i++) linesContent += i+"\n" 
  $("#lines-textarea").val(linesContent)
}

function onWindowResize(){
  resizeContainers()
  var newWindowSize = getWindowSize()
  var diffWindowSize = [newWindowSize[0] - currentWindowSize[0], newWindowSize[1] - currentWindowSize[1]]
  if (currentSvgTranslation) {
    currentSvgTranslation = [currentSvgTranslation[0]+diffWindowSize[0]/2, currentSvgTranslation[1]+diffWindowSize[1]/2]
    zoom.translate(currentSvgTranslation).event(svg);
    currentWindowSize = newWindowSize
  }
}

function onConfigScroll() {
  $("#lines-textarea").scrollTop($( "#config-textarea" ).scrollTop())
  updateHighlightedError()
}

function onZoomSvg(){
  currentSvgTranslation =  d3.event.translate
  currentSvgScale = d3.event.scale
  svgGroup.attr("transform", "translate(" + currentSvgTranslation + ")scale(" + currentSvgScale + ")");
}

function highlightError(line) {
	$("#errorLine").show()
  highlightedErrorLine = parseInt( line )
  updateHighlightedError()
}

function updateHighlightedError() {
  var scroll = $("#lines-textarea").scrollTop()
  $("#errorLine").css('top', textareaLineHeight * highlightedErrorLine + 2 - scroll + 8)
}

function getGraphCenter() {
  if (d3Graph)
    return [ currentSvgTranslation[0] + d3Graph.graph().width * currentSvgScale /2,
             currentSvgTranslation[1] + d3Graph.graph().height * currentSvgScale /2 ]
  else {
		// default
		return [ (1+currentConfigTextareaRatio)*svg.attr("width")/2, svg.attr("height")/2 ]
	}
}

function optimalGraphCenter(forFullScreen) {
		var defaultCenter
		var windowWidth = svg.attr("width")
			
		if (forFullScreen) {
			defaultCenter = [svg.attr("width")/2, svg.attr("height")/2]
		} else {
			// X
			var configTextareaWidth = parseInt(windowWidth*currentConfigTextareaRatio)
			var totalTextareasWidth = lineTextareaWidth + configTextareaWidth
			var spaceLeftForDrawing = windowWidth - totalTextareasWidth
			
			defaultCenter = [ totalTextareasWidth + .5*spaceLeftForDrawing, svg.attr("height")/2 ]
		}
			
		var notOverRightEdgeX = Math.min(defaultCenter[0], windowWidth-d3Graph.graph().width * currentSvgScale/2)
		var notOverLeftEdgeX = Math.max(notOverRightEdgeX, d3Graph.graph().width * currentSvgScale/2)
		
		var notOverBottomEdgeY = Math.min(defaultCenter[1], windowWidth-d3Graph.graph().height * currentSvgScale/2)
		var notOverTopEdgeY = Math.max(notOverBottomEdgeY, d3Graph.graph().height * currentSvgScale/2)
		
		return [ notOverLeftEdgeX, notOverTopEdgeY ]
}

function centerGraph(centerPos, scale) {
	if (centerPos) {} else { centerPos = optimalGraphCenter(); }
  if (scale) {} else { scale = currentSvgScale; }
  
  // Center the graph
  currentSvgTranslation = [
    centerPos[0] - d3Graph.graph().width  * scale/2,
    centerPos[1] - d3Graph.graph().height * scale/2
  ]
  zoom.translate(currentSvgTranslation).scale(scale).event(svg);
  svgGroup.attr('height', d3Graph.graph().height * scale + 40);
}

function resizeContainers() {
  var dim = getWindowSize()
  console.log(dim)
  var w = dim[0]
  var h = dim[1]
  
  $("#svg-canvas").attr("width",w)
  $("#svg-canvas").attr("height",h)
  
  if (graphitConfig.fullScreenTextarea) {
    $("#config-textarea").css("width", w - lineTextareaWidth)
  } else {
    $("#config-textarea").css("width", Math.round(w * currentConfigTextareaRatio))
  }
  $("#config-textarea").css("height",h)
  $("#lines-container").css("height",h)
  $("#lines-textarea").css("height",h)
  $("#graphit-info").css("height",h)
}

function getWindowSize() {
  return [window.innerWidth,  window.innerHeight];
}

