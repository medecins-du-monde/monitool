
import uuid from 'uuid/v4';


const module = angular.module(
	'monitool.components.misc.form-group',
	[
	]
);


module.component('formGroup', {
	bindings: {
		inputId: '@',
		label: '@',

		help: '@',
		helpValues: '<',
	},

	transclude: true,

	template: require('./form-group.html')
});


export default module.name;
