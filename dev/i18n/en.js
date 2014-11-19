var ENGLISH_TRANSLATION = {
	shared: {
		projects: 'Projects',
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
		target_percentage: 'Target percentage',
		baseline_percentage: 'Baseline percentage',
		plot: 'Plot',
		download_plot: 'Download plot',
		download_table: 'Download table',
		unknown_indicator: "Unknown indicator",

		choose_indicator: 'Choose an indicator',
		list: 'List',

	},
	menu: {
		toggle_nav: "Toggle navigation",
		language: "Language",
		french: "French",
		spanish: "Spanish",
		english: "English",
	},
	project: {
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

		monthly: 'Every month',
		quarterly: 'Every quarter',
		planned: 'Planned',

		no_input_entities: 'No input entity was created yet!',
		no_input_groups: 'No input group was created yet!',
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
		green_zone: 'Verte Zone',
		baseline: 'Baseline',
		baseline_ph: 'Reference value',
		target_value_ph: 'value',
		targets: 'Targets',
		add_target: 'Add a target',
		general_data: 'General data',

		goal: 'Main goal',
		goal_short: "Goal",
		intervention_logic: '',				// Logique d\'intervention
		intervention_logic_goal_ph: '',		// Description de la contribution du projet aux objectifs (impact) d\'une politique ou d\'un programme
		intervention_logic_purpose_ph: '',	// Description des avantages directs destinés au(x) groupe(s) cible(s)
		assumptions_purpose_ph: '',			// Si l\'objectif spécifique est atteint, quelles hypothèses doivent être confirmées pour atteindre l\'objectif général?
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
		activity_prereq_ph: '',		// Si le resultat est obtenu, quelles hypothèses doivent être confirmées pour atteindre l\'objectif spécifique?
		activity_desc_ph: '',		// Produit ou service tangibles apportés par le projet.
		output_assumptions_ph: '',	// Si le résultat est obtenu, quelles hypothèses doivent être confirmées pour atteindre l\'objectif spécifique?',
		output_desc_ph: '',			// Produit ou service tangibles apportés par le projet.

		add_activity: 'Add activity',
		add_output: 'Add output',
		add_purpose: 'Add purpose',

	},
	indicator: {
		no_theme: 'No theme',
		no_type: 'No type',

		name_ph: 'For instance: Percentage of correclty filled medical records',
		description_ph: '',		// Exemple: Mesurer le niveau de formation du personnel médical qui rempli les dossiers patients. Sa mesure est facile sur des projets de petite dimension, à éviter dans un autre cadre.',
		history_ph: '',			// Exemple: Défini en 2007 par l\'OMS et utilisé sur les projets de UNICEF ... cet indicateur a permi de suivre les objectifs ...
		definition: 'Definition',
		standard: 'Standard',
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

	},
	form: {
		mandatory: "This field is mandatory",
		begin_lower_than_end: 'Begin date must be lower than end date',
		end_greater_than_begin: 'End date must be greater than begin date',
	}
};
