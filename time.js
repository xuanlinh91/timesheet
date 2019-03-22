var public_holiday = [
    ['2019/1/1', '火', '元日'],
    ['2019/1/14', '月', '成人の日'],
    ['2019/2/11', '月', '建国記念の日'],
    ['2019/3/21', '木', '春分の日'],
    ['2019/4/29', '月', '昭和の日'],
    ['2019/4/30', '火', '国民の休日'],
    ['2019/5/1', '水', '天皇の即位の日'],
    ['2019/5/2', '木', '国民の休日'],
    ['2019/5/3', '金', '憲法記念日'],
    ['2019/5/4', '土', 'みどりの日'],
    ['2019/5/5', '日', 'こどもの日'],
    ['2019/5/6', '月', '振替休日'],
    ['2019/7/15', '月', '海の日'],
    ['2019/8/11', '日', '山の日'],
    ['2019/8/12', '月', '振替休日'],
    ['2019/9/16', '月', '敬老の日'],
    ['2019/9/23', '月', '秋分の日'],
    ['2019/10/14', '月', '体育の日'],
    ['2019/10/22', '火', '即位礼正殿の儀'],
    ['2019/11/3', '日', '文化の日'],
    ['2019/11/4', '月', '振替休日'],
    ['2019/11/23', '土', '勤労感謝の日'],
    ['2020/1/1', '水', '元日'],
    ['2020/1/13', '月', '成人の日'],
    ['2020/2/11', '火', '建国記念の日'],
    ['2020/2/23', '日', '天皇誕生日'],
    ['2020/2/24', '月', '振替休日'],
    ['2020/3/20', '金', '春分の日'],
    ['2020/4/29', '水', '昭和の日'],
    ['2020/5/3', '日', '憲法記念日'],
    ['2020/5/4', '月', 'みどりの日'],
    ['2020/5/5', '火', 'こどもの日'],
    ['2020/5/6', '水', '振替休日'],
    ['2020/7/23', '木', '海の日'],
    ['2020/7/24', '金', 'スポーツの日'],
    ['2020/8/10', '月', '山の日'],
    ['2020/9/21', '月', '敬老の日'],
    ['2020/9/22', '火', '秋分の日'],
    ['2020/11/3', '火', '文化の日'],
    ['2020/11/23', '月', '勤労感謝の日'],
    ['2021/1/1', '金', '元日'],
    ['2021/1/11', '月', '成人の日'],
    ['2021/2/11', '木', '建国記念の日'],
    ['2021/2/23', '火', '天皇誕生日'],
    ['2021/3/20', '土', '春分の日'],
    ['2021/4/29', '木', '昭和の日'],
    ['2021/5/3', '月', '憲法記念日'],
    ['2021/5/4', '火', 'みどりの日'],
    ['2021/5/5', '水', 'こどもの日'],
    ['2021/7/19', '月', '海の日'],
    ['2021/8/11', '水', '山の日'],
    ['2021/9/20', '月', '敬老の日'],
    ['2021/9/23', '木', '秋分の日'],
    ['2021/10/11', '月', 'スポーツの日'],
    ['2021/11/3', '水', '文化の日'],
    ['2021/11/23', '火', '勤労感謝の日'],
    ['2022/1/1', '土', '元日'],
    ['2022/1/10', '月', '成人の日'],
    ['2022/2/11', '金', '建国記念の日'],
    ['2022/2/23', '水', '天皇誕生日'],
    ['2022/3/21', '月', '春分の日'],
    ['2022/4/29', '金', '昭和の日'],
    ['2022/5/3', '火', '憲法記念日'],
    ['2022/5/4', '水', 'みどりの日'],
    ['2022/5/5', '木', 'こどもの日'],
    ['2022/7/18', '月', '海の日'],
    ['2022/8/11', '木', '山の日'],
    ['2022/9/19', '月', '敬老の日'],
    ['2022/9/23', '金', '秋分の日'],
    ['2022/10/10', '月', 'スポーツの日'],
    ['2022/11/3', '木', '文化の日'],
    ['2022/11/23', '水', '勤労感謝の日']
];

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
        } else if (this.hour == time.hour && this.minute > time.minute) {
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
        return (formatNumberLessThanTen(this.hour) + ":" + formatNumberLessThanTen(this.minute)).toString();
    }
}

function formatNumberLessThanTen(number) {
    return ('0' + number).slice(-2)
}

function formatTimeLessThanTen(timeStr) {
    if (timeStr === "") {
        return "";
    }

    let time = timeStr.split(":");
    let hour = time[0];
    let minute = time[1];
    let resultHour = ('0' + hour).slice(-2);
    return resultHour + ':' + minute;
}

function dateFromString(str, spr = '/') {
    let tmp = str.split(spr);
    tmp[1] = parseInt(tmp[1]) - 1; //January start from 0
    return new Date(tmp[0], tmp[1], tmp[2]);
}


function checkHoliday(date) {
    let result = false;
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    for (let i = 0; i < public_holiday.length; i++) {
        let element = public_holiday[i];
        if (date.getTime() === dateFromString(element[0]).getTime()) {
            result = element;
            break;
        }
    }

    return result;
}

function equalDate(firstDate, secondDate) {
    if (firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth() && firstDate.getDate() === secondDate.getDate()) {
        return true;
    } else
        return false;
}

function isDateRange(dateInput) {
    let split = dateInput.split(' - ');
    if (split[0] !== undefined && split[1] !== undefined) {
        return true;
    } else {
        return false;
    }
}

function dateRangeFromString(dateRangeInput) {
    let split = dateRangeInput.split(' - ');
    if (split[1] !== undefined && split[1] !== undefined) {
        return {startDate: new Date(split[0]), endDate: new Date(split[1])};
    } else {
        return false;
    }
}
