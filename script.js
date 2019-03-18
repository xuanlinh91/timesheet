$(function () {
    var weekday = new Array(7);
    weekday[0] = "日";
    weekday[1] = "月";
    weekday[2] = "火";
    weekday[3] = "水";
    weekday[4] = "木";
    weekday[5] = "金";
    weekday[6] = "土";
    var domain = "https://xuanlinh91aws.tk";
    // var domain = "http://localhost/timesheet_backend/src/";

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
        newRecord();
    }

    $('.holiday-toggle').click(function (e) {
        let dayOff = $("#day_off").val();
        if (dayOff === $(this).text()) {
            $(".time-sheet-control input[type=time]").each(function () {
                $(this).prop('disabled', false);
            });

            $("#day_off").val('');
        } else {
            $(".time-sheet-control input[type=time]").each(function () {
                $(this).prop('disabled', true);
                $(this).val('');
            });

            $("#day_off").val($(this).text());
        }

    });

    // When the user scrolls the page, execute myFunction 
    function onScrollFuntion(position, header) {
        if (window.pageYOffset > position) {
            header.classList.add("sticky");
        } else {
            header.classList.remove("sticky");
        }
    }

    $('#download').click(function () {
        $('#download_excel_form').attr('action', domain + 'time_sheet_processor.php');
        $('#download_excel_form').submit();
    });

    $('#submit').click(function () {

    });

    $('#new_record').click(newRecord);

    $('#about').click(function () {
        alert("Nguyễn Xuân Linh");
    });

    $('#timesheet_date').change(function () {
        let inputDate = $(this).val();
        $('#timesheet_date_weekday').html(dayOfWeek(new Date(inputDate)));
        let holiday = checkHoliday(formatDate(inputDate));
        if (holiday) {
            onHoliday();
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

    function onHoliday() {
        $('.time-sheet-control input[type=time]').each(function () {
            $(this).val('');
        });

        $(".time-sheet-control input[type=time]").each(function () {
            $(this).prop('disabled', true);
        });

        $("#day_off").val("祝日");
        $("#time_sheet_note").val(holiday[2]);
    }

    function newRecord() {
        $('.time-sheet-control input[type=time]').each(function () {
            $(this).val('');
        });

        $('#timesheet_date').val(todayFormatted);
//        Check if today is public holiday
        let holiday = checkHoliday(new Date());
        if (holiday) {
            onHoliday();
        }

        $('#timesheet_date_weekday').html(dayOfWeek(today));
        if (dayOfWeek(today) === '土' || dayOfWeek(today) === '日') {
            $('#start_time').val('');
            $('#end_time').val('');
        } else {
            $('#start_time').val(regularStartTime.displayTime());
            $('#end_time').val(regularEndTime.displayTime());
        }
        $('#recordId').val('');
        $(".time-sheet-control input[type=time]").each(function () {
            $(this).prop('disabled', false);
        });

        $('html, body').animate({
            scrollTop: $("#start_time").offset().top
        }, 1000);
    }

    function showDeleteModal() {
        $('#delete_record').data('recordId', $(this).parent().data('id'));
        $("#deleteConfirm").modal("show");
    }

    $('#delete_record').click(onDeleteRecord);

    async function onDeleteRecord() {
        let recordId = $(this).data('record-id');
        if (recordId) {
            timesheets.splice(recordId, 1);
        }

        await saveTimesheet();
        await getCurrentTimesheet();
        drawTimesheet();
    }

    function onEditRecord() {
        let id = $(this).parent().data('id');
        let editDate = timesheets[id][0];
        let weekday = dayOfWeek(dateFromString(editDate));
        let dayOffFlag = timesheets[id][9];
        if (dayOffFlag) {
            $('#day_off').val(dayOffFlag);
            $(".time-sheet-control input[type=time]").each(function () {
                $(this).prop('disabled', true);
            });
        } else {
            $('#day_off').val('');
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
        $("#start_time").focus();
    }

    async function onLoginDone(data) {
        if (data.result === 'success') {
            await mainApp();
            $('#formContent').hide();
            $('.content').show();
            $('.navbar').css('display', 'inherit');

            var header = document.getElementById("navbar_menu");
            var sticky = header.offsetTop;
            window.onscroll = function () {
                onScrollFuntion(sticky, header);
            };
        } else {
            $('#error_msg').html(data.message);
        }
    }

    $('#save_timesheet').click(onSaveClick);

    async function onSaveClick() {
        let new_record = ["", "", "", "", "", "", "", "", "", "", ""];
        new_record[0] = formatDate(new Date($('#timesheet_date').val()));
        new_record[1] = $('#timesheet_date_weekday').html();
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
        if (id) {
            $('html, body').animate({
                scrollTop: $("tr#" + id).offset().top
            }, 1000);
        }
    }

    function checkTimesheetExplicit() {
        let currentMonthObj = dateFromString(currentMonth);
        let days = daysInMonth(currentMonthObj.getMonth(), currentMonthObj.getFullYear());
        if (timesheets.length >= days) {
            $('.time-sheet-control').hide();
            $('.day-off').hide();
            $('.end-of-month').css('display', 'flex');
        } else {
            $('.time-sheet-control').show();
            $('.day-off').show();
            $('.end-of-month').hide();
        }
    }

    async function saveRecord(record, id) {
        if (id !== "" && id < timesheets.length) {
            timesheets[id] = record;
        } else {
            timesheets.push(record)
        }

        timesheets.sort(function (a, b) {
            return dateFromString(a[0]) - dateFromString(b[0])
        });
        await saveTimesheet();
    }

    async function saveTimesheet() {
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
                                    <div data-id="` + row + `">
                                        <button class="btn btn-primary btn-sm turnBoxButton turnBoxButtonPrev edit-row" id="edit_row">Edit</button>
                                        <button class="btn btn-danger btn-sm turnBoxButton turnBoxButtonPrev delete-row" id="delete_row"  data-toggle="modal" data-target="#deleteConfirm">Delete</button>
                                    </div>
                                </div>
                            </td>`;
                } else {
                    var td = "<td>" + col + "</td>";
                }

                $('#time_sheet table tbody tr:last-child').append(td);
            });
        });

        $x(".row-input").turnBox({
            type: "skip"
        });

        $('.edit-row').click(onEditRecord);
        $('.delete-row').click(showDeleteModal);
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
        if (dayOffValue) {
            return true;
        } else
            return false
    }

    function toJpMonthDate(monthDate) {
        let tmp = monthDate.split('/');
        return tmp[1] + "月" + tmp[2] + "日";
    }


    function daysInMonth(month, year) {
        month = month + 1;
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

