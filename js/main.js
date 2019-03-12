var graphitConfig = {
  textareaRatio: 0.27,
  fullScreenTextarea: true,
  zoomScale: 0.75,
  limitLabelSize: 30,
  fontSize: 14,
  defaultGraphId: "example",
  hideUnusedImportedNode: true
}

var svg, svgGroup
var d3Graph, render
var previousTextareaVal = ""
var codeFunc, code
var cache = false
var redrawStart
var fullscreen = false

function check(nodes) {
  for (var id in nodes) {
    for (var sidx in nodes[id].sources) {
      var found = false
      for (var id2 in nodes) {
        if (nodes[id].sources[sidx] == id2) {
          found = true
          break
        }
      }
      if (!found) console.log("WARNING: Node "+id+" depends on "+nodes[id].sources[sidx]+" but it doesn't exist.")
    }
  }
}

function initializeGraphIt() {
  console.log("Graphit starts...")

  if (QueryString.d) {
    fullscreen = true
    var code = LZString.decompressFromBase64(QueryString.d)
    startGraphIt(code)
    return
  }
  
  if (QueryString.f) {
    fullscreen = true
  }

  if (QueryString.p) {
    var dataId = QueryString.p

    loadData({
      dataId: dataId,
      onload: function(code) {
        startGraphIt(code)
      },
      onerror: function() {
        console.log("Failed to data "+dataId)
      }
    })
    return
  }
  
  startGraphIt()
}

function startGraphIt(code) {
  if (code) $("#config-textarea").val( code )
  onConfigChange()
  initializeUI()
	var onRedrawComplete = function(){
		if (fullscreen || QueryString.f) toggleFullScreenGraph(true)
	}
  redrawGraph(onRedrawComplete)
  setInterval(redrawGraph, 2000);
}

function onConfigChange() {
  updateLineNumbers()
  onConfigScroll()
}

function redrawGraph(onComplete) {
  redrawStart = new Date().getTime()
  var textareaVal = $("#config-textarea").val()
  if (previousTextareaVal == textareaVal) return
  previousTextareaVal = textareaVal
  
  var codeLoader = CodeLoader({
    onError: function(ex) {
      console.log("Parsing error: "+ex.message)
			console.log("error on line "+ex.line)
      highlightError(ex.line)
    }
  })

  codeLoader.loadCode(textareaVal, function() {
		highlightError(-10)
    onNodesReady(codeLoader, onComplete)
  })
}

function gatherAllUsedIDs(nodes) {
  var collectedUsed = []
  // add all the nodes not imported
  for (id in nodes) {
    var imported = nodes[id].dataId?!nodes[id].display:false
    var show = imported? ( nodes[id].all?true:false ) : true
    if (show) {
      collectedUsed.push(id)
    }
  }
  // add all their dependencies recursively	
  var i = 0
  while (i < collectedUsed.length){
    var id = collectedUsed[i]
		var sources = nodes[id].sources
		for (var sourceid in sources) {
			if (collectedUsed.indexOf(sources[sourceid]) < 0) collectedUsed.push(sources[sourceid])
		}
    i++
  }
  return collectedUsed
}

function onNodesReady(loader, onComplete) {
	var nodes = loader.nodes
  if (_.size(nodes) == 0) return
  
  check(nodes)
   console.log("Refreshing graph...")
  
  // remove sources that don't exist
  for (var id in nodes) {
		var node = nodes[id]
		for (var i=0 ; i < node.sources.length ; ) {
			if (node.sources[i] in nodes) {
				i++
			} else {
				node.sources.splice(i,1)
			}
		}
  }
  
  // remove unused nodes from imports
  if (graphitConfig.hideUnusedImportedNode) {
    var usedIDs = gatherAllUsedIDs(nodes)
    var filtered = {}
    for (var i in usedIDs) {
      var id = usedIDs[i]
      filtered[id] = nodes[id]
    }
    nodes = filtered
  }
  if (_.size(nodes) == 0) {
    console.log("No node to draw")
    return
  }

	var oldCenterPos
	if (d3Graph) oldCenterPos = getGraphCenter()

  // Create new graph
  d3Graph = new dagreD3.graphlib.Graph()
    .setGraph({ rankdir:loader.orientation, nodesep: parseInt(loader.nodeParams.nodesep), edgesep: 10, ranksep: parseInt(loader.nodeParams.ranksep), marginx:10, marginy:10 })
    .setDefaultEdgeLabel(function() { return {}; });
  
  // Add nodes and links
  for (id in nodes) {
    var node = nodes[id]
    d3Graph.setNode(id, {
      id:id,
      label: limitLabelSize( node.title, graphitConfig.limitLabelSize),
      description: node.description,
      rx:5,
      ry:5,
      labelStyle: "font: normal normal bold "+graphitConfig.fontSize+"px Arial; cursor:pointer;",
      class: node.dataId || QueryString.p,
      nodeData: node
    });
    var sources = node.sources
    for (i in sources) {
      if (sources[i] in nodes) d3Graph.setEdge(sources[i], id, {
				id: sources[i] + "-" + id,
				lineInterpolate: 'bundle' // https://github.com/mbostock/d3/wiki/SVG-Shapes#line_interpolate
			});
    }
  }

  // Run the renderer. This is what draws the graph.
  svgGroup.selectAll("*").remove()
  render = new dagreD3.render()
  render(svgGroup, d3Graph)
	
	

  d3.selectAll(".node rect")
    .attr("stroke", "#999")
    .attr("fill", function(id) {
      return d3Graph.node(id).nodeData.color
    })
    .attr("stroke-width", "1.5px")
    .attr("cursor", "pointer")

  d3.selectAll(".edgePath path")
    .attr("stroke", "#333")
    .attr("stroke-width", "1.5px")

  // add click event to nodes
  svgGroup.selectAll("g.node")
    .on('click', function(id) {
      var label = d3Graph.node(id).label
      var description = d3Graph.node(id).description
      if (description && description.trim() != "") {
        $("#detailsPopupTitle").html(label)
        $("#detailsPopupContent").html(toHtml(d3Graph.node(id).description))
        $("#detailsPopup").show()
      }
    })
    .on("mouseover", function(id){ $("#"+id+" rect").css("fill", "#eaeaea"); })
    .on("mouseout", function(id){ $("#"+id+" rect").css("fill", ""); })
  
  centerGraph(oldCenterPos);
  
  console.log("Graph refreshed in "+ (new Date().getTime() - redrawStart)+ " ms");
	
	if (onComplete) onComplete()
}

