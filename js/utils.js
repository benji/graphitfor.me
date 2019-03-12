var nbScriptsLoadingComplete = 0, scriptCallbacks = []

function makeurl(path){
  return path + (cache?"":"?ts=" + new Date().getTime())
}

function closePopup(){
  $("#detailsPopup").hide()
}

var iframecounter = 0
function createDataIFrame(){
  var iframeid = "dataFrame"+iframecounter++;
  $("body").append("<iframe id=\""+iframeid+"\" style=\"display:none;\"></iframe>")
  return iframeid
}

function getIFrameDOM(iframeid){
  var ifrm = document.getElementById(iframeid);
  ifrm = (ifrm.contentWindow) ? ifrm.contentWindow : (ifrm.contentDocument.document) ? ifrm.contentDocument.document : ifrm.contentDocument;
  return ifrm;
}

function createTextCallback(f){
  var callbackIdx = scriptCallbacks.length
  scriptCallbacks[callbackIdx] = f
  var windowPiece = parent?"parent.":""
  return "javascript:"+windowPiece+"scriptCallbacks["+callbackIdx+"]();"
}

function loadData(options) {
  options.onload = options.onload || function(){}
  options.onerror = options.onerror || function(){}
  options.oncomplete = options.oncomplete || function(){}
  
  var url = makeurl("data/"+options.dataId+".js")
  if (console) console.log("Loading data script: "+url)
  
  var iframeid = createDataIFrame()
  var iframeDOM = getIFrameDOM(iframeid)
  var iframeJQ = $("#"+iframeid)
  
  iframeJQ.attr("onload", createTextCallback(function() {
    if (iframeDOM.codeFunc == null) {
      options.onerror()
    } else {
      var dataCode = iframeDOM.codeFunc.toString().match(/\/\*([^]*)\*\//)[1].trim();
      options.onload(dataCode, options.dataId)
    }
    iframeJQ.remove()
    options.oncomplete()
  }))
  
  iframeDOM.codeFunc = null
  iframeDOM.document.write("<script src='"+url+"'><\/script>");
  iframeDOM.document.close()
}

function toHtml(str) {
  str = str.replace(/(https?:\/\/[^ \r\n]+)/g, "<a href=\"$1\">$1</a>")
  str = str.replace(/[\r\n]/g, "<br/>")
  return str
}

function updatePermaLink() {
  var textareaVal = $("#config-textarea").val()
  var baseurl = window.location.href.replace(/\?.*/,"")
  $("#permalink").attr("href", baseurl+'?d='+LZString.compressToBase64(textareaVal))
}

function limitLabelSize(str, maxLabelLineChars) {
  var words = str.split(" ")
  var currentLineLen = 0
  var currentLineWords = []
  var linesArr = []
  for (var i=0 ; i<words.length; i++) {
    var word = words[i]
    if (currentLineLen + 1 + word.length <= maxLabelLineChars) {
      currentLineLen += 1 + word.length
      currentLineWords.push(word)
    } else {
      linesArr.push(currentLineWords.join(" "))
      currentLineWords = [word]
      currentLineLen = word.length
    }
  }
  if (currentLineWords.length > 0) linesArr.push(currentLineWords.join(" "))
  return linesArr.join("\n")
}

 var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();

function isIE() {
   var ua = window.navigator.userAgent;
  var msie = ua.indexOf("MSIE ");
  return msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)
}

if (window.location.protocol != "file:") {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-3208297-6', 'auto');
  ga('send', 'pageview');
}
