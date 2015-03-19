"use strict";

var FRENCH_LOCALE = {
	id: "fr-fr",
	DATETIME_FORMATS: {
		AMPMS: [ "AM", "PM" ],
		DAY: [ "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi" ],
		MONTH: [ "janvier", "f\u00e9vrier", "mars", "avril", "mai", "juin", "juillet", "ao\u00fbt", "septembre", "octobre", "novembre", "d\u00e9cembre" ],
		SHORTDAY: [ "dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam." ],
		SHORTMONTH: [ "janv.", "f\u00e9vr.", "mars", "avr.", "mai", "juin", "juil.", "ao\u00fbt", "sept.", "oct.", "nov.", "d\u00e9c." ],
		fullDate: "EEEE d MMMM y",
		longDate: "d MMMM y",
		medium: "d MMM y HH:mm:ss",
		mediumDate: "d MMM y",
		mediumTime: "HH:mm:ss",
		short: "dd/MM/y HH:mm",
		shortDate: "dd/MM/y",
		shortTime: "HH:mm"
	},
	NUMBER_FORMATS: {
		CURRENCY_SYM: "\u20ac",
		DECIMAL_SEP: ",",
		GROUP_SEP: "\u00a0",
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
				negPre: "-",
				negSuf: "\u00a0\u00a4",
				posPre: "",
				posSuf: "\u00a0\u00a4"
			}
		]
	},
	"pluralCat": function(n, opt_precision) {
		var i = n | 0;
		if (i == 0 || i == 1)
			return PLURAL_CATEGORY.ONE;
		
		return PLURAL_CATEGORY.OTHER;
	}
};




var FRENCH_TRANSLATION = {
	shared: {
		sum: "Total",
		include: "Inclure",
		toggle: "Changer",
		toggle_all: "Changer tous",

		date: "Date",
		administrator: "Administrateur",

		back_to_intranet: "Retourner sur l'intranet",
		settings: "Paramètres",
		projects: 'Projets',
		project: 'Projet',
		users: "Utilisateurs",
		indicator: 'Indicateur',
		indicators: 'Indicateurs',
		indicators_catalog: 'Catalogue Indicateurs',
		help: 'Aide',
		input_entities: 'Lieux d\'activité',
		input_groups: 'Groupes d\'activité',
		input_entity: 'Lieu d\'activité',
		input_group: 'Groupe d\'activité',

		name: 'Nom',
		begin: 'Début',
		end: 'Fin',

		add: 'Ajouter',
		save: 'Sauvegarder',
		remove: 'Retirer',
		remove_changes: 'Annuler les modifications',
		edit: 'Modifier',
		'delete': 'Supprimer',

		view_stats: 'Voir les statistiques',
		members: 'Membres',

		day: 'Jour',
		week: 'Semaine',
		month: 'Mois',
		year: "Année",
		
		done: 'Fait',
		copy: 'Copier',
		choose: 'Choisir',
		edition: 'Édition',
		cancel: 'Annuler',
		logical_frame: 'Cadre logique',
		description: 'Description',
		reporting: 'Statistiques',
		reporting_analysis: "Analyse descriptive",
		columns: "Colonnes",
		colorize: 'Colorer',
		display: 'Afficher',
		values: 'Valeurs',
		target_percentage: 'Avancement',
		plot: 'Grapher',
		download_plot: 'Télécharger le graphique',
		download_table: 'Télécharger le tableau',
		unknown_indicator: "Indicateur inconnu",
		active: "Actif",

		choose_indicator: 'Choisissez un indicateur',
		list: 'Liste',
		logout: 'Déconnecter',
		change_password: "Changer le mot de passe",
		detach: "Déplacer vers supplémentaires",

		stay_here_check: 'Vous avez realisé des changements. OK pour rester sur cette page, Annuler pour perdre les modifications.',
		filter: "Filtre"
	},
	menu: {
		toggle_nav: "Voir le menu",
		language: "Langue",
		french: "Français",
		spanish: "Espagnol",
		english: "Anglais",
	},
	project: {
		value: "Valeur",
		raw_data: "Données brutes",
		planning: "Planning",
		indicators_computation: "Calcul des indicateurs",
		partition: "Partition",
		additional_partition: "Partition supplémentaires",
		new_partition: "Ajouter une partition",
		variable: "Variable",
		new_variable: "Ajouter une variable",
		section: "Section",
		new_section: "Ajouter une section",
		see_partitions: "Voir les partition selectionnées",

		unknown: "Inconnu",
		color: "Couleur",
		red_for_target: "Rouge pour cible atteinte à moins de",
		orange_for_target: "Orange pour cible atteinte entre {{value}}% et ",
		green_for_target: "Vert pour cible atteinte à {{value}}%",
		what_is_progress: "Qu'appelle-t'on une \"cible atteinte à 34%\"?",
		what_is_progress_detail:
			"On ne peut colorer que les indicateurs qui renseignent leur baseline <strong>et</strong> leur cible.<br/>" + 
			"On calcule où se situe chaque saisie entre la baseline et la cible à l'aide d'une règle de trois.",

		specs: "Spécifications",
		indicators_management: "Suivi des indicateurs",
		additional_indicators: "Indicateurs supplémentaires",
		no_additional_indicators: "Aucun indicateur supplémentaire n'a été défini",
		no_purposes: "Aucun objectif spécifique n'a été défini",

		input_form_list: "Liste des plannings de saisie",
		indicator_distribution: "Distribution des indicateurs par planning de saisie et période",
		add_new_indicator_to_form: "Ajouter un nouvel indicateur au formulaire",

		form_name_ph: "ex: Collecte mensuelle pour les centres de santé",
		collect: "Collecter sur",

		analysis: "Analyse",
		analysis_insert_data: "Insérer des données",
		analysis_insert_text: "Insérer du texte",
		analysis_up_next: "Monter",
		analysis_down_next: "Descendre",
		analysis_delete_next: "Supprimer",
		analysis_data: "Affichage",
		analysis_table: "Tableau",
		analysis_graph: "Graphique",
		analysis_both: "Tableau & Graphique",
		report_name_ph: "ex: Analyse descriptive mensuelle mai 2015",
		no_reports: "Aucune analyse descriptive n'a encore été créé!",

		source: "Source",
		source_ph: "Ex: NHIS local",
		in_charge: "Personne responsable",
		in_charge_ph: "Ex: Infirmière projet",

		missing_mandatory_indicators: "Indicateurs obligatoires manquants",
		other_indicators: "Autres indicateurs",
		see_other_themes: "Voir aussi les autres thématiques",

		entity_name: "Nom de la structure ou lieu d’intervention",
		group_name: "Nom du groupe",
		entity_name_placeholder: "ex: Centre de santé X, Hôpital X, ...",
		group_name_placeholder: "ex: Hôpitaux régionaux, parti Nord du pays, ...",

		logical_frame_tooltip: 'Décrit les objectifs, resultats attendus et activitées mises en oeuvre par le projet.',
		input_entities_tooltip: 'Liste les lieux d\'activité du projet où sont collectés les indicateurs. Par exemple des hopitaux, centre de santé, villages...',
		input_groups_tooltip: 'Permet de grouper les lieux d\'activité par catégories logiques.',
		input_forms_tooltip: 'Déclaration des formulaires et du planning de saisie des indicateurs de suivi du projet.',
		waiting_inputs_tooltip: '',
		reporting_tooltip: '',

		show_finished: 'Montrer les projets finis',
		create: "Créer un nouveau projet",
		input_forms: 'Plannings de saisie',
		input_form: 'Planning de saisie',
		data_collection: 'Collecte',
		periodicity: "Périodicité",
		begin: 'Début du projet',
		end: 'Fin du projet',

		sumable: 'Sommable',
		input_field: 'Champ de saisie',
		value_source: 'Source de la valeur',
		input_mode: 'Mode de saisie',
		manual_input: 'Saisie manuelle',

		periodicities: {
			day: 'Tous les jours',
			week: 'Toutes les semaines',
			month: 'Tous les mois',
			quarter: 'Tous les trimestres',
			year: 'Tous les ans',
			planned: 'Planifiée'
		},
		collects: {
			entity: "Lieux d'activité",
			project: "Projet"
		},

		add_intermediary: "Ajouter une saisie",
		intermediary_periods: "Dates supplémentaires",

		no_input_entities: 'Aucun lieu d\'activité n\'a encore été créé!',
		no_input_groups: 'Aucun groupe d\'activité n\'a encore été créé!',
		no_forms: 'Aucun formulaire n\'a encore été créé',
		no_indicators: 'Aucun indicateur n\'est défini sur ce projet',

		waiting_inputs: 'Saisies en attente',
		no_waiting_inputs: 'Aucune saisie en attente.',
		input: 'Saisir',
		see_all_inputs: 'Voir toutes les saisies',

		relevance: 'Pertinence',
		relevance_ph: 'Pourquoi collectez-vous cet indicateur?',
		limits: 'Limites',
		minimum_ph: 'minimum',
		maximum_ph: 'maximum',
		orange_zone: 'Zone Orange',
		green_zone: 'Zone Verte',
		baseline: 'Baseline',
		baseline_ph: 'Valeur de référence',
		target_ph: 'Valeur à atteindre',
		target: 'Cible',
		add_target: 'Ajouter une cible',
		general_data: 'Données générales',

		goal: 'Objectif général',
		goal_short: "OG",
		intervention_logic: 'Logique d\'intervention',
		intervention_logic_goal_ph: 'Description de la contribution du projet aux objectifs (impact) d\'une politique ou d\'un programme',
		intervention_logic_purpose_ph: 'Description des avantages directs destinés au(x) groupe(s) cible(s)',
		assumptions_purpose_ph: 'Facteurs externes susceptibles de compromettre l’atteinte de l’objectif',
		purpose_short: 'OS',
		output_short: 'R',

		begin_date: "Date de lancement",
		end_date: "Date de fin",
		name_ph: 'Exemple: Réduction des Risques Laos',
		add_indicator: 'Ajouter un indicateur',

		purpose: 'Objectif Spécifique',
		purposes: 'Objectifs Spécifiques',
		assumptions: 'Hypothèses',
		output: "Résultat",
		activity: 'Activité',
		prerequisite: 'Prérequis',
		activity_prereq_ph: 'Quels sont les prérequis pour mettre en place d\'activité?',
		activity_desc_ph: 'Produit ou service tangibles apportés par le projet.',
		output_assumptions_ph: 'Facteurs externes susceptibles de compromettre l’atteinte du résultat',
		output_desc_ph: 'Produit ou service tangibles apportés par le projet.',

		add_activity: 'Ajouter une activité',
		add_output: 'Ajouter un résultat attendu',
		add_purpose: 'Ajouter un objectif spécifique',

		users: "Utilisateurs",
		owners: "Propriétaires",
		dataEntryOperators: "Opérateurs de saisie",

		move_up: "Monter",
		move_down: "Descendre",

		indicator_source: "Obtention",
		you_are_owner: "Vous pouvez éditer ce projet",
		you_are_editor: "Vous pouvez saisir sur ce projet",
		you_are_not_owner: "Vous ne pouvez pas éditer ce projet",
		you_are_not_editor: "Vous ne pouvez pas saisir sur ce projet",
		form_warning: [
			"<strong>Attention</strong><br/>",
			"Tous les changements que vous réalisez sur un formulaire sont rétroactifs.<br/>",
			"<ul>",
				"<li>Si vous changez les dates de début et fin ou la périodicité, les saisies supplémentaires seront invalidés.</li>",
				"<li>Si vous supprimez, ou changez la méthode de calcul d'un indicateur tout son historique de saisie sera invalidé.</li>",
			"</ul>",
			"<br/>",
			"Plutôt que réaliser des modifications, la bonne approche est le plus souvent de:",
			"<ul>",
				"<li>Changer la date de fin du formulaire utilisé et le désactiver.</li>",
				"<li>De créer un nouveau formulaire qui commence à cette date avec les modifications à réaliser.</li>",
			"</ul>",
		].join(' '),

		status_green: "Cet indicateur est en zone verte",
		status_orange: "Cet indicateur est en zone orange",
		status_red: "Cet indicateur est en zone rouge",
		status_unknown: "Cet indicateur est en dehors<br/>des limites fixées<br/>dans le cadre logique",

		formula: "Formule: {{name}}",
		link: "Lien: {{name}}",
		links: "Liens"
	},
	indicator: {
		search: "Rechercher",
		search_ph: "Rentrez au moins 3 caractères",
		
		target: "Relation à la cible",
		higher_is_better: "Atteinte si la saisie est supérieure à la cible",
		lower_is_better: "Atteinte si la saisie est inférieure à la cible",
		around_is_better: "Atteinte si la saisie est égale à la cible",
		non_relevant: "Non pertinent",

		no_theme: 'Sans thématique',
		no_type: 'Sans type',

		operation: "Mode d'opération",

		name_ph: 'Exemple: Part des dossiers patient bien remplis',
		description_ph: 'Exemple: Mesurer le niveau de formation du personnel médical qui rempli les dossiers patients. Sa mesure est facile sur des projets de petite dimension, à éviter dans un autre cadre.',
		definition: 'Définition',
		core: 'Recommandé',
		unit: 'Unité',
		other: 'Autre',
		percent: 'Pour cent (%)',
		permille: 'Pour mille (‰)',
		types: 'Types',
		themes: 'Thématiques',
		select_types: 'Sélectionnez un ou plusieurs types',
		select_themes: 'Sélectionnez une ou plusieures thématiques',
		categorization: 'Classement',
		computation: 'Calcul',
		sum_allowed: 'Sommable',
		formula: 'Formule',
		formulas: 'Formules',
		formula_name_ph: 'Exemple: Pourcentage entre dossiers patient bien remplis et total',
		formula_expression_ph: 'Exemple: 100 * a / b',
		add_formula: "Ajouter une formule",
		parameter: 'Paramètre',

		order_by: 'Trier par',
		alphabetical_order: 'Ordre alphabétique',
		num_inputs: 'Nombre de saisies',
		num_projects: 'Nombre de projets',
		create_new: 'Créer un nouvel indicateur',

		themes_list: "Liste des thématiques",
		types_list: "Liste des types",
		num_indicators: 'Nombre d\'indicateurs',
		
		new_type_name: "Nom du nouveau type",
		new_theme_name: "Nom de la nouvelle thématique",
		only_core: "Ne voir que les indicateurs recommandés",

		is_mandatory: "Cet indicateur est obligatoire pour les projets de même thématique",
		is_common: "Cet indicateur est optionnel",
		is_forbidden: "Cet indicateur est historique est ne peut pas être utilisé sur un nouveau projet",
		is_external: "Cet indicateur provient d'une autre thématique",

		time_aggregation: "Aggrégation par rapport au temps",
		time_aggregation_sum: "Somme (ex: nombre de consultations, de naissances, ...)",
		time_aggregation_average: "Moyenne non pondérée (ex: population, nombre de médecins, de véhicules, ...)",
		time_aggregation_none: "Pas d'aggrégation directe possible (tous les taux, pourcentages, indicateurs calculés, ...)",

		what_is_aggregation: "Comment remplir ces champs?",
		time_aggregation_help: [
			"<strong>Aide à la saisie</strong>",
			"<ul>",
				"<li>",
					"Si un hôpital réalise 100 consultations en janvier, en février et en mars, il en aura réalisé 300 au",
					"cours du premier trimestre de l'année. Le mode d'aggrégation de l'indicateur <strong>\"Nombre de consultations\"</strong>",
					"vaut donc <strong>\"Somme\"</strong>",
				"</li>",
				"<li>",
					"Si un bloc chirurgical a un taux de mortalité de 5% en janvier, 7% en février et 10% en mars, on ne peut pas calculer",
					"son taux de mortalité sur le premier trimestre de l'année sans connaître le nombre d'opérations sur chaque mois.",
					"Le mode d'aggrégation de l'indicateur <strong>\"Taux de mortalité opératoire\"</strong> vaut donc <strong>\"Pas d'aggrégation directe possible\"</strong>",
				"</li>",
				"<li>",
					"Si un village a une population de 510 habitants en janvier, 600 en février et 550 en mars, on peut dire que sa population",
					"au premier trimestre de l'année vaut 553. Le mode d'aggrégation de l'indicateur <strong>\"Population\"</strong>à choisir est",
					"donc <strong>\"Moyenne non pondérée\"</strong>",
				"</li>",
			"</ul>"
		].join(' '),

		geo_aggregation: "Aggrégation géographique",
		geo_aggregation_sum: "Somme (ex: population, nombre de médecins, de véhicules disponibles, de consultations, de naissances, ...)",
		geo_aggregation_average: "Moyenne non pondérée (à n'utiliser uniquement que pour des indicateurs qui sont déjà des moyennes par centre: \"nombre de médecins par centre\")",
		geo_aggregation_none: "Pas d'aggrégation directe possible (tous les taux, pourcentages, indicateurs calculés, ...)",
	},
	login: {
		error: "Identifiant ou mot de passe invalide",
		please_connect: "Connectez-vous",
		login: 'Identifiant',
		password: "Mot de passe",
		connect: "Me connecter",
		change_password_please: "Entrez votre nouveau mot de passe",
		new_password: "Mot de passe",
		new_password_again: "Répétez le mot de passe",
		change_password: "Changer mon mot de passe"
	},
	form: {
		mandatory: "Ce champ est obligatoire",
		begin_lower_than_end: 'La date début de doit être inférieure à la date de fin',
		end_greater_than_begin: 'La date de fin doit être supérieure à la date de début',
	}
};

