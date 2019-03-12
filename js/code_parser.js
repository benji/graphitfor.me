var PMapConfig = {
  mainSeparator: ':',
  dependencySeparator: ',',
  nodeDefinitionPrefix: '+',
  commentPrefix: '#',
  importKeyword: '@import',
  importSeparator: ' ',
  headerSeparator: ' '
}

var CodeParser = function(options) {
  options = options || {}
  options.onError = options.onError || function(ex) { console.log(ex); }
  
  return {
    nodes: {},
    orientation: 'TB',
    imports: options.imports || {},
    nodeParams: {
      color: '#fff',
      nodesep: "50",
      ranksep: "30"
    },

    onSuccess: options.onSuccess || function(){},
    onError: function(ex){
      if (this.error) return; // already got an error, throw event only once
      this.error = ex
      options.onError(ex)
    },
    
    readHeader: function(header) {
      var parts = header.trim().split(PMapConfig.headerSeparator)
      for (var i=0; i<parts.length; i++) {
        var headElement = parts[i].trim().toLowerCase()
        if (headElement != "") {
          if      (headElement == 'top-bottom' || headElement == 'tb') this.orientation = 'TB'
          else if (headElement == 'bottom-top' || headElement == 'bt') this.orientation = 'BT'
          else if (headElement == 'left-right' || headElement == 'lr') this.orientation = 'LR'
          else if (headElement == 'right-left' || headElement == 'rl') this.orientation = 'RL'
          else {
            var recognized = false
            for (var param in this.nodeParams) {
              if (headElement.indexOf(param+":") == 0) {
                this.nodeParams[param] = headElement.replace(param+":", "")
                recognized = true
              }
            }
            if (!recognized) return false
          }
        }
      }
      return true
    },
    readImport: function(line, lineNum) {
      var parts = line.replace("@import", "").split(PMapConfig.importSeparator)
      var importDataId = parts[1].trim()

      var importsOpts = {}
      for (var i = 2 ; i < parts.length ; i++) importsOpts[ parts[i] ] = true

      this.imports[importDataId] = importsOpts
    },
    readNodeDefinition: function(line) {
      // parse argument definition
      var parts = line.substring(1, line.length).split(PMapConfig.mainSeparator)
      if (parts.length < 2) {
        throw "Unable to parse argument definition: " + line
      }
      var node = {
        id: parts[0],
        title: parts[1],
        sources: [],
        dataId: this.dataId
      }
      for (var param in this.nodeParams) {
        node[param] = this.nodeParams[param]
      }
      if (parts.length == 3) {
        var deps = parts[2].split(PMapConfig.dependencySeparator)
        for (var j in deps) {
          var dep = deps[j].trim()
          if (dep != "") node.sources.push(dep)
        }
      }
      return node
    },
    readNodeDescription: function(node, line) {
      if (node) {
        // parse argument description
        if (node.description) node.description += "\n" + line
        else node.description = line
      } else if (line!="") {
        throw "No node defined for description: " + line
      }
    },
    read : function(str, onSuccess) {
      this.nodes = {}
      this.imports = {}
      var arr = str.split(/[\r\n]/g)
      for (var i in arr) {
        var line = arr[i].trim()
        // console.log("Parsing line "+i+" : "+line)
        if (line.indexOf(PMapConfig.commentPrefix) == 0) continue // comment

        var isImport = line.indexOf(PMapConfig.importKeyword) == 0
        var isNodeDef = line.indexOf(PMapConfig.nodeDefinitionPrefix) == 0

        if (_.size(this.nodes) == 0 && !isImport && !isNodeDef) {
          this.readHeader(line)
          continue
        }

        var node
        try {
          if (isImport) {
            this.readImport(line, i)
          } else if (isNodeDef) {
            node = this.readNodeDefinition(line, i)
            // console.log("Read node",node)
            this.nodes[node.id] = node
          } else {
            this.readNodeDescription(node, line, i)
          }
        } catch (err) {
          this.onError({
            message: err,
            line: i
          })
          return
        }
      }
      onSuccess()
    }
  }
}
