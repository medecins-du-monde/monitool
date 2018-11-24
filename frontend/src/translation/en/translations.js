

export default {
	shared: {
		none: "None",
		percentage_done: "{{value}}% done",
		percentage_incomplete: "{{value}}% incomplete",
		percentage_missing: "{{value}}% missing",

		task: "Task",
		state: "State",
		open: "Open",
		loading: "Loading...",
		portrait: "Portrait",
		landscape: "Landscape",

		restore: "Restore",

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
		month_week_sat: 'Week (saturday to friday / split by month)',
		month_week_sun: 'Week (sunday to saturday / split by month)',
		month_week_mon: 'Week (monday to sunday / split by month)',
		week_sat: 'Week (saturday to friday)',
		week_sun: 'Week (sunday to saturday)',
		week_mon: 'Week (monday to sunday)',
		month: 'Month',
		quarter: "Quarter",
		semester: "Semester",
		year: "Year",

		choose: 'Choose',
		cancel: 'Cancel',
		logical_frames: 'Logical Frameworks',
		reporting: 'Reporting',
		reporting_general: 'General reporting',
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
		last_entry: "Last entry",
		show_totals: "Show totals",
		input_fill_forms: "Fill the {{numInputs}} forms of",
		add_user: "Add new user",
		add_datasource: "Create a new data source",
		is_user: "You are a member of this project",
		no_matches: "No projects match the selected criterias",
		is_finished: "This project is finished",
		was_deleted: "This project was deleted",
		show_finished_projects: "Show finished projects",
		show_deleted_projects: "Show deleted projects",
		filter_placeholder: "Enter text here to filter the projects",

		revisions: "History",
		revision_info: "The changelog allows to consult all modifications that were made to the structure of your project, and revert to previous revisions if needed.",
		revision_datetime: "Date & User",
		revision_changes: "Changes",
		revision_restore: "Revert to this version",
		revision_save_to_confirm: "Save to confirm reverting to this version",
		revision_is_equivalent: "This version is equivalent to the current state of the project",
		revision_none: "No history is available on this project",
		revision_show_more: "Load more revisions",

		history: {
			active_replace: "Change deletion status from <code>{{!before}}</code> to <code>{{!after}}</code>",
			name_replace: "Rename the project from <code>{{before}}</code> to <code>{{after}}</code>",
			start_replace: "Change the project start date of the project from <code>{{before|date}}</code> to <code>{{after|date}}</code>",
			end_replace: "Change the project end date from <code>{{before|date}}</code> to <code>{{after|date}}</code>",
			country_replace: "Change the project country from <code>{{before}}</code> to <code>{{after}}</code>",
			visibility_replace: "Change the project visibility from <code>{{before}}</code> vers <code>{{after}}</code>",

			themes_add: "Add a new thematic to the project",
			themes_move: "Reorder the project thematics",
			themes_remove: "Remove a thematic from the project",

			entities_add: "Add the new site <code>{{item.name}}</code>",
			entities_move: "Reorder the sites of the project",
			entities_remove: "Remove the site <code>{{item.name}}</code>",
			entities_name_replace: "Rename the site <code>{{before}}</code> to <code>{{after}}</code>",
			entities_start_replace: "Change the site begin date of <code>{{entity.name}}</code> from <code>{{before|date}}</code> to <code>{{after|date}}</code>",
			entities_end_replace: "Change the site end date of <code>{{entity.name}}</code> from <code>{{before|date}}</code> to <code>{{after|date}}</code>",

			groups_add: "Create the group <code>{{item.name}}</code>",
			groups_move: "Reorder the project groups",
			groups_remove: "Remove the group <code>{{item.name}}</code>",
			groups_name_replace: "Rename the group <code>{{before}}</code> to <code>{{after}}</code>",
			groups_members_add: "Add the site <code>{{item.name}}</code> to the group <code>{{group.name}}</code>",
			groups_members_move: "Reorder the sites of the group <code>{{group.name}}</code>",
			groups_members_remove: "Remove the site <code>{{item.name}}</code> from the group <code>{{group.name}}</code>",

			users_add: "Add the user <code>{{item.id || item.username}}</code> to the project",
			users_move: "Reorder the project users",
			users_remove: "Remove the user <code>{{item.id || item.username}}</code> from the project",
			users_name_replace: "Rename the partner <code>{{before}}</code> to <code>{{after}}</code>",
			users_password_replace: "Change the password of the partner <code>{{user.id || user.username}}</code>",
			users_role_replace: "Change the role of  <code>{{user.id || user.username}}</code> from <code>{{before}}</code> to <code>{{after}}</code>",
			users_entities_add: "Allow <code>{{user.id || user.username}}</code> to input data on site <code>{{item.name}}</code>",
			users_entities_move: "Reorder the sites associated with user <code>{{user.id || user.username}}</code>",
			users_entities_remove: "Remove authorization to input on site <code>{{item.name}}</code> of user <code>{{user.id || user.username}}</code>",
			users_dataSources_add: "Allow <code>{{user.id || user.username}}</code> to input data on data source <code>{{item.name}}</code>",
			users_dataSources_move: "Reordonne les sources de données associées à l'utilisateur <code>{{user.id || user.username}}</code>",
			users_dataSources_remove: "Remove authorization to input on data source <code>{{item.name}}</code> of user <code>{{user.id || user.username}}</code>",

			forms_add: "Create the data source <code>{{item.name}}</code>",
			forms_move: "Reorder the data sources of the project",
			forms_remove: "Delete the data source <code>{{item.name}}</code>",
			forms_name_replace: "Rename the data source <code>{{before}}</code> to <code>{{after}}</code>",
			forms_periodicity_replace: "Change the periodicity of the data source <code>{{form.name}}</code> from <code>{{before}}</code> to <code>{{after}}</code>",
			forms_start_replace: "Change the start date of the data source <code>{{form.name}}</code> from <code>{{before|date}}</code> to <code>{{after|date}}</code>",
			forms_end_replace: "Change the end date of the data source <code>{{form.name}}</code> from <code>{{before|date}}</code> to <code>{{after|date}}</code>",

			forms_entities_add: "Add the site <code>{{item.name}}</code> to the data source <code>{{form.name}}</code>",
			forms_entities_move: "Reorder the sites of the data source <code>{{form.name}}</code>",
			forms_entities_remove: "Remove the site <code>{{item.name}}</code> from the data source <code>{{form.name}}</code>",

			forms_elements_add: "Add the variable <code>{{item.name}}</code> to <code>{{form.name}}</code>",
			forms_elements_move: "Reorder the variables of the data source <code>{{form.name}}</code>",
			forms_elements_remove: "Remove the variable <code>{{item.name}}</code> from <code>{{form.name}}</code>",
			forms_elements_name_replace: "Rename the variable <code>{{before}}</code> to <code>{{after}}</code>",
			forms_elements_geoAgg_replace: "Change the aggregation rule (location) of <code>{{variable.name}}</code> from <code>{{before}}</code> to <code>{{after}}</code>",
			forms_elements_timeAgg_replace: "Change the aggregation rule (time) of <code>{{variable.name}}</code> from <code>{{before}}</code> to <code>{{after}}</code>",
			forms_elements_order_replace: "Change the format of the input table of <code>{{variable.name}}</code>",
			forms_elements_distribution_replace: "Change the format of the input table of <code>{{variable.name}}</code>",

			forms_elements_partitions_add: "Create the disaggregation <code>{{item.name}}</code> in <code>{{variable.name}}</code>",
			forms_elements_partitions_move: "Reorder the disaggregations of <code>{{variable.name}}</code>",
			forms_elements_partitions_remove: "Delete the disaggregation <code>{{item.name}}</code> from <code>{{variable.name}}</code>",
			forms_elements_partitions_name_replace: "Rename the disaggregation <code>{{before}}</code> to <code>{{after}}</code> in variable <code>{{variable.name}}</code>",
			forms_elements_partitions_aggregation_replace: "Change aggregation mode from <code>{{before}}</code> to <code>{{after}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",

			forms_elements_partitions_elements_add: "Add element <code>{{item.name}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",
			forms_elements_partitions_elements_move: "Reorder elements of disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",
			forms_elements_partitions_elements_remove: "Delete element <code>{{item.name}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",
			forms_elements_partitions_elements_name_replace: "Rename element <code>{{before}}</code> to <code>{{after}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",

			forms_elements_partitions_groups_add: "Add group <code>{{item.name}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_move: "Reorder groups in <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_remove: "Delete group <code>{{item.name}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_name_replace: "Rename group <code>{{before}}</code> to <code>{{after}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_members_add: "Add <code>{{item.name}}</code> to group <code>{{group.name}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_members_move: "Reorder group members of <code>{{group.name}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_members_remove: "Remove <code>{{item.name}}</code> from group <code>{{group.name}}</code> in disaggregation <code>{{partition.name}}</code> of variable <code>{{variable.name}}</code>",

			logicalFrames_add: "Create logical framework <code>{{item.name}}</code>",
			logicalFrames_move: "Reorder logical frameworks",
			logicalFrames_remove: "Remove logical framework <code>{{item.name}}</code>",

			logicalFrames_entities_add: "Add the site <code>{{item.name}}</code> to the logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_entities_move: "Reorder the sites of the logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_entities_remove: "Remove the site <code>{{item.name}}</code> from the logical framework <code>{{logicalFrame.name}}</code>",

			logicalFrames_name_replace: "Rename logical framework <code>{{before}}</code> to <code>{{after}}</code>",
			logicalFrames_goal_replace: "Change general objective <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_start_replace: "Change start date <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_end_replace: "Change end date <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",

			logicalFrames_purposes_add: "Add specific objective <code>{{item.description}}</code> to logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_move: "Reorder specific objectives of logical framwork <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_remove: "Remove specific objective <code>{{item.description}}</code> from logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_description_replace: "Change description of specific objective <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_assumptions_replace: "Change assumptions of specific objective <code>{{purpose.description}}</code> de <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",

			logicalFrames_purposes_outputs_add: "Add result <code>{{item.description}}</code> to logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_move: "Reorder results in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_remove: "Remove result <code>{{item.description}}</code> from logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_description_replace: "Change result description <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_assumptions_replace: "Change result assumptions <code>{{output.description}}</code> from <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",

			logicalFrames_purposes_outputs_activities_add: "Add activity <code>{{item.description}}</code> to logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_activities_move: "Reorder activities in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_activities_remove: "Remove activity <code>{{item.description}}</code> from logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_activities_description_replace: "Change activity description <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",

			logicalFrames_indicators_add: "Add indicator <code>{{item.display}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_move: "Move indicator <code>{{item.display}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_remove: "Remove indicator <code>{{item.display}}</code> from logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_baseline_replace: "Change baseline of indicator <code>{{indicator.display}}</code> from <code>{{before}}</code> vers <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_target_replace: "Change target of indicator <code>{{indicator.display}}</code> from <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_display_replace: "Rename indicator <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_colorize_replace: "Change indicator <code>{{indicator.display}}</code> colorization from <code>{{before}}</code> to <code>{{after}}</code> in logical framework <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_computation_replace: "Change indicator <code>{{indicator.display}}</code> computation in logical framework <code>{{logicalFrame.name}}</code>",

			extraIndicators_add: "Add extra indicator <code>{{item.display}}</code>",
			extraIndicators_move: "Reorder extra indicators",
			extraIndicators_remove: "Deletee extra indicator <code>{{item.display}}</code>",
			extraIndicators_baseline_replace: "Change baseline of extra indicator <code>{{extraIndicator.display}}</code> from <code>{{before}}</code> to <code>{{after}}</code>",
			extraIndicators_target_replace: "Change target of extra indicator <code>{{extraIndicator.display}}</code> from <code>{{before}}</code> to <code>{{after}}</code>",
			extraIndicators_display_replace: "Rename extra indicator <code>{{before}}</code> to <code>{{after}}</code>",
			extraIndicators_colorize_replace: "Change extra indicator <code>{{extraIndicator.display}}</code> colorization from <code>{{before}}</code> to <code>{{after}}</code>",
			extraIndicators_computation_replace: "Change extra indicator <code>{{extraIndicator.display}}</code> computation",

			crossCutting_add: "Add a cross-cutting indicator",
			crossCutting_remove: "Delete a cross-cutting indicator",
			crossCutting_baseline_replace: "Change cross-cutting indicator baseline from <code>{{before}}</code> to <code>{{after}}</code>",
			crossCutting_target_replace: "Change cross-cutting indicator target from <code>{{before}}</code> to <code>{{after}}</code>",
			crossCutting_colorize_replace: "Change cross-cutting indicator colorization from <code>{{before}}</code> to <code>{{after}}</code>",
			crossCutting_computation_replace: "Change cross-cutting indicator computation"
		},

		visibility: {
			visibility: "Visibility",
			public: "Visible for all users (besides partners)",
			private: "Visible only to members of this project",
			help: "Outside of specific cases, all projects should be visible for all users."
		},

		authorization: "Authorization",
		form_error_short: "Some fields are invalid in the form.",
		form_persisted_short: "You did not made changes.",
		form_changed_short: "You made changes.",

		form_error: "Some fields are invalid in the form, fix them in order to save.",
		form_persisted: "Your data is saved.",
		form_changed: "You made changes. Don't forget to click on Save.",

		show_more_inputs: "See older dates",
		all_elements: "All",
		no_extra_indicators: "No extra indicator has been created yet. Click on \"Add indicator\" to create one!",
		no_data_source: "<span style=\"font-style: italic\">Create data sources to allow data entry</span>",
		general_info: "General information",
		collected_by: "Information collected by",
		reporting_empty: "No indicators were added to this section.",
		no_cross_cutting: "This project does not require collecting any cross-cutting indicator. Did you filled the thematics?",
		indicator_computation_missing: "Calculation is missing",
		delete_input: "Are you sure to delete this input?",
		zero_theme_indicator: "No thematics",
		multi_theme_indicator: "Multiple thematics",
		which_variable: "From which variable does this information comes from?",
		which_partitions: "Which disaggregations are relevant?",
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

		partition_edit: "Disaggregation edition",
		partition_help_name: "This name will appear on multiple reporting tables. It names the disaggregation that you want to create on your variable",
		partition_help_elements: 'Elements from the disaggregation must be mutually exclusive, and it should be possible to find the total value by aggregating them.',
		partition_help_aggregation: 'How to find the total value by aggregating the elements described above?',
		partition_help_groups: 'Groups allow making intermediary aggregations',
		logical_frame: "Logical framework",

		structure: "Structure",
		no_data: "This data is not available",
		not_available_by_entity: "This data is not available by site",
		not_available_by_group: "This data is not available by group",
		not_available_min_week_sat: "This data is available by week (saturday to friday)",
		not_available_min_week_sun: "This data is available by week (sunday to saturday)",
		not_available_min_week_mon: "This data is available by week (monday to sunday)",
		not_available_min_month: "This data is available by month",
		not_available_min_quarter: "This data is available by quarter",
		not_available_min_semester: "This data is available by semester",
		not_available_min_year: "This data is available by year",

		saving_failed_conflict_input: "Unable to save the changes because another user made changes to the same data entry since you loaded the page. Reload the page to get the last version, and apply your changes again.",
		saving_failed_conflict: "Unable to save the changes because another user made changes to the same project since you loaded the page. Reload the page to get the last version, and apply your changes again.",
		saving_failed_other: "Unable to save the changes, probably because of connectivity issues. Keep this window open, and try saving again once you are connected to the internet.",

		no_logical_frames: "No logical framework was created yet for this project.",
		partition_general: "General",
		partition_general_placeholder: "ex: Age group, gender, motive for consultation, pathology, referral status, ...",
		partition_elements: "Elements",
		aggregation_lab: "How to group elements together?",
		partition_name: "Name",
		partition_name_placeholder: "ex: Less than 12 years old, male, social consultation, flu, community referral, ...",
		no_partition_elements: "Click \"Add\" to add a new element to the disaggregation",

		partition_groups: "Groups",
		partition_group_name: "Name",
		partition_group_name_placeholder: "ex: Minors, chronic pathologies, ...",
		no_partition_groups: "Click \"Add\" to add a new group to the disaggregation",
		use_groups: "Use groups",

		no_inputs: "You are all done. There are no expected inputs",
		no_variable: "No variable is defined on this data source. Click \"Add a variable\" to create one!",
		no_partitions: "No disaggregations are defined on this variable",

		dimensions: {
			day: "Days",
			month_week_sat: 'Weeks (saturday to friday / split by month)',
			month_week_sun: 'Weeks (sunday to saturday / split by month)',
			month_week_mon: 'Weeks (monday to sunday / split by month)',
			week_sat: "Weeks (saturday to friday)",
			week_sun: "Weeks (sunday to saturday)",
			week_mon: "Weeks (monday to sunday)",
			month: "Months",
			quarter: "Quarters",
			semester: "Semesters",
			year: "Years",
			entity: "Collection site",
			group: "Collection group"
		},
		group: {
			location: "Location",
			partition: "Disaggregations",
			time: "Dates"
		},

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
			input: "Data entry",
			read: "Read-only"
		},
		user_fullname: "Full name",
		user: "User",
		username: "Login",
		password: "Password",

		parameter: "Parameter",
		all_selected: "No filter",
		create_logframe: "Add a logical framework",
		reporting_compare_sites: "Compare sites",
		unnamed_logframe: "Unnamed logical framework",

		edit_indicator: "Edit indicator",
		display: "Name",
		display_ph: "i.e. ANC1 rate for the health centers",
		computation: "Computation",

		show_finished: "See all data entries",
		field_order: "Order",
		field_distribution: "Distribution",
		cant_create: "You are not allowed to create new projects",
		my_projects: "My projects",
		are_you_sure_to_clone: "This action will clone this project, and all related input. Confirm to clone.",
		are_you_sure_to_delete: "Are you sure that you want to delete this project? Confirm to delete.",
		data_selection: "Data selection",
		filters: "Filters",
		input_status: {
			'done': "Edit ({{100*value|number:0}}%)",
			'expected': "Create",
			'expected-new': "Create (new date)"
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

		partitions: "Disaggregations",

		add_variable: "Add a variable",
		remove_variable: "Remove this variable",
		add_partition: "Add a disaggregation",
		remove_partition: "Remove this disaggregation",

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
			month_week_sat: 'Every weeks (saturday to friday / split by month)',
			month_week_sun: 'Every weeks (sunday to saturday / split by month)',
			month_week_mon: 'Every weeks (monday to sunday / split by month)',
			week_sat: "Every week (saturday to friday)",
			week_sun: "Every week (sunday to saturday)",
			week_mon: "Every week (monday to sunday)",
			month: 'Every month',
			quarter: 'Every quarter',
			semester: 'Every semester',
			year: "Every year",
			free: 'Free'
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

		logframe_help_sites: "Among sites identified in \"Collection sites\", which one are relevant for this logical framework?",
		logframe_help_name: "Name this logical framework to be able to identify it easily. For instance, with the name of the relevant donor",
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
		basics_help_end: "The end date is the moment when your project closes its data collection. If unknown, enter a date far into the future.",

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
		user_help_datasources: "For which data sources will this user enter data?",

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
		collection_edit_help_partition: "Do we want to be able to differenciate <code>{{name}}</code> by age, gender, type of care, consultation motive, pathology, hour of the day, referral type, ...?<br/>Do not disaggregate by location: your collection sites were already filled in the relevant page.",
		collection_edit_help_distribution: "If you wish to print the forms in A4 format, prefer having the titles at the left of the tables, to shorten their width.",
		collection_edit_help_order: "How do you wish to show the disaggregations on the input form?",

		logical_frame_list_info:
			"<p>A logical framework is a document that describe objectives, expected results, and actities to achieve them, as well as indicators to monitor the advancement of each of those elements</p>" +
			"<p>All indicators have to be computable from the data described in data sources</p>",

		cross_cutting_list_info:
			"<p>Cross-cutting indicators are determined from the list of thematics in \"Basics\".</p>" +
			"<p>This list contains all cross-cutting indicators that your project need to collect</p>",

		input_list_info:
			"<p>This input calendar list all the inputs that were programmed for the data source \"{{name}}\"</p>" +
			"<p>To limit data entry errors, the preferred course is to do the data entry close from the site where the data is extracted, directly on monitool.</p>" +
			"<p>If not attainable, a PDF version of the form is provided.</p>",

		extra_indicators_list_info:
			"<p>Extra indicators are indicators that are not in any logical framework.</p>" +
			"<p>Those allow to monitor specific elements of the project (medical data, logistics, ...)</p>",

		download_portrait: "Download PDF (portrait)",
		download_landscape: "Download PDF (landscape)",
		download_pdf: "PDF",

		press_to_drag: "Hold to drag & drop",
		titles: "Titles",
		data: "Data",
		general_informations: "General informations",
		fill_with_last_input: "Fill with data from the previous entry",

		variable_name_label: "What are your measuring?",
		variable_name_ph: "ex: Number of diagnostics",
		site_agg_label: "How to group entries from different sites?",
		time_agg_label: "How to group entries from different periods?",
		partitions_label: "Which disaggregations should be used on this variable?",
		distribution_label: "Where should disaggregation elements be displayed on the forms?",
		order_label: "In which order should the disaggregations be shown?",
		no_indicator: "No indicator is defined. Click on \"Add an indicator\"",
		delete_form: "Delete data source",
		delete_logical_frame: "Delete logical framework",
		delete_purpose: "Delete specific objective",
		delete_result: "Delete result",

		no_element_selected: "No element is selected",

		indicator_ph_fixed: "Enter the constant value for the indicator (e.g. 12)",
		indicator_help_description: "Context of the data collection, details on how to compute the indicator...",
		indicator_help_display: "Name your indicator. The name should come from a catalog to be consistent with other projects.",
		indicator_help_baseline: "What was the value of the indicator before the first activities? Tick the checkbox to specify.",
		indicator_help_target: "What is the target for this indicator? Tick the checkbox to specify.",
		indicator_help_colorize: "Do you wish to have colors (red, orange, green) on reporting for this indicator?",
		indicator_help_computation: "How to compute this indicator from the variables that you collected in data sources?",

		activity: "Activity",
		add_activity: "Add a new activity",
		delete_activity: "Delete activity",
		activity_desc_ph: "e.g. Awareness sessions on HIV transmission",
		logframe_help_activity_desc: "Activity realized by the NGO",
		logframe_help_activity_indicators: "Enter here the indicators that allows to measure the activity progress",

		logframe_edit_help_start: "If this logical framework is not valid since the start of the project enter the date here, otherwise, leave the default value",
		logframe_edit_help_end: "If this logical framework is not valid up to the end of the project enter the date here, otherwise, leave the default value",
		form_is_not_associated_with_site: "This data source is not associated with any collection site."
	},

	form: {
		mandatory: "This field is mandatory",
		start_lower_than_end: 'Begin date must be lower than end date',
		end_greater_than_start: 'End date must be greater than start date',

		help: {
			show: "Show help for this field",
			hide: "Hide help for this field"
		},

		create_blank: "Create a blank logical framework",
		create_copy: "Create a copy"
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
		missing_description: "<i>The description of this indicator was not filled</i>",
		not_collected: "This indicator is not collected by any project",
		extra: "Extra indicators",
		new_indicator: "New indicator",
		create_new: 'Create a new indicator',

		see_report: "See report",

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

