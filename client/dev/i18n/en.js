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
		clone: "Clone",
		user_guide: "User guide",
		home: "Home",
		up: "Up",
		down: "Down",

		date: "Date",
		administrator: "Administrator",

		settings: "Settings",
		projects: 'Projects',
		project: 'Project',
		users: "Users",
		indicator: 'Indicator',
		indicators: 'Indicators',
		indicators_catalog: 'Indicators Catalog',
		help: 'Help',
		name: 'Name',
		start: 'Start',
		end: 'End',

		add: 'Add',
		save: 'Save',
		remove: 'Remove',
		remove_changes: 'Reset changes',
		edit: 'Edit',
		'delete': 'Delete',

		members: 'Members',

		day: 'Day',
		week: 'Week',
		month: 'Month',
		quarter: "Quarter",
		year: "Year",
		
		choose: 'Choose',
		cancel: 'Cancel',
		logical_frames: 'Logical Frames',
		reporting: 'Reporting',
		reporting_general: 'General reporting',
		reporting_analysis: 'Descriptive Analysis',
		columns: "Columns",
		colorize: 'Colorize',
		display: 'Display',
		download_plot: 'Download plot',
		download_table: 'Download table',

		logout: 'Log Out',

		sure_to_leave: 'You made changes. Click OK to confirm that you want to leave without saving.',
		filter: "Filter"
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
			project: "Project"
		},
		page: {
			presentation_general: "Presentation",
			data_path: "Data path",
			create: "Create a new project",
			structure: "Give structure to activity data",
			input: "Make a data input",
			activity_followup: "Activities follow-up",
			logical_frame: "Input a logical framework",
			objectives_results: "Objectives & results follow-up",
			change_definition: "Change a started project",
			indicator_usage: "Use the indicator catalog",
			create_new_indicator: "Create an indicator",
			merge_indicators: "Merge two indicators",
			indicator_reporting: "Follow a cross-cutting indicator"
		},
		reminder: {
			have_you_read_single_pre: "Did you read the ",
			have_you_read_single_post: "chapter from the manual?",
			have_you_read_multiple: "Did you read the following chapters in the manual?",
		}
	},

	project: {
		no_inputs: "You are all done. There are no expected outputs",

		dimensions: {
			day: "Days",
			week: "Weeks",
			month: "Months",
			quarter: "Quarters",
			year: "Years",
			partition0: "Partition 0",
			partition1: "Partition 1",
			partition2: "Partition 2",
			partition3: "Partition 3",
			partition4: "Partition 4",
			partition5: "Partition 5",
			partition6: "Partition 6",
			entity: "Input entity",
			group: "Input group"
		},
		group: {
			location: "Location",
			partition: "Partitions",
			time: "Dates"
		},

		please_enter_new_name: "Enter a name for the new project",
		edit_user: "User edition",
		update_user: "Update the user",
		user_type: "Type",
		user_types: {
			internal: "MDM account",
			partner: "Partner account"
		},

		user_role: "Role",
		user_roles: {
			owner: "Owner",
			input_all: "Data entry",
			input: "Limited data entry",
			read: "Read-only"
		},
		user_fullname: "Full name",
		user: "User",
		username: "Login",
		password: "Password",

		link_indicator: "Link to an indicator in the catalog",
		unlink_indicator: 'Unlink from the catalog',

		parameter: "Parameter",
		all_selected: "No filter",
		create_logframe: "Add a logical frame",
		reporting_compare_sites: "Compare locations",
		unnamed_logframe: "Unnamed logical frame",

		update_logframe: "Update the logical frame",
		edit_indicator: "Edit indicator",
		display: "Name",
		display_ph: "ANC1 rate for the health centers",

		fill_with_last_input: "Fill with last input",
		show_finished: "See all data entries",
		field_order: "Order",
		field_distribution: "Distribution",
		cant_create: "You are not allowed to create new projects",
		my_projects: "My projects",
		are_you_sure_to_delete: "Please type: 'Yes, I do want to delete this project' to confirm",
		are_you_sure_to_delete_answer: "Yes, I do want to delete this project",
		data_selection: "Data selection",
		filters: "Filters",
		input_status: {
			'done-read': "Open",
			'outofschedule-read': "Open (out of calendar)",
			'done-edit': "Edit",
			'expected-edit': "Create",
			'expected-edit-new': "Create (new date)",
			'outofschedule-edit': "Open (wrong date)"
		},
		cols: "Columns",
		rows: "Rows",
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
			'	<li>Modifications on the planning (periodicity, dates) will cause old inputs to be put apart (with no data loss)</li>' + 
			'	<li>Modifications on the data structure will have variable consequences: please refer to the user guide</li>' + 
			'</ul>',

		partitions: "Partitions",

		add_variable: "Add a variable",
		remove_variable: "Remove this variable",
		add_partition: "Add a partition",
		remove_partition: "Remove this partition",

		aggregation: "Aggregation",
		different_geos: "On different places",
		same_geos: "On the same place",

		none: "Do not aggregate",
		sum: "Sum",
		average: "Average",
		highest: "Highest",
		lowest: "Lowest",
		last: "Last",

		variable_up: "Move up",
		variable_down: "Move down",


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


		activity: "Activity",
		activity_management: "Activities & Demography",
		variable: "Variable",


		result_management: "Objectives & results",
		no_purposes: "No purposes were defined yet",


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


		missing_mandatory_indicators: "Missing mandatory indicators",
		other_indicators: "Other indicators",
		see_other_themes: "See all thematics",

		entity_name: "Entity name",
		group_name: "Group name",
		entity_name_placeholder: "For instance: Health center X, Hospital X, ...",
		group_name_placeholder: "ex: Regional hospitals, North of the country, ...",


		create: "Create new project",
		periodicity: "Periodicity",
		start: 'Project start',
		end: 'Project end',


		periodicities: {
			day: "Every day",
			week: "Every week",
			month: 'Every month',
			quarter: 'Every quarter',
			year: "Every year",
			free: 'Free'
		},
		collect: "Collect",
		collects: {
			some_entity: "Once for some input entities",
			entity: "Once for each input entity",
			project: "Once for the whole project"
		},
		

		no_input_entities: 'No input entity was created yet!',
		no_input_groups: 'No input group was created yet!',
		no_forms: 'No form was created yet!',


		input: 'Input now',

		baseline: 'Baseline',
		target: 'Targets',

		goal: 'General objective',
		intervention_logic: 'Description',
		intervention_logic_goal_ph: 'Describe the project\'s contribution on a program or policy',
		intervention_logic_purpose_ph: 'Describe the tangible advantages that are provided to the beneficiaries',
		assumptions_purpose_ph: 'External factors that could jeopardize reaching the specific objective',

		start_date: "Begin date",
		end_date: "End date",
		name_ph: 'For Instance: [Laos] Primary health care',
		add_indicator: 'Add an indicator',

		purpose: 'Specific objective',
		purposes: 'Specific objectives',
		assumptions: 'Assumptions',
		output: "Result",
		activities: 'Activities',
		activity_desc_ph: 'Product or tangible service brought by the project',
		output_assumptions_ph: 'External factors that could jeopardize reaching the result',
		output_desc_ph: 'Product or tangible service brought by the project',

		add_activity: 'Add activity',
		add_output: 'Add a new result',
		add_purpose: 'Add a new specific objective',

		users: "Users",
		owners: "Owners",


		you_are_owner: "You can edit this project",
		you_are_editor: "You can input on this project",
		you_are_not_owner: "You cannot edit this project",
		you_are_not_editor: "You cannot input on this project",
	
		formula: "Formula: {{name}}",
		link: "Link: {{name}}",
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

		is_mandatory: "Mandatory. Should be collected for all new projects of this thematic.",
		is_approved: "Approved. Can be collected on new projects of this thematic.",
		is_waiting: "Waiting. Headquarters have not graded the quality of this indicator yet.",
		
		num_collecting_projects: "Nombre de projets collectant cet indicateur",

		search: "Search",
		search_ph: "Enter at least 3 characters",

		standard: "Standard",
		sources: "Sources",
		comments: "Notes",
		standard_ph: "Which standard is this indicator from?",
		sources_ph: "Which sources are more common for this indicator?",
		comments_ph: "When is it relevant to collect this indicator, and what are its limits?",

		target: "Relation with target",
		higher_is_better: "Reached if input is higher than target",
		lower_is_better: "Reached if input is lower than target",
		around_is_better: "Reached if input is around target",
		non_relevant: "Non relevant",

		no_theme: 'No theme',
		no_type: 'No type',

		operation: "Operation mode",

		name_ph: 'For instance: Percentage of correctly filled medical records',
		definition: 'Definition',
		unit: 'Unit',
		other: 'Other',
		percent: 'Percentage (%)',
		permille: 'Per thousand (‰)',
		types: 'Types',
		themes: 'Thematics',
		select_types: 'Select one or more types',
		select_themes: 'Select one or more themes',

		num_projects: 'Number of projects',
		create_new: 'Create new indicator',

		themes_list: "Themes list",
		types_list: "Types list",
		num_indicators: 'Number of indicators',
		
	},
	form: {
		mandatory: "This field is mandatory",
		start_lower_than_end: 'Begin date must be lower than end date',
		end_greater_than_start: 'End date must be greater than start date'
	}
};

