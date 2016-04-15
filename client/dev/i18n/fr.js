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
		apply: "Appliquer les modifications",
		clone: "Cloner",
		user_guide: "Guide d'utilisation",
		home: "Accueil",
		up: "Monter d'un cran",
		down: "Descendre d'un cran",

		date: "Date",
		administrator: "Administrateur",

		settings: "Paramètres",
		projects: 'Projets',
		project: 'Projet',
		users: "Utilisateurs",
		indicator: 'Indicateur',
		indicators: 'Indicateurs',
		indicators_catalog: 'Catalogue Indicateurs',
		help: 'Aide',
		name: 'Nom',
		start: 'Début',
		end: 'Fin',

		add: 'Ajouter',
		save: 'Sauvegarder',
		remove: 'Retirer',
		remove_changes: 'Annuler les modifications',
		edit: 'Modifier',
		'delete': 'Supprimer',

		members: 'Membres',

		day: 'Jour',
		week: 'Semaine',
		month: 'Mois',
		quarter: "Trimestre",
		year: "Année",
		
		choose: 'Choisir',
		cancel: 'Annuler',
		logical_frames: 'Cadres logiques',
		reporting: 'Statistiques',
		reporting_general: 'Statistiques générales',
		reporting_analysis: "Analyse descriptive",
		columns: "Colonnes",
		colorize: 'Colorer',
		display: 'Afficher',
		download_plot: 'Télécharger le graphique',
		download_table: 'Télécharger le tableau',

		logout: 'Déconnecter',

		sure_to_leave: 'Vous avez realisé des changements. Êtes-vous sûr de vouloir quitter sans sauvegarder?',
		filter: "Filtre"
	},
	menu: {
		toggle_nav: "Voir le menu",
		language: "Langue",
		french: "Français",
		spanish: "Espagnol",
		english: "Anglais",
	},

	help: {
		block: {
			project: "Projet",
			indicators: "Catalogue d'indicateurs"
		},
		page: {
			create: "Créer un nouveau projet",
			structure: "Structurer des données d'activité",
			input: "Réaliser une saisie",
			activity_followup: "Suivre des activités",
			logical_frame: "Rentrer un cadre logique",
			objectives_results: "Suivre des objectifs & résultats",
			change_definition: "Modifier un projet en cours",
			indicator_usage: "Utiliser le catalogue",
			create_new_indicator: "Créer un indicateur",
			merge_indicators: "Fusionner deux indicateurs",
			indicator_reporting: "Suivre un indicateur en transversal"
		},
		reminder: {
			have_you_read_single_pre: "Avez-vous lu la section",
			have_you_read_single_post: "dans la documentation?",
			have_you_read_multiple: "Avez-vous lu les sections suivantes dans la documentation?",
		}
	},

	project: {
		partition_general: "Général",
		partition_general_placeholder: "ex: Tranches d'âge",
		partition_elements: "Éléments",
		partition_name: "Nom",
		partition_name_placeholder: "ex: Moins de 12 ans",
		no_partition_elements: "Appuyez sur \"Ajouter\" pour ajouter un élément à la partition",

		partition_groups: "Groupes",
		partition_group_name: "Nom",
		partition_group_name_placeholder: "ex: Mineurs",
		no_partition_groups: "Appuyez sur \"Ajouter\" pour ajouter un groupe à la partition",

		no_inputs: "Aucune saisie en attente",
		no_partitions: "Aucune partition n'est définie sur cette variable",

		dimensions: {
			day: "Jours",
			week: "Semaines",
			month: "Mois",
			quarter: "Trimestres",
			year: "Années",
			entity: "Lieux de collecte",
			group: "Groupe de collecte"
		},
		group: {
			location: "Lieux",
			partition: "Partitions",
			time: "Dates"
		},

		please_enter_new_name: "Entrez un nom pour le nouveau projet",
		edit_user: "Édition utilisateur",
		update_user: "Mettre à jour l'utilisateur",
		user_type: "Type",
		user_types: {
			internal: "Compte MDM",
			partner: "Compte Partenaire"
		},

		user_role: "Rôle",
		user_roles: {
			owner: "Propriétaire",
			input_all: "Saisisseur",
			input: "Saisisseur limité",
			read: "Consultation uniquement"
		},
		user_fullname: "Nom complet",
		user: "Utilisateur",
		username: "Login",
		password: "Mot de passe",

		link_indicator: "Lier à un indicateur du catalogue",
		unlink_indicator: 'Retirer le lien avec le catalogue',

		parameter: "Paramètre",
		all_selected: "Pas de filtre",
		create_logframe: "Ajouter un cadre logique",
		reporting_compare_sites: "Comparer les lieux",
		unnamed_logframe: "Cadre logique sans nom",

		update_logframe: "Mettre à jour le cadre logique",
		edit_indicator: "Édition indicateur",
		display: "Nom",
		display_ph: "Taux de CPN1 au sein des structures de santés",

		fill_with_last_input: "Remplir avec les données de la saisie précédente",
		show_finished: "Voir les saisies réalisées",
		field_order: "Ordre",
		field_distribution: "Distribution",
		cant_create: "Vous n'êtes pas autorisé à créer de nouveaux projets",
		my_projects: "Mes projets",
		are_you_sure_to_delete: "Tapez: 'Je suis sûr de vouloir supprimer ce projet' pour confirmer",
		are_you_sure_to_delete_answer: "Je suis sûr de vouloir supprimer ce projet",
		data_selection: "Selection des données",
		filters: "Filtres",
		input_status: {
			'done-read': "Afficher",
			'outofschedule-read': "Afficher (Hors calendrier)",
			'done-edit': "Modifier",
			'expected-edit': "Saisir",
			'expected-edit-new': "Saisir (nouvelle date)",
			'outofschedule-edit': "Afficher (Hors calendrier)"
		},
		cols: "Colonnes",
		rows: "Lignes",
		entity: "Lieu de collecte",
		select_cols: "Sélectionnez les colonnes",
		select_rows: "Sélectionnez les lignes",
		pivot_table: "Tableau croisé dynamique",

		actions: "Actions",
		groups: "Groupes",
		basics: "Données de base",
		general: "Général",
		full_project: "Tout le projet",
		select_filters: "Sélectionnez les partitions désirées",

		collection_form_warning:
			'<strong>Attention, en modifiant cette page vous risquez de perdre des données.</strong><br/>' + 
			'{{num_inputs}} saisies ont déjà été réalisées sur cette source de données.' + 
			'<ul>' +
			'	<li>Les modifications sur le calendrier (périodicité, dates) mettront de côté les saisies non concernées par le nouveau planning (sans perte de données)</li>' +
			'	<li>Les modifications sur la structure auront des conséquence différentes selon le type de modification: référez-vous au guide d\'utilisation pour lister les différents cas de figures</li>' +
			'</ul>',

		partitions: "Partitions",

		add_variable: "Ajouter une variable",
		remove_variable: "Supprimer la variable",
		add_partition: "Ajouter une partition",
		remove_partition: "Supprimer la partition",

		aggregation: 'Agrégation',
		different_geos: 'Sur des lieux différents',
		same_geos: 'Sur un même lieu',

		none: "Ne pas agréger",
		sum: "Somme",
		average: "Moyenne",
		highest: "Plus grand valeure",
		lowest: "Plus petite valeure",
		last: "Dernière valeur",

		variable_up: "Monter la variable d'un cran",
		variable_down: "Descendre la variable d'un cran",


		collection_site_list: "Lieux de collecte",
		collection_form_list: "Sources de données",
		collection_input_list: "Saisie",

		collection_site: "Lieu de collecte",
		collection_form: "Source de données",

		collection_form_planning: "Calendrier",
		collection_form_structure: "Structure",

		delete_form_easy: "Voulez-vous vraiment supprimer ce planning de saisie?",
		delete_form_hard: "Si vous supprimez cette source de données, toutes les saisies associées seront supprimés. Tapez \"Supprimer les {{num_inputs}} saisies\" pour confirmer",
		delete_form_hard_answer: "Supprimer les {{num_inputs}} saisies",
		delete_entity: "Si vous supprimez ce lieu de collecte, toutes les saisies associées seront supprimés. Tapez \"Supprimer les {{num_inputs}} saisies\" pour confirmer",
		delete_entity_answer: "Supprimer les {{num_inputs}} saisies",

		running: "Projets en cours",
		finished: "Projets terminés",
		noproject: "Aucun projet ne correspond à ce critère",


		activity: "Activités",
		activity_management: "Activités & Démographie",
		variable: "Variable",


		result_management: "Objectifs & résultats",
		no_purposes: "Aucun objectif spécifique n'a été défini",


		form_name_ph: "ex: Données système national d'information sanitaire",

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


		missing_mandatory_indicators: "Indicateurs obligatoires manquants",
		other_indicators: "Autres indicateurs",
		see_other_themes: "Voir aussi les autres thématiques",

		entity_name: "Nom de la structure ou lieu d’intervention",
		group_name: "Nom du groupe",
		entity_name_placeholder: "ex: Centre de santé X, Hôpital X, ...",
		group_name_placeholder: "ex: Hôpitaux régionaux, parti Nord du pays, ...",


		create: "Créer un nouveau projet",
		periodicity: "Périodicité",
		start: 'Début du projet',
		end: 'Fin du projet',


		periodicities: {
			day: 'Tous les jours',
			week: 'Toutes les semaines',
			month: 'Tous les mois',
			quarter: 'Tous les trimestres',
			year: 'Tous les ans',
			free: 'Libre'
		},
		collect: "Collecter",
		collects: {
			some_entity: "Pour certains lieux de collecte",
			entity: "Pour chaque lieu de collecte",
			project: "Une fois pour tout le projet"
		},


		no_input_entities: 'Aucun lieu d\'activité n\'a encore été créé!',
		no_input_groups: 'Aucun groupe d\'activité n\'a encore été créé!',
		no_forms: 'Aucune source de données n\'a encore été créé',


		input: 'Saisir',

		baseline: 'Baseline',
		target: 'Cible',

		goal: 'Objectif général',
		intervention_logic: 'Logique d\'intervention',
		intervention_logic_goal_ph: 'Description de la contribution du projet aux objectifs (impact) d\'une politique ou d\'un programme',
		intervention_logic_purpose_ph: 'Description des avantages directs destinés au(x) groupe(s) cible(s)',
		assumptions_purpose_ph: 'Facteurs externes susceptibles de compromettre l’atteinte de l’objectif',

		start_date: "Date de lancement",
		end_date: "Date de fin",
		name_ph: 'Exemple: Réduction des Risques Laos',
		add_indicator: 'Ajouter un indicateur',

		purpose: 'Objectif Spécifique',
		purposes: 'Objectifs Spécifiques',
		assumptions: 'Hypothèses',
		output: "Résultat",
		activities: 'Activités',
		activity_desc_ph: 'Produit ou service tangibles apportés par le projet.',
		output_assumptions_ph: 'Facteurs externes susceptibles de compromettre l’atteinte du résultat',
		output_desc_ph: 'Produit ou service tangibles apportés par le projet.',

		add_activity: 'Ajouter une activité',
		add_output: 'Ajouter un résultat attendu',
		add_purpose: 'Ajouter un objectif spécifique',

		users: "Utilisateurs",
		owners: "Propriétaires",


		you_are_owner: "Vous pouvez éditer ce projet",
		you_are_editor: "Vous pouvez saisir sur ce projet",
		you_are_not_owner: "Vous ne pouvez pas éditer ce projet",
		you_are_not_editor: "Vous ne pouvez pas saisir sur ce projet",

		formula: "Formule",
		link: "Lien: {{name}}",
	},
	indicator: {
		cant_create: "Vous n'êtes pas autorisé à créer de nouveaux indicateurs",
		name: "Nom",
		translate_from_fr: "Traduire automatiquement à partir du français",
		translate_from_es: "Traduire automatiquement à partir de l'espagnol",
		translate_from_en: "Traduire automatiquement à partir de l'anglais",

		delete_indicator: "Etes-vous sûr de vouloir supprimer cet indicateur? Cette décision affecte tous les projets qui l'utilisent.",
		delete_formula: "Etes-vous sûr de vouloir supprimer cette formule? Cette décision affecte tous les projets qui l'utilisent.",

		classification: "Classification",

		is_mandatory: "Obligatoire - Doit être collecté pour tous les projets de même thématique",
		is_approved: "Approuvé - Peut ou non être collecté sur les projets de même thématique",
		is_waiting: "En attente - Le siège ne s'est pas prononcé sur la qualité de cet indicateur",
		
		num_collecting_projects: "Nombre de projets collectant cet indicateur",

		search: "Rechercher",
		search_ph: "Rentrez au moins 3 caractères",

		standard: "Norme",
		sources: "Sources",
		comments: "Notes",
		standard_ph: "À quelle norme appartient cet indicateur?",
		sources_ph: "Quelles sont les sources possibles pour cet indicateur?",
		comments_ph: "Dans quel cas est-il pertinent d'utiliser cet indicateur, et avec quelles limites?",

		target: "Relation à la cible",
		higher_is_better: "Atteinte si la saisie est supérieure à la cible",
		lower_is_better: "Atteinte si la saisie est inférieure à la cible",
		around_is_better: "Atteinte si la saisie est égale à la cible",
		non_relevant: "Non pertinent",

		no_theme: 'Sans thématique',
		no_type: 'Sans type',

		operation: "Mode d'opération",
		
		name_ph: 'Exemple: Part des dossiers patient bien remplis',
		definition: 'Définition',
		unit: 'Unité',
		other: 'Autre',
		percent: 'Pour cent (%)',
		permille: 'Pour mille (‰)',
		types: 'Types',
		themes: 'Thématiques',
		select_types: 'Sélectionnez un ou plusieurs types',
		select_themes: 'Sélectionnez une ou plusieures thématiques',

		num_projects: 'Nombre de projets',
		create_new: 'Créer un nouvel indicateur',

		themes_list: "Liste des thématiques",
		types_list: "Liste des types",
		num_indicators: 'Nombre d\'indicateurs',
		
	},
	form: {
		mandatory: "Ce champ est obligatoire",
		start_lower_than_end: 'La date début de doit être inférieure à la date de fin',
		end_greater_than_start: 'La date de fin doit être supérieure à la date de début',
	}
};

