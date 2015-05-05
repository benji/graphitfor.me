// the onError is set at the level of the loader
// the onSucess is set at the level of the method

function CodeLoader(options) {
  options = options || {}
  
  return {
    nodes: {},
    imports: {},
    orientation: 'TB',

    onError: function(err) {
      this.error = err
      if (options.onError) options.onError(err); else console.log(ex);
    },

    loadCode: function(code, onSuccess) {
      var thisLoader = this
      
      this.loadCodeNoImports(code, function(parser) {
        thisLoader.orientation = parser.orientation
        thisLoader.collectParserResults(parser)
        thisLoader.checkLoaded(onSuccess)
      })
    },

    collectParserResults: function(parser) {
      // copy result
      for (var nodeId in parser.nodes) {
        this.nodes[nodeId] = parser.nodes[nodeId]
        var dataId = this.nodes[nodeId].dataId
        if (dataId) this.nodes[nodeId].display = (this.imports[dataId].all)?true:false
      }
      for (var dataId in parser.imports) {
        if (dataId in this.imports) {} else {
          var imp = parser.imports[dataId]
          imp.loading = imp.loaded = false
          this.imports[dataId] = imp
        }
      }
    },

    loadCodeNoImports: function(code, onSuccess) {
      var parser = CodeParser({
        onError: this.onError
      })
      parser.read(
        code,
        function() {
          onSuccess(parser)
        }
      )
    },

    checkLoaded: function(onSuccess) {
      if (this.error) return

      var allLoaded = true
      for (var importDataId in this.imports) {
        if (!this.imports[importDataId].loaded) allLoaded = false
      }
      if (allLoaded) return onSuccess()
      
      var thisLoader = this

      for (var importDataId in this.imports) {
        var imp = this.imports[importDataId]

        if (!imp.loading && !imp.loaded) {
          thisLoader.imports[importDataId].loading = true

          loadData({
            dataId: importDataId,
            onload: function(code, importId) {
              thisLoader.loadCodeNoImports(code, function(parser) {
                thisLoader.imports[importId].loaded = true
                thisLoader.imports[importId].loading = false

                for (var nodeId in parser.nodes) parser.nodes[nodeId].dataId = importId
                thisLoader.collectParserResults(parser)
                thisLoader.checkLoaded(onSuccess)
              })
            },
            onerror: function(){
              thisLoader.onError({
                message: "Failed to load import " + importDataId,
                line: -10
              })
            }
          })
        }
      }
    }
  }
}
