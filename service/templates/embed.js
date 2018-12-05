// check for or set up the global widget registry for the page
if (!RDB_WIDGET_REGISTRY) {
    var RDB_WIDGET_REGISTRY = {
        assets: false,
        pending : [],
        widgets: {}
    }
}

// register the current widget
RDB_WIDGET_REGISTRY.pending.push("{{ id }}");

// wait for the main page to load its JQuery implementation
var waitForJQuery{{ id }} = setInterval(function () {
    if (typeof $ != 'undefined') {
        // localise the widget configuration
        var widgetConfig = RDB_WIDGET_CONFIG_{{ id }};

        // load the embed data into the widget div
        jQuery(document).ready(function ($) {
            var assets = "false";
            if (RDB_WIDGET_REGISTRY.assets === false) {
                assets = "true";
                RDB_WIDGET_REGISTRY.assets = true
            }
            $("#" + widgetConfig.id).load(widgetConfig.include + "?id=" + widgetConfig.id + "&base=" + encodeURIComponent(widgetConfig.base) + "&assets=" + assets);
        });
        clearInterval(waitForJQuery{{ id }});
    }
}, 30);
