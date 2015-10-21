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
		user_guide: "User guide",
		home: "Home",

		up: "Up",
		down: "Down",
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
		reporting_general: 'General reporting',
		reporting_by_indicator: 'By indicator reporting',
		reporting_by_variable: 'By variable reporting',
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
		filter: "Filter",
		'export': "Export",
		none: "None"
	},
	menu: {
		toggle_nav: "Toggle navigation",
		language: "Language",
		french: "French",
		spanish: "Spanish",
		english: "English",
	},

	help: {
		block: {
			general: "Overall",
			indicators: "Indicators catalog",
			project: "Projects",
		},
		page: {
			presentation_general: "Introduction",
			presentation_project: "Introduction",
			presentation_indicator: "Introduction",

			offline_access: "Offline access",
			acls: "Authorization",
			translation: "Translation",

			completeness: "Completeness and limitations",
			operation_modes: "Operation modes",
			computation: "Computation and aggregation",
			collection_history: "Collection history",

			logical_frame: "Logical frame",
			entities_groups: "Input entities and groups",
			input_forms: "Input forms",
			users: "Authorization",

			inputs: "Inputs",
			statistics: "Statistics",
			descriptive_analysis: "Descriptive analysis",
			change_definition: "Modifying projects",

			data_path: "Data path",
			activities_demography: "Activities & Demography",
			objectives_results: "Objectives & Results"

		},
		reminder: {
			have_you_read_single_pre: "Did you read the ",
			have_you_read_single_post: "chapter from the manual?",
			have_you_read_multiple: "Did you read the following chapters in the manual?",
		}
	},

	project: {
		cant_create: "You are not allowed to create new projects",
		my_projects: "My projects",
		are_you_sure_to_delete: "Please type: 'Yes, I do want to delete this project' to confirm",
		are_you_sure_to_delete_answer: "Yes, I do want to delete this project",

		data_selection: "Data selection",
		filters: "Filters",

		cols: "Columns",
		rows: "Rows",
		partition0: "Partition 0",
		partition1: "Partition 1",
		partition2: "Partition 2",
		partition3: "Partition 3",
		partition4: "Partition 4",
		entity: "Input entity",
		select_cols: "Please select columns",
		select_rows: "Please select rows",
		pivot_table: "Pivot table",

		actions: "Actions",
		groups: "Groups",
		basics: "Basics",
		general: "General",
		full_project: "Full project",
		select_filters: "Select filters",

		collection_form_warning: 
			'<strong>Take care, if you make changes to this page, you risk losing data</strong><br/>' + 
			'{{num_inputs}} inputs were made with the form as it is.' + 
			'<ul>' + 
			'	<li>All modifications on the planning (periodicity, dates) will cause old inputs to be discarded</li>' + 
			'	<li>All modifications on the structure will be echoed on former inputs</li>' + 
			'</ul>',

		sections: "Sections",
		variables: "Variables",
		partitions: "Partitions",

		add_variable: "Add a variable",
		remove_variable: "Remove this variable",
		add_partition: "Add a partition",
		remove_partition: "Remove this partition",
		add_partition_element: "Add an element",
		remove_partition_element: "Remove this element",

		aggregation: "Aggregation",
		different_geos: "On different places",
		same_geos: "On the same place",

		none: "Do not aggregate",
		sum: "Sum",
		average: "Average",
		highest: "Highest",
		lowest: "Lowest",
		last: "Last",

		section_up: "Move up",
		section_down: "Move down",
		variable_up: "Move up",
		variable_down: "Move down",
		remove_section: "Remove this section",
		add_section: "Add section",

		please_select_variable: "Please select a variable",
		no_partitions_available: "No partitions available",

		collection_site_list: "Collection sites",
		collection_form_list: "Collection forms",
		collection_input_list: "Input",

		collection_site: "Collection site",
		collection_form: "Collection form",

		collection_form_planning: "Calendar",
		collection_form_structure: "Structure",

		delete_form_easy: "Are you sure to delete this input form?",
		delete_form_hard: "If you delete this input form, all linked entries will be deleted as well. Enter \"Delete the {{num_inputs}} inputs\" to confirm",
		delete_form_hard_answer: "Delete the {{num_inputs}} inputs",
		delete_entity: "If you delete this input entity, all linked entries will be deleted as well. Enter \"Delete the {{num_inputs}} inputs\" to confirm",
		delete_entity_answer: "Delete the {{num_inputs}} inputs",

		running: "Running projects",
		finished: "Finished projects",
		noproject: "No projects match this criteria",
		inputs: "Inputs",

		last_input: "Last input: ",

		value: "Value",
		activity: "Activity",
		activity_management: "Activities & Demography",
		variable: "Variable",
		section: "Section",

		unknown: "Unknown",
		color: "Color",

		specs: "Specifications",
		result_management: "Objectives & results",
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

		create: "Create new project",
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
		finished_inputs: 'Done inputs',
		invalid_inputs: 'Out of calendar inputs',

		no_inputs: 'No inputs match this criteria.',
		input: 'Input now',

		relevance: 'Relevance',
		relevance_ph: 'Why are you collecting this indicator?',
		baseline: 'Baseline',
		baseline_ph: 'Reference value',
		target_ph: 'Target value',
		target: 'Targets',
		general_data: 'General data',

		goal: 'General objective',
		goal_short: "General objective",
		intervention_logic: 'Description',
		intervention_logic_goal_ph: 'Describe the project\'s contribution on a program or policy',
		intervention_logic_purpose_ph: 'Describe the tangible advantages that are provided to the beneficiaries',
		assumptions_purpose_ph: 'External factors that could jeopardize reaching the specific objective',
		purpose_short: 'Purpose',
		output_short: 'Output',

		begin_date: "Begin date",
		end_date: "End date",
		name_ph: 'For Instance: [Laos] Primary health care',
		add_indicator: 'Add an indicator',

		purpose: 'Specific objective',
		purposes: 'Specific objectives',
		assumptions: 'Assumptions',
		output: "Result",
		activities: 'Activities',
		prerequisite: 'Prerequisite',
		activity_prereq_ph: 'What are the prerequisites that have to be met before starting the activity?',
		activity_desc_ph: 'Product or tangible service brought by the project',
		output_assumptions_ph: 'External factors that could jeopardize reaching the result',
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
	
		formula: "Formula: {{name}}",
		link: "Link: {{name}}",
		links: "Links"
	},
	indicator: {
		cant_create: "You are not allowed to create new indicators",

		name: "Name",
		translate_from_fr: "Translate automatically from french",
		translate_from_es: "Translate automatically from spanish",
		translate_from_en: "Translate automatically from english",

		delete_indicator: "Are you sure that you wish to delete this indicator? It will affect all projects using it.",
		delete_formula: "Are you sure that you wish to delete this formula? It will affect all projects using it.",

		classification: "Classification",
		is_unchanged: "Button is locked because the form content did not change since last save.",
		is_invalid: "Button is locked because the form is invalid. Did you fill all names and formulas?",

		is_mandatory: "Mandatory. Should be collected for all new projects of this thematic.",
		is_approved: "Approved. Can be collected on new projects of this thematic.",
		is_waiting: "Waiting. Headquarters have not graded the quality of this indicator yet.",
		is_forbidden: "Forbidden. Must not be collected on any new projects.",
		
		num_collecting_projects: "Nombre de projets collectant cet indicateur",

		search: "Search",
		search_ph: "Enter at least 3 characters",
		scope: "Scope",

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
		param_name_ph: "For instance: Number of prenatal consultations",
		add_formula: "Add formula",
		parameter: 'Parameter',

		order_by: 'Order by',
		alphabetical_order: 'Alphabetical order',
		num_inputs: 'Number of inputs',
		num_projects: 'Number of projects',
		create_new: 'Create new indicator',

		themes_list: "Themes list",
		types_list: "Types list",
		num_indicators: 'Number of indicators',
		
		new_type_name: "New type name",
		new_theme_name: "New theme name",
		only_core: "Only display core indicators",
		is_external: "This indicator is from another thematic",
	},
	form: {
		mandatory: "This field is mandatory",
		begin_lower_than_end: 'Begin date must be lower than end date',
		end_greater_than_begin: 'End date must be greater than begin date'
	}
};

