
var ENGLISH_LOCALE = {
	DATETIME_FORMATS: {
		"AMPMS": [ "AM", "PM" ],
		"DAY": [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
		"MONTH": [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
		"SHORTDAY": [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
		"SHORTMONTH": [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
		"fullDate": "EEEE, MMMM d, y",
		"longDate": "MMMM d, y",
		"medium": "MMM d, y h:mm:ss a",
		"mediumDate": "MMM d, y",
		"mediumTime": "h:mm:ss a",
		"short": "M/d/yy h:mm a",
		"shortDate": "M/d/yy",
		"shortTime": "h:mm a"
	},
	"NUMBER_FORMATS": {
		"CURRENCY_SYM": "$",
		"DECIMAL_SEP": ".",
		"GROUP_SEP": ",",
		"PATTERNS": [
		{
			"gSize": 3,
			"lgSize": 3,
			"maxFrac": 3,
			"minFrac": 0,
			"minInt": 1,
			"negPre": "-",
			"negSuf": "",
			"posPre": "",
			"posSuf": ""
		},
		{
			"gSize": 3,
			"lgSize": 3,
			"maxFrac": 2,
			"minFrac": 2,
			"minInt": 1,
			"negPre": "\u00a4-",
			"negSuf": "",
			"posPre": "\u00a4",
			"posSuf": ""
		}
		]
	},
	"id": "en-us",
	"pluralCat": function(n, opt_precision) {
		var i = n | 0;
		var vf = getVF(n, opt_precision);

		if (i == 1 && vf.v == 0) {
			return PLURAL_CATEGORY.ONE;
		}

		return PLURAL_CATEGORY.OTHER;
	}
};



var ENGLISH_TRANSLATION = {
	shared: {
		date: "Date",
		administrator: "Administrator",

		back_to_intranet: "Go back to intranet",
		settings: "Settings",
		projects: 'Projects',
		users: "Users",
		indicator: 'Indicator',
		indicators: 'Indicators',
		indicators_catalog: 'Indicators Catalog',
		help: 'Help',
		input_entities: 'Input entities',
		input_groups: 'Input groups',
		input_entity: 'Input entity',
		input_group: 'Input group',

		name: 'Name',
		begin: 'Start',
		end: 'End',

		add: 'Add',
		save: 'Save',
		remove: 'Remove',
		remove_changes: 'Reset changes',
		edit: 'Edit',
		'delete': 'Delete',

		view_stats: 'Display reporting',
		members: 'Members',

		day: 'Day',
		week: 'Week',
		month: 'Month',
		year: "Year",
		
		done: 'Done',
		copy: 'Copy',
		choose: 'Choose',
		edition: 'Edition',
		cancel: 'Cancel',
		logical_frame: 'Logical Frame',
		description: 'Description',
		reporting: 'Reporting',
		columns: "Columns",
		colorize: 'Colorize',
		display: 'Display',
		values: 'Values',
		target_percentage: 'Progress',
		plot: 'Plot',
		download_plot: 'Download plot',
		download_table: 'Download table',
		unknown_indicator: "Unknown indicator",
		active: "Active",

		choose_indicator: 'Choose an indicator',
		list: 'List',
		logout: 'Log Out',
		change_password: "Change password",
		detach: "Detach"
	},
	menu: {
		toggle_nav: "Toggle navigation",
		language: "Language",
		french: "French",
		spanish: "Spanish",
		english: "English",
	},
	project: {
		missing_mandatory_indicators: "Missing mandatory indicators",
		other_indicators: "Other indicators",
		see_other_themes: "See all thematics",

		logical_frame_tooltip: 'Describe purpose, expected outputs and activities implemented by the project.',
		input_entities_tooltip: 'List of input entities where indicators are collected. For instance hospitals, health centers, villages...',
		input_groups_tooltip: 'Allow grouping input entities to generate reportings on those groups.',
		input_forms_tooltip: 'Allow defining how the indicators are going to be entered into monitool (periodicity, ...).',
		waiting_inputs_tooltip: '',
		reporting_tooltip: '',

		show_finished: 'Show finished projects',
		create: "Create a new project",
		input_forms: 'Input forms',
		input_form: 'Input form',
		data_collection: 'Data collection',
		periodicity: "Periodicity",
		begin: 'Use project start',
		end: 'Use project end',

		sumable: 'Summable',
		input_field: 'Input field',
		value_source: 'Value source',
		input_mode: 'Input mode',
		manual_input: 'Manual input',

		daily: "Every day",
		weekly: "Every week",
		monthly: 'Every month',
		quarterly: 'Every quarter',
		yearly: "Every year",
		planned: 'Planned',
		add_intermediary: "Add a date",
		intermediary_periods: "Extra dates",

		no_input_entities: 'No input entity was created yet!',
		no_input_groups: 'No input group was created yet!',
		no_forms: 'No form was created yet!',

		waiting_inputs: 'Late inputs',
		no_waiting_inputs: 'No late inputs.',
		input: 'Input now',
		see_all_inputs: 'Show all inputs',

		relevance: 'Relevance',
		relevance_ph: 'Why are you collecting this indicator?',
		limits: 'Limits',
		minimum_ph: 'minimum',
		maximum_ph: 'maximum',
		orange_zone: 'Orange Zone',
		green_zone: 'Green Zone',
		baseline: 'Baseline',
		baseline_ph: 'Reference value',
		target_value_ph: 'value',
		targets: 'Targets',
		add_target: 'Add a target',
		general_data: 'General data',

		goal: 'Main goal',
		goal_short: "Goal",
		intervention_logic: 'Description',
		intervention_logic_goal_ph: 'Describe the project\'s contribution on a program or policy',
		intervention_logic_purpose_ph: 'Describe the tangible advantages that are provided to the beneficiaries',
		assumptions_purpose_ph: 'External factors that could jeopardize reaching the purpose',
		purpose_short: 'Purpose',
		output_short: 'Output',

		begin_date: "Begin date",
		end_date: "End date",
		name_ph: 'For Instance: [Laos] Primary health care',
		add_indicator: 'Add an indicator',

		purpose: 'Purpose',
		purposes: 'Purposes',
		assumptions: 'Assumptions',
		output: "Output",
		activity: 'Activity',
		prerequisite: 'Prerequisite',
		activity_prereq_ph: 'What are the prerequisites that have to be met before starting the activity?',
		activity_desc_ph: 'Product or tangible service brought by the project',
		output_assumptions_ph: 'External factors that could jeopardize reaching the output',
		output_desc_ph: 'Product or tangible service brought by the project',

		add_activity: 'Add activity',
		add_output: 'Add output',
		add_purpose: 'Add purpose',

		users: "Users",
		owners: "Owners",
		dataEntryOperators: "Data entry clerks",

		move_up: "Move up",
		move_down: "Move down",

		indicator_source: "Acquisition",
		source: "Reponsible person",
		you_are_owner: "You can edit this project",
		you_are_editor: "You can input on this project",
		you_are_not_owner: "You cannot edit this project",
		you_are_not_editor: "You cannot input on this project",
		form_warning: [
			"<strong>Take care</strong><br/>",
			"All changes that are done on this form are retroactive.<br/>",
			"<ul>",
				"<li>If you change the begin date, end date or periodicity, all additional inputs will be invalidated.</li>",
				"<li>If you delete or change the computation method of an indicator all of its input history will be invalidated.</li>",
			"</ul>",
			"<br/>",
			"Most of the time, to make changes, the best approach is:",
			"<ul>",
				"<li>Change the end date of current form, and unactivate it.</li>",
				"<li>Create a new form which start at this date.</li>",
			"</ul>",
		].join(' '),


		status_green: "This indicator is in its green zone",
		status_orange: "This indicator is in its orange zone",
		status_red: "This indicator is in its red zone",
		status_unknown: "This indicator is out of bounds",

		formula: "Formula: {{name}}",
		link: "Link: {{name}}",
		links: "Links"
	},
	indicator: {
		no_theme: 'No theme',
		no_type: 'No type',

		operation: "Operation mode",

		name_ph: 'For instance: Percentage of correclty filled medical records',
		description_ph: '',		// Exemple: Mesurer le niveau de formation du personnel médical qui rempli les dossiers patients. Sa mesure est facile sur des projets de petite dimension, à éviter dans un autre cadre.',
		history_ph: '',			// Exemple: Défini en 2007 par l\'OMS et utilisé sur les projets de UNICEF ... cet indicateur a permi de suivre les objectifs ...
		definition: 'Definition',
		core: 'Core',
		history: 'History',
		unit: 'Unit',
		other: 'Other',
		percent: 'Percentage (%)',
		permille: 'Per thousand (‰)',
		types: 'Types',
		themes: 'Thematics',
		select_types: 'Select one or more types',
		select_themes: 'Select one or more themes',
		categorization: 'Categorization',
		computation: 'Computation',
		sum_allowed: 'Summable',
		formula: 'Formula',
		formulas: 'Formulas',
		formula_name_ph: 'For instance: Percentage between correctly filled forms and total',
		formula_expression_ph: 'For instance: 100 * a / b',
		add_formula: "Add formula",
		parameter: 'Parameter',

		order_by: 'Order by',
		alphabetical_order: 'Alphabetical order',
		num_inputs: 'Number of inputs',
		num_projects: 'Number of projects',
		create_new: 'Create  new indicator',

		themes_list: "Themes list",
		types_list: "Types list",
		num_indicators: 'Number of indicators',
		
		new_type_name: "New type name",
		new_theme_name: "New theme name",
		only_core: "Only display core indicators",

		is_mandatory: "This indicator is mandatory in this thematic",
		is_common: "This indicator is optional",
		is_parameter: "This indicator can only be used to compute another one",
		is_external: "This indicator is from another thematic",

		time_aggregation: "Time aggregation",
		time_aggregation_sum: "Sum (for instance: number of consultations, births, ...)",
		time_aggregation_average: "Average (for instance: population, number of doctors, cars, ...)",
		time_aggregation_none: "None (all percentages and computed indicators)",
		time_aggregation_help: [
			"<strong>Tip</strong>",
			"<ul>",
				"<li>",
					"If an hospital makes 100 in january, february and march, it has made 300 on the first quarter of the year.",
					"The aggregation mode of <strong>\"Number of consultations\"</strong> will be <strong>\"Sum\"</strong>",
					"",
				"</li>",
				"<li>",
					"If a surgical unit has a mortality rate of 5% in january, 7% in february and 10% in march, it is impossible to compute",
					"its mortality rate over the first quarter of the year without knowing the number of surgeries on each month.",
					"The aggregation of the indicator <strong>\"operative mortality\"</strong> is <strong>\"None\"</strong>",
				"</li>",
				"<li>",
					"If a town has a population of 512 people in january, 600 in february and 550 in march, we can say that it's population",
					"over the first quarter is 553. The aggregation mode of the indicator <strong>\"Population\"</strong> is ",
					"<strong>\"Average\"</strong>",
				"</li>",
			"</ul>"
		].join(' '),

		geo_aggregation: "Geographic aggregation",
		geo_aggregation_sum: "Sum (for instance: population, number of doctors, cars, consultations, births, ...)",
		geo_aggregation_average: "Average (only use for indicators that already are averages over input entities)",
		geo_aggregation_none: "None (all percentages and computed indicators)",
	},
	login: {
		error: "Invalid username or password",
		please_connect: "Please log in",
		login: 'Username',
		password: "Password",
		connect: "Log in",
		change_password_please: "Type your new password",
		new_password: "Password",
		new_password_again: "Password again",
		change_password: "Change"
	},
	form: {
		mandatory: "This field is mandatory",
		begin_lower_than_end: 'Begin date must be lower than end date',
		end_greater_than_begin: 'End date must be greater than begin date'
	}
};