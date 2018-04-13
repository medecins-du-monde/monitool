/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

var SPANISH_LOCALE = (function() {
	var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};

	return {
  "DATETIME_FORMATS": {
    "AMPMS": [
      "a. m.",
      "p. m."
    ],
    "DAY": [
      "domingo",
      "lunes",
      "martes",
      "mi\u00e9rcoles",
      "jueves",
      "viernes",
      "s\u00e1bado"
    ],
    "ERANAMES": [
      "antes de Cristo",
      "despu\u00e9s de Cristo"
    ],
    "ERAS": [
      "a. C.",
      "d. C."
    ],
    "FIRSTDAYOFWEEK": 0,
    "MONTH": [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre"
    ],
    "SHORTDAY": [
      "dom.",
      "lun.",
      "mar.",
      "mi\u00e9.",
      "jue.",
      "vie.",
      "s\u00e1b."
    ],
    "SHORTMONTH": [
      "ene.",
      "feb.",
      "mar.",
      "abr.",
      "may.",
      "jun.",
      "jul.",
      "ago.",
      "sept.",
      "oct.",
      "nov.",
      "dic."
    ],
    "STANDALONEMONTH": [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre"
    ],
    "WEEKENDRANGE": [
      5,
      6
    ],
    "fullDate": "EEEE, d 'de' MMMM 'de' y",
    "longDate": "d 'de' MMMM 'de' y",
    "medium": "d MMM y H:mm:ss",
    "mediumDate": "d MMM y",
    "mediumTime": "H:mm:ss",
    "short": "d/M/yy H:mm",
    "shortDate": "d/M/yy",
    "shortTime": "H:mm"
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "\u20ac",
    "DECIMAL_SEP": ",",
    "GROUP_SEP": ".",
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
  "id": "es",
  "localeID": "es",
  "pluralCat": function(n, opt_precision) {  if (n == 1) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
}; })();





















var SPANISH_TRANSLATION = {
	shared: {
		loading: "Cargando...",
		portrait: "Vertical",
		landscape: "Horizontal",

		name_label_fr: "Nombre (francès)",
		name_label_es: "Nombre (español)",
		name_label_en: "Nombre (inglès)",

		description_label_fr: "Descripción (francès)",
		description_label_es: "Descripción (español)",
		description_label_en: "Descripción (inglès)",

		description: "Descripción",

		country: "País",
		apply: "Aplicar los cambios",
		clone: "Clonar",
		home: "Inicio",

		date: "Fecha",

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
		
		day: 'Día',
		month_week_sat: 'Semana (sábado a viernes / cortado por mes)',
		month_week_sun: 'Semana (domingo a sábado / cortado por mes)',
		month_week_mon: 'Semana (lunes a domingo / cortado por mes)',
		week_sat: 'Semana (sábado a viernes)',
		week_sun: 'Semana (domingo a sábado)',
		week_mon: 'Semana (lunes a domingo)',
		month: 'Mes',
		quarter: "Trimestre",
		semester: "Semestre",
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

	project: {
		authorization: "Permisiones",
		form_error_short: "Algunos campos del formulario no son validos.",
		form_persisted_short: "No ha realizado cambios.",
		form_changed_short: "Ha realizado cambios.",

		form_error: "Algunos campos del formulario no son validos, arreglelos para poder guardar.",
		form_persisted: "Sus datos estan guardados.",
		form_changed: "Ha realizado cambios. No olvide hacer click en Guardar.",

		show_more_inputs: "Ver la fechas anteriores",
		all_elements: "Todo",
		no_extra_indicators: "Ningún indicador adicional ha sido creado. ¡Haga click en \"Añadir un indicador\" para agregar uno!",
		no_data_source: "<span style=\"font-style: italic\">Cree una fuente de datos para poder hacer entradas</span>",
		general_info: "Información general",
		collected_by: "Información colectada por",
		reporting_empty: "Ningún indicador ha sido añadido en esta sección.",
		no_cross_cutting: "Este proyecto no requiere ningún indicador transversal. Ha rellenado las temáticas?",
		indicator_computation_missing: "Falta el cálculo",
		delete_input: "Esta seguro que desea suprimir esta entrada?",
		zero_theme_indicator: "Sin temática",
		multi_theme_indicator: "Varias temáticas",
		which_variable: "De que variable viene esta información?",
		which_partitions: "Qué desagregaciones son relevantes?",
		value_unknown: "Valor desconocido",

		computations: {
			unavailable: "No es posible calcular este indicador",
			fixed: "Usar un valor constante",
			copy: "Copiar un valor (desde una fuente de datos)",
			percentage: "Porcentaje (desde fuentes de datos)",
			permille: "Por mil (desde fuentes de datos)",
			formula: "Formula personalizada (desde fuentes de datos)"
		},

		formula: {
			copied_value: "Valor a copiar",
			denominator: "Denominador",
			numerator: "Numerador"
		},

		same_as_start: "Igual que el inicio del proyecto",
		same_as_end: "Igual que el final del proyecto",

		specific_start: "Fecha de inicio específica",
		specific_end: "Fecha de final específica",
		choose_sites_for_form: "Elija los lugares en los que esta fuente de datos se aplica",
		choose_sites_for_user: "Elija los lugares en los que este usuario puede entrar datos",

		partition_edit: "Edición desagregación",
		partition_help_name: "Este nombre aparecera en varias tablas de estadísticas. Identifica la desagregación que desea crear en su variable",
		partition_help_elements: 'Los elementos de la desagregación deben ser mutualmente exclusivos, y se debe poder calcular el valor total agregandolos.',
		partition_help_aggregation: 'Como calcular el valor total agregando los elementos describidos?',
		partition_help_groups: 'Los grupos permiten hacer agregaciones intermediarias',
		logical_frame: "Marco lógico",
		
		structure: "Estructura",
		no_data: "Datos no disponibles",
		not_available_by_entity: "Datos no disponibles por lugar de colecta",
		not_available_by_group: "Datos no disponibles por grupo",
		not_available_min_week_sat: "Estos datos estan disponibles por semana (sábado a viernes)",
		not_available_min_week_sun: "Estos datos estan disponibles por semana (domingo a sábado)",
		not_available_min_week_mon: "Estos datos estan disponibles por semana (lunes a domingo)",
		not_available_min_month: "Estos datos estan disponibles por mes",
		not_available_min_quarter: "Estos datos estan disponibles por trimestre",
		not_available_min_semester: "Estos datos estan disponibles por semestre",
		not_available_min_year: "Estos datos estan disponibles por año",

		saving_failed: "Monitool no consiguio salvar los cambios.",
		no_logical_frames: "Ningún marco lógico has sido creado en este proyecto.",
		partition_general: "General",
		partition_general_placeholder: "ej: Grupos de edad, sexo, motivo de consulta, patología, ...",
		partition_elements: "Elementos",
		aggregation_lab: "Como compilar los elements juntos?",
		partition_name: "Nombre",
		partition_name_placeholder: "ex: Menor de 12 años, hombre, consultación social, gripe, ...",
		no_partition_elements: "Pulse \"Añadir\" para añadir un elemento en la desagregación",

		partition_groups: "Groupos",
		partition_group_name: "Nombre",
		partition_group_name_placeholder: "ej: Menores de edad, patologias crónicas, ...",
		no_partition_groups: "Pulse \"Añadir\" para añadir un grupo en la desagregación",
		use_groups: "Usar grupos",

		no_inputs: "Ninguna entrada de datos en espera",
		no_variable: "Ninguna variable esta definida en esta fuente de datos. ¡Haga click en \"Añadir una variable\" para create una nueva!",
		no_partitions: "Ninguna desagregación esta definida en esta variable",

		dimensions: {
			day: "Días",
			month_week_sat: 'Semana (sábado a viernes / cortado por mes)',
			month_week_sun: 'Semana (domingo a sábado / cortado por mes)',
			month_week_mon: 'Semana (lunes a domingo / cortado por mes)',
			week_sat: "Semanas (sábado a viernes)",
			week_sun: "Semanas (domingo a sábado)",
			week_mon: "Semanas (lunes a domingo)",
			month: "Meses",
			quarter: "Trimestres",
			semester: "Semestres",
			year: "Años",
			entity: "Lugar de colecta",
			group: "Grupo de colecta"
		},
		group: {
			location: "Lugar",
			partition: "Desagregaciónes",
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
			input: "Entrada de datos",
			read: "Consulta unicamente"
		},
		user_fullname: "Nombre y apellido",
		user: "Usuario",
		username: "Nombre de usuario",
		password: "Contraseña",

		parameter: "Parametro",
		all_selected: "Sin filtro",
		create_logframe: "Añadir un marco lógico",
		reporting_compare_sites: "Comparar lugares",
		unnamed_logframe: "Marco lógico sin nombre",

		edit_indicator: "Editar usuario",
		display: "Nombre",
		display_ph: "ej: Tasa de consultaciones prenatales en las estructuras de salud",
		computation: "Cálculo",

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
			'done': "Editar",
			'expected': "Crear",
			'expected-new': "Crear (nueva fecha)",
			'outofschedule': "Consultar (fuera calendario)"
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

		partitions: "Desagregaciones",

		add_variable: "Añadir una variable",
		remove_variable: "Quitar esta variable",
		add_partition: "Añadir una desagregación",
		remove_partition: "Quitar esta desagregación",

		aggregation: {
			sum: "Suma",
			average: "Promedio",
			highest: "Número mayor",
			lowest: "Número menor",
			last: "Último valor",
			none: "No es posible compilar"
		},

		covered_period: "Periodo cubierto",

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

		variable: "Variable",

		no_purposes: "Ningun objetivo específico ha sido definido",

		form_name_ph: "ej: Datos SNIS, Ficha de colecta ante-natal, Ficha sanidad primaria, ...",

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
			month_week_sat: 'Cada semana (sábado a viernes / cortado por mes)',
			month_week_sun: 'Cada semana (domingo a sábado / cortado por mes)',
			month_week_mon: 'Cada semana (lunes a domingo / cortado por mes)',
			week_sat: 'Cada semana (sábado a viernes)',
			week_sun: 'Cada semana (domingo a sábado)',
			week_mon: 'Cada semana (lunes a domingo)',
			month: 'Cada mes',
			quarter: 'Cada trimestre',
			semester: 'Cada semestre',
			year: 'Cada año',
			free: 'Libre'
		},

		no_input_entities: '¡Ningún lugar de colecta ha sido creado!',
		no_input_groups: '¡Ningún grupo de colecta ha sido creado!',
		no_users: '¡Ningún usuario ha sido añadido!',
		no_forms: '¡Ningúna fuente de datos ha sido creada!',

		input: 'Entrar datos',

		baseline: 'Valor de base',
		target: 'Objectivo',

		goal: 'Objectivo global',
		intervention_logic: 'Logica de intervención',

		start_date: "Fecha de inicio",
		end_date: "Fecha de fin",
		country_ph: 'ej: República Centroafricana',
		name_ph: 'ej: Acceso a atención de calidad para las personas afectadas por la crisis',
		add_indicator: 'Añadir un indicador',

		purpose: 'Objectivo específico',
		purposes: 'Objectivos específicos',
		assumptions: 'Hipotesis',
		output: "Resultado",

		indicator_is_computed: "Valido",
		indicator_is_not_computed: "Invalido",

		intervention_logic_goal_ph: 'ej. Reducir la mortalidad y la morbididad de la población afectada por la crisis',
		intervention_logic_purpose_ph: 'ej. Mejorar el acceso a la salud para la población afectada por la crisis en los districtos de Bimbo y Begoua',
		output_desc_ph: 'ej. Mejorar la atención de salud primaria en los centros de salud de Bimbo y Begoua',
		assumptions_purpose_ph: '',
		output_assumptions_ph: '',
		logframe_ph_name: "ej. ECHO",

		logframe_help_name: "Nombre este marco lógico para poder identificarlo facilment. Por ejemplo con el nombre del donante relevante",
		logframe_help_goal: "Descripción de la contribución del proyecto a los objectivos (impacto) de una política o de un programa",
		logframe_help_goal_indicators: "Entre los indicadores que permiten medir el objectivo general",
		logframe_help_purpose_desc: "Describa las ventajas tangibles que se proporcionan a los beneficiarios",
		logframe_help_purpose_assumptions: "Factores externos susceptibles de comprometer el alcanze del objectivo específico",
		logframe_help_purpose_indicators: "Entre los indicadores que permiten medir el objectivo específico",
		logframe_help_output_desc: "Producto o servicio tangible proporcionado por el proyecto",
		logframe_help_output_assumptions: "Factores externos susceptibles de comprometer el alcanze del resultado",
		logframe_help_output_indicators: "Entre los indicadores que permiten medir el resultado",

		add_output: 'Añadir un resultado',
		add_purpose: 'Añadir un objetivo específico',

		users: "Usuarios",
		owners: "Proprietarios",

		basics_info: "<p>Los datos básicos permiten clasificar su proyecto entre los demas de la ONG.</p>",
		basics_help_country: "En que país tiene lugar su proyecto? Si es un proyecto regional, entre el nombre de la región.",
		basics_help_name: "El nombre del proyecto le permite encontrarlo en Monitool. Elija algo que sea suficientemente informativo, o copie el objectivo general.",
		basics_help_thematics: "Las temáticas que elija van a determinar la lista de indicadores transversales que se deberan collectar.",
		basics_help_begin: "La fecha de inicio es el momento en el que su proyecto empieza a colectar datos (usualemente, con la primeras actividades)",
		basics_help_end: "La fecha de fin es el momento en el que termina la colecta de datos. Si no es conocida, entre una fecha en el futuro.",

		collection_site_info:
			"<p>Cuando un proyecto tiene las mismas actividades en varios lugares, se deben seguir por lugar, grupos de lugares y a nivel de proyecto.</p>" + 
			"<p>Entre aqui:</p>" + 
			"<ul>" + 
				"<li>La lista de lugares donde su proyecto trabaja (ej: la lista de centros de salud)</li>" + 
				"<li>los grupos que se usuran durante la vida del proyecto (ej: por región, o tipo de estructura)</li>" + 
			"</ul>",

		users_list_info:
			"<p>Muchas personas diferentes participan en crear y seguir un proyecto: coordination, equipo M&E, operadores de entrada de datos, partnerarios, ...</p>" + 
			"<p>Entre aqui la lista de todos los usuarios que deben tener acceso a los datos del programa.</p>",

		user_help_type: "Elija \"Cuenta MDM\" si el usuario tiene una dirección email xxx@medecinsdumonde.net. Elija \"Cuenta partnerio\" sino.",
		user_help_user: "Quien es el usuario MDM que desea añadir? Si el usuario no esta en la lista, pidale que se conecte al menos una vez a Monitool.",
		user_help_username: "El usuario usara este nombre para conectarse. No se autorizan direcciones de correo electronico (por ej. use \"apellido.nombre\", o \"puesto.país\")",
		user_help_fullname: "Entre aqui el nombre completo de la persona que va a usar la cuenta.",
		user_help_password: "La contraseña debe ser al menos 6 letras. No use el mismo valor que el nombre de usuario",
		user_help_role: "Este campo determina que podra hacer este usuario: los proprietarios pueden cambiar la estructura de los proyectos, los operadores de entrada solo entrar datos.",
		user_help_sites: "Para que lugares podra este usuario entrar datos?",
		user_help_datasources: "Para que fuentes de datos podra este usuario entrar datos?",

		collection_form_list_info:
			"<p>Las fuentes de datos son los diferentes soportes donde se encuentran los datos necesarios para seguir el proyecto (fichas de colecta, historiales clínicos, ficheros excel, ...).</p>" + 
			"<p>En Monitool, no hace falta entrar todos los datos disponibles en las fuentes de datos: solo lo que es relevante</p>" + 
			"<p>Para que sea mas facil entrar los datos, la fuentes deben corresponder a herramientas reales usadas en el terreno.</p>",

		collection_edit_help_name: "Cual es el nombre de la fuente de datos de la que quiere extraer datos? ej. \"Historiales clínicos electronicos\", \"Fichas de colecta\", \"Informe SNIS\", ...",
		collection_edit_help_sites: "Entre los lugares identificados en \"Lugares de colecta\", cuales son los que colectan esta fuente de datos?",
		collection_edit_help_periodicity: "Cada cuanto son disponibles estos datos? Tenga ciudado, no entre aqui la frecuencia a la que hace sus informes.",
		collection_edit_help_start: "Si esta fuente de datos fue creada despues del inicio del proyecto, especifique la fecha, sino deje el valor por defecto",
		collection_edit_help_end: "Si esta fuente de datos terminara antes del fin del proyecto, o se ha reemplazado, entre la fecha aqui",

		collection_edit_help_varname: "Nombre la variable que quiere extraer de <code>{{name}}</code>. ej: \"Número de diagnosticos\".",
		collection_edit_help_geoagg: "En un proyecto que trabaja en dos lugares, si <code>{{name}}</code> vale 10 en el primero, y 20 en el segundo, cual es el valor para el proyecto entero?",
		collection_edit_help_timeagg: "En un proyecto que colecta datos mensuales, si <code>{{name}}</code> vale 10 en enero, 20 en febrero y 30 en marzo, que vale para el trimer trimestre?",
		collection_edit_help_partition: "Quiere poder diferenciar <code>{{name}}</code> por edad, sexo, tipo de consulta, motivo de consulta, patología, hora del dia, ...?",
		collection_edit_help_distribution: "Si va a imprimir formulario en A4, prefiera tener columnas a la izquierda para que las tablas sean menor anchas.",
		collection_edit_help_order: "En que ordén quiere que aparescan la desagregaciones en las tablas de entrada de datos?",

		logical_frame_list_info:
			"<p>Un marco lógico es un documento que describe los objectivos, resultados y actividades de un proyecto, asi como indicadores para seguir el progreso de cada uno de ellos</p>" + 
			"<p>Todos los indicadores deben ser calculables a partir de los datos describidos en las fuentes de datos</p>",

		cross_cutting_list_info:
			"<p>Los indicadores transversales se deciden según la lista de temáticas en \"Datos basicos\".</p>" + 
			"<p>Esta lista contiene todos los indicadores transversales que su proyecto debe colectar</p>",

		input_list_info:
			"<p>Este calendario de entrada hace la lista de todas las entradas de datos programadas para la fuente de datos \"{{name}}\"</p>" +
			"<p>Para limitar los errores de entrada, es preferible entrar los datos cerca de donde se colectaron, directamente en Monitool.</p>" + 
			"<p>Si no es posible, una versión PDF del formulario esta provista.</p>",

		extra_indicators_list_info: 
			"<p>Los indicadores adicionales son indicadores que no estan en ningún marco lógico.</p>" +
			"<p>Permiten seguir elementos especificos del proyecto (datos medicales, logisticos, ...)</p>",

		download_portrait: "Descargar PDF (vertical)",
		download_landscape: "Descargar PDF (horizontal)",
		download_pdf: "Descargar PDF",

		press_to_drag: "Pulse para arrastrar y soltar",
		titles: "Título",
		data: "Datos",
		general_informations: "Informaciones generales",
		fill_with_last_input: "Rellenar con los datos de la última entrada",
		
		variable_name_label: "Qué esta midiendo?",
		variable_name_ph: "ej: Número de diagnosticos",
		site_agg_label: "Como compilar entradas provenientes de diferentes lugares?",
		time_agg_label: "Como compilar entradas provenientes de diferentes periodos?",
		partitions_label: "Que desagregaciones quiere usar en esta variable?",
		distribution_label: "Como mostrar la desagregaciones en el formulario de colecta?",
		order_label: "En que ordén mostrar las desagregaciones en el formulario de colecta?",
		no_indicator: "Ningún indicador esta definido. Haga click en \"Añadir un indicador\"",
		delete_form: "Suprimir la fuente de datos",
		delete_logical_frame: "Suprimir el marco lógico",
		delete_purpose: "Suprimir el objectivo especifico",
		delete_result: "Suprimir el resultado",

		no_element_selected: "Ningún elemento esta seleccionado",

		indicator_ph_fixed: "Entre el valor constante del indicador (ej: \"12\")",
		indicator_help_display: "Nombre su indicador. Es preferible obtener el nombre a partir de un catalogo para ser consistente con otros proyectos.",
		indicator_help_baseline: "Cual era el valor del indicador antes de empezar la actividades? Marque la casilla para especificar un valor.",
		indicator_help_target: "Cual es el objectivo para este indicador? Marque la casilla para especificar un valor.",
		indicator_help_colorize: "Desea tener colores (rojo, naranja, verde) en estadísticas para este indicador?",
		indicator_help_computation: "Como se calcula este indicador a partir de las variables que ha colectado en fuentes de datos?"
	},

	form: {
		mandatory: "Este campo es obligatorio",
		start_lower_than_end: 'La fecha de inicio tiene que ser inferior a la de fin',
		end_greater_than_start: 'la fecha de fin tiene que ser superior a la de inicio',
	
		help: {
			show: "Mostrar ayuda para este campo",
			hide: "Esconder ayuda para este campo"
		}
	},
	theme: {
		new_theme: "Nueva temática",
		create_new: "Create una temática"
	},
	user: {
		email: "Correo electrónico",
		fullname: "Nombre completo",
		role: "Tipo",
		save: "Guardar usuario",
		
		list_info: 
			"<p>Esta página contiene la lista de todos los usuarios que se han conectado por lo menos una vez a Monitool</p>" + 
			"<p>No es necesario crear cuentas para usuario con una dirección de correo xxx@medecinsdumonde.net: apareceran automáticamente una vez se hayan conectado una vez. Para socios, es posible crear cuentas desde la páginas dedicadas a cada proyecto.</p>",

		edit_info:
			"<p>Puede editar aqui la permisiones de los demas usuarios. Haga click en \"Mostrar ayuda para este campo\" para mas detalles sobre los diferentes tipos de permision que son disponibles.</p>",

		roles_short: {
			admin: "Administrador",
			project: "Creador proyectos",
			common: "Normal",
		},

		permissions: {
			thematics: "Crear y editar temáticas",
			cross_cutting: "Crear y editar indicadores transversales",
			user_roles: "Editar las permisiones de los demás usuarios",
			own_all_projects: "Editar los datos y estructura de todos los proyectos",
			create_projects: "Crear proyectos",
			edit_projects: "Editar los datos y la estructura de proyecto donde se ha autorizado explicitamente",
			see_reporting: "Ver la estadísticas de todos los proyectos"
		}
	},

	theme: {
		list_info: 
			"<p>Esta página contiene la lista de las temáticas tratadas por la ONG.</p>" +
			"<p>Los proyectos y los indicadores transversales se pueden conectar a temáticas.</p>",

		edit_info:
			"",

		themes: "Temáticas",
		edit_title: "Édition thématique",
		save: "Guardar la temática",

		new_theme: "Nueva temática",
		create_new: "Crear una nueva temática",

		name_placeholder_fr: "i.e. Santé Sexuelle et Reproductive",
		name_placeholder_es: "i.e. Salud Sexual y reproductiva",
		name_placeholder_en: "i.e. Sexual and Reproductive Health",

		info: 
			"<p>Entre aqui el nombre de la temática en todos los idiomas usados por su organización.</p>" +
			"<p>Si no puede traducir a todos los idiomas:</p>" +
			"<ol>" +
				"<li>Entre manualmente todos los idiomas que pueda</li>" +
				"<li>Pulse el botón a la izquierda para traducir automáticamente los demás</li>" +
			"</ol>"
	},

	indicator: {
		not_collected: "Ningún proyecto colecta este indicador",
		extra: "Indicadores adicionales",
		new_indicator: "Nuevo indicador",
		create_new: 'Crear un nuevo indicador',
		
		cross_cutting: "Indicadores transversales",
		select_themes: 'Selectione una o varias temáticas',

		edit_title: "Edición indicador",
		themes_label: "Temáticas",

		name_placeholder_fr: "Volume de formation",
		name_placeholder_en: "Training volume",
		name_placeholder_es: "Volumen de formación",

		description_placeholder_fr: "On ne parle pas d'éducation pour la santé, mais de formation à du personnel soignant. On compte le nombre de participations et non pas le nombre de personnes différentes ayant participé à ces formations.",
		description_placeholder_en: "We are not talking about health education, but training of medical staff. Count the number of entries and not the number of different people who attended these trainings.",
		description_placeholder_es: "No se trata de educación para la salud, sino de formación para el personal sanitario. Se cuenta el número de participaciones y no el número de personas distintas que hayan participado.",

		list_info: 
			"<p>Esta página contiene la lista de todos los indicadores transversales de la ONG.<br/>Colectar estos indicadores es obligatorio para todos los proyectos que tengan por los menos una temática en común con ese.</p>" + 
			"<p>Para ayudar los proyectos a planificar su colecta de datos, evite cambiar esta lista a menudo.</p>",

		edit_info: 
			"<p>Esta página permite cambiar la definicion de un indicador transversal. Si have cambios, tenga cuidado en poner todos los idiomas a día.</p>" + 
			"<p>Si no puede traducir a todos los idiomas:</p>" +
			"<ol>" +
				"<li>Entre manualmente todos los idiomas que pueda</li>" +
				"<li>Pulse el botón a la izquierda para traducir automáticamente los demás</li>" +
			"</ol>",

		save: "Guardar indicador"
	}
};

