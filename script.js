$(function() {
    $('#login_submit').click(function (event) {
        var username = $('#username').val();
        var password = $('#password').val();
        $.ajax({
            method: "POST",
            dataType: 'json',
            url: "http://localhost:8081/login.php",
            data: {username: username, password: password}
        })
            .done(function (data) {
                if (data.result === 'success'){
                    $('#formContent').hide();
                    // $('#time_sheet').html(data.html);
                    $('#time_sheet').show();
                    $('#today_time').show();
                } else {
                    $('#error_msg').html(data.message);
                }
            });

        event.preventDefault();
    });

    $('#today').html(getTodayDateString);

    function getTodayDateString(){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!

        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        var today = dd + '/' + mm + '/' + yyyy;

        return today;
    }

    function getCurrentTimesheet(){
        $.ajax({
            method: "POST",
            dataType: 'json',
            url: "http://localhost:8081/getTs.php",
            data: {tag: 'getTs'}
        })
            .done(function (data) {
                if (data.result === 'success'){
                    // $('#time_sheet').html(data.html);
                } else {
                    console.log(data.message);
                }
            });
    }
});
