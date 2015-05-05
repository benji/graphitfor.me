var PNG_CODE_TOKEN = "_GRAPHITCODE_"

function handleFileSelect(evt) {
  var files = evt.target.files;

  var file = document.getElementById("loadGraphFile").files[0];
  if (file) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (evt) {
      var decoded = evt.target.result.replace(/^data:image\/(png|jpg|svg\+xml);base64,/, "");
      var tmp = base64.decode(decoded)
      code = tmp.split(PNG_CODE_TOKEN)[1]
      $("#config-textarea").val(code)
      redrawGraph()
    }
    reader.onerror = function (evt) {
      console.log(evt)
      alert("Error when reading input file")
    }
  }
}

function parseXML(text){
  if (window.DOMParser) {
    parser=new DOMParser();
    return parser.parseFromString(text,"text/xml");
  } else { // Internet Explorer
    xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async=false;
    xmlDoc.loadXML(text); 
    return xmlDoc
  }
}

function updateSaveImageUrl(){
  if (isIE()) return;
  
  var targetScale = 0.8
  
  $("#canvas").attr("width", d3Graph.graph().width * targetScale)
  $("#canvas").attr("height", d3Graph.graph().height * targetScale)
  var svgxml = new XMLSerializer().serializeToString(document.querySelector('svg'));

  // resize svg element to encompass the whole graph
  var xmlDoc = parseXML(svgxml)
  xmlDoc.getElementById('svg-canvas').setAttribute("width", d3Graph.graph().width*targetScale)
  xmlDoc.getElementById('svg-canvas').setAttribute("height", d3Graph.graph().height*targetScale)
  xmlDoc.getElementById('svgGroup').setAttribute("transform","translate(0,0)scale("+targetScale+")")

  svgxml = new XMLSerializer().serializeToString(xmlDoc)

  // produces an error in IE        
  // xmlns:NS1="http://www.w3.org/XML/1998/namespace" NS1:space="preserve"
  // svgxml=svgxml.replace(/xmlns:NS[0-9]+="[^"]*" NS[0-9]+:space="preserve"/g,"")              
                        
  // Fixes the size discrepancy between SVG and Canvas 
  // var fontRegex = new RegExp("font-size: "+graphitConfig.fontSize+"px","g");
  // var newFontSize = Math.round(SVG_FONT_TO_CANVAS_RATIO*graphitConfig.fontSize)
  // svgxml = svgxml.replace(fontRegex,"font-size: "+newFontSize+"px")

  var canvas = document.getElementById("canvas");
  var canvasCtx = canvas.getContext('2d');
          
  var img = new Image();
  img.src = "data:image/svg+xml;base64," + base64.encode(svgxml)

  $("#openSvgImageLink").attr("href", img.src)

  //img.onload = function() {  
      canvasCtx.drawImage(img, 0, 0);
      // SecurityError in IE
      var url = canvas.toDataURL("image/png");

      // add code inside the image itself
      var tmp = base64.decode( url.replace(/data:image\/png;base64,/,"") )
      tmp += PNG_CODE_TOKEN + $("#config-textarea").val()
      url = "data:image/png;base64," + base64.encode( tmp )

      $("#saveImageLink").attr("href", url)
  //}
}
