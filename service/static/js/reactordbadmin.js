var reactordbadmin = {

    base_url : false,

    updateStatus : function(data) {
        var info = "Currently viewing:&nbsp;";

        var reactor_index = false;
        var operation_index = false;

        // if there's no "next" we're looking at the live database,
        // otherwise we're looking at the preview
        if (!data.reactor.next.cfg && !data.reactor.next.file) {
            info += "Live Database (no current Preview available)";
            reactor_index = data.reactor.curr.cfg ? data.reactor.curr.cfg : data.reactor.curr.file;
        } else {
            info += "Preview Database";
            reactor_index = data.reactor.next.cfg ?  data.reactor.next.cfg : data.reactor.next.file;
        }

        // record which reactor index we're looking at
        info += "<br>Reactor Index:&nbsp;" + reactor_index;

        // now find out which operation index we're looking at
        if (data.operation.next.cfg || data.operation.next.file) {
            operation_index = data.operation.next.cfg ? data.operation.next.cfg : data.operation.next.file;
        } else {
            operation_index = data.operation.curr.cfg ? data.operation.curr.cfg : data.operation.curr.file;
        }
        info += "<br>Operation Index:&nbsp;" + operation_index;

        $("#current-rollout-status").html(info);
    },

    refresh : function() {
        $.ajax({
            type: "GET",
            url: reactordbadmin.base_url + "/rolling/refresh",
            success: reactordbadmin.requestStatus
        });
    },

    rolloutStatus : function(data) {
        reactordbadmin.updateStatus(data);
        reactordbadmin.rebindButtons(data);
        reactordb.activeEdges["#reactor-search"].doQuery();
    },

    requestStatus : function(base_url) {
        reactordbadmin.base_url = base_url;

        // check the rollout status
        $.ajax({
            type: "GET",
            dataType: "jsonp",
            url: base_url + "/rolling/status",
            success: reactordbadmin.rolloutStatus
        });
    },

    rebindButtons : function(data) {
        var hasNext = data.reactor.next.cfg || data.reactor.next.file;
        var hasPrev = data.reactor.prev.cfg || data.reactor.prev.file;

        if (hasNext) {
            $("#publish").removeAttr("disabled").unbind("click").on("click", function (event) {
                event.preventDefault();
                var pub = confirm("Are you sure you want to publish this dataset?\n\nIt will become visible to the public in its current state.");
                if (!pub) { return }
                var postdata = JSON.stringify({types: ["reactor", "operation"]});
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: reactordbadmin.base_url + "/rolling/publish",
                    data : postdata,
                    success: reactordbadmin.requestStatus
                })
            });
        } else {
            $("#publish").unbind("click").attr("disabled", "disabled");
        }

        if (hasPrev) {
            $("#rollback").removeAttr("disabled").unbind("click").on("click", function (event) {
                event.preventDefault();
                var roll = confirm("Are you sure you want to rollback this dataset?\n\nThe old version will become visible to the public, the most recent Preview data will be destroyed, and the current Live will revert back to Preview status.");
                if (!roll) { return }
                var postdata = JSON.stringify({types: ["reactor", "operation"]});
                $.ajax({
                    type: "POST",
                    contentType: "application/json",
                    url: reactordbadmin.base_url + "/rolling/rollback",
                    data : postdata,
                    success: reactordbadmin.requestStatus
                })
            });
        } else {
            $("#rollback").unbind("click").attr("disabled", "disabled");
        }
    }
};
