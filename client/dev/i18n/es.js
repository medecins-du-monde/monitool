"use strict";

var SPANISH_LOCALE = {
	id: "es-es",
	DATETIME_FORMATS: {
		AMPMS: [ "a. m.", "p. m." ],
		DAY: [ "domingo", "lunes", "martes", "mi\u00e9rcoles", "jueves", "viernes", "s\u00e1bado" ],
		MONTH: [ "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre" ],
		SHORTDAY: [ "dom.", "lun.", "mar.", "mi\u00e9.", "jue.", "vie.", "s\u00e1b." ],
		SHORTMONTH: [ "ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sept.", "oct.", "nov.", "dic." ],
		fullDate: "EEEE, d 'de' MMMM 'de' y",
		longDate: "d 'de' MMMM 'de' y",
		medium: "d 'de' MMM 'de' y H:mm:ss",
		mediumDate: "d 'de' MMM 'de' y",
		mediumTime: "H:mm:ss",
		short: "d/M/yy H:mm",
		shortDate: "d/M/yy",
		shortTime: "H:mm"
	},
	NUMBER_FORMATS: {
		CURRENCY_SYM: "\u20ac",
		DECIMAL_SEP: ",",
		GROUP_SEP: ".",
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
	pluralCat: function(n, opt_precision) {
		if (n == 1)
			return PLURAL_CATEGORY.ONE;
		return PLURAL_CATEGORY.OTHER;
	}
};






var SPANISH_TRANSLATION = {
	shared: {
		clone: "Clonar",
		user_guide: "Guía del usuario",
		home: "Inicio",
		up: "Subir",
		down: "Bajar",

		date: "Fecha",
		administrator: "Administrador",

		settings: "Configuración",
		projects: 'Proyectos',
		project: 'Proyecto',
		users: "Usuarios",
		indicator: 'Indicador',
		indicators: 'Indicadores',
		indicators_catalog: 'Catálogo de indicadores',
		help: 'Ayuda',
		name: 'Nombre',
		start: 'Principio',
		end: 'Fin',

		add: 'Añadir',
		save: 'Guardar',
		remove: 'Quitar',
		remove_changes: 'Cancelar los cambios',
		edit: 'Modificar',
		'delete': 'Suprimir',

		members: 'Miembros',
		
		day: 'Dia',
		week: 'Semana',
		month: 'Mes',
		quarter: "Trimestre",
		year: "Año",

		choose: 'Elegir',
		cancel: 'Cancelar',
		logical_frames: 'Marcos lógicos',
		reporting: 'Estadísticas',
		reporting_general: 'Estadísticas generales',
		reporting_analysis: "Análisis descriptivo",
		columns: "Columnas",
		colorize: 'Colorear',
		display: 'Mostrar',
		download_plot: 'Descargar el gráfico',
		download_table: 'Descargar la tabla',

		logout: 'Desconectar',

		sure_to_leave: 'Ha realizado cambios. ¿Esta seguro de querer cambiar de página sin salvar?',
		filter: "Filtro"
	},
	menu: {
		toggle_nav: "Ver el menu",
		language: "Idiomas",
		french: "Francés",
		spanish: "Español",
		english: "Inglés",
	},

	help: {
		block: {
			general: "General",
			indicators: "Catálogo de indicadores",
			project: "Proyecto"
		},
		page: {
			presentation_general: "Presentación",
			data_path: "Etapas de los datos",
			create: "Crear un nuevo proyecto",
			structure: "Estructurar los datos de seguimiento",
			input: "Hacer una entrada de datos",
			activity_followup: "Seguir las actividades",
			logical_frame: "Entrar un marco lógico",
			objectives_results: "Seguir los objetivos & resultatos",
			change_definition: "Cambiar un proyecto en curso",
			indicator_usage: "Usar el catálogo",
			create_new_indicator: "Crear un indicador",
			merge_indicators: "Fusionar dos indicadores",
			indicator_reporting: "Seguir un indicator transversal"
		},
		reminder: {
			have_you_read_single_pre: "¿Ha leido la sección ",
			have_you_read_single_post: "de la documentación?",
			have_you_read_multiple: "Ha leido las secciones siguientes en la documentación?",
		}
	},

	project: {
		no_inputs: "Ninguna entrada de datos en espera",

		dimensions: {
			day: "Días",
			week: "Semanas",
			month: "Meses",
			quarter: "Trimestres",
			year: "Años",
			partition0: "Partición 0",
			partition1: "Partición 1",
			partition2: "Partición 2",
			partition3: "Partición 3",
			partition4: "Partición 4",
			partition5: "Partición 5",
			partition6: "Partición 6",
			entity: "Lugar de colecta",
			group: "Grupo de colecta"
		},
		group: {
			location: "Lugar",
			partition: "Particiones",
			time: "Fechas"
		},

		please_enter_new_name: "Entre un nombre para el nuevo proyecto",
		edit_user: "Editar usuario",
		update_user: "Actualizar el usuario",
		user_type: "Tipo",
		user_types: {
			internal: "Cuenta MDM",
			partner: "Cuenta socio"
		},

		user_role: "Nivel de autorización",
		user_roles: {
			owner: "Proprietario",
			input_all: "Entrada de datos",
			input: "Entrada de datos limitada",
			read: "Consultar"
		},
		user_fullname: "Nombre y apellido",
		user: "Usuario",
		username: "Nombre de usuario",
		password: "Contraseña",

		link_indicator: "Conectar con un indicador del catálogo",
		unlink_indicator: 'Deconectar del catálogo',

		parameter: "Parametro",
		all_selected: "Sin filtro",
		create_logframe: "Añadir un marco lógico",
		reporting_compare_sites: "Comparar lugares",
		unnamed_logframe: "Marco lógico sin nombre",

		update_logframe: "Actualizar el marco lógico",
		edit_indicator: "Editar usuario",
		display: "Nombre",
		display_ph: "Tasa de consultaciones prenatales en las estructuras de salud",

		fill_with_last_input: "Rellenar con los datos de la última entrada",
		show_finished: "Ver todas las entradas",
		field_order: "Orden",
		field_distribution: "Distribución",
		cant_create: "No esta autorizado a crear nuevos proyectos",
		my_projects: "Mis proyectos",
		are_you_sure_to_delete: "Por favor entre: 'Estoy seguro de querer suprimir este proyecto' para confirmar.",
		are_you_sure_to_delete_answer: "Estoy seguro de querer suprimir este proyecto",
		data_selection: "Seleccione los datos",
		filters: "Filtros",
		input_status: {
			'done-read': "Consultar",
			'outofschedule-read': "Consultar (fuera calendario)",
			'done-edit': "Editar",
			'expected-edit': "Crear",
			'expected-edit-new': "Crear (nueva fecha)",
			'outofschedule-edit': "Consultar (fuera calendario)"
		},
		cols: "Columnas",
		rows: "Linear",
		entity: "Lugar de colecta",
		select_cols: "Selecione las columnas",
		select_rows: "Selecione las lineas",
		pivot_table: "Tabla dinámica",

		actions: "Actions",
		groups: "Grupos",
		basics: "Datos de base",
		general: "General",
		full_project: "Proyecto completo",
		select_filters: "Seleccione filtros",

		collection_form_warning: 
			'<strong>Cuidado, si hace cambios en esta página, perdera datos</strong><br/>' + 
			'{{num_inputs}} entradas han sido realizadas en esta fuente de datos.' + 
			'<ul>' + 
			'	<li>Los cambios sobre el calendario (periodicidad, fechas) pondra de lado todas las entradas que no entren en las nuevas fechas (sin perder los datos)</li>' + 
			'	<li>Los cambios sobre la estructura de datos tendran consequencias diferentes según el tipo de cambio: lea la guía del usuario</li>' + 
			'</ul>',

		partitions: "Particiones",

		add_variable: "Añadir una variable",
		remove_variable: "Quitar esta variable",
		add_partition: "Añadir una partición",
		remove_partition: "Quitar esta partición",

		aggregation: "Agregación",
		different_geos: "Entre lugares diferentes",
		same_geos: "En un mismo lugar",

		none: "No agregar",
		sum: "Suma",
		average: "Promedio",
		highest: "Mas alto",
		lowest: "Mas bajo",
		last: "Último",

		variable_up: "Subir la variable",
		variable_down: "Bajar la variable",


		collection_site_list: "Lugares de colecta",
		collection_form_list: "Fuentes de datos",
		collection_input_list: "Entrada de datos",

		collection_site: "Lugar de colecta",
		collection_form: "Fuente de datos",

		collection_form_planning: "Calendario",
		collection_form_structure: "Estructura",

		delete_form_easy: "¿Esta seguro que quiere suprimir esta fuente de datos?",
		delete_form_hard: "Si suprime esta fuente de datos, todas las entradas asociadas seran suprimidas tambien. Entre \"Suprimir las {{num_inputs}} entradas\" para confirmar",
		delete_form_hard_answer: "Suprimir las {{num_inputs}} entradas",
		delete_entity: "Si suprime este lugar de colecta, todas las entradas asociadas seran suprimidas tambien. Entre \"Suprimir las {{num_inputs}} entradas\" para confirmar",
		delete_entity_answer: "Suprimir las {{num_inputs}} entradas",

		running: "Proyectos en progreso",
		finished: "Proyectos terminados",
		noproject: "Ningún proyecto corresponde a este criterio",


		activity: "Actividad",
		activity_management: "Actividades y Demografía",
		variable: "Variable",


		result_management: "Objectivos & resultados",
		no_purposes: "Ningun objetivo específico ha sido definido",


		form_name_ph: "ej: Recuperación mensual en los centros de salud",

		analysis: "Análisis",
		analysis_insert_data: "Insertar datos",
		analysis_insert_text: "Insertar texto",
		analysis_up_next: "Subir",
		analysis_down_next: "Bajar",
		analysis_delete_next: "Suprimir",
		analysis_data: "Mostrar",
		analysis_table: "Tabla",
		analysis_graph: "Gráfico",
		analysis_both: "Tabla & Gráfico",
		report_name_ph: "ex: Análisis descriptivo mensual de mayo 2015",
		no_reports: "Ningún analisis descriptivo ha sido creado!",


		missing_mandatory_indicators: "Indicadores obligatorios",
		other_indicators: "Otros indicadores",
		see_other_themes: "Ver tambien las otra temáticas",

		entity_name: "Nombre de la estructura o del lugar de intervención",
		group_name: "Nombre del grupo",
		entity_name_placeholder: "ej: Centro de salud X, Hospital X, ...",
		group_name_placeholder: "ej: Hospitales regionales, parte Norte del país, ...",


		create: "Crear un nuevo proyecto",
		periodicity: "Periodicidad",
		start: 'Principio del proyecto',
		end: 'Fin del proyecto',


		periodicities: {
			day: 'Diario',
			week: 'Cada semana',
			month: 'Cada mes',
			quarter: 'Cada trimestre',
			year: 'Cada año',
			free: 'Libre'
		},
		collect: "Recuperar",
		collects: {
			some_entity: "Para algunos lugares de colecta",
			entity: "Para cada lugar de colecta",
			project: "Una vez para todo el proyecto"
		},
		

		no_input_entities: '¡Ningún lugar de colecta ha sido creado!',
		no_input_groups: '¡Ningún grupo de colecta ha sido creado!',
		no_forms: '¡Ningúna fuente de datos ha sido creada!',


		input: 'Entrar datos',

		baseline: 'Valor de base',
		target: 'Objectivo',

		goal: 'Objectivo global',
		intervention_logic: 'Logica de intervención',
		intervention_logic_goal_ph: 'Descripción de la contribución del proyecto a los objectivos (impacto) de una política o de un programa',
		intervention_logic_purpose_ph: 'Descripción de las ventajas directas destinadas a los beneficiarios',
		assumptions_purpose_ph: 'Factores externos susceptibles de comprometer el alcanze del objetivo',

		start_date: "Fecha de inicio",
		end_date: "Fecha de fin",
		name_ph: 'Por ejemplo: [Laos] Reducción de riesgos',
		add_indicator: 'Añadir un indicador',

		purpose: 'Objectivo Específico',
		purposes: 'Objectivos Específicos',
		assumptions: 'Hipotesis',
		output: "Resultado",
		activities: 'Actividades',
		activity_desc_ph: 'Producto o servicio tangible aportado por el proyecto.',
		output_assumptions_ph: 'Factores externos susceptibles de comprometer el alcanze del resultado',
		output_desc_ph: 'Producto o servicio tangible aportado por el proyecto.',

		add_activity: 'Añadir una actividad',
		add_output: 'Añadir un resultado esperado',
		add_purpose: 'Añadir un objetivo específico',

		users: "Usuarios",
		owners: "Proprietarios",


		you_are_owner: "Puede editar este proyecto",
		you_are_editor: "Puede entrar indicadores en este proyecto",
		you_are_not_owner: "No puede editar este proyecto",
		you_are_not_editor: "No puede entrar indicadores en este proyecto",
		
		formula: "Formula: {{name}}",
		link: "Vínculo: {{name}}",
	},
	indicator: {
		cant_create: "No esta autorizado a crear nuevos indicadores",
		name: "Nombre",
		translate_from_fr: "Traducir automaticamente desde el francès",
		translate_from_es: "Traducir automaticamente desde el español",
		translate_from_en: "Traducir automaticamente desde el inglès",

		delete_indicator: "¿Esta seguro que quiere suprimir este indicador? Afectara a todos los proyectos que lo usan.",
		delete_formula: "¿Esta seguro que quiere suprimir esta formula? Afectara a todos los proyectos que la usan.",

		classification: "Clasificación",

		is_mandatory: "Obligatorio - Debe ser colectado por todos los proyectos de misma tématica",
		is_approved: "Opcional - Puede o no ser colectado por proyecto de misma tématica",
		is_waiting: "En espera - La sede no se ha pronunciado aún sobre la calidad de este indicador",
		
		num_collecting_projects: "Número de proyectos que colectan este indicador",

		search: "Buscar",
		search_ph: "Entre por lo menos 3 caracteres",

		standard: "Norma",
		sources: "Origen",
		comments: "Notas",
		standard_ph: "¿A que norma pertenece este indicador?",
		sources_ph: "¿Dónde se puede colectar este indicador?",
		comments_ph: "¿En qué casos es pertinente usar este indicador, y con qué limites?",

		target: "Relación con el objetivo",
		higher_is_better: "Alcanzado si la entrada es superior al objetivo",
		lower_is_better: "Alcanzado si la entrada es inferior al objetivo",
		around_is_better: "Alcanzado si la entrada es igual al objetivo",
		non_relevant: "No pertinente",

		no_theme: 'Sin temática',
		no_type: 'Sin tipo',

		operation: "Modo de operación",

		name_ph: 'Por ejemplo: Porcentaje de fichas de paciente completas',
		definition: 'Definición',
		unit: 'Unidad',
		other: 'Otro',
		percent: 'Porcentaje (%)',
		permille: 'Por mil (‰)',
		types: 'Tipos',
		themes: 'Temáticas',
		select_types: 'Selectione uno o varios tipos',
		select_themes: 'Selectione una o varias tématicas',

		num_projects: 'Número de proyectos',
		create_new: 'Crear un nuevo indicador',

		themes_list: "Lista de temáticas",
		types_list: "Lista de tipos",
		num_indicators: 'Número de indicadores',
		
	},
	form: {
		mandatory: "Este campo es obligatorio",
		start_lower_than_end: 'La fecha de inicio tiene que ser inferior a la de fin',
		end_greater_than_start: 'la fecha de fin tiene que ser superior a la de inicio',
	}
};

