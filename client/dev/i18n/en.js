"use strict";

var ENGLISH_LOCALE = {
	id: "en-us",
	DATETIME_FORMATS: {
		AMPMS: [ "AM", "PM" ],
		DAY: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
		MONTH: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
		SHORTDAY: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
		SHORTMONTH: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
		fullDate: "EEEE, MMMM d, y",
		longDate: "MMMM d, y",
		medium: "MMM d, y h:mm:ss a",
		mediumDate: "MMM d, y",
		mediumTime: "h:mm:ss a",
		short: "M/d/yy h:mm a",
		shortDate: "M/d/yy",
		shortTime: "h:mm a"
	},
	NUMBER_FORMATS: {
		CURRENCY_SYM: "$",
		DECIMAL_SEP: ".",
		GROUP_SEP: ",",
		PATTERNS: [
			{
				gSize: 3,
				lgSize: 3,
				maxFrac: 3,
				minFrac: 0,
				minInt: 1,
				negPre: "-",
				negSuf: "",
				posPre: "",
				posSuf: ""
			},
			{
				gSize: 3,
				lgSize: 3,
				maxFrac: 2,
				minFrac: 2,
				minInt: 1,
				negPre: "\u00a4-",
				negSuf: "",
				posPre: "\u00a4",
				posSuf: ""
			}
		]
	},
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
		sum: "Sum",
		include: "Include",
		toggle: "Toggle",
		toggle_all: "Toggle all",

		date: "Date",
		administrator: "Administrator",

		back_to_intranet: "Go back to intranet",
		settings: "Settings",
		projects: 'Projects',
		project: 'Project',
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
		quarter: "Quarter",
		year: "Year",
		
		done: 'Done',
		copy: 'Copy',
		choose: 'Choose',
		edition: 'Edition',
		cancel: 'Cancel',
		logical_frame: 'Logical Frame',
		description: 'Description',
		reporting: 'Reporting',
		reporting_analysis: 'Descriptive Analysis',
		columns: "Columns",
		colorize: 'Colorize',
		display: 'Display',
		values: 'Logframe indicators',
		target_percentage: 'Logframe progress',
		plot: 'Plot',
		download_plot: 'Download plot',
		download_table: 'Download table',
		unknown_indicator: "Unknown indicator",
		active: "Active",

		choose_indicator: 'Choose an indicator',
		list: 'List',
		logout: 'Log Out',
		change_password: "Change password",
		detach: "Detach",

		stay_here_check: 'You made changes. Click OK to stay on this page, Cancel to leave.',
		filter: "Filter"
	},
	menu: {
		toggle_nav: "Toggle navigation",
		language: "Language",
		french: "French",
		spanish: "Spanish",
		english: "English",
	},
	project: {
		last_input: "Last input: ",

		value: "Value",
		raw_data: "Raw data",
		planning: "Planning",
		indicators_computation: "Indicadors computation",
		partition: "Partition",
		additional_partition: "Additional partition",
		new_partition: "Add a partition",
		variable: "Variable",
		new_variable: "Add a variable",
		section: "Section",
		new_section: "Add a section",
		see_partitions: "View selected sections",

		unknown: "Unknown",
		color: "Color",
		red_for_target: "Red if target is reached at",
		orange_for_target: "Orange if target is reacher between {{value}}% and ",
		green_for_target: "Green for a target reached over {{value}}%",
		what_is_progress: "What does \"target reached at 34%\" means?",
		what_is_progress_detail:
			"We can compute progress only when both baseline and target are defined.<br/>" + 
			"The progress simply is computed situating each input between those two values.",

		specs: "Specifications",
		indicators_management: "Indicators management",
		additional_indicators: "Additional indicators",
		no_additional_indicators: "No additional indicators were defined",
		no_purposes: "No purposes were defined yet",

		input_form_list: "Input form list",
		indicator_distribution: "Indicators repartition by form and period",
		add_new_indicator_to_form: "Add a new indicator to the form",

		collect: "Collect on",
		form_name_ph: "For instance: Monthly collection on health centers",

		analysis: "Analysis",
		analysis_insert_data: "Insert data",
		analysis_insert_text: "Insert text",
		analysis_up_next: "Up",
		analysis_down_next: "Down",
		analysis_delete_next: "Remove",
		analysis_data: "Display",
		analysis_table: "Table",
		analysis_graph: "Plot",
		analysis_both: "Table & Plot",
		report_name_ph: "ex: Monthly descriptive analysis for may 2015",
		no_reports: "No descriptive analysis has be created yet!",

		source: "Source",
		source_ph: "Ej: NHIS",
		in_charge: "Person in charge",
		in_charge_ph: "Ex: Project nurse",

		missing_mandatory_indicators: "Missing mandatory indicators",
		other_indicators: "Other indicators",
		see_other_themes: "See all thematics",

		entity_name: "Entity name",
		group_name: "Group name",
		entity_name_placeholder: "For instance: Health center X, Hospital X, ...",
		group_name_placeholder: "ex: Regional hospitals, North of the country, ...",

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

		periodicities: {
			day: "Every day",
			week: "Every week",
			month: 'Every month',
			quarter: 'Every quarter',
			year: "Every year",
			planned: 'Planned'
		},
		collects: {
			entity: "Input entity",
			project: "Project"
		},
		
		add_intermediary: "Add a date",
		intermediary_periods: "Extra dates",

		no_input_entities: 'No input entity was created yet!',
		no_input_groups: 'No input group was created yet!',
		no_forms: 'No form was created yet!',
		no_indicators: 'This project does not follow any indicator',

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
		target_ph: 'Target value',
		target: 'Targets',
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
		activities: 'Activities',
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
		you_are_owner: "You can edit this project",
		you_are_editor: "You can input on this project",
		you_are_not_owner: "You cannot edit this project",
		you_are_not_editor: "You cannot input on this project",
	
		status_green: "This indicator is in its green zone",
		status_orange: "This indicator is in its orange zone",
		status_red: "This indicator is in its red zone",
		status_unknown: "This indicator is out of bounds",

		formula: "Formula: {{name}}",
		link: "Link: {{name}}",
		links: "Links"
	},
	indicator: {
		search: "Search",
		search_ph: "Enter at least 3 characters",

		standard: "Standard",
		sources: "Sources",
		comments: "Notes",
		standard_ph: "Which standard is this indicator from?",
		sources_ph: "Which sources are more common for this indicator?",
		comments_ph: "When is it relevant to collect this indicator, and what are its limits?",
		metadata: "Metadata",

		target: "Relation with target",
		higher_is_better: "Reached if input is higher than target",
		lower_is_better: "Reached if input is lower than target",
		around_is_better: "Reached if input is around target",
		non_relevant: "Non relevant",

		no_theme: 'No theme',
		no_type: 'No type',

		operation: "Operation mode",

		name_ph: 'For instance: Percentage of correctly filled medical records',
		definition_ph: 'For instance: Mesure the staff formation level. This indicator is mesurable only on small projects and should be avoided otherwise',
		definition: 'Definition',
		core: 'Core',
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
		is_recommended: "This indicator is from the thematic's catalog",
		is_common: "This indicator is optional",
		is_forbidden: "This is a legacy indicator, it cannot be used on new projects",
		is_external: "This indicator is from another thematic",

		what_is_aggregation: "How to fill those fields?",
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

