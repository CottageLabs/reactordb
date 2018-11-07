var waitForJQuery = setInterval(function () {
    if (typeof $ != 'undefined') {
        jQuery(document).ready(function ($) {
            $('#reactor-widget-container').load("//reactordb.ooz.cottagelabs.com/embed.html");
        });
        clearInterval(waitForJQuery);
    }
}, 10);
