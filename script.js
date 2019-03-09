$(function () {
    var weekday = new Array(7);
    weekday[0] = "日";
    weekday[1] = "月";
    weekday[2] = "火";
    weekday[3] = "水";
    weekday[4] = "木";
    weekday[5] = "金";
    weekday[6] = "土";

    class time {
        constructor() {
            return this;
        }

        fromText(inputTextTime) {
            let time = inputTextTime.split(":");
            this.hour = parseInt(time[0]);
            this.minute = parseInt(time[1]);

            return this;
        }

        minus(inputTime) {
            let diffHour = this.hour - inputTime.hour;
            let diffMinute = this.minute - inputTime.minute;
            if (diffMinute < 0) {
                diffMinute = diffMinute + 60;
                diffHour--;
            }

            let result = new time();

            return result.fromHourAndMinute(diffHour, diffMinute);
        }

        greaterThan(time) {
            let result = false;
            if (this.hour > time.hour) {
                result = true;
            }
            else if (this.hour == time.hour && this.minute > time.minute) {
                result = true;
            }

            return result;
        }

        lessThan(time) {
            let result = false;
            if (this.hour < time.hour) {
                result = true;
            } else if (this.hour == time.hour && this.minute < time.minute) {
                result = true;
            }

            return result;
        }

        fromHourAndMinute(hour, minute) {
            this.hour = hour;
            this.minute = minute;

            return this;
        }

        fromExcelTime(excelTime) {
            this.hour = Math.floor((excelTime * 86400) / 3600);
            this.minute = Math.round(((excelTime * 86400) % 3600) / 60);

            return this;
        }

        displayTime() {
            return (formatNumberLessThanTen(this.hour) + ":" + formatNumberLessThanTen(this.minute) + ":00").toString();
        }
    }


    var timesheets = [];
    var lunchBreak = new time().fromText("01:00");
    var overtimeBreak = new time().fromText("00:30");
    var regularStartTime = new time().fromText("10:00");
    var regularEndTime = new time().fromText("19:00");
    var regularWorkTime = new time().fromText("08:00");
    $('#date').html(getTodayDateString());
    $('#weekday').html(dayOfWeek());

    mainApp();

    async function mainApp() {
        await getCurrentTimesheet();
    }

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
                if (data.result === 'success') {
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

    $('#save_timesheet').click(onSaveClick);

    async function onSaveClick(){
        let new_record = ["", "", "", "", "", "", "", "", "", "", ""];
        new_record[0] = $('#date').html();
        new_record[1] = $('#weekday').html();
        new_record[10] = $('#time_sheet_note').val();
        if (isHoliday()) {
            new_record[9] = isHoliday();
        } else {
            let startTime = new time().fromText($('#start_time').val());
            let endTime = new time().fromText($('#end_time').val());
            let workTime = caculateWorkTime(startTime, endTime);
            let overWorkTime = caculateOverworkTime(workTime);
            let earlyTime = caculateEarlyTime(startTime);
            let lateTime = caculateLateTime(startTime);
            new_record[2] = startTime.displayTime();
            new_record[3] = endTime.displayTime();
            new_record[4] = isWorkOverTime(startTime, endTime) ? overtimeBreak.displayTime() : "";
            new_record[5] = workTime.displayTime();
            new_record[6] = isWorkOverTime(startTime, endTime) ? overWorkTime.displayTime() : "";
            new_record[7] = lateTime ? lateTime.displayTime() : "";
            new_record[8] = earlyTime ? earlyTime.displayTime() : "";
        }

        let id = $('#recordId').val();
        await saveRecord(new_record, id);
        await getCurrentTimesheet();
        drawTimesheet();
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
            url: "http://localhost:8081/time_sheet_processor.php",
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

    function getTodayDateString() {
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
        // var today = dd + '/' + mm + '/' + yyyy;
        var today = mm + '月' + dd + '日';

        return today;
    }

    function dayOfWeek() {
        var d = new Date();
        return weekday[d.getDay()];
    }

    async function getCurrentTimesheet() {
        await $.ajax({
            method: "POST",
            dataType: 'json',
            url: "http://localhost:8081/time_sheet_processor.php",
            data: {tag: 'getTs'}
        })
            .done(function (data) {
                if (data.result === 'success') {
                    timesheets = data.message;
                    // convertTimesheet(timesheets);
                    drawTimesheet();
                    $('.timesheet-title h1').html(data.title);
                } else {
                    console.log(data.message);
                }
            });
    }

    function drawTimesheet() {
        $('#time_sheet table tbody').html("");
        timesheets.forEach(function (timesheet, index) {
            let rowClass = "";
            if (timesheet[1] === "土") {
                rowClass += " holiday saturday";
            } else if(timesheet[1] === "日"){
                rowClass += " holiday sunday";
            }
            if (timesheet[9] !== "") {
                rowClass += " holiday";
            }

            let tr = "<tr class='timesheet-row" + rowClass + "' id='day" + (index + 1) + "'></tr>";
            $('#time_sheet table tbody').append(tr);
            timesheet.forEach(function (col, index) {
                // if (index === 0) {
                //     col = toJpMonthDate(col);
                // }
                var td = "<td>" + col + "</td>";
                $('#time_sheet table tbody tr:last-child').append(td);
            });

            // let editBtn = $('<button class="btn btn-sm btn-info record-edit-btn" data-rowId=' + index + ' >Edit</button>');
            // $('#time_sheet table tbody tr:last-child').append(editBtn);
        });
    }


    function formatNumberLessThanTen(number) {
        return ('0' + number).slice(-2)
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
        let result = null;
        $('.holiday_toogle').each(function () {
            if ($(this).is(':checked')) {
                result = $(this).data('on');
                return result;
            }
        });

        return result;
    }

    function convertTimesheet(input_timesheets) {
        input_timesheets.forEach(function (timesheet, dateIndex) {
            timesheet.forEach(function (col, index) {
                // if (index > 1 && index < 9 && col !== "") {
                //     let displayTime = new time();
                //     col = displayTime.fromExcelTime(col).displayTime();
                // }

                timesheets[dateIndex][index] = col;
            });
        });
    }

    function toJpMonthDate(monthDate){
        let tmp = monthDate.split('/');
        return tmp[1] + "月" + tmp[2] + "日";
    }
});

