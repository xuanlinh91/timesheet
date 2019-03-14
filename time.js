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
        return (formatNumberLessThanTen(this.hour) + ":" + formatNumberLessThanTen(this.minute)).toString();
    }
}

function formatNumberLessThanTen(number) {
    return ('0' + number).slice(-2)
}

function formatTimeLessThanTen(timeStr) {
    if(timeStr === ""){
        return "";
    }
    
    let time = timeStr.split(":");
    let hour = time[0];
    let minute = time[1];
    let resultHour = ('0' + hour).slice(-2);
    return resultHour + ':' + minute;
}
