// From http://stackoverflow.com/a/26426761/1897495

Date.prototype.isLeapYear = function() {
    var year = this.getFullYear();
    if ((year & 3) != 0)
    	return false;

    return (year % 100) != 0 || (year % 400) == 0;
};

Date.prototype.getUTCISODateOfYear = function() {
    var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var mn = this.getMonth();
    var dn = this.getUTCDate();
    var dayOfYear = dayCount[mn] + dn;

    if (mn > 1 && this.isLeapYear())
    	dayOfYear++;

    return dayOfYear;
};

Date.prototype.getUTCISODay = function() {
	return (this.getUTCDay() + 6) % 7 + 1;
};

Date.prototype.getUTCISOWeekYear = function() {
	var week = Math.floor((this.getUTCISODateOfYear() - this.getUTCISODay() + 10) / 7);

	if (week < 1)
		return this.getUTCYear() - 1;

	else if (week == 53) {

	}

	else
		return this.getUTCYear();
};

Date.prototype.getUTCISOWeek = function() {
	var week = Math.floor((this.getUTCISODateOfYear() - this.getUTCISODay() + 10) / 7);
	
	// Date may be in last year
	if (week < 1) {
		
	}

	if (week == 53) {

	}

	return week;
};

