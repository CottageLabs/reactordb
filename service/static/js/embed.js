var waitForJQuery = setInterval(function () {
    if (typeof $ != 'undefined') {
        jQuery(document).ready(function ($) {
            $("#" + RDB_WIDGET_CONFIG.id).load(RDB_WIDGET_CONFIG.include + "?id=" + RDB_WIDGET_CONFIG.id + "&base=" + encodeURIComponent(RDB_WIDGET_CONFIG.base));
        });
        clearInterval(waitForJQuery);
    }
}, 10);
