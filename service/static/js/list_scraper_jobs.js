$(document).ready(function(){

    var url = "/list_scraper_jobs";

    function receiveScraperJobs(data, status, jqXHR) {

        // update the job status
        $("#scraperjobs").html(data);

        // update the values on page
        setTimeout(updateScraperJobs, 1000);
    }

    function updateScraperJobs() {
        $.ajax(url, {
            cache: false,
            dataType: 'jsonp',
            type: 'GET',
            success: receiveScraperJobs
        });
    }

    updateScraperJobs();
});
