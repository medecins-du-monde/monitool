
////////////////////////////
// Project
////////////////////////////

var Project = function(data) {
	this.data = data;
};

Project.prototype.makeInput = function(month) {
	var rawIndicatorIds = this.getNeededIndicatorIds(month);

	indicatorIds.forEach(function(indicatorId) {
		if (this.planning[indicatorId].formula) {

		}
		else

	})



};

Project.prototype.getNeededIndicatorIds = function(month) {
	return Object.keys(this.data.planning).filter(function(indicatorId) {
		var p = this.data.planning[indicatorId];

		if (p.periodicity === 'month')
			return p.from <= currentMonth && p.to >= currentMonth;
		else if (p.periodicity === 'planned')
			return false; // @FIXME
		else if (p.periodicity === 'quarter')
			return false; // @FIXME
		else
			throw new Error('Unknown periodicity.');
	}.bind(this));
};



////////////////////////////
// Indicator
////////////////////////////

var Indicator = function(data) {
	this.data = data;
};



////////////////////////////
// 
////////////////////////////

