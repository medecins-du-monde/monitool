

export default {
	shared: {
		short_name: "Sigle",
		none: "Aucune",
		percentage_done: "{{value}}% réalisé",
		percentage_incomplete: "{{value}}% en cours",
		percentage_missing: "{{value}}% manquant",

		task: "Tâche",
		state: "État",
		open: "Ouvrir",
		loading: "Chargement en cours...",
		portrait: "Portrait",
		landscape: "Paysage",

		restore: "Restaurer",

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
		home: "Accueil",

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
		month_week_sat: "Semaines (samedi à vendredi / coupées par mois)",
		month_week_sun: "Semaines (dimanche à samedi / coupées par mois)",
		month_week_mon: "Semaines (lundi à dimanche / coupées par mois)",
		week_sat: "Semaines (samedi à vendredi)",
		week_sun: "Semaines (dimanche à samedi)",
		week_mon: "Semaines (lundi à dimanche)",
		month: 'Mois',
		quarter: "Trimestre",
		semester: "Semestre",
		year: "Année",

		choose: 'Choisir',
		cancel: 'Annuler',
		logical_frames: 'Cadres logiques',
		reporting: 'Rapport',
		reporting_general: 'Rapport général',
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
		last_entry: "Dernière saisie",
		show_totals: "Afficher les totaux",
		input_fill_forms: "Remplir les {{numInputs}} saisies de",
		add_user: "Ajouter un utilisateur",
		add_datasource: "Créer une nouvelle source de données",
		is_user: "Vous êtes membre de ce projet",
		no_matches: "Aucun projet ne correspond à vos critères de recherche",
		is_finished: "Ce projet est terminé",
		was_deleted: "Ce projet a été supprimé",
		show_ongoing_projects: "Afficher les projets en cours",
		show_finished_projects: "Afficher les projets terminés",
		show_deleted_projects: "Afficher les projets supprimés",
		filter_placeholder: "Rentrez du texte pour filtrer les projets",

		revisions: "Historique",
		revision_info: "L'historique des modifications vous permet de consulter la liste des modifications faites sur la structure de votre projet.",
		revision_datetime: "Date & Utilisateur",
		revision_changes: "Modifications apportées au projet",
		revision_restore: "Revenir à ce point",
		revision_save_to_confirm: "Sauvegardez pour confirmer de revenir à ce point",
		revision_is_equivalent: "Ce point est équivalent à l'état actuel du projet",
		revision_none: "Pas d'historique disponible sur ce projet",
		revision_show_more: "Voir plus de modifications",

		history: {
			active_replace: "Change le status de suppression de <code>{{!before}}</code> vers <code>{{!after}}</code>",
			name_replace: "Renomme le projet de <code>{{before}}</code> vers <code>{{after}}</code>",
			start_replace: "Modifie la date de début du projet de <code>{{before|date}}</code> vers <code>{{after|date}}</code>",
			end_replace: "Modifie la date de fin du projet de <code>{{before|date}}</code> vers <code>{{after|date}}</code>",
			country_replace: "Modifie le pays du projet de <code>{{before}}</code> vers <code>{{after}}</code>",
			visibility_replace: "Modifie la visibilité du projet de <code>{{before}}</code> vers <code>{{after}}</code>",

			themes_add: "Ajoute une thématique au projet",
			themes_move: "Reordonne les thématiques du projet",
			themes_remove: "Retire une thématique du projet",

			entities_add: "Ajoute le lieu <code>{{item.name}}</code>",
			entities_move: "Reordonne les lieux du projet",
			entities_remove: "Supprime le lieu <code>{{item.name}}</code>",
			entities_name_replace: "Renomme le lieu <code>{{before}}</code> en <code>{{after}}</code>",
			entities_start_replace: "Change la date de début du lieu <code>{{entity.name}}</code> de <code>{{before|date}}</code> vers <code>{{after|date}}</code>",
			entities_end_replace: "Change la date de fin du lieu <code>{{entity.name}}</code> de <code>{{before|date}}</code> vers <code>{{after|date}}</code>",

			groups_add: "Ajoute le groupe <code>{{item.name}}</code>",
			groups_move: "Reordonne les groupes du projet",
			groups_remove: "Supprime le groupe <code>{{item.name}}</code>",
			groups_name_replace: "Renomme le groupe <code>{{before}}</code> en <code>{{after}}</code>",
			groups_members_add: "Ajoute le lieu <code>{{item.name}}</code> au groupe <code>{{group.name}}</code>",
			groups_members_move: "Reordonne les lieux du groupe <code>{{group.name}}</code>",
			groups_members_remove: "Retire le lieu <code>{{item.name}}</code> du groupe <code>{{group.name}}</code>",

			users_add: "Ajoute l'utilisateur <code>{{item.id || item.username}}</code> au projet",
			users_move: "Reordonne les utilisateurs du projet",
			users_remove: "Supprime l'utilisateur <code>{{item.id || item.username}}</code> du projet",
			users_name_replace: "Renomme le partenaire de <code>{{before}}</code> vers <code>{{after}}</code>",
			users_password_replace: "Change le mot de passe de <code>{{user.id || user.username}}</code>",
			users_role_replace: "Change le role de <code>{{user.id || user.username}}</code> de <code>{{before}}</code> vers <code>{{after}}</code>",
			users_entities_add: "Autorise <code>{{user.id || user.username}}</code> à saisir sur le lieu <code>{{item.name}}</code>",
			users_entities_move: "Reordonne les lieux associés à l'utilisateur <code>{{user.id || user.username}}</code>",
			users_entities_remove: "Retire l'autorisation de saisir sur <code>{{item.name}}</code> à l'utilisateur <code>{{user.id || user.username}}</code>",
			users_dataSources_add: "Autorise <code>{{user.id || user.username}}</code> à saisir sur la source de données <code>{{item.name}}</code>",
			users_dataSources_move: "Reordonne les sources de données associées à l'utilisateur <code>{{user.id || user.username}}</code>",
			users_dataSources_remove: "Retire l'autorisation de saisir sur <code>{{item.name}}</code> à l'utilisateur <code>{{user.id || user.username}}</code>",

			forms_add: "Ajoute la source de données <code>{{item.name}}</code>",
			forms_move: "Reordonne les sources de données du projet",
			forms_remove: "Supprime la source de données <code>{{item.name}}</code>",
			forms_name_replace: "Renomme la source de données <code>{{before}}</code> en <code>{{after}}</code>",
			forms_periodicity_replace: "Change la périodicité de <code>{{form.name}}</code> de <code>{{before}}</code> vers <code>{{after}}</code>",
			forms_start_replace: "Change la date de début de <code>{{form.name}}</code> de <code>{{before|date}}</code> vers <code>{{after|date}}</code>",
			forms_end_replace: "Change la date de fin de <code>{{form.name}}</code> de <code>{{before|date}}</code> vers <code>{{after|date}}</code>",

			forms_entities_add: "Ajoute le lieu <code>{{item.name}}</code> à la source de données <code>{{form.name}}</code>",
			forms_entities_move: "Reordonne les lieux de la source de données <code>{{form.name}}</code>",
			forms_entities_remove: "Retire le lieu <code>{{item.name}}</code> de la source de données <code>{{form.name}}</code>",

			forms_elements_add: "Ajoute la variable <code>{{item.name}}</code> dans <code>{{form.name}}</code>",
			forms_elements_move: "Reordonne les variables de la source de données <code>{{form.name}}</code>",
			forms_elements_remove: "Supprime la variable <code>{{item.name}}</code> dans <code>{{form.name}}</code>",
			forms_elements_name_replace: "Renomme la variable <code>{{before}}</code> en <code>{{after}}</code>",
			forms_elements_geoAgg_replace: "Change la règle d'aggrégation (lieux) de <code>{{variable.name}}</code> de <code>{{before}}</code> vers <code>{{after}}</code>",
			forms_elements_timeAgg_replace: "Change la règle d'aggrégation (temps) de <code>{{variable.name}}</code> de <code>{{before}}</code> vers <code>{{after}}</code>",
			forms_elements_order_replace: "Change la présentation de la saisie de la variable <code>{{variable.name}}</code>",
			forms_elements_distribution_replace: "Change la présentation de la saisie de la variable <code>{{variable.name}}</code>",

			forms_elements_partitions_add: "Ajoute la désagrégation <code>{{item.name}}</code> dans <code>{{variable.name}}</code>",
			forms_elements_partitions_move: "Reordonne les désagrégations de <code>{{variable.name}}</code>",
			forms_elements_partitions_remove: "Supprime la désagrégation <code>{{item.name}}</code> de <code>{{variable.name}}</code>",
			forms_elements_partitions_name_replace: "Renomme la désagrégation <code>{{before}}</code> en <code>{{after}}</code> dans la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_aggregation_replace: "Change la règle d'aggrégation de <code>{{before}}</code> vers <code>{{after}}</code> pour la variable <code>{{variable.name}}</code>",

			forms_elements_partitions_elements_add: "Ajoute l'élément <code>{{item.name}}</code> dans la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_elements_move: "Reordonne les éléments de la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_elements_remove: "Supprime l'élément <code>{{item.name}}</code> dans la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_elements_name_replace: "Renomme <code>{{before}}</code> en <code>{{after}}</code> dans la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",

			forms_elements_partitions_groups_add: "Ajoute le groupe <code>{{item.name}}</code> dans la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_move: "Reordonne les groupes de la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_remove: "Supprime le groupe <code>{{item.name}}</code> dans la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_name_replace: "Renomme le groupe <code>{{before}}</code> en <code>{{after}}</code> dans la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_members_add: "Ajoute <code>{{item.name}}</code> au groupe <code>{{group.name}}</code> dans la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_members_move: "Reordonne les membres du groupe <code>{{group.name}}</code> dans la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",
			forms_elements_partitions_groups_members_remove: "Retire <code>{{item.name}}</code> du groupe <code>{{group.name}}</code> dans la désagrégation <code>{{partition.name}}</code> de la variable <code>{{variable.name}}</code>",

			logicalFrames_add: "Ajoute le cadre logique <code>{{item.name}}</code>",
			logicalFrames_move: "Reordonne les cadres logiques",
			logicalFrames_remove: "Supprime le cadre logique <code>{{item.name}}</code>",

			logicalFrames_entities_add: "Ajoute le lieu <code>{{item.name}}</code> au cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_entities_move: "Reordonne les lieux du cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_entities_remove: "Retire le lieu <code>{{item.name}}</code> du cadre logique <code>{{logicalFrame.name}}</code>",

			logicalFrames_name_replace: "Renomme le cadre logique <code>{{before}}</code> en <code>{{after}}</code>",
			logicalFrames_goal_replace: "Change l'objectif général <code>{{before}}</code> en <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_start_replace: "Change la date de début <code>{{before}}</code> en <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_end_replace: "Change la date de fin <code>{{before}}</code> en <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",

			logicalFrames_purposes_add: "Ajoute l'objectif spécifique <code>{{item.description}}</code> au cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_move: "Reordonne les objectifs spécifiques du cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_remove: "Supprime l'objectif spécifique <code>{{item.description}}</code> du cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_description_replace: "Change la description de l'objectif spécifique <code>{{before}}</code> en <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_assumptions_replace: "Change les hypothèses de l'objectif spécifique <code>{{purpose.description}}</code> de <code>{{before}}</code> en <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",

			logicalFrames_purposes_outputs_add: "Ajoute le résultat <code>{{item.description}}</code> au cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_move: "Reordonne des résultats dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_remove: "Supprime le résultat <code>{{item.description}}</code> du cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_description_replace: "Change la description du résultat <code>{{before}}</code> en <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_assumptions_replace: "Change les hypothèses du résultat <code>{{output.description}}</code> de <code>{{before}}</code> vers <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",

			logicalFrames_purposes_outputs_activities_add: "Ajoute l'activité <code>{{item.description}}</code> au cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_activities_move: "Reordonne des activités dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_activities_remove: "Supprime l'activité <code>{{item.description}}</code> du cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_purposes_outputs_activities_description_replace: "Change la description de l'activité <code>{{before}}</code> en <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",

			logicalFrames_indicators_add: "Ajoute l'indicateur <code>{{item.display}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_move: "Déplace l'indicateur <code>{{item.display}}</code> du cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_remove: "Supprime l'indicateur <code>{{item.display}}</code> du cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_baseline_replace: "Change la valeur initiale de l'indicateur <code>{{indicator.display}}</code> de <code>{{before}}</code> vers <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_target_replace: "Change la cible de l'indicateur <code>{{indicator.display}}</code> de <code>{{before}}</code> vers <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_display_replace: "Renomme l'indicateur <code>{{before}}</code> en <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_colorize_replace: "Change la colorisation de l'indicateur <code>{{indicator.display}}</code> de <code>{{before}}</code> vers <code>{{after}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",
			logicalFrames_indicators_computation_replace: "Change le calcul de l'indicateur <code>{{indicator.display}}</code> dans le cadre logique <code>{{logicalFrame.name}}</code>",

			extraIndicators_add: "Ajoute l'indicateur annexé <code>{{item.display}}</code>",
			extraIndicators_move: "Reordonne les indicateurs annexés",
			extraIndicators_remove: "Supprime l'indicateur annexé <code>{{item.display}}</code>",
			extraIndicators_baseline_replace: "Change la valeur initiale de l'indicateur annexé <code>{{extraIndicator.display}}</code> de <code>{{before}}</code> vers <code>{{after}}</code>",
			extraIndicators_target_replace: "Change la cible de l'indicateur annexé <code>{{extraIndicator.display}}</code> de <code>{{before}}</code> vers <code>{{after}}</code>",
			extraIndicators_display_replace: "Renomme l'indicateur annexé <code>{{before}}</code> en <code>{{after}}</code>",
			extraIndicators_colorize_replace: "Change la colorisation de l'indicateur annexé <code>{{extraIndicator.display}}</code> de <code>{{before}}</code> vers <code>{{after}}</code>",
			extraIndicators_computation_replace: "Change le calcul de l'indicateur annexé <code>{{extraIndicator.display}}</code>",

			crossCutting_add: "Ajoute un indicateur transversal",
			crossCutting_remove: "Supprime un indicateur transversal",
			crossCutting_baseline_replace: "Change la valeur initiale d'un indicateur transversal de <code>{{before}}</code> vers <code>{{after}}</code>",
			crossCutting_target_replace: "Change la cible d'un indicateur transversal de <code>{{before}}</code> vers <code>{{after}}</code>",
			crossCutting_colorize_replace: "Change la colorisation d'un indicateur transversal de <code>{{before}}</code> vers <code>{{after}}</code>",
			crossCutting_computation_replace: "Change le calcul d'un indicateur transversal"
		},

		visibility: {
			visibility: "Visibilité",
			public: "Visible par tous les utilisateurs (hors partenaires)",
			private: "Visible uniquement par les membres de ce projet",
			help: "Sauf besoin particulier, tous les projets doivent être laissé visibles par tous les utilisateurs."
		},

		authorization: "Autorisation",

		form_error_short: "Un ou plusieurs champs du formulaire sont en erreur.",
		form_persisted_short: "vous n'avez pas réalisé de changements.",
		form_changed_short: "Vous avez réalisé des changements.",

		form_error: "Un ou plusieurs champs du formulaire sont en erreur, corrigez-les afin de pouvoir sauvegarder.",
		form_persisted: "Vos données sont sauvegardées.",
		form_changed: "Vous avez réalisé des changements. N'oubliez pas de cliquer sur sauvegarder.",

		show_more_inputs: "Voir les dates précedentes",
		all_elements: "Tout",
		no_extra_indicators: "Aucune indicateur annexé n'a été créé. Cliquez sur \"Ajouter un indicateur\" pour en créer un!",
		no_data_source: "<span style=\"font-style: italic\">Créez des sources de données pour pouvoir saisir</span>",
		general_info: "Information génerales",
		collected_by: "Information collectée par",
		reporting_empty: "Aucun indicateur n'a été ajouté dans cette section.",
		no_cross_cutting: "Ce projet n'a besoin de collecter aucun indicateur transversal. Avez-vous bien renseigné vos thématiques?",
		indicator_computation_missing: "Calcul absent",
		delete_input: "Êtes-vous sûr de vouloir supprimer cette saisie?",
		zero_theme_indicator: "Sans thématique",
		multi_theme_indicator: "Multi-thématique",
		which_variable: "De quelle variable provient cette information?",
		which_partitions: "Quelles désagrégations sont concernées?",
		value_unknown: "Valeur inconnue",

		computations: {
			unavailable: "Il n'est pas possible de calculer cet indicateur",
			fixed: "Utiliser une valeur fixe",
			copy: "Copier une valeur (depuis une sources de données)",
			percentage: "Pourcentage (depuis les sources de données)",
			permille: "Pour mille (depuis les sources de données)",
			formula: "Formule personalisée (depuis les sources de données)",
		},

		formula: {
			copied_value: "Valeur à copier",
			denominator: "Dénominateur",
			numerator: "Numérateur"
		},

		same_as_start: "Idem début du projet",
		same_as_end: "Idem fin du projet",

		specific_start: "Date de début spécifique",
		specific_end: "Date de fin spécifique",
		choose_sites_for_form: "Choisir les structures pour lesquelles cette source de données s'applique",
		choose_sites_for_user: "Choisir les structures sur lesquelles cet utilisateur pourra saisir des données",

		partition_edit: "Édition désagrégation",
		partition_help_name: "Ce nom apparaîtra dans divers rapports. Il nomme la désagrégation que vous voulez créer sur votre donnée",
		partition_help_elements: 'Les éléments de la désagrégation doivent être mutuellement exclusifs, et il doit être possible de trouver la valeur totale en les aggrégant.',
		partition_help_aggregation: 'Comment trouver la valeur totale en agrégeant les éléments décrits?',
		partition_help_groups: 'Les groupes permettent de faire des aggrégations intermédiaires',
		logical_frame: "Cadre logique",

		structure: "Structure",
		no_data: "Les données ne sont pas disponibles",
		not_available_by_entity: "Ces données ne sont pas disponibles par site",
		not_available_by_group: "Ces données ne sont pas disponibles par groupe",
		not_available_min_week_sat: "Ces données sont disponibles par semaine (samedi à vendredi)",
		not_available_min_week_sun: "Ces données sont disponibles par semaine (dimanche à samedi)",
		not_available_min_week_mon: "Ces données sont disponibles par semaine (lundi à dimanche)",
		not_available_min_month: "Ces données sont disponibles par mois",
		not_available_min_quarter: "Ces données sont disponibles par trimestre",
		not_available_min_semester: "Ces données sont disponibles par semestre",
		not_available_min_year: "Ces données sont disponibles par an",

		saving_failed_conflict_input: "Impossible de sauvegarder vos modification car un autre utilisateur à modifié cette saisie depuis que vous avez chargé cette page. Rechargez la page pour obtenir la dernière version, et re-appliquez vos changements.",
		saving_failed_conflict: "Impossible de sauvegarder vos modification car un autre utilisateur à modifié le projet depuis que vous avez chargé cette page. Rechargez la page pour obtenir la dernière version, et re-appliquez vos changements.",
		saving_failed_other: "Impossible de sauvegarder vos modifications, probablement car vous n'êtes plus connecté à internet. Gardez cette fenêtre ouverte, et retentez de sauvegarder quand vous serez connecté à internet.",

		no_logical_frames: "Aucun cadre logique n'a encore été créé sur ce projet.",
		partition_general: "Général",
		partition_general_placeholder: "ex: Tranches d'âge, sexe, motif de consultation, pathologie, référencement effectué, ...",
		partition_elements: "Éléments",
		aggregation_lab: "Comment grouper les éléments entre eux?",
		partition_name: "Nom",
		partition_name_placeholder: "ex: Moins de 12 ans, Homme, Consultation sociale, Grippe ou Réferencement communautaire, ...",
		no_partition_elements: "Appuyez sur \"Ajouter\" pour ajouter un élément à la désagrégation",

		partition_groups: "Groupes",
		partition_group_name: "Nom",
		partition_group_name_placeholder: "ex: Mineurs, Pathologies chroniques, ...",
		no_partition_groups: "Appuyez sur \"Ajouter\" pour ajouter un groupe à la désagrégation",
		use_groups: "Utiliser des groupes",

		no_inputs: "Aucune saisie en attente",
		no_variable: "Aucune variable n'est définie sur cette source de données. Cliquez sur \"Ajouter une variable\" pour en créer une!",
		no_partitions: "Aucune désagrégation n'est définie sur cette variable",

		dimensions: {
			day: "Jours",
			month_week_sat: "Semaines (samedi à vendredi / coupées par mois)",
			month_week_sun: "Semaines (dimanche à samedi / coupées par mois)",
			month_week_mon: "Semaines (lundi à dimanche / coupées par mois)",
			week_sat: "Semaines (samedi à vendredi)",
			week_sun: "Semaines (dimanche à samedi)",
			week_mon: "Semaines (lundi à dimanche)",
			month: "Mois",
			quarter: "Trimestres",
			semester: "Semestres",
			year: "Années",
			entity: "Lieux de collecte",
			group: "Groupe de collecte"
		},
		group: {
			location: "Lieux",
			partition: "Désagrégations",
			time: "Dates"
		},

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
			input: "Saisisseur",
			read: "Consultation uniquement"
		},
		user_fullname: "Nom complet",
		user: "Utilisateur",
		username: "Login",
		password: "Mot de passe",

		parameter: "Paramètre",
		all_selected: "Pas de filtre",
		create_logframe: "Ajouter un cadre logique",
		reporting_compare_sites: "Comparer les lieux",
		unnamed_logframe: "Cadre logique sans nom",

		edit_indicator: "Édition indicateur",
		display: "Nom",
		display_ph: "ex: Taux de CPN1 au sein des structures de santé",
		computation: "Calcul",

		show_finished: "Voir les saisies réalisées",
		field_order: "Ordre",
		field_distribution: "Distribution",
		cant_create: "Vous n'êtes pas autorisé à créer de nouveaux projets",
		my_projects: "Mes projets",
		are_you_sure_to_clone: "Cette action va cloner ce projet et toutes ses saisies. Confimez pour cloner.",
		are_you_sure_to_delete: "Êtes-vous sûr de vouloir supprimer ce projet? Confirmez pour supprimer.",
		data_selection: "Selection des données",
		filters: "Filtres",
		input_status: {
			'done': "Modifier ({{100*value|number:0}}%)",
			'expected': "Saisir",
			'expected-new': "Saisir (nouvelle date)",
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
		select_filters: "Sélectionnez les désagrégations désirées",

		collection_form_warning:
			'<strong>Attention, en modifiant cette page vous risquez de perdre des données.</strong><br/>' +
			'{{num_inputs}} saisies ont déjà été réalisées sur cette source de données.' +
			'<ul>' +
			'	<li>Les modifications sur le calendrier (périodicité, dates) mettront de côté les saisies non concernées par le nouveau planning (sans perte de données)</li>' +
			'	<li>Les modifications sur la structure auront des conséquence différentes selon le type de modification: référez-vous au guide d\'utilisation pour lister les différents cas de figures</li>' +
			'</ul>',

		partitions: "Désagrégations",

		add_variable: "Ajouter une variable",
		remove_variable: "Supprimer la variable",
		add_partition: "Ajouter une désagrégation",
		remove_partition: "Supprimer la désagrégation",

		aggregation: {
			sum: "Faire une somme",
			average: "Faire une moyenne",
			highest: "Prendre la plus grande valeure",
			lowest: "Prendre la plus petite valeure",
			last: "Prendre la dernière valeur",
			none: "Il n'est pas possible de faire ce calcul"
		},

		covered_period: "Période couverte",

		collection_site_list: "Lieux de collecte",
		collection_form_list: "Sources de données",
		collection_input_list: "Saisie",

		collection_site: "Lieu de collecte",
		collection_form: "Source de données",

		collection_form_planning: "Calendrier",
		collection_form_structure: "Structure",

		running: "Projets en cours",
		finished: "Projets terminés",
		noproject: "Aucun projet ne correspond à ce critère",

		variable: "Variable",

		no_purposes: "Aucun objectif spécifique n'a été défini",

		form_name_ph: "ex: Données SNIS, Fiche consultations prénatales, Fiche consultations générales, ...",

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
			month_week_sat: 'Toutes les semaines (samedi à vendredi / coupées par mois)',
			month_week_sun: 'Toutes les semaines (dimanche à lundi / coupées par mois)',
			month_week_mon: 'Toutes les semaines (lundi à dimanche / coupées par mois)',
			week_sat: 'Toutes les semaines (samedi à vendredi)',
			week_sun: 'Toutes les semaines (dimanche à lundi)',
			week_mon: 'Toutes les semaines (lundi à dimanche)',
			month: 'Tous les mois',
			quarter: 'Tous les trimestres',
			semester: 'Tous les semestres',
			year: 'Tous les ans',
			free: 'Libre'
		},

		no_input_entities: 'Aucun lieu d\'activité n\'a encore été créé!',
		no_input_groups: 'Aucun groupe d\'activité n\'a encore été créé!',
		no_users: 'Aucun utilisateur n\'est ajouté au projet',
		no_forms: 'Aucune source de données n\'a encore été créé',

		input: 'Saisir',

		baseline: 'Valeur initiale',
		target: 'Valeur cible',

		goal: 'Objectif général',
		intervention_logic: 'Logique d\'intervention',

		start_date: "Date de lancement",
		end_date: "Date de fin",
		country_ph: "ex: RCA",
		name_ph: 'ex: Accès a des soins de santé de qualité pour les populations touchées par la crise',
		add_indicator: 'Ajouter un indicateur',

		purpose: 'Objectif Spécifique',
		purposes: 'Objectifs Spécifiques',
		assumptions: 'Hypothèses',
		output: "Résultat",

		indicator_is_computed: "Valide",
		indicator_is_not_computed: "Invalide",

		intervention_logic_goal_ph: 'ex: Réduire la mortalité et la morbidité des populations affectées par la crise',
		intervention_logic_purpose_ph: 'ex: Améliorer l\'accès aux soins des populations affectées par la crise dans les districts de Bimbo et Begoua',
		output_desc_ph: 'ex: Améliorer la qualité des soins de première ligne des centres de santé de Bimbo et Begoua',
		assumptions_purpose_ph: '',
		output_assumptions_ph: '',
		logframe_ph_name: "ex: ECHO",

		logframe_help_sites: "Parmi les structures identifiées dans \"Lieux de collecte\", lesquelles considérer pour ce cadre logique?",
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

		basics_info: "<p>Les données de bases permettent de classer votre projet parmi les autres de l'ONG.</p>",
		basics_help_country: "Dans quel pays le projet se déroule-t'il? S'il s'agit d'un projet régional, entrez le nom de la région.",
		basics_help_name: "Le nom permet de retrouver le projet dans Monitool. Choisissez un nom suffisament informatif, ou copiez l'objectif général du projet.",
		basics_help_thematics: "Le choix des thématiques conditionne les indicateurs transversaux que vous devrez collecter au sein de votre projet.",
		basics_help_begin: "La date de début représente le moment où le projet commence à collecter des données (généralement, le début des activités)",
		basics_help_end: "La date de fin représente le moment où le projet finale sa collecte de données. Si cette date n'est pas connu à l'avance, rentrer une date lointaine dans le futur.",

		collection_site_info:
			"<p>Lorsqu'un projet réalise les même activités dans plusieurs lieux, celles-ci doivent pouvoir être suivi individuellements, par groupes, et tous ensembles.</p>" +
			"<p>Rentrez ici:</p>" +
			"<ul>" +
			"<li>La liste des lieux sur lesquels le projet travaille (par exemple: une liste des centres de santé)</li>" +
			"<li>Des groupements qui seront utilisé lors du suivi (par exemple: des régions, des types de structure)</li>" +
			"</ul>",

		users_list_info:
			"<p>Plusieurs types d'utilisateurs interviennent dans la mise en place et dans le suivi d'un projet: coordination, staff M&E, opérateurs de saisie, partenaires, ...</p>" +
			"<p>Listez ici tous les utilisateurs qui doivent avoir accès au monitoring de ce projet.</p>",

		user_help_type: "Choisissez \"Compte MDM\" si l'utilisateur possède une adresse email xxx@medecinsdumonde.net, et compte partenaire sinon.",
		user_help_user: "De quel utilisateur MDM s'agit-il? Si l'utilisateur que vous voulez ajouter n'est pas disponible dans la liste, demandez lui de se connecter à Monitool une première fois.",
		user_help_username: "Cet identifiant permettra à l'utilisateur de se connecter. Les adresses emails ne sont pas acceptés comme identifiant (utiliser par exemple: \"nom.prenom\", ou \"fonction.pays\")",
		user_help_fullname: "Rentrez ici le nom complet de la personne qui va utiliser ce compte.",
		user_help_password: "Le mot de passe doit avoir 6 caractères au minimum. Ne pas utiliser la même valeur que l'identifiant",
		user_help_role: "Ce champs determine les modifications que pourra réaliser cet utilisateur sur le projet: les propriétaires peuvent changer la structure du projet, les saisisseurs, uniquement rentrer des données.",
		user_help_sites: "Sur quels lieux de collecte cet utilisateur pourra-t'il saisir?",
		user_help_datasources: "Sur quels sources de données cet utilisateur pourra-t'il saisir?",

		collection_form_list_info:
			"<p>Les sources de données sont les différents supports desquels les données nécessaires au monitoring du projet sont extraites (fiches de suivi, dossiers patient, fichiers Excel, ...)</p>" +
			"<p>Au sein de monitool, on ne décrira pas l'intégralité des données existantes, mais uniquement la partie qui va être extraite pour le suivi du projet</p>" +
			"<p>Afin de faciliter l'organisation de la saisie, les sources doivent correspondre à des outils réels utilisés sur le terrain.</p>",

		collection_edit_help_name: "Comment s'apelle la source de laquelle vous voulez extraire des données? Par exemple: \"Dossier patient informatisé\", \"Registre des centre de santé\", \"Rapport du système national d'information sanitaire\", ...",
		collection_edit_help_sites: "Parmi les structures identifiées dans \"Lieux de collecte\", lesquelles font remonter cette source de donnée?",
		collection_edit_help_periodicity: "À quelle fréquence ces données remontent-elles? Attention, cette fréquence est complétement decorrelée de la fréquence à laquelle le projet doit fournir du reporting.",
		collection_edit_help_start: "Si cette source de données est plus récente que le début du projet, indiquez la date de début, sinon laisser la valeur par défaut",
		collection_edit_help_end: "Si cette source de données finira avant la fin du projet, ou à été remplacée, indiquez le ici",

		collection_edit_help_varname: "Nommez la variable que vous voulez extraire de/du <code>{{name}}</code>. Par exemple \"Nombre de diagnostics effectués\".",
		collection_edit_help_geoagg: "Dans un projet avec deux sites, si <code>{{name}}</code> vaut 10 pour un site, et 20 pour l'autre, que vaut-il pour le projet dans son ensemble?",
		collection_edit_help_timeagg: "Dans un projet qui collecte mensuellement, si <code>{{name}}</code> vaut 10 en janvier, et 20 en février et 30 en mars que vaut-il pour le premier trimestre?",
		collection_edit_help_partition: "Veut-t'on être capable de différencier <code>{{name}}</code> par age, sexe, prise en charge, motif de consultation, pathologie, tranche horaire, reférencement effectif, ...?<br/>Ne désagrégez pas ici par zone géographique ou site d'intervention: vos lieux de collecte ont déjà été renseignés dans la page prévu à cet effet.",
		collection_edit_help_distribution: "Si vous desirez imprimer des formulaires en A4, préférez placer les intitulés sur la gauche des tableaux, afin de limiter leur largeur.",
		collection_edit_help_order: "Dans quel ordre voulez vous placer vos désagrégations dans les différentes lignes et colonnes?",

		logical_frame_list_info:
			"<p>Un cadre logique est un document qui décrit les objectifs, les résultats attendus, et les activités misent en oeuvre pour y parvenir, ainsi que les indicateurs qui permette de suivre l'avancement de chaque élément</p>" +
			"<p>Tous les indicateurs présents dans les cadres logiques doivent être calculables à partir des données décrites dans les sources de données</p>",

		cross_cutting_list_info:
			"<p>Les indicateurs transversaux a collecter sont déterminés à partir de la liste de thématiques renseignée dans les données de bases.</p>" +
			"<p>Cette liste contient tous les indicateurs qui doivent être collectés pour réaliser le suivi transversal</p>",

		input_list_info:
			"<p>Ce planning liste toutes les saisies qui ont été programmées pour la source de données \"{{name}}\"</p>" +
			"<p>Afin de limiter les erreurs, il est préférable de réaliser la saisie au plus près du lieu d'où sont extraites les données, directement sur Monitool.</p>" +
			"<p>Si ce n'est pas possible, une version PDF à imprimer du formulaire est disponible.</p>",

		extra_indicators_list_info:
			"<p>Les indicateurs annexés sont des indicateurs complémentaires qui ne figurent dans aucun cadre logique.</p>" +
			"<p>Ils permettent de suivre des éléments spécifiques du projet (données médicales, logistiques, ...)</p>",

		download_portrait: "Télécharger PDF (portrait)",
		download_landscape: "Télécharger PDF (paysage)",
		download_pdf: "PDF",

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

		no_element_selected: "Aucun élément selectionné",

		indicator_ph_fixed: "Entrez ici la valeur fixe de l'indicateur",
		indicator_help_description: "Contexte de collecte, détails sur la méthode de calcul choisie...",
		indicator_help_display: "Nommez votre indicateur. Le nom doit provenir d'un catalogue d'indicateur, afin d'être cohérent avec les autres projets.",
		indicator_help_baseline: "Combien valait cet indicateur avant le début du projet? Cochez la case pour spécifier cette valeur.",
		indicator_help_target: "Quel est l'objectif à atteindre sur cet indicateur?  Cochez la case pour spécifier cette valeur.",
		indicator_help_colorize: "Voulez-vous ajouter des couleurs (rouge, orange, vert) sur les rapports pour cet indicateur?",
		indicator_help_computation: "Comment calculer cet indicateur à partir des données que vous avez collecté dans les sources de données?",

		activity: "Activité",
		add_activity: "Ajouter une activité",
		delete_activity: "Supprimer l'activité",
		activity_desc_ph: "ex: Réalisation de sessions de sensibilisation sur la transmission du VIH",
		logframe_help_activity_desc: "Activité réalisée par l'ONG",
		logframe_help_activity_indicators: "Rentrez ici les indicateurs permettant de mesurer l'avancement de l'activité",

		logframe_edit_help_start: "Si ce cadre logique n'est pas valable à partir du début du projet indiquez le ici, sinon laisser 'Idem début du projet'",
		logframe_edit_help_end: "Si ce cadre logique n'est pas valable jusqu'à la fin du projet indiquez le ici, sinon laisser 'Idem fin du projet'",
		form_is_not_associated_with_site: "Cette source de données n'est associé à aucun lieu de collecte."
	},

	form: {
		mandatory: "Ce champ est obligatoire",
		start_lower_than_end: 'La date début de doit être inférieure à la date de fin',
		end_greater_than_start: 'La date de fin doit être supérieure à la date de début',

		help: {
			show: "Afficher l'aide sur ce champ",
			hide: "Cacher l'aide sur ce champ"
		},

		create_blank: "Créer un cadre logique vierge",
		create_copy: "Ajouter une copie"
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
			"<p>Vous pouvez ici éditer les permissions d'autres utilisateurs que vous sur le lieu. Cliquez sur \"Afficher l'aide sur ce champ\" pour avoir plus de détails sur les différents niveaux d'autorisation disponibles</p>",

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
			see_reporting: "Voir les rapports de tous les projets"
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
			"Rentrez ici le nom de la thématique dans toutes les langues utilisées par votre organisation."
	},

	indicator: {

		missing_description: "<i>La description de cet indicateur n'a pas été renseignée</i>",
		not_collected: "Cet indicateur n'est collecté par aucun projet",
		extra: "Indicateurs annexés",
		new_indicator: "Nouvel indicateur",
		create_new: 'Créer un nouvel indicateur',

		see_report: "Voir le rapport",

		cross_cutting: "Indicateurs transversaux",
		select_themes: 'ex: Soins de santé primaire',

		edit_title: "Édition indicateur",
		themes_label: "Thématiques",

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
			"Cette page vous permet de modifier la définition d'un indicateur transversal. Si vous réalisez des changements, attention de bien mettre à jour les champs dans toutes les langues.",

		save: "Sauvegarder l'indicateur"
	}
};

