var SPANISH_TRANSLATION = {
	shared: {
		back_to_intranet: "Volver a la intranet",
		projects: 'Proyectos',

		indicator: 'Indicador',
		indicators: 'Indicadores',
		indicators_catalog: 'Catálogo de indicadores',
		help: 'Ayuda',
		input_entities: 'Lugares de actividad',
		input_groups: 'Grupos de actividad',
		input_entity: 'Lugar de actividad',
		input_group: 'Grupo de actividad',

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
		year: "Año",

		done: 'Hecho',
		copy: 'Copiar',
		choose: 'Elegir',
		edition: 'Edición',
		cancel: 'Cancelar',
		logical_frame: 'Marco lógico',
		description: 'Descripción',
		reporting: 'Estadísticas',
		columns: "Columnas",
		colorize: 'Colorear',
		display: 'Mostrar',
		values: 'Valores',
		target_percentage: 'Porcentaje del objetivo',
		baseline_percentage: 'Porcentaje de la valor base',
		plot: 'Mostrar gráfico',
		download_plot: 'Descargar el gráfico',
		download_table: 'Descargar la tabla',
		unknown_indicator: "Indicador no conocido",
		active: "Activo",

		choose_indicator: 'Elige un indicador',
		list: 'Lista',
		logout: 'Desconectar',
		change_password: "Cambiar contraseña",
		detach: "Desconectar"
	},
	menu: {
		toggle_nav: "Ver el menu",
		language: "Idiomas",
		french: "Francés",
		spanish: "Español",
		english: "Inglés",
	},
	project: {
		logical_frame_tooltip: 'Describe los objectivos, resultados esperados et actividades del proyecto.',
		input_entities_tooltip: 'Lista de los lugares de actividad donde se collectan los indicadores. Por ejemplo hospitales, centros de salud, pueblos...',
		input_groups_tooltip: 'Permite reunir lugares de actividad en categorias logicas.',
		input_forms_tooltip: 'Contiene la declaración de los diferentes formularios que permiten collectar los indicadores.',
		waiting_inputs_tooltip: '',
		reporting_tooltip: '',

		show_finished: 'Mostrar todos los proyectos',
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

		daily: 'Diario',
		weekly: 'Cada semana',
		monthly: 'Cada mes',
		quarterly: 'Cada trimestre',
		yearly: 'Cada año',
		planned: 'Planificado',
		add_intermediary: "Añadir una fecha",
		intermediary_periods: "Fechas adicionales",

		no_input_entities: '¡Ningún lugar de actividad ha sido creado!',
		no_input_groups: '¡Ningún grupo de actividad ha sido creado!',
		no_forms: '¡Ningún formulario ha sido creado!',
		waiting_inputs: 'Entradas en espera',
		no_waiting_inputs: 'Ninguna entrada en espera.',
		input: 'Entrar datos',
		see_all_inputs: 'Ver todos los formularios',

		relevance: 'Pertinencia',
		relevance_ph: '¿Porqué quiere colectar este indicador?',
		limits: 'Limites',
		minimum_ph: 'minimo',
		maximum_ph: 'maximo',
		orange_zone: 'Zona Naranja',
		green_zone: 'Zona Verde',
		baseline: 'Valor de base',
		baseline_ph: 'Valor de referencia',
		target_value_ph: 'valor',
		targets: 'Objectivo',
		add_target: 'Añadir un objetivo',
		general_data: 'Datos generales',

		goal: 'Objectivo global',
		goal_short: "OG",
		intervention_logic: 'Logica de intervención',
		intervention_logic_goal_ph: 'Descripción de la contribución del proyecto a los objectivos (impacto) de una política o de un programa',
		intervention_logic_purpose_ph: 'Descripción de las ventajas directas destinadas a los beneficiarios',
		assumptions_purpose_ph: 'Si el objetivo esta alcanzado, ¿qué hipotesis se deben confirmar para alcanzar el objetivo general?',
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
		prerequisite: 'Requisito previo',
		activity_prereq_ph: '¿Qué requisitos previos se deben verificar antes de poder empezar esta actividad?',
		activity_desc_ph: 'Producto o servicio tangible aportado por el proyecto.',
		output_assumptions_ph: 'Si el resultado es obtenido, ¿que hipotesis se deben confirmar para alcanzar el objetivo específico?',
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
		source: "Persona responsable",
		you_are_owner: "Puede editar este proyecto",
		you_are_editor: "Puede entrar indicadores en este proyecto",
		you_are_not_owner: "No puede editar este proyecto",
		you_are_not_editor: "No puede entrar indicadores en este proyecto",
		form_warning: [
			"<strong>Cuidado</strong><br/>",
			"Todo cambio realizado en un formulario es retro-activo.<br/>",
			"<ul>",
				"<li>Si cambia las fechas de inicio, de fin o la perdiodicidad, las entradas adicionales seran invalidadas.</li>",
				"<li>Si suprime o cambia el metodo de cálculo de un indicador todo su historico de entrada sera invalidado.</li>",
			"</ul>",
			"<br/>",
			"En vez de realizar estos cambios, la mayoria del tiempo es mejor:",
			"<ul>",
				"<li>Cambiar la fecha de fin del formulario activo y desactivarlo.</li>",
				"<li>Crear un nuevo formulario a partir de dicha fecha.</li>",
			"</ul>",
		].join(' '),

		status_green: "Este indicador esta en zona verde",
		status_orange: "Este indicador esta en zona naranja",
		status_red: "Este indicador esta en zona roja",
		status_darkred: "Este indicador esta fuera<br/>de los limites establecidos<br/>en el marco lógico",

		formula: "Formula: {{name}}",
		link: "Vínculo: {{name}}",
		links: "Vínculos"
	},
	indicator: {
		no_theme: 'Sin temática',
		no_type: 'Sin tipo',

		name_ph: 'Por ejemplo: Porcentaje de fichas de paciente completas',
		description_ph: 'Por ejemplo: Medir el nivel de formación del personal medical que completa las fichas de pacientes. Medir este indicador es facil en proyectos pequeños, evitar usarlo en otras circunstancias.',
		history_ph: 'Por ejemplo: Creado en 2007 en el cuadro de un proyecto de UNICEF ... este indicador permitio seguir los objetivos de ...',
		definition: 'Definición',
		core: 'Recomendado',
		history: 'Historico',
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

		is_recommended: "Este indicador esta recomendado",
		is_not_recommended: "Este indicador no esta recomendado",

		time_aggregation: "Agregación en el tiempo",
		time_aggregation_sum: "Suma (por ejemplo: número de consultaciones, de nacimientos, ...)",
		time_aggregation_average: "Promedia no ponderada (por ejemplo: poblaciones, número de medicos, de vehiculos...)",
		time_aggregation_none: "No agregación directa posible (todas las tasas, porcentajes, indicadores calculados, ...)",
		time_aggregation_help: [
			"<strong>Ayuda a la entrada</strong>",
			"<ul>",
				"<li>",
					"Si un hospital realiza 100 consultaciones en enero, febrero y marzo, habra realizado 300 en",
					"el curso del primer trimestre del año. El modo de agregación del indicador <strong>\"Número de consultaciones\"</strong>",
					"es <strong>\"suma\"</strong>",
				"</li>",
				"<li>",
					"Si una zona quirúrgica tiene una tasa de mortalidad de 5% en enero, 7% en febrero y 10% en marzo, no se puede calcular",
					"su tasa de mortalidad en el primer trimestre del año sin conocer el número de operaciones de cada mes.",
					"El modo de agregación del indicador <strong>\"Tasa de mortalidad postoperatoria\"</strong> valdra <strong>\"No agregación directa posible\"</strong>",
				"</li>",
				"<li>",
					"Si un pueblo tiene una población de 510 habitantes en enero, 600 en febrero y 550 en marzo, podemos decir que su población",
					"en el primero trimestre del año vale 553. El modo de agregación del indicador <strong>\"Población\"</strong> es",
					"<strong>\"Promedia no ponderada\"</strong>",
				"</li>",
			"</ul>"
		].join(' '),

		geo_aggregation: "Agregación geografica",
		geo_aggregation_sum: "Suma (por ejemplo: población, número de medicos, de vehiculos disponibles, de consultaciones, de nacimientos, ...)",
		geo_aggregation_average: "Promedia no ponderada (usar unicamente para indicadores que son promedios por lugar de actividad)",
		geo_aggregation_none: "No agregación directa posible (todas las tasas, porcentajes, indicadores calculados, ...)",
	},
	login: {
		error: "Usuario o contraseña inválido",
		please_connect: "Conectese",
		login: 'Usuario',
		password: "Contraseña",
		connect: "Conectar",
		change_password_please: "Entre su nueva contraseña",
		new_password: "Contraseña",
		new_password_again: "Repita su contraseña",
		change_password: "Cambiar"
	},
	form: {
		mandatory: "Este campo es obligatorio",
		begin_lower_than_end: 'La fecha de inicio tiene que ser inferior a la de fin',
		end_greater_than_begin: 'la fecha de fin tiene que ser superior a la de inicio',
	}
};

