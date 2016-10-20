"use strict";

var FRENCH_LOCALE = (function() {
	var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
	return {
  "DATETIME_FORMATS": {
    "AMPMS": [
      "AM",
      "PM"
    ],
    "DAY": [
      "dimanche",
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi"
    ],
    "ERANAMES": [
      "avant J\u00e9sus-Christ",
      "apr\u00e8s J\u00e9sus-Christ"
    ],
    "ERAS": [
      "av. J.-C.",
      "ap. J.-C."
    ],
    "FIRSTDAYOFWEEK": 0,
    "MONTH": [
      "janvier",
      "f\u00e9vrier",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "ao\u00fbt",
      "septembre",
      "octobre",
      "novembre",
      "d\u00e9cembre"
    ],
    "SHORTDAY": [
      "dim.",
      "lun.",
      "mar.",
      "mer.",
      "jeu.",
      "ven.",
      "sam."
    ],
    "SHORTMONTH": [
      "janv.",
      "f\u00e9vr.",
      "mars",
      "avr.",
      "mai",
      "juin",
      "juil.",
      "ao\u00fbt",
      "sept.",
      "oct.",
      "nov.",
      "d\u00e9c."
    ],
    "STANDALONEMONTH": [
      "Janvier",
      "F\u00e9vrier",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Ao\u00fbt",
      "Septembre",
      "Octobre",
      "Novembre",
      "D\u00e9cembre"
    ],
    "WEEKENDRANGE": [
      5,
      6
    ],
    "fullDate": "EEEE d MMMM y",
    "longDate": "d MMMM y",
    "medium": "d MMM y HH:mm:ss",
    "mediumDate": "d MMM y",
    "mediumTime": "HH:mm:ss",
    "short": "dd/MM/y HH:mm",
    "shortDate": "dd/MM/y",
    "shortTime": "HH:mm"
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "\u20ac",
    "DECIMAL_SEP": ",",
    "GROUP_SEP": "\u00a0",
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
        "negPre": "-",
        "negSuf": "\u00a0\u00a4",
        "posPre": "",
        "posSuf": "\u00a0\u00a4"
      }
    ]
  },
  "id": "fr",
  "localeID": "fr",
  "pluralCat": function(n, opt_precision) {  var i = n | 0;  if (i == 0 || i == 1) { return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
}
})();


var FRENCH_TRANSLATION = {
	shared: {
		name_label_fr: "Nom (français)",
		name_label_es: "Nom (espagnol)",
		name_label_en: "Nom (anglais)",

		description_label_fr: "Description (français)",
		description_label_es: "Description (espagnol)",
		description_label_en: "Description (anglais)",

		description: "Description",

		country: "Pays",
		apply: "Appliquer les modifications",
		clone: "Cloner",
		user_guide: "Guide d'utilisation",
		home: "Accueil",
		up: "Monter d'un cran",
		down: "Descendre d'un cran",

		date: "Date",

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

	project: {
		same_as_start: "Idem début du projet",
		same_as_end: "Idem fin du projet",

		specific_start: "Date de lancement spécifique",
		specific_end: "Date de fin spécifique",

		structure: "Structure",
		no_data: "Les données ne sont pas disponibles",
		not_available_by_entity: "Ces données ne sont pas disponibles par lieu de collecte",
		not_available_by_group: "Ces données ne sont pas disponibles par groupe",
		not_available_min_week: "Agrégez au moins par semaine pour accéder à ces données",
		not_available_min_month: "Agrégez au moins par mois pour accéder à ces données",
		not_available_min_quarter: "Agrégez au moins par trimestre pour accéder à ces données",
		not_available_min_year: "Agrégez au moins par an pour accéder à ces données",

		saving_failed: "Monitool n'a pas réussi à sauvegarder vos changements. Ceux-ci seront perdus.",
		no_logical_frames: "Aucun cadre logique n'a encore été créé sur ce projet.",
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
		no_variable: "Aucune variable n'est définie sur cette source de données. Cliquez sur \"Ajouter une variable\" pour en créer une!",
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
			input_all: "Saisisseur pour tous les lieux de collecte",
			input: "Saisisseur pour certains les lieux de collecte",
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

		aggregation: {
			sum: "Faire une somme",
			average: "Faire une moyenne",
			highest: "Prendre la plus grande valeure",
			lowest: "Prendre la plus petite valeure",
			last: "Prendre la dernière valeur",
			none: "Il n'est pas possible de faire ce calcul"
		},

		collection_site: "Lieu de collecte",
		covered_period: "Période couverte",

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
			entity: "Pour tous les lieux de collecte",
			project: "Une fois pour tout le projet"
		},

		no_input_entities: 'Aucun lieu d\'activité n\'a encore été créé!',
		no_input_groups: 'Aucun groupe d\'activité n\'a encore été créé!',
		no_users: 'Aucun utilisateur n\'est ajouté au projet',
		no_forms: 'Aucune source de données n\'a encore été créé',

		input: 'Saisir',

		baseline: 'Baseline',
		target: 'Cible',

		goal: 'Objectif général',
		intervention_logic: 'Logique d\'intervention',

		start_date: "Date de lancement",
		end_date: "Date de fin",
		country_ph: "Exemple: RCA",
		name_ph: 'Exemple: Accès a des soins de santé de qualité pour les populations touchées par la crise',
		add_indicator: 'Ajouter un indicateur',

		purpose: 'Objectif Spécifique',
		purposes: 'Objectifs Spécifiques',
		assumptions: 'Hypothèses',
		output: "Résultat",
		activities: 'Activités',


		intervention_logic_goal_ph: 'ex: Réduire la mortalité et la morbidité des populations affectées par la crise',
		intervention_logic_purpose_ph: 'ex: Améliorer l\'accès aux soins des populations affectées par la crise dans les districts de Bimbo et Begoua',
		output_desc_ph: 'ex: Améliorer la qualité des soins de première ligne des centres de santé de Bimbo et Begoua',
		assumptions_purpose_ph: '',
		output_assumptions_ph: '',
		logframe_ph_name: "ex: ECHO",

		logframe_help_name: "Nommez ce cadre logique de façon à l'identifier facilement. Par exemple avec le nom du bailleur auquel il est destiné",
		logframe_help_goal: "Description de la contribution du projet aux objectifs (impact) d\'une politique ou d\'un programme",
		logframe_help_goal_indicators: "Rentrez ici les indicateurs permettant de mesurer l'objectif géneral",
		logframe_help_purpose_desc: "Description des avantages directs destinés au(x) groupe(s) cible(s)",
		logframe_help_purpose_assumptions: "Facteurs externes susceptibles de compromettre l’atteinte de l’objectif",
		logframe_help_purpose_indicators: "Rentrez ici les indicateurs permettant de mesurer l'objectif spécifique",
		logframe_help_output_desc: "Produit ou service tangibles apportés par le projet.",
		logframe_help_output_assumptions: "Facteurs externes susceptibles de compromettre l’atteinte du résultat",
		logframe_help_output_indicators: "Rentrez ici les indicateurs permettant de mesurer le résultat",

		add_output: 'Ajouter un résultat',
		add_purpose: 'Ajouter un objectif spécifique',

		users: "Utilisateurs",
		owners: "Propriétaires",


		you_are_owner: "Vous pouvez éditer ce projet",
		you_are_editor: "Vous pouvez saisir sur ce projet",
		you_are_not_owner: "Vous ne pouvez pas éditer ce projet",
		you_are_not_editor: "Vous ne pouvez pas saisir sur ce projet",

		formula: "Formule",
		link: "Lien: {{name}}",
		collected: "Collecté",

		basics_info: "<p>Les données de bases de votre projet permettent de le classer parmi les autres.</p>",
		basics_help_country: "Dans quel pays le projet se déroule-t'il? S'il s'agit d'un projet régional, entrez le nom de la région.",
		basics_help_name: "Le nom permet de retrouver le projet dans Monitool. Choisissez un nom suffisament informatif, ou copiez l'objectif général du projet.",
		basics_help_thematics: "Le choix des thématiques conditionne les indicateurs transversaux que vous devrez collecter au sein de votre projet.",
		basics_help_begin: "La date de début représente le moment où le projet commence à collecter des données (généralement, le début des activités)",
		basics_help_end: "La date de fin représente le moment où le projet finale sa collecte de données. Si cette date n'est pas connu à l'avance, rentrer une date lointaine dans le futur.",

		collection_site_info:
			"<p>Lorsqu'un projet réalise les même activités dans plusieurs lieux, celles-ci doivent pouvoir être suivi individuellements, par groupes, et tous ensembles.</p>" + 
			"<p>Rentrez ici:</p>" + 
			"<ul>" + 
				"<li>La liste des lieux sur lesquels le projet travaille (par exemple: liste des centres de santé)</li>" + 
				"<li>Des groupements qui seront utilisé lors du suivi (par exemple: par région, ou type de structure)</li>" + 
			"</ul>",

		users_list_info:
			"<p>Plusieurs types d'utilisateurs interviennent dans la mise en place et dans le suivi d'un projet: coordination, staff M&E, opérateurs de saisie, partenaires, ...</p>" + 
			"<p>Listez ici tous les utilisateurs qui doivent avoir accès au monitoring de ce projet.</p>",

		user_help_type: "Choisissez \"Compte MDM\" si l'utilisateur possède une adresse email xxx@medecinsdumonde.net, et compte partenaire sinon.",
		user_help_user: "De quel utilisateur MDM s'agit-il? Si l'utilisateur que vous voulez ajouter n'est pas disponible dans la liste, demandez lui de se connecter à Monitool une première fois.",
		user_help_username: "Cet identifiant permettra à l'utilisateur de se connecter. Les adresses emails ne sont pas acceptés comme identifiant (utiliser par exemple: \"nom.prenom\", ou \"fonction.pays\"",
		user_help_fullname: "Rentrez ici le nom complet de la personne qui va utiliser ce compte.",
		user_help_password: "Le mot de passe doit avoir 6 caractères au minimum. Ne pas utiliser la même valeur que l'identifiant",
		user_help_role: "Ce champs determine les modifications que pourra réaliser cet utilisateur sur le projet: les propriétaires peuvent changer la structure du projet, les saisisseurs, uniquement rentrer des données.",
		user_help_sites: "Sur quels lieux de collecte cet utilisateur pourra-t'il saisir des données?",

		collection_form_list_info:
			"<p>Les sources de données sont les différents supports desquels les données nécessaires au monitoring du projet sont présentes</p>" + 
			"<p>Au sein de monitool, on ne décrira pas l'intégralité des données existantes, mais uniquement la partie qui va être extraite pour le suivi du projet</p>" + 
			"<p>Afin de faciliter l'organisation de la saisie, les sources doivent correspondre à des outils réel utilisés sur le terrain.</p>",

		collection_edit_help_name: "Comment s'apelle la source de laquelle vous voulez extraire des données? Par exemple: \"Dossier patient informatisé\", \"Registre des centre de santé\", \"Rapport du système national d'information sanitaire\", ...",
		collection_edit_help_sites: "Parmi les structures identifiées dans \"Lieux de collecte\", lesquelles font remonter cette source de donnée?",
		collection_edit_help_periodicity: "À quelle fréquence ces données remontent-elles? Attention, cette fréquence est complétement decorrelée de la fréquence à laquelle le projet doit fournir du reporting.",
		collection_edit_help_start: "Si cette source de données est plus récente que le début du projet, indiquez la date de début, sinon laisser la valeur par défaut",
		collection_edit_help_end: "Si cette source de données finira avant la fin du projet, ou à été remplacée, indiquez le ici",

		collection_edit_help_varname: "Nommez la variable que vous voulez extraire de/du <code>{{name}}</code>. Par exemple \"Nombre de diagnostics effectués\".",
		collection_edit_help_geoagg: "Dans un projet avec deux sites, si <code>{{name}}</code> vaut 10 pour un site, et 20 pour l'autre, que vaut-il pour le projet?",
		collection_edit_help_timeagg: "Dans un projet qui collecte mensuellement, si <code>{{name}}</code> vaut 10 en janvier, et 20 en février et 30 en mars que vaut-il pour le premier trimestre?",
		collection_edit_help_partition: "Veut-t'on être capable de différencier <code>{{name}}</code> par age, sexe, prise en charge, motif de consultation, pathologie, tranche horaire, reférencement effectif, ...?",
		collection_edit_help_distribution: "Si vous desirez imprimer des formulaires en A4, préférez placer les intitulés sur la gauche des tableaux, afin de limiter leur largeur.",
		collection_edit_help_order: "Dans quel ordre voulez vous placer vos désagrégations dans les différentes lignes et colonnes?",

		logical_frame_list_info:
			"<p>Un cadre logique est un document qui décrit les objectifs d'un projet, les activités misent en oeuvre pour y parvenir, ainsi que les indicateurs qui permette de suivre l'avancement de chaque élément</p>" + 
			"<p>Tous les indicateurs présents dans les cadres logiques doivent être calculables à partir des données décrites dans les sources de données</p>",

		cross_cutting_list_info:
			"<p>Les indicateurs transversaux</p>",

		input_list_info:
			"<p>Ce planning de saisie liste toutes les saisies qui ont été programmées pour la source de données \"{{name}}\"</p>" +
			"<p>Afin de limiter les erreurs de saisie, il est préférable de la réaliser au plus près du lieu d'où sont extraites les données, directement sur monitool.</p>" + 
			"<p>Si ce n'est pas possible, il est possible de télécharger une version PDF à imprimer du formulaire.</p>",

		download_portrait: "Télécharger PDF (portrait)",
		download_landscape: "Télécharger PDF (paysage)",

		press_to_drag: "Restez appuyé pour glisser déposer",
		titles: "Intitulés",
		data: "Données",
		general_informations: "Informations génerales",
		fill_with_last_input: "Remplir avec les données de la période précédente",
		
		variable_name_label: "Que mesurez-vous?",
		variable_name_ph: "ex: Nombre de diagnostics effectués",
		site_agg_label: "Comment grouper les saisies entre sites?",
		time_agg_label: "Comment grouper les valeurs de plusieurs périodes",
		partitions_label: "Quelles sont les désagrégations à utiliser sur cette variable?",
		distribution_label: "Où placer les intitulés des désagrégations dans les formulaires?",
		order_label: "Dans quel ordre placer les intitulés des désagrégations dans les formulaires?",
		no_indicator: "Aucun indicateur n'est défini. Cliquez sur \"Ajouter un indicateur\"",
		delete_form: "Supprimer la source de données",
		delete_logical_frame: "Supprimer le cadre logique",
		delete_purpose: "Supprimer l'objectif spécifique",
		delete_result: "Supprimer le résultat",

		
	},

	form: {
		mandatory: "Ce champ est obligatoire",
		start_lower_than_end: 'La date début de doit être inférieure à la date de fin',
		end_greater_than_start: 'La date de fin doit être supérieure à la date de début',

		help: {
			show: "Afficher l'aide sur ce champ",
			hide: "Cacher l'aide sur ce champ"
		}
	},
	theme: {
		new_theme: "Nouvelle thématique",
		create_new: "Créer une thématique"
	},
	user: {
		email: "Email",
		fullname: "Nom",
		role: "Rôle",
		save: "Sauvegarder l'utilisateur",

		list_info: 
			"<p>Cette page contient la liste de tous les utilisateurs qui se sont connectés au moins une fois sur Monitool</p>" + 
			"<p>Il n'est pas nécessaire de créer de comptes pour les nouveaux utilisateurs si ceux-ci possède un compte Médecins du Monde: après leur première connexion ils apparaitront automatiquement ici. Pour les utilisateurs hors MDM, il est possible de créer des comptes partenaires depuis l'interface de gestion des projets.</p>",

		edit_info:
			"<p>Vous pouvez ici éditer les permissions d'autres utilisateurs que vous sur le site. Cliquez sur \"Afficher l'aide sur ce champ\" pour avoir plus de détails sur les différents niveaux d'autorisation disponibles</p>",

		roles_short: {
			admin: "Administrateur",
			project: "Création projets",
			common: "Standard",
		},

		permissions: {
			thematics: "Créer et éditer des thématiques",
			cross_cutting: "Créer et éditer des indicateurs transversaux",
			user_roles: "Éditer le rôle des autres utilisateurs",
			own_all_projects: "Éditer la structure et les données de tous les projets",
			create_projects: "Créer des projets",
			edit_projects: "Éditer la structure et les données de certains projets",
			see_reporting: "Voir les statistiques de tous les projets"
		}
	},

	theme: {
		list_info: 
			"<p>Cette page contient la liste des thématiques traitées par l'ONG.</p>" +
			"<p>Il est possible d'attribuer une ou plusieurs thématiques à chaque projet et indicateur transversal.</p>",

		edit_info:
			"",

		themes: "Thématiques",
		edit_title: "Édition thématique",
		save: "Sauvegarder la thématique",

		new_theme: "Nouvelle thématique",
		create_new: "Créer une nouvelle thématique",

		name_placeholder_fr: "ex: Santé Sexuelle et Reproductive",
		name_placeholder_es: "ex: Salud Sexual y reproductiva",
		name_placeholder_en: "ex: Sexual and Reproductive Health",

		info: 
			"<p>Rentrez ici le nom de la thématique dans toutes les langues utilisées par votre organisation.</p>" +
			"<p>Si vous ne pouvez pas traduire vers toutes les langues:</p>" +
			"<ol>" +
				"<li>Remplissez les langues que vous pouvez</li>" +
				"<li>Utilisez le bouton à gauche des champs pour une traduction automatique</li>" +
			"</ol>"
	},

	indicator: {
		new_indicator: "Nouvel indicateur",
		create_new: 'Créer un nouvel indicateur',

		cross_cutting: "Indicateurs transversaux",
		select_themes: 'ex: Soins de santé primaire',

		edit_title: "Édition indicateur",
		themes_label: "Thématiques",
		
		target_label: "Relation à la cible",
		targets: {
			higher_is_better: "Atteinte si la saisie est supérieure à la cible",
			lower_is_better: "Atteinte si la saisie est inférieure à la cible",
			around_is_better: "Atteinte si la saisie est égale à la cible",
			non_relevant: "Non pertinent"
		},

		unit_label: "Unité",
		units: {
			other: 'Autre',
			percent: 'Pour cent (%)',
			permille: 'Pour mille (‰)',
		},

		name_placeholder_fr: "Volume de formation",
		name_placeholder_en: "Training volume",
		name_placeholder_es: "Volumen de formación",

		description_placeholder_fr: "On ne parle pas d'éducation pour la santé, mais de formation à du personnel soignant. On compte le nombre de participations et non pas le nombre de personnes différentes ayant participé à ces formations.",
		description_placeholder_en: "We are not talking about health education, but training of medical staff. Count the number of entries and not the number of different people who attended these trainings.",
		description_placeholder_es: "No se trata de educación para la salud, sino de formación para el personal sanitario. Se cuenta el número de participaciones y no el número de personas distintas que hayan participado.",

		list_info: 
			"<p>Cette page contient la liste de tous les indicateurs transversaux de l'ONG.<br/>La collecte de chaque indicateur est obligatoire pour les projets qui ont au moins une thématique en commun celui-ci.</p>" + 
			"<p>Afin de permettre aux projets de planifier leur collecte, merci de ne pas changer régulièrement cette liste.</p>",

		edit_info: 
			"<p>Cette page vous permet de modifier la définition d'un indicateur transversal. Si vous réalisez des changements, attention de bien mettre à jour les champs dans toutes les langues.</p>" + 
			"<p>Si vous ne pouvez pas traduire vers toutes les langues:</p>" +
			"<ol>" +
				"<li>Remplissez les langues que vous pouvez</li>" +
				"<li>Utilisez le bouton à gauche des champs pour une traduction automatique</li>" +
			"</ol>",

		save: "Sauvegarder l'indicateur"
	}
};

