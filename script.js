$(function () {
    var weekday = new Array(7);
    weekday[0] = "日";
    weekday[1] = "月";
    weekday[2] = "火";
    weekday[3] = "水";
    weekday[4] = "木";
    weekday[5] = "金";
    weekday[6] = "土";
    var domain = "https://xuanlinh91aws.tk/";
    // var domain = "/backend/";

    var timesheets = [];
    var currentMonth = '2019/01/01';
    var lunchBreak = new time().fromText("01:00");
    var overtimeBreak = new time().fromText("00:30");
    var regularStartTime = new time().fromText("10:00");
    var regularEndTime = new time().fromText("19:00");
    var regularWorkTime = new time().fromText("08:00");
    let today = new Date();
    let todayFormatted = formatDate(today, '/');

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
        $('#download_excel_form').attr('action', domain + 'time_sheet_processors.php');
        $('#download_excel_form input[name=token]').val(getCookie('token'));
        $('#download_excel_form input[name=username]').val(getCookie('username'));
        $('#download_excel_form').submit();
    });

    $('#submit').click(function () {

    });

    $('#new_record').click(newRecord);

    $('#about').click(function () {
        alert("Nguyễn Xuân Linh");
    });

    $('#logout').click(function () {
        $.ajax({
            method: "GET",
            dataType: 'json',
            xhrFields: { withCredentials: true },
            crossDomain:true,
            url: domain + "login.php",
            data: {tag: 'logout'}
        })
                .done(function (data) {
                    location.reload();
                    console.log(data);
                });

        return false;
    });

    function checkLogin() {
        $.ajax({
            method: "POST",
            dataType: 'json',
            xhrFields: { withCredentials: true },
            crossDomain:true,
            url: domain + "login.php",
            data: {username: getCookie('username'), password: ""}
        })
                .done(function (data) {
                    if (data.result === 'success') {
                        onLoginDone(data);
                    } else {
                        $('#formContent').show();
                    }
                });
    }

    $('#timesheet_date').change(function () {
        let inputDate = $(this).val();
        if (isDateRange(inputDate)) {
            let dateRange = dateRangeFromString(inputDate);
            if (equalDate(dateRange.startDate, dateRange.endDate)) {
                $('#timesheet_date').val(formatDate(dateRange.startDate));
            } else {
                $('#recordId').val('');
                $('#timesheet_date_weekday').html('-');
            }
        } else {
            let tmp = new Date(inputDate);
            newRecord(tmp, $('#recordId').val(''));
        }
    });

    $('#login_submit').click(function (event) {
        var username = $('#username').val();
        var password = Sha1.hash($('#password').val());
        $.ajax({
            method: "POST",
            dataType: 'json',
            xhrFields: { withCredentials: true },
            crossDomain:true,
            url: domain + "login.php",
            data: {username: username, password: password}
        })
                .done(function (data) {
                    console.log(data);
                    onLoginDone(data);
                });

        event.preventDefault();
    });

    function onHoliday(holiday) {
        $('.time-sheet-control input[type=time]').each(function () {
            $(this).val('');
        });

        $(".time-sheet-control input[type=time]").each(function () {
            $(this).prop('disabled', true);
        });

        $("#day_off").val("祝日");
        $("#time_sheet_note").val(holiday[2]);
    }

    function newRecord(inputDate) {
        if (typeof inputDate !== 'object' || inputDate === "") {
            inputDate = today;
        }
        $('.time-sheet-control input[type=time]').each(function () {
            $(this).val('');
        });

        $('#timesheet_date').val(formatDate(inputDate));
//        Check if today is public holiday
        let holiday = checkHoliday(inputDate);
        if (holiday) {
            onHoliday(holiday);
        } else {
            $(".time-sheet-control input[type=time]").each(function () {
                $(this).prop('disabled', false);
            });

            if (dayOfWeek(inputDate) === '土' || dayOfWeek(inputDate) === '日') {
                $('#start_time').val('');
                $('#end_time').val('');
            } else {
                $('#start_time').val(regularStartTime.displayTime());
                $('#end_time').val(regularEndTime.displayTime());
            }

            $("#day_off").val('');
            $("#time_sheet_note").val('');
        }

        $('#timesheet_date_weekday').html(dayOfWeek(inputDate));
        $('#recordId').val('');

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
        if (typeof recordId !== 'undefined') {
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

        $('#timesheet_date').val(editDate);
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
        showHideInputControl('force');
        $('html, body').animate({
            scrollTop: $("#start_time").offset().top
        }, 1000);
        $("#start_time").focus();
    }

    async function onLoginDone(data) {
        if (data.result === 'success') {
            setCookie('username', data.username, 1);
            setCookie('token', data.token, 1);

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
        let inputDate = $('#timesheet_date').val();
        let id = $('#recordId').val();
        if (isDateRange(inputDate)) {
            let rangeOfDate = dateRangeFromString(inputDate);
            for (var d = rangeOfDate.startDate; d <= rangeOfDate.endDate; d.setDate(d.getDate() + 1)) {
                let holiday = checkHoliday(d);
                if (holiday) {
                    var createdRecord = createRecord(formatDate(d), dayOfWeek(d), "", "", "", "", "", "", "", "祝日", holiday[2]);
                } else if (dayOfWeek(d) === '土' || dayOfWeek(d) === '日') {
                    var createdRecord = createRecord(formatDate(d), dayOfWeek(d), "", "", "", "", "", "", "", "", "");
                } else {
                    var createdRecord = createRecord(formatDate(d), dayOfWeek(d), regularStartTime.displayTime(), regularEndTime.displayTime(), "", "", "", "", "", "", "");
                }

                if (checkTimesheetExplicit()) {
                    break;
                }

                pushRecord(createdRecord, "");
            }
            id = "";

        } else {

            var createdRecord = createRecord($('#timesheet_date').val(), $('#timesheet_date_weekday').html(), $('#start_time').val(), $('#end_time').val(), $('#break_time').val(), $('#work_time').val(), $('#overwork_time').val(), $('#late_time').val(), $('#early_time').val(), $('#day_off').val(), $('#time_sheet_note').val());
            pushRecord(createdRecord, id);
        }

        await saveTimesheet();
        await getCurrentTimesheet();
        drawTimesheet();
        if (id) {
            $('html, body').animate({
                scrollTop: $("tr#" + id).offset().top
            }, 1000);
        }
    }

    function createRecord(...params) {
        let new_record = params;
        let dayOffValue = new_record[9]
        if (dayOffValue) {
            for (let i = 2; i < 9; i++) {
                new_record[i] = "";
            }
        } else {

            let startTime = new_record[2] !== "" ? new time().fromText(new_record[2]) : "";
            let endTime = new_record[3] !== "" ? new time().fromText(new_record[3]) : "";
            let breakTime = new_record[4];
            if (breakTime === "" && new_record[2] !== "" && new_record[3] !== "") {
                breakTime = isWorkOverTime(startTime, endTime) ? overtimeBreak.displayTime() : "";
                new_record[4] = breakTime;
            }
        }

        return new_record;
    }

    function checkTimesheetExplicit() {
        let currentMonthObj = dateFromString(currentMonth);
        let days = daysInMonth(currentMonthObj.getMonth(), currentMonthObj.getFullYear());
        if (timesheets.length >= days) {
            return true;
        } else {
            return false;
        }
    }

    function showHideInputControl(option) {
        if (checkTimesheetExplicit() && option !== 'force') {
            $('.time-sheet-control').hide();
            $('.day-off').hide();
            $('#new_record').prop('disabled', true);
            $('.end-of-month').css('display', 'flex');
        } else {
            $('.time-sheet-control').show();
            $('.day-off').show();
            $('#new_record').prop('disabled', false);
            $('.end-of-month').hide();
        }
    }

    function pushRecord(record, id) {
        if (id !== "" && id < timesheets.length) {
            timesheets[id] = record;
        } else if (!checkTimesheetExplicit()) {
            timesheets.push(record);
        }

        timesheets.sort(function (a, b) {
            return dateFromString(a[0]) - dateFromString(b[0])
        });
    }

    async function saveTimesheet() {
        await $.ajax({
            method: "POST",
            dataType: 'json',
            xhrFields: { withCredentials: true },
            crossDomain:true,
            url: domain + "time_sheet_processors.php",
            data: {tag: 'saveTs', data: timesheets, username: getCookie('username'), token: getCookie('token')}
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
            xhrFields: { withCredentials: true },
            crossDomain:true,
            url: domain + "time_sheet_processors.php",
            data: {tag: 'getTs', username: getCookie('username'), token: getCookie('token')}
        })
                .done(function (data) {
                    if (data.result === 'success') {
                        timesheets = JSON.parse(data.message);
                        if (timesheets !== null) {
                            currentMonth = timesheets[0][0];
                            let currentMonthObj =  dateFromString(currentMonth);
                            $('.timesheet-title h1').html(currentMonthObj.getFullYear()+'年'+(currentMonthObj.getMonth()+1)+'月' + '出勤簿');
                            $('.timesheet-name h4').html('氏名：'+data.name);
                        }
                        drawTimesheet();
                        $('.timesheet-name h4').html();
                    } else {
                        console.log(data);
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
        showHideInputControl();
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

    function toJpMonthDate(monthDate) {
        let tmp = monthDate.split('/');
        return tmp[1] + "月" + tmp[2] + "日";
    }

    function daysInMonth(month, year) {
        month = month + 1;
        return new Date(year, month, 0).getDate();
    }

    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }


    checkLogin();
});
