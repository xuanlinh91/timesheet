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
    var domain = "http://localhost/timesheet_backend/src/";

    var timesheets = [];
    var currentMonth = '2019/02/01';
    var lunchBreak = new time().fromText("01:00");
    var overtimeBreak = new time().fromText("00:30");
    var regularStartTime = new time().fromText("10:00");
    var regularEndTime = new time().fromText("19:00");
    var regularWorkTime = new time().fromText("08:00");
    let today = new Date();
    let todayFormatted = today.getFullYear() + '-' + formatNumberLessThanTen((today.getMonth() + 1)) + '-' + today.getDate();

    async function mainApp() {
        await getCurrentTimesheet();
    }

    $('.holiday-toggle').click(function (e) {
        let dayOff = $("#day_off").val();
        if (dayOff === $(this).text()) {
            $(".time-sheet-control input[type=time]").each(function () {
                $(this).prop('disabled', false);
            });

            $("#day_off").val('false');
        } else {
            $(".time-sheet-control input[type=time]").each(function () {
                $(this).prop('disabled', true);
                $(this).val('');
            });

            $("#day_off").val($(this).text());
        }

    });


    $('#login_submit').click(function (event) {
        var username = $('#username').val();
        var password = Sha1.hash($('#password').val());
        $.ajax({
            method: "POST",
            dataType: 'json',
            url: domain + "login.php",
            data: {username: username, password: password}
        })
                .done(function (data) {
                    onLoginDone(data);
                });

        event.preventDefault();
    });

    function onEditRecord() {
        let id = $(this).data('id');
        let editDate = timesheets[id][0];
        let weekday = dayOfWeek(dateFromString(editDate));
        let dayOffFlag = timesheets[id][9];
        if (dayOffFlag) {
            $('#day_off').val(dayOffFlag);
            $(".time-sheet-control input[type=time]").each(function () {
                $(this).prop('disabled', true);
            });
        } else {
            $(".time-sheet-control input[type=time]").each(function () {
                $(this).prop('disabled', false);
            });
        }

        $('#timesheet_date').val(formatDate(dateFromString(editDate), '-'));
        $('#timesheet_date_weekday').html(timesheets[id][1]);
        if (weekday === '土' || weekday === '日') {
            $('#start_time').val('');
            $('#end_time').val('');
        } else {
            $('#start_time').val(formatTimeLessThanTen(timesheets[id][2]));
            $('#end_time').val(formatTimeLessThanTen(timesheets[id][3]));
        }

        $('#break_time').val(formatTimeLessThanTen(timesheets[id][4]));
        $('#work_time').val(formatTimeLessThanTen(timesheets[id][5]));
        $('#overwork_time').val(formatTimeLessThanTen(timesheets[id][6]));
        $('#early_time').val(formatTimeLessThanTen(timesheets[id][7]));
        $('#late_time').val(formatTimeLessThanTen(timesheets[id][8]));
        $('#time_sheet_note').val(timesheets[id][10]);
        $('#recordId').val(id);

        $('html, body').animate({
            scrollTop: $("#start_time").offset().top
        }, 1000);
    }

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
        new_record[0] = formatDate(new Date($('#timesheet_date').val()));
        new_record[1] = $('#weekday').html();
        let dayOffValue = $('#day_off').val();
        new_record[10] = $('#time_sheet_note').val();
        if (isHoliday()) {
            new_record[9] = dayOffValue;
        } else {
            let startTime = new time().fromText($('#start_time').val());
            let endTime = new time().fromText($('#end_time').val());
            let breakTime = $('#break_time').val();
            if (breakTime === "") {
                breakTime = isWorkOverTime(startTime, endTime) ? overtimeBreak.displayTime() : "";
            }
            // let workTime = calculateWorkTime(startTime, endTime);
            // let overWorkTime = caculateOverworkTime(workTime);
            // let earlyTime = caculateEarlyTime(startTime);
            // let lateTime = caculateLateTime(startTime);
            new_record[2] = startTime.displayTime();
            new_record[3] = endTime.displayTime();
            new_record[4] = breakTime;

            new_record[5] = $('#work_time').val();
            new_record[6] = $('#overwork_time').val();
            new_record[7] = $('#late_time').val();
            new_record[8] = $('#early_time').val();
            new_record[10] = $('#time_sheet_note').val();
            // new_record[5] = workTime.displayTime();
            // new_record[6] = isWorkOverTime(startTime, endTime) ? overWorkTime.displayTime() : "";
            // new_record[7] = lateTime ? lateTime.displayTime() : "";
            // new_record[8] = earlyTime ? earlyTime.displayTime() : "";
        }

        let id = $('#recordId').val();
        await saveRecord(new_record, id);
        await getCurrentTimesheet();
        drawTimesheet();
        $('html, body').animate({
            scrollTop: $("tr#" + id).offset().top
        }, 1000);

    }

    function checkTimesheetExplicit() {
        let currentMonthObj = dateFromString(currentMonth);
        let days = daysInMonth(currentMonthObj.getMonth(), currentMonthObj.getFullYear());
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

    function formatDate(date, seperator = '/') {
        let dd = date.getDate();
        let mm = date.getMonth() + 1; //January is 0!
        let yyyy = date.getFullYear();

        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }

        let result = yyyy + seperator + mm + seperator + dd;

        return result;
    }

    function dayOfWeek(date) {
        return weekday[date.getDay()];
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
            timesheet.forEach(function (col, index) {
                if (index === 0) {
                    col = toJpMonthDate(col);
                    var td = `<td>
                                <div class="row-input">
                                    <span class="turnBoxButton">` + col + `</span>
                                    <div>
                                        <button class="btn btn-primary turnBoxButton turnBoxButtonPrev edit-row" data-id="` + row + `">Edit</button>
                                    </div>
                                </div>
                            </td>`;
                } else {
                    var td = "<td>" + col + "</td>";
                }

                $('#time_sheet table tbody tr:last-child').append(td);
            });

            $('#timesheet_date').val(todayFormatted);
            $('#timesheet_date_weekday').html(dayOfWeek(today));
            $('#weekday').html(dayOfWeek(new Date()));
            if (dayOfWeek(today) === '土' || dayOfWeek(today) === '日') {
                $('#start_time').val('');
                $('#end_time').val('');
            } else {
                $('#start_time').val(regularStartTime.displayTime());
                $('#end_time').val(regularEndTime.displayTime());
            }

            // todo Add processing for edit button
            // let editBtn = $('<button class="btn btn-sm btn-info record-edit-btn" data-rowId=' + index + ' >Edit</button>');
            // $('#time_sheet table tbody tr:last-child').append(editBtn);
        });

        $x(".row-input").turnBox({
            type: "skip"
        });

        $('.edit-row').click(onEditRecord);
        checkTimesheetExplicit();
    }

    function calculateWorkTime(startTime, endTime) {
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
        } else
            return null;
    }

    function caculateLateTime(startTime) {
        let start = new time();
        Object.assign(start, startTime);
        if (startTime.greaterThan(regularStartTime)) {
            return start.minus(regularStartTime);
        } else
            return null;

    }

    function isWorkOverTime(startTime, endTime) {
        return startTime.lessThan(regularStartTime) || endTime.greaterThan(regularEndTime) ? true : false;
    }

    function isHoliday() {
        let dayOffValue = $('#day_off').val();
        if (dayOffValue !== 'false') {
            return true;
        } else
            return false

    }

    function toJpMonthDate(monthDate) {
        let tmp = monthDate.split('/');
        return tmp[1] + "月" + tmp[2] + "日";
    }

    function dateFromString(str) {
        let tmp = str.split('/');
        tmp[1] = parseInt(tmp[1]) - 1; //January start from 0
        return new Date(tmp[0], tmp[1], tmp[2]);
    }

    function daysInMonth(month, year) {
        return new Date(year, month, 0).getDate();
    }

    $(window).bind('scroll', function () {
        if ($(window).scrollTop() > 50) {
            $('.menu').addClass('fixed');
        } else {
            $('.menu').removeClass('fixed');
        }
    });
});

