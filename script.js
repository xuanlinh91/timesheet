$(function () {
    var weekday = new Array(7);
    weekday[0] = "日";
    weekday[1] = "月";
    weekday[2] = "火";
    weekday[3] = "水";
    weekday[4] = "木";
    weekday[5] = "金";
    weekday[6] = "土";
    // var domain = "http://ec2-13-230-40-192.ap-northeast-1.compute.amazonaws.com:8081/";
    var domain = "http://localhost:8081/";

    var timesheets = [];
    var currentMonth = '2019/02/01';
    var lunchBreak = new time().fromText("01:00");
    var overtimeBreak = new time().fromText("00:30");
    var regularStartTime = new time().fromText("10:00");
    var regularEndTime = new time().fromText("19:00");
    var regularWorkTime = new time().fromText("08:00");
    $('#date').html(formatJapanDate(new Date()));
    $('#date').data('date', formatDate(new Date()));
    $('#weekday').html(dayOfWeek());

    async function mainApp() {
        await getCurrentTimesheet();
    }

    $('.holiday-toggle').click(function(e){
        $("#start_time").val("");
        $("#end_time").val("");
        $("#day_off").val($(this).text());
        $("#start_time").prop('disabled', true);
        $("#end_time").prop('disabled', true);

        e.stopPropagation();
    });

    $(document).click(function(){
        $("#start_time").prop('disabled', false);
        $("#end_time").prop('disabled', false);
        $("#start_time").val("10:00");
        $("#end_time").val("19:00");
        $("#day_off").val("false");

    });

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
                onLoginDone(data);
            });

        event.preventDefault();
    });

    async function onLoginDone(data) {
        if (data.result === 'success') {
            await mainApp();
            $('#formContent').hide();
            $('.content').show();
        } else {
            $('#error_msg').html(data.message);
        }
    }

    $('#save_timesheet').click(onSaveClick);

    async function onSaveClick() {
        let new_record = ["", "", "", "", "", "", "", "", "", "", ""];
        new_record[0] = $('#date').data('date');
        new_record[1] = $('#weekday').html();
        let dayOffValue = $('#day_off').val();
        new_record[10] = $('#time_sheet_note').val();
        if (isHoliday()) {
            new_record[9] = dayOffValue;
        } else {
            let startTime = new time().fromText($('#start_time').val());
            let endTime = new time().fromText($('#end_time').val());
            // let workTime = caculateWorkTime(startTime, endTime);
            // let overWorkTime = caculateOverworkTime(workTime);
            // let earlyTime = caculateEarlyTime(startTime);
            // let lateTime = caculateLateTime(startTime);
            new_record[2] = startTime.displayTime();
            new_record[3] = endTime.displayTime();
            new_record[4] = isWorkOverTime(startTime, endTime) ? overtimeBreak.displayTime() : "";
            // new_record[5] = workTime.displayTime();
            // new_record[6] = isWorkOverTime(startTime, endTime) ? overWorkTime.displayTime() : "";
            // new_record[7] = lateTime ? lateTime.displayTime() : "";
            // new_record[8] = earlyTime ? earlyTime.displayTime() : "";
        }

        let id = $('#recordId').val();
        await saveRecord(new_record, id);
        await getCurrentTimesheet();
        drawTimesheet();
    }

    function checkTimesheetExplicit(){
        let currentMonthObj = dateFromString(currentMonth);
        let days = daysInMonth(currentMonthObj.getFullYear(), currentMonthObj.getMonth());
        if (timesheets.length >= days) {
            $('.time-sheet-control').hide();
            $('.day-off').hide();
        }
    }

    async function saveRecord(record, id) {
        if (id !== "" && id < timesheets.length) {
            timesheets[id] = record;
        } else {
            timesheets.push(record)
        }

        await $.ajax({
            method: "POST",
            dataType: 'json',
            url: domain + "time_sheet_processor.php",
            data: {tag: 'saveTs', data: timesheets}
        })
            .done(function (data) {
                if (data.result === 'success') {
                    console.log(data.message);
                } else {
                    console.log(data.message);
                }
            });
    }

    function formatJapanDate(date) {
        let dd = date.getDate();
        let mm = date.getMonth() + 1; //January is 0!

        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        let result = mm + '月' + dd + '日';

        return result;
    }

    function formatDate(date) {
        let dd = date.getDate();
        let mm = date.getMonth() + 1; //January is 0!
        let yyyy = date.getFullYear();

        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }

        let result = yyyy + '/' + mm + '/' + dd;

        return result;
    }

    function dayOfWeek() {
        var d = new Date();
        return weekday[d.getDay()];
    }

    async function getCurrentTimesheet() {
        await $.ajax({
            method: "POST",
            dataType: 'json',
            url: domain + "time_sheet_processor.php",
            data: {tag: 'getTs'}
        })
            .done(function (data) {
                if (data.result === 'success') {
                    timesheets = data.message;
                    drawTimesheet();
                    $('.timesheet-title h1').html(data.title);
                } else {
                    console.log(data.message);
                }
            });
    }

    function drawTimesheet() {
        $('#time_sheet table tbody').html("");
        timesheets.forEach(function (timesheet, row) {
            let rowClass = "";
            if (timesheet[1] === "土") {
                rowClass += " holiday saturday";
            } else if (timesheet[1] === "日") {
                rowClass += " holiday sunday";
            }
            if (timesheet[9] !== "") {
                rowClass += " holiday";
            }

            let tr = "<tr class='timesheet-row" + rowClass + "' id='" + row + "'></tr>";
            $('#time_sheet table tbody').append(tr);
            var td = "<td>" + (row + 1) + "</td>";
            $('#time_sheet table tbody tr:last-child').append(td);
            timesheet.forEach(function (col, index) {
                if (index === 0) {
                    col = toJpMonthDate(col);
                }
                var td = "<td>" + col + "</td>";
                $('#time_sheet table tbody tr:last-child').append(td);
            });

            // todo Add processing for edit button
            // let editBtn = $('<button class="btn btn-sm btn-info record-edit-btn" data-rowId=' + index + ' >Edit</button>');
            // $('#time_sheet table tbody tr:last-child').append(editBtn);
        });

        checkTimesheetExplicit();
    }

    function caculateWorkTime(startTime, endTime) {
        let start = new time();
        let end = new time();
        Object.assign(start, startTime);
        Object.assign(end, endTime);
        let workTime = end.minus(start);
        workTime = workTime.minus(lunchBreak);
        if (isWorkOverTime(start, end)) {
            workTime = workTime.minus(overtimeBreak);
        }

        return workTime;
    }

    function caculateOverworkTime(workTime) {
        let work_time = new time();
        Object.assign(work_time, workTime);

        return work_time.minus(regularWorkTime);
    }

    function caculateEarlyTime(startTime) {
        let regular = new time();
        Object.assign(regular, regularStartTime);
        if (startTime.lessThan(regularStartTime)) {
            return regular.minus(startTime);
        } else return null;
    }

    function caculateLateTime(startTime) {
        let start = new time();
        Object.assign(start, startTime);
        if (startTime.greaterThan(regularStartTime)) {
            return start.minus(regularStartTime);
        } else return null;

    }

    function isWorkOverTime(startTime, endTime) {
        return startTime.lessThan(regularStartTime) || endTime.greaterThan(regularEndTime) ? true : false;
    }

    function isHoliday() {
        let dayOffValue = $('#day_off').val();
        if (dayOffValue !== 'false') {
            return true;
        } else return false

    }

    function toJpMonthDate(monthDate) {
        let tmp = monthDate.split('/');
        return tmp[1] + "月" + tmp[2] + "日";
    }

    function dateFromString(str) {
        let tmp = str.split('/');
        // tmp[1] = parseInt(tmp[1]) - 1; //January start from 0
        return new Date(tmp[0], tmp[1], tmp[2]);
    }

    function daysInMonth (month, year) {
        return new Date(year, month, 0).getDate();
    }
});

