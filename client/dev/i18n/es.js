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
		up: "Subir",
		down: "Bajar",
		sum: "Suma",
		include: "Incluir",
		toggle: "Cambiar",
		toggle_all: "Cambiar todos",

		date: "Fecha",
		administrator: "Administrador",

		back_to_intranet: "Volver a la intranet",
		settings: "Configuración",
		projects: 'Proyectos',
		project: 'Proyecto',
		users: "Usuarios",
		indicator: 'Indicador',
		indicators: 'Indicadores',
		indicators_catalog: 'Catálogo de indicadores',
		help: 'Ayuda',
		name: 'Nombre',
		begin: 'Principio',
		end: 'Fin',

		add: 'Añadir',
		save: 'Guardar',
		remove: 'Quitar',
		remove_changes: 'Cancelar los cambios',
		edit: 'Modificar',
		'delete': 'Suprimir',

		view_stats: 'Ver las estadísticas',
		members: 'Miembros',
		
		day: 'Dia',
		week: 'Semana',
		month: 'Mes',
		quarter: "Trimestre",
		year: "Año",

		done: 'Hecho',
		copy: 'Copiar',
		choose: 'Elegir',
		edition: 'Edición',
		cancel: 'Cancelar',
		logical_frame: 'Marco lógico',
		description: 'Descripción',
		reporting: 'Estadísticas',
		reporting_general: 'Estadísticas generales',
		reporting_by_indicator: 'Estadísticas por indicador',
		reporting_by_variable: 'Estadísticas por variable',
		reporting_analysis: "Análisis descriptivo",
		columns: "Columnas",
		colorize: 'Colorear',
		display: 'Mostrar',
		values: 'Indicadores marco lógico',
		target_percentage: 'Progreso marco lógico',
		plot: 'Mostrar gráfico',
		download_plot: 'Descargar el gráfico',
		download_table: 'Descargar la tabla',
		unknown_indicator: "Indicador no conocido",
		active: "Activo",

		choose_indicator: 'Elige un indicador',
		list: 'Lista',
		logout: 'Desconectar',
		change_password: "Cambiar contraseña",
		detach: "Desconectar",

		stay_here_check: 'Ha realizado cambios. Selectione acceptar para quedarse en esta página, cancelar para perder los cambios.',
		filter: "Filtro",
		'export': "Exportar",
		none: "Ningúno"
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
			project: "Proyectos",
		},
		page: {
			presentation_general: "Presentación",
			presentation_project: "Presentación",
			presentation_indicator: "Presentación",

			offline_access: "Uso desconectado",
			acls: "Derechos de acceso",
			translation: "Traducción",

			completeness: "Integridad y limitaciones",
			operation_modes: "Modos de operación",
			computation: "Formulas y agregación",
			collection_history: "Historial de colecta",

			logical_frame: "Marco lógico",
			entities_groups: "Lugares de actividad y grupos",
			input_forms: "Formularios",
			users: "Derechos de acceso",

			inputs: "Entradas",
			statistics: "Estadísticas",
			descriptive_analysis: "Análisis descriptivo",
			change_definition: "Modicaciones",
		},
		reminder: {
			have_you_read_single_pre: "¿Ha leido la sección ",
			have_you_read_single_post: "de la documentación?",
			have_you_read_multiple: "Ha leido las secciones siguientes en la documentación?",
		}
	},

	project: {
		are_you_sure_to_delete: "Por favor entre: 'Estoy seguro de querer suprimir este proyecto' para confirmar.",
		are_you_sure_to_delete_answer: "Estoy seguro de querer suprimir este proyecto",

		cols: "Columnas",
		rows: "Linear",
		partition0: "Partición 0",
		partition1: "Partición 1",
		partition2: "Partición 2",
		partition3: "Partición 3",
		partition4: "Partición 4",
		entity: "Lugar de actividad",
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
			'{{num_inputs}} entradas han sido realizadas en este formulario.' + 
			'<ul>' + 
			'	<li>Todo cambio sobre el calendario suprimira todas las entradas que no entren en las nuevas fechas</li>' + 
			'	<li>Todo cambio sobre la estructura de datos sera efectiva en todas las entradas realizadas</li>' + 
			'</ul>',

		sections: "Apartados",
		variables: "Variables",
		partitions: "Particiones",

		add_variable: "Añadir una variable",
		remove_variable: "Quitar esta variable",
		add_partition: "Añadir una partición",
		remove_partition: "Quitar esta partición",
		add_partition_element: "Añadir un elemento",
		remove_partition_element: "Quitar este elemento",

		aggregation: "Agregación",
		different_geos: "Entre lugares diferentes",
		same_geos: "En un mismo lugar",

		none: "No agregar",
		sum: "Suma",
		average: "Promedio",
		highest: "Mas alto",
		lowest: "Mas bajo",
		last: "Último",

		section_up: "Subir el apartado",
		section_down: "Bajar el apartado",
		variable_up: "Subir la variable",
		variable_down: "Bajar la variable",
		remove_section: "Quitar este apartado",
		add_section: "Añadir una sección",

		please_select_variable: "Seleccione una variable",
		no_partitions_available: "Ningúna partición disponible",

		collection_site_list: "Lugares de colecta",
		collection_form_list: "Formularios de colecta",
		collection_input_list: "Entrada de datos",

		collection_site: "Lugar de colecta",
		collection_form: "Formulario de colecta",

		collection_form_planning: "Calendario",
		collection_form_structure: "Estructura",

		remove_partition: "Quitar esta partición",

		delete_form_easy: "¿Esta seguro que quiere suprimir este formulario de entrada?",
		delete_form_hard: "Si suprime este formulario, todas las entradas asociadas seran suprimidas tambien. Entre \"Suprimir las {{num_inputs}} entradas\" para confirmar",
		delete_form_hard_answer: "Suprimir las {{num_inputs}} entradas",
		delete_entity: "Si suprime este lugar de actividad, todas las entradas asociadas seran suprimidas tambien. Entre \"Suprimir las {{num_inputs}} entradas\" para confirmar",
		delete_entity_answer: "Suprimir las {{num_inputs}} entradas",

		running: "Proyectos en progreso",
		finished: "Proyectos terminados",
		noproject: "Ningún proyecto corresponde a este criterio",
		inputs: "Entradas",

		last_input: "Última entrada: ",

		value: "Valor",
		activity: "Actividad",
		activity_management: "Seguimiento de actividades",
		partitions: "Particiónes",
		variable: "Variable",
		section: "Apartado",

		unknown: "Desconocido",
		color: "Color",

		specs: "Especificaciones",
		result_management: "Seguimiento de resultados",
		additional_indicators: "Indicadores adicionales",
		no_additional_indicators: "Ningun indicador adicional ha sido definido",
		no_purposes: "Ningun objetivo específico ha sido definido",

		input_form_list: "Lista de los formularios",
		indicator_distribution: "Distribución de los indicadores por formulario y período",
		add_new_indicator_to_form: "Añadir un nuevo indicator al formulario",

		form_name_ph: "ej: Recuperación mensual en los centros de salud",
		collect: "Recuperar por",

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

		source: "Origen",
		source_ph: "Ej: NHIS local",
		in_charge: "Persona responsable",
		in_charge_ph: "Ex: Enfermera del proyecto",

		missing_mandatory_indicators: "Indicadores obligatorios",
		other_indicators: "Otros indicadores",
		see_other_themes: "Ver tambien las otra temáticas",

		entity_name: "Nombre de la estructura o del lugar de intervención",
		group_name: "Nombre del grupo",
		entity_name_placeholder: "ej: Centro de salud X, Hospital X, ...",
		group_name_placeholder: "ej: Hospitales regionales, parte Norte del país, ...",

		logical_frame_tooltip: 'Describe los objectivos, resultados esperados et actividades del proyecto.',
		input_entities_tooltip: 'Lista de los lugares de actividad donde se collectan los indicadores. Por ejemplo hospitales, centros de salud, pueblos...',
		input_groups_tooltip: 'Permite reunir lugares de actividad en categorias logicas.',
		input_forms_tooltip: 'Contiene la declaración de los diferentes formularios que permiten collectar los indicadores.',
		waiting_inputs_tooltip: '',
		reporting_tooltip: '',

		create: "Crear un nuevo proyecto",
		input_forms: 'Formularios',
		input_form: 'Formulario',
		data_collection: 'Recuperación de los datos',
		periodicity: "Periodicidad",
		begin: 'Principio del proyecto',
		end: 'Fin del proyecto',

		sumable: 'Somable',
		input_field: 'Campo de entrada',
		value_source: 'Origen del valor',
		input_mode: 'Modo de entrada',
		manual_input: 'Entrada manual',

		periodicities: {
			day: 'Diario',
			week: 'Cada semana',
			month: 'Cada mes',
			quarter: 'Cada trimestre',
			year: 'Cada año',
			planned: 'Planificado'
		},
		collects: {
			entity: "Lugar de actividad",
			project: "Proyecto"
		},
		
		add_intermediary: "Añadir una fecha",
		intermediary_periods: "Fechas adicionales",

		no_input_entities: '¡Ningún lugar de actividad ha sido creado!',
		no_input_groups: '¡Ningún grupo de actividad ha sido creado!',
		no_forms: '¡Ningún formulario ha sido creado!',
		no_indicators: 'Ningún indicador ha sido definido en este proyecto',

		waiting_inputs: 'Entradas en espera',
		finished_inputs: 'Entradas realizadas',
		invalid_inputs: 'Entradas fuera de calendario',

		no_inputs: 'Ninguna entrada corresponder a este criterio.',
		input: 'Entrar datos',

		relevance: 'Pertinencia',
		relevance_ph: '¿Porqué quiere colectar este indicador?',
		baseline: 'Valor de base',
		baseline_ph: 'Valor de referencia',
		target_ph: 'Valor del objetivo',
		target: 'Objectivo',
		general_data: 'Datos generales',

		goal: 'Objectivo global',
		goal_short: "OG",
		intervention_logic: 'Logica de intervención',
		intervention_logic_goal_ph: 'Descripción de la contribución del proyecto a los objectivos (impacto) de una política o de un programa',
		intervention_logic_purpose_ph: 'Descripción de las ventajas directas destinadas a los beneficiarios',
		assumptions_purpose_ph: 'Factores externos susceptibles de comprometer el alcanze del objetivo',
		purpose_short: 'OS',
		output_short: 'R',

		begin_date: "Fecha de inicio",
		end_date: "Fecha de fin",
		name_ph: 'Por ejemplo: [Laos] Reducción de riesgos',
		add_indicator: 'Añadir un indicador',

		purpose: 'Objectivo Específico',
		purposes: 'Objectivos Específicos',
		assumptions: 'Hipotesis',
		output: "Resultado",
		activity: 'Actividad',
		activities: 'Actividades',
		prerequisite: 'Requisito previo',
		activity_prereq_ph: '¿Qué requisitos previos se deben verificar antes de poder empezar esta actividad?',
		activity_desc_ph: 'Producto o servicio tangible aportado por el proyecto.',
		output_assumptions_ph: 'Factores externos susceptibles de comprometer el alcanze del resultado',
		output_desc_ph: 'Producto o servicio tangible aportado por el proyecto.',

		add_activity: 'Añadir una actividad',
		add_output: 'Añadir un resultado esperado',
		add_purpose: 'Añadir un objetivo específico',

		users: "Usuarios",
		owners: "Proprietarios",
		dataEntryOperators: "Capturistas",

		move_up: "Subir",
		move_down: "Bajar",

		indicator_source: "Adquisición",
		you_are_owner: "Puede editar este proyecto",
		you_are_editor: "Puede entrar indicadores en este proyecto",
		you_are_not_owner: "No puede editar este proyecto",
		you_are_not_editor: "No puede entrar indicadores en este proyecto",
		
		formula: "Formula: {{name}}",
		link: "Vínculo: {{name}}",
		links: "Vínculos"
	},
	indicator: {
		delete_indicator: "¿Esta seguro que quiere suprimir este indicador? Afectara a todos los proyectos que lo usan.",
		delete_formula: "¿Esta seguro que quiere suprimir esta formula? Afectara a todos los proyectos que la usan.",

		classification: "Clasificación",
		is_unchanged: "Ningun dato ha cambiado desde la última vez que ha salvado.",
		is_invalid: "El formulario no es valido. ¿ha rellenado todos los nombre y elementos en las formulas?",

		is_mandatory: "Obligatorio - Debe ser colectado por todos los proyectos de misma tématica",
		is_approved: "Opcional - Puede o no ser colectado por proyecto de misma tématica",
		is_waiting: "En espera - La sede no se ha pronunciado aún sobre la calidad de este indicador",
		is_forbidden: "Prohibido - Ne debe ser colectado en nuevos proyectos",
		
		num_collecting_projects: "Número de proyectos que colectan este indicador",

		search: "Buscar",
		search_ph: "Entre por lo menos 3 caracteres",
		scope: "Perimetro",

		standard: "Norma",
		sources: "Origen",
		comments: "Notas",
		standard_ph: "¿A que norma pertenece este indicador?",
		sources_ph: "¿Dónde se puede colectar este indicador?",
		comments_ph: "¿En qué casos es pertinente usar este indicador, y con qué limites?",
		metadata: "Metadatos",

		target: "Relación con el objetivo",
		higher_is_better: "Alcanzado si la entrada es superior al objetivo",
		lower_is_better: "Alcanzado si la entrada es inferior al objetivo",
		around_is_better: "Alcanzado si la entrada es igual al objetivo",
		non_relevant: "No pertinente",

		no_theme: 'Sin temática',
		no_type: 'Sin tipo',

		operation: "Modo de operación",

		name_ph: 'Por ejemplo: Porcentaje de fichas de paciente completas',
		definition_ph: 'Por ejemplo: Medir el nivel de formación del personal medical que completa las fichas de pacientes. Medir este indicador es facil en proyectos pequeños, evitar usarlo en otras circunstancias.',
		definition: 'Definición',
		core: 'Recomendado',
		unit: 'Unidad',
		other: 'Otro',
		percent: 'Porcentaje (%)',
		permille: 'Por mil (‰)',
		types: 'Tipos',
		themes: 'Temáticas',
		select_types: 'Selectione uno o varios tipos',
		select_themes: 'Selectione una o varias tématicas',
		categorization: 'Categorización',
		computation: 'Cálculo',
		sum_allowed: 'Somable',
		formula: 'Formula',
		formulas: 'Formulas',
		formula_name_ph: 'Por ejemplo: Porcentaje entre fichas completas y total',
		formula_expression_ph: 'Por ejemplo: 100 * a / b',
		param_name_ph: "Por ejemplo: Número de consultaciones prenatales",
		add_formula: "Añadir una formula",
		parameter: 'Parametro',

		order_by: 'Ordenar por',
		alphabetical_order: 'Orden alfabético',
		num_inputs: 'Número de entradas',
		num_projects: 'Número de proyectos',
		create_new: 'Crear un nuevo indicador',

		themes_list: "Lista de temáticas",
		types_list: "Lista de tipos",
		num_indicators: 'Número de indicadores',
		
		new_type_name: "Nombre del nuevo tipo",
		new_theme_name: "Nombre de la nueva temática",
		only_core: "Ver unicamente los indicadores recomendados",
		is_external: "Este indicator viene de otra temática",
	},
	form: {
		mandatory: "Este campo es obligatorio",
		begin_lower_than_end: 'La fecha de inicio tiene que ser inferior a la de fin',
		end_greater_than_begin: 'la fecha de fin tiene que ser superior a la de inicio',
	}
};

