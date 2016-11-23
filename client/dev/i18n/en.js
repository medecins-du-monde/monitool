"use strict";


var ENGLISH_LOCALE = (function() {
	var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
	function getDecimals(n) {
	  n = n + '';
	  var i = n.indexOf('.');
	  return (i == -1) ? 0 : n.length - i - 1;
	}

	function getVF(n, opt_precision) {
	  var v = opt_precision;

	  if (undefined === v) {
	    v = Math.min(getDecimals(n), 3);
	  }

	  var base = Math.pow(10, v);
	  var f = ((n * base) | 0) % base;
	  return {v: v, f: f};
	}

	return {
  "DATETIME_FORMATS": {
    "AMPMS": [
      "AM",
      "PM"
    ],
    "DAY": [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ],
    "ERANAMES": [
      "Before Christ",
      "Anno Domini"
    ],
    "ERAS": [
      "BC",
      "AD"
    ],
    "FIRSTDAYOFWEEK": 6,
    "MONTH": [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ],
    "SHORTDAY": [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat"
    ],
    "SHORTMONTH": [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ],
    "STANDALONEMONTH": [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ],
    "WEEKENDRANGE": [
      5,
      6
    ],
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
        "negPre": "-\u00a4",
        "negSuf": "",
        "posPre": "\u00a4",
        "posSuf": ""
      }
    ]
  },
  "id": "en",
  "localeID": "en",
  "pluralCat": function(n, opt_precision) {  var i = n | 0;  var vf = getVF(n, opt_precision);  if (i == 1 && vf.v == 0) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
}
})();


var ENGLISH_TRANSLATION = {
	shared: {
		name_label_fr: "Name (french)",
		name_label_es: "Name (spanish)",
		name_label_en: "Name (english)",

		description_label_fr: "Description (french)",
		description_label_es: "Description (spanish)",
		description_label_en: "Description (english)",

		description: "Description",

		country: "Country",
		apply: "Apply changes",
		clone: "Clone",
		home: "Home",

		date: "Date",

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
		week_sat: 'Week (saturday to friday)',
		week_sun: 'Week (sunday to saturday)',
		week_mon: 'Week (monday to sunday)',
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

	project: {
		no_extra_indicators: "No extra indicator has been created yet. Click on \"Add indicator\" to create one!",
		no_data_source: "<span style=\"font-style: italic\">Create data sources to allow for data input</span>",
		general_info: "General information",
		collected_by: "Information collected by",
		reporting_empty: "No indicators were added to this section.",
		no_cross_cutting: "This project does not require collecting any cross-cutting indicator. Did you filled the thematics?",
		indicator_computation_missing: "Calculation is missing",
		delete_input: "Are you sure to delete this input?",
		zero_theme_indicator: "No thematics",
		multi_theme_indicator: "Multiple thematics",
		which_variable: "From which variable does this information comes from?",
		which_partitions: "Which partitions are relevant?",
		value_unknown: "Unknown value",

		computations: {
			unavailable: "It is not possible to compute this indicator",
			fixed: "Use a constant value",
			copy: "Copy a value (from a data source)",
			percentage: "Percentage (from data sources)",
			permille: "Per thousands (from data sources)",
			formula: "Custom formula (from data sources)"
		},

		formula: {
			copied_value: "Value to copy",
			denominator: "Denominator",
			numerator: "Numerator"
		},

		same_as_start: "Same as project's start",
		same_as_end: "Same as project's end",

		specific_start: "Specific start date",
		specific_end: "Specific end date",
		choose_sites_for_form: "Choose the sites from which this data source applies",
		choose_sites_for_user: "Choose the sites from which this user can input data",

		partition_edit: "Partition edition",
		partition_help_name: "This name will appear on multiple reporting tables. It names the partition that you want to create on your variable",
		partition_help_elements: 'Elements from the partition must be mutually exclusive, and it should be possible to find the total value by aggregating them.',
		partition_help_aggregation: 'How to find the total value by aggregating the elements described above?',
		partition_help_groups: 'Groups allow making intermediary aggregations',
		logical_frame: "Logical frame",
		
		structure: "Structure",
		no_data: "This data is not available",
		not_available_by_entity: "This data is not available by site",
		not_available_by_group: "This data is not available by group",
		not_available_min_week_sat: "This data is available by week (saturday to friday)",
		not_available_min_week_sun: "This data is available by week (sunday to saturday)",
		not_available_min_week_mon: "This data is available by week (monday to sunday)",
		not_available_min_month: "This data is available by month",
		not_available_min_quarter: "This data is available by quarter",
		not_available_min_year: "This data is available by year",

		saving_failed: "Monitool was unable to save the changes.",
		no_logical_frames: "No logical frame was created yet for this project.",
		partition_general: "General",
		partition_general_placeholder: "ex: Age group, gender, motive for consultation, pathology, referral status, ...",
		partition_elements: "Elements",
		aggregation_lab: "How to group elements together?",
		partition_name: "Name",
		partition_name_placeholder: "ex: Less than 12 years old, male, social consultation, flu, community referral, ...",
		no_partition_elements: "Click \"Add\" to add a new element to the partition",

		partition_groups: "Groups",
		partition_group_name: "Name",
		partition_group_name_placeholder: "ex: Minors, chronic pathologies, ...",
		no_partition_groups: "Click \"Add\" to add a new group to the partition",
		use_groups: "Use groups",

		no_inputs: "You are all done. There are no expected inputs",
		no_variable: "No variable is defined on this data source. Click \"Add a variable\" to create one!",
		no_partitions: "No partitions are defined on this variable",

		dimensions: {
			day: "Days",
			week_sat: "Weeks (saturday to friday)",
			week_sun: "Weeks (sunday to saturday)",
			week_mon: "Weeks (monday to sunday)",
			month: "Months",
			quarter: "Quarters",
			year: "Years",
			entity: "Collection site",
			group: "Collection group"
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
			input_all: "Data entry on all sites",
			input: "Data entry for specified sites",
			read: "Read-only"
		},
		user_fullname: "Full name",
		user: "User",
		username: "Login",
		password: "Password",

		parameter: "Parameter",
		all_selected: "No filter",
		create_logframe: "Add a logical frame",
		reporting_compare_sites: "Compare locations",
		unnamed_logframe: "Unnamed logical frame",

		edit_indicator: "Edit indicator",
		display: "Name",
		display_ph: "i.e. ANC1 rate for the health centers",
		computation: "Computation",

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
			'done': "Edit",
			'expected': "Create",
			'expected-new': "Create (new date)",
			'outofschedule': "Open (out of calendar)"
		},
		cols: "Columns",
		rows: "Rows",
		entity: "Collection site",
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

		aggregation: {
			sum: "Sum",
			average: "Average",
			highest: "Take highest value",
			lowest: "Take lowest value",
			last: "Take last value",
			none: "It's not possible to compute this"
		},

		covered_period: "Covered period",

		collection_site_list: "Collection sites",
		collection_form_list: "Data sources",
		collection_input_list: "Input",

		collection_site: "Collection site",
		collection_form: "Data source",

		collection_form_planning: "Calendar",
		collection_form_structure: "Structure",

		delete_form_easy: "Are you sure to delete this data source?",
		delete_form_hard: "If you delete this data source, all linked inputs will be deleted as well. Enter \"Delete the {{num_inputs}} inputs\" to confirm",
		delete_form_hard_answer: "Delete the {{num_inputs}} inputs",
		delete_entity: "If you delete this collection site, all linked inputs will be deleted as well. Enter \"Delete the {{num_inputs}} inputs\" to confirm",
		delete_entity_answer: "Delete the {{num_inputs}} inputs",

		running: "Running projects",
		finished: "Finished projects",
		noproject: "No projects match this criteria",

		variable: "Variable",

		no_purposes: "No purposes were defined yet",

		form_name_ph: "For instance: NHIS data, Ante-natal care tally sheet, PHC tally sheet, ...",

		entity_name: "Site name",
		group_name: "Group name",
		entity_name_placeholder: "For instance: Health center X, Hospital X, ...",
		group_name_placeholder: "ex: Regional hospitals, North of the country, ...",

		create: "Create new project",
		periodicity: "Periodicity",
		start: 'Project start',
		end: 'Project end',

		periodicities: {
			day: "Every day",
			week_sat: "Every week (saturday to friday)",
			week_sun: "Every week (sunday to saturday)",
			week_mon: "Every week (monday to sunday)",
			month: 'Every month',
			quarter: 'Every quarter',
			year: "Every year",
			free: 'Free'
		},
		collect: "Collect",
		collects: {
			some_entity: "For some of the collection sites",
			entity: "For each collection site",
			project: "Once for the whole project"
		},
		
		no_input_entities: 'No collection site was created yet!',
		no_input_groups: 'No collection group was created yet!',
		no_users: 'No user was added yet!',
		no_forms: 'No data source was created yet!',

		input: 'Input',

		baseline: 'Baseline',
		target: 'Target',

		goal: 'General objective',
		intervention_logic: 'Description',
		
		start_date: "Begin date",
		end_date: "End date",
		country_ph: 'For instance: CAR',
		name_ph: 'e.g. Access to quality care for people affected by the crisis',
		add_indicator: 'Add indicator',

		purpose: 'Specific objective',
		purposes: 'Specific objectives',
		assumptions: 'Assumptions',
		output: "Result",

		indicator_is_computed: "Valid",
		indicator_is_not_computed: "Invalid",

		intervention_logic_goal_ph: 'e.g. Reduce mortality and morbidity of the populations affected by the crisis',
		intervention_logic_purpose_ph: 'e.g. Improve access to health care for population affected by the crisis in the districts of Bimbo and Begoua',
		output_desc_ph: 'e.g. Improve primary health care at Bimbo and Begoua health centers',
		assumptions_purpose_ph: '',
		output_assumptions_ph: '',
		logframe_ph_name: "e.g. ECHO",

		logframe_help_name: "Name this logical frame to be able to identify it easily. For instance, with the name of the relevant donor",
		logframe_help_goal: "Describe the project\'s contribution on a program or policy",
		logframe_help_goal_indicators: "Enter here the indicators that allow to measure the general objective",
		logframe_help_purpose_desc: "Describe the tangible advantages that are provided to the beneficiaries",
		logframe_help_purpose_assumptions: "External factors that could jeopardize reaching the specific objective",
		logframe_help_purpose_indicators: "Enter here the indicators that allow to measure the specific objective",
		logframe_help_output_desc: "Product or tangible service brought by the project",
		logframe_help_output_assumptions: "External factors that could jeopardize reaching the result",
		logframe_help_output_indicators: "Enter here the indicators that allow to measure the result",

		add_output: 'Add a new result',
		add_purpose: 'Add a new specific objective',

		users: "Users",
		owners: "Owners",
	
		basics_info: "<p>Basics allow to file your project among the others of the NGO.</p>",
		basics_help_country: "In which country does your project takes place? If it's a regional project enter the name of the region.",
		basics_help_name: "The project's name allow finding your project in Monitool. Choose something that is informative enought, or copy the general objective.",
		basics_help_thematics: "The thematics that you choose will determine which cross-cutting indicators your project will need to collect.",
		basics_help_begin: "The begin date is the moment when your projects starts collecting data (usually, with the first activities)",
		basics_help_end: "The end date is the moment when your project closes it's data collection. If unknown, enter a date far into the future.",

		collection_site_info:
			"<p>When a project have the same activities on different sites, those activities need to be followed-up by site, groups of sites, and at project level.</p>" + 
			"<p>Enter here:</p>" + 
			"<ul>" + 
				"<li>The list of sites where your project works (i.e. the list of health centers)</li>" + 
				"<li>Groups that will be used during monitoring (i.e. by region, or type of structure)</li>" + 
			"</ul>",

		users_list_info:
			"<p>Many people take part in setting-up and monitoring a project: coordination, M&E staff, data entry operators, partners, ...</p>" + 
			"<p>Enter here all users that need to have access to the monitoring of the project.</p>",

		user_help_type: "Choose \"MDM Account\" if the user has a xxx@medecinsdumonde.net email address. Choose \"Partner account\" otherwise.",
		user_help_user: "Who is the MDM user that you want to add? If the user is not in the list, ask him/her to log-in Monitool a first time.",
		user_help_username: "This username will allow the user to connect. Email addresses are not allowed as usernames (i.e. your can use \"lastname.firstname\", ou \"job.country\")",
		user_help_fullname: "Enter here the full name of the person that will use the account.",
		user_help_password: "The password must be at least 6 characters long. Do not use the same value than the username",
		user_help_role: "This field determines what will this user be allowed to do: owners can change the project's structure, data entry officers can only do data input.",
		user_help_sites: "For which sites will this user enter data?",

		collection_form_list_info:
			"<p>The data sources are the different supports where the data needed for monitoring are available (tally sheets, medical records, excel files, ...).</p>" + 
			"<p>In Monitool, all the data avaiable on the data sources does not need to be entered, but only what is relevat to the project's monitorings</p>" + 
			"<p>To ease the data collection planning, data sources should correspond to real tools used on the field.</p>",

		collection_edit_help_name: "What is the name of the data source that you want to extract data from? i.e. \"Electronic medical record\", \"Health center tally sheet\", \"NHIS report\", ...",
		collection_edit_help_sites: "Among sites identified in \"Collection sites\", which one collect this data source?",
		collection_edit_help_periodicity: "How often is this data available? Take care, this is not the same thing as the frenquency of the reports that you need to provide.",
		collection_edit_help_start: "If this data source was created after the beginning of the project, enter here the date, otherwise, leave the default value",
		collection_edit_help_end: "If this data source will end before the end of the project, or was replaced, enter the date here",

		collection_edit_help_varname: "Name the variable that you want to extract from <code>{{name}}</code>. i.e. \"Number of diagnostics\".",
		collection_edit_help_geoagg: "In a project with two sites, if <code>{{name}}</code> is 10 for the first and 20 for the second, what is the value for the complete project?",
		collection_edit_help_timeagg: "In a project collecting monthly data, if <code>{{name}}</code> is 10 in january, 20 in february and 30 in march, what is the value for the first quarter?",
		collection_edit_help_partition: "Do we want to be able to differenciate <code>{{name}}</code> by age, gender, type of care, consultation motive, pathology, hour of the day, referral type, ...?",
		collection_edit_help_distribution: "If you wish to print the forms in A4 format, prefer having the titles at the left of the tables, to shorten their width.",
		collection_edit_help_order: "How do you wish to show the partitions on the input form?",

		logical_frame_list_info:
			"<p>A logical frame is a document that describe objectives, expected results, and actities to achieve them, as well as indicators to monitor the advancement of each of those elements</p>" + 
			"<p>All indicators have to be computable from the data described in data sources</p>",

		cross_cutting_list_info:
			"<p>Cross-cutting indicators are determined from the list of thematics in \"Basics\".</p>" + 
			"<p>This list contains all cross-cutting indicators that your project need to collect</p>",

		input_list_info:
			"<p>This input calendar list all the inputs that were programmed for the data source \"{{name}}\"</p>" +
			"<p>To limit data entry errors, the preferred course is to do the data entry close from the site where the data is extracted, directly on monitool.</p>" + 
			"<p>If not attainable, a PDF version of the form is provided.</p>",

		extra_indicators_list_info: 
			"<p>Extra indicators are indicators that are not in any logical frame.</p>" +
			"<p>Those allow to monitor specific elements of the project (medical data, logistics, ...)</p>",

		download_portrait: "Download PDF (portrait)",
		download_landscape: "Download PDF (landscape)",

		press_to_drag: "Hold to drag & drop",
		titles: "Titles",
		data: "Data",
		general_informations: "General informations",
		fill_with_last_input: "Fill with data from the previous entry",
		
		variable_name_label: "What are your measuring?",
		variable_name_ph: "ex: Number of diagnostics",
		site_agg_label: "How to group entries from different sites?",
		time_agg_label: "How to group entries from different periods?",
		partitions_label: "Which partitions should be used on this variable?",
		distribution_label: "Where should partition elements be displayed on the forms?",
		order_label: "In which order should the partitions be shown?",
		no_indicator: "No indicator is defined. Click on \"Add an indicator\"",
		delete_form: "Delete data source",
		delete_logical_frame: "Delete logical frame",
		delete_purpose: "Delete specific objective",
		delete_result: "Delete result",

		no_element_selected: "No element is selected",

		indicator_ph_fixed: "Enter the constant value for the indicator (e.g. 12)",
		indicator_help_display: "Name your indicator. The name should come from a catalog to be consistent with other projects.",
		indicator_help_baseline: "What was the value of the indicator before the first activities? Tick the checkbox to specify.",
		indicator_help_target: "What is the target for this indicator? Tick the checkbox to specify.",
		indicator_help_colorize: "Do you wish to have colors (red, orange, green) on reporting for this indicator?",
		indicator_help_computation: "How to compute this indicator from the variables that you collected in data sources?"
	},
	
	form: {
		mandatory: "This field is mandatory",
		start_lower_than_end: 'Begin date must be lower than end date',
		end_greater_than_start: 'End date must be greater than start date',

		help: {
			show: "Show help for this field",
			hide: "Hide help for this field"
		}
	},
	theme: {
		new_theme: "New thematic",
		create_new: "Create a thematic"
	},
	user: {
		email: "Email",
		fullname: "Full name",
		role: "Role",
		save: "Save user",
		
		list_info: 
			"<p>This page contains the list of all users that connected at least once on Monitool</p>" + 
			"<p>It is not needed to create new account for users that have a xxx@medecinsdumonde.net email address: they will automatically appear here once they connect once. For partners, it is possible to create account from the project management pages.</p>",

		edit_info:
			"<p>You can edit the permissions of other users here. Click on \"Show help for this field\" to have more details on the different kinds of permissions that are available.</p>",

		roles_short: {
			admin: "Administrator",
			project: "Project creation",
			common: "Common",
		},

		permissions: {
			thematics: "Create and edit thematics",
			cross_cutting: "Create and edit cross-cutting indicators",
			user_roles: "Edit other users roles",
			own_all_projects: "Edit all projects structure and data",
			create_projects: "Create projects",
			edit_projects: "Edit projects' structure and data where explicitely allowed",
			see_reporting: "See all project's reporting"
		}
	},

	theme: {
		list_info: 
			"<p>This page contains the list of thematics handled by the NGO.</p>" +
			"<p>Projects and cross-cutting indicators can be linked to thematics.</p>",

		edit_info:
			"",

		themes: "Thematics",
		edit_title: "Thematic edition",
		save: "Save the thematic",

		new_theme: "New thematic",
		create_new: "Create a new thematic",

		name_placeholder_fr: "i.e. Santé Sexuelle et Reproductive",
		name_placeholder_es: "i.e. Salud Sexual y reproductiva",
		name_placeholder_en: "i.e. Sexual and Reproductive Health",

		info: 
			"<p>Enter here the name of the thematic in all languages used by your organisation.</p>" +
			"<p>If you cannot translate to all languages:</p>" +
			"<ol>" +
				"<li>Manually translate all the languages that you can</li>" +
				"<li>Use the button on the left to use automatic translation for the others</li>" +
			"</ol>"
	},

	indicator: {
		not_collected: "This indicator is not collected by any project",
		extra: "Extra indicators",
		new_indicator: "New indicator",
		create_new: 'Create a new indicator',

		cross_cutting: "Cross-cutting indicators",
		select_themes: 'i.e. Primary health care',

		edit_title: "Indicator edition",
		themes_label: "Thematics",

		name_placeholder_fr: "Volume de formation",
		name_placeholder_en: "Training volume",
		name_placeholder_es: "Volumen de formación",

		description_placeholder_fr: "On ne parle pas d'éducation pour la santé, mais de formation à du personnel soignant. On compte le nombre de participations et non pas le nombre de personnes différentes ayant participé à ces formations.",
		description_placeholder_en: "We are not talking about health education, but training of medical staff. Count the number of entries and not the number of different people who attended these trainings.",
		description_placeholder_es: "No se trata de educación para la salud, sino de formación para el personal sanitario. Se cuenta el número de participaciones y no el número de personas distintas que hayan participado.",

		list_info: 
			"<p>This page contain the list of all the cross-cutting indicators of the NGO.<br/>Collecting each indicator is mandatory for all projects that have at least one thematic in common with it.</p>" + 
			"<p>To allow projects to plan for their data collection, avoid changing this list often.</p>",

		edit_info: 
			"<p>This page allows changing the definition of a cross-cutting indicator. If you make changes, take care to update all languages.</p>" + 
			"<p>If you cannot translate to all language:</p>" +
			"<ol>" +
				"<li>Translate all languages that you can</li>" +
				"<li>Use the button on the left on missing fields to use automatic translation</li>" +
			"</ol>",

		save: "Save indicator"
	}
};

