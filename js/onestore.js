var onestore;
function loadOnestore() {
    try {
        onestore = new OneStore.Client({
            jsonify: true,
            onAuthenticationChanged: function(isAuth) {
                //if (isAuth)
                loadGraphs();
            },
            widgetElementId: "onestore-button",
            authMethod: "popup.auto",
            offlineStorageStrategy: "localStorage",
            widgetDisplayStorageType: false,
            logger: console
        });
    } catch (e) {
        console.log("Failed to load OneStore client.");
    }
}

const os_store_name = "graphs";
var graphs = {};

function loadGraphs() {
    onestore.list(os_store_name, { limit: 1000, maxRequests: 50 }, function(err, response) {
        if (err) {
            alert("Failed to load graphs.");
            console.error(err);
        } else {
            graphs = {};
            for (var i in response.data) {
                var item = response.data[i];
                var g = item.userdata;
                g.id = item.id;
                graphs[g.id] = g;
            }
            refresh_graphs_ui();
        }
    });
}

function onestoreSaveGraph() {
    var graph = { name: $("#graphName").val(), data: getCurrentGraphData() };
    onestore.create(os_store_name, graph, function(err, id) {
        if (err) {
            alert("Failed to save graph.");
            console.error(err);
        } else {
            $("#graphName").val("");
            graph.id = id
            graphs[id] = graph;
            refresh_graphs_ui();
        }
    });
}

function refresh_graphs_ui() {
    const graphs_container = $("#graphs");
    graphs_container.empty();

    for (var id in graphs) {
        graphs_container.append(buildGraphItem(graphs[id]));
    }
}

function buildGraphItem(g) {
    var content =
        "<span class='gname' onclick='loadGraph(\"" +
        g.id +
        "\")'>" +
        g.name +
        "</span>";
    content +=
        "<a href='javascript:deleteGraph(\"" +
        g.id +
        "\")'><img class='action-remove' src='img/remove.png'/></a>";
    return "<li id='graph_" + g.id + "'>" + content + "</li>";
}

function deleteGraph(id) {
    var g = graphs[id];
    if (confirm("Delete graph '" + g.name + "'?")) {
        onestore.remove(os_store_name, id, function(err, response) {
            if (err) {
                alert("Failed to remove graph");
                console.error(err);
            } else {
                delete graphs[id];
                refresh_graphs_ui();
            }
        });
    }
}

function loadGraph(id) {
    $("li.selected").removeClass("selected")
    $("li#graph_"+id).addClass("selected")
    loadGraphFromData(graphs[id].data);
}
