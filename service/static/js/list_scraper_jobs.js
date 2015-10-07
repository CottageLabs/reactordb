$(document).ready(function(){

    var url = "/list_scraper_jobs";
    var count = 0;

    function receiveScraperJobs(data, status, jqXHR) {

        // update the job status
        $("#scraperjobs").html(data);

        // update the values on page
        if (count < 10) {
            count = count + 1;
            setTimeout(updateScraperJobs, 1000);
        }
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
