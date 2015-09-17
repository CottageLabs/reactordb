$(document).ready(function(){

    var url = "/progress/" + job_id + "/status";

    function receiveStatus(data, status, jqXHR) {

        // update the job status
        $("#job_status_code").html(data.status);
        $("#pc_container").width(data.pc+"%");
        $("#pc_container").attr("aria-valuenow", data.pc);
        $("#pc_container").text(data.pc+"%");
        $("#statement_container").html(data.pc_message)

        // update the values on page
        if (data.status !== "complete" && data.status != "error") {
            setTimeout(updateStatus, 1000);
        }
    }

    function updateStatus() {
        $.ajax(url, {
            cache: false,
            dataType: 'jsonp',
            type: 'GET',
            success: receiveStatus
        });
    }

    updateStatus();
});
