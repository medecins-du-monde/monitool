const Router = require('koa-router');
const Excel = require('exceljs');
const fs = require('fs');

import Project from '../resource/model/project';
import { queryReportingSubprocess } from './reporting';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';
import Indicator from '../resource/model/indicator';
import User from '../resource/model/user';

const router = new Router();
let lang = 'es';


let blueFill = [
  {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {argb:'2E86C1'}
  },
  {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {argb:'3498DB'}
  },
  {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {argb:'5DADE2'}
  },
  {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {argb:'85C1E9'}
  },
]

let sectionHeader = {
  // gray background
  fill: {
    type: 'pattern',
    pattern:'solid',
    fgColor:{argb:'999999'}
  },
  // white, bold and bigger font
  font: {
    name: 'Calibri',
    size: 12,
    bold: true,
    color: {argb:'ffffff'},
  }
}
let numberCellStyle = {
  numFmt: '### ### ### ##0.#'
}

let percentageCellStyle = {
  numFmt: '0.#%'
}
let partitionsCollapsed = {
  font: {
    name: 'Calibri',
    size: 10,
    bold: false,
    color: {argb:'666666'},
  }
}

let errorRow = {
  fill: {
    type: 'pattern',
    pattern:'solid',
    fgColor:{argb:'bbbbbb'}
  }
}
  
const errorTranslations = {
  'missing-calc': {
    'en': "No calculation for this indicator",
    'es': "No hay cálculo para este indicador",
    'fr': "Aucun calcul pour cet indicateur"
  },
  'no-indicator': {
    'en': "This indicator isn't part of the Project",
    'es': "Este indicador no es parte del proyecto",
    'fr': "Cet indicateur ne fait pas partie du projet"
  },
  'outside-range': {
    'en': "Date range is outside project dates",
    'es': "El rango de fechas esta fuera de las fechas del proyecto",
    'fr': "La plage de dates est en dehors des dates du projet"
  },
  "missing-data": {
    'en': "No data for this indicator",
    'es': "No hay datos para este indicador",
    'fr': "Aucune donnée pour cet indicateur"
  },
  "not-available-by-semester": {
    'en': "Data is not available by semester",
    'es': "Los datos no estan disponibles por semestre",
    'fr': "Les données ne sont pas disponibles par semestre"
  },
  "division-by-zero": {
    'en': "Division by Zero",
    'es': "División por cero",
    'fr': "Division par Zero"
  }
}

let dateColumn = [];

// Call the database and get the computed values
// Add the name of the indicator to the result of the computation
async function indicatorToRow(ctx, projectId, computation, name, baseline=null, target=null, filter){
  const query = {
		projectId: projectId,
		computation: computation,
		filter: filter ? filter : {},
		dimensionIds: [ctx.params.periodicity],
		withTotals: true,
		withGroups: false
	};

  let result = {};

  if(computation === null){
    result[dateColumn[0]] = "Calculation is missing";
    result.fill = errorRow.fill;
  }

  else if (JSON.stringify(computation.parameters) === JSON.stringify({})) {
    for (let timeColumn of dateColumn){
      result[timeColumn] = +computation.formula;
    }
  }

  else {
    const isPercentage = computation.formula.indexOf('100') !== -1;
    // this function can throw an error in case the periodicity asked is not compatible with the data
    try{
      result = JSON.parse(await queryReportingSubprocess(query)).items;
    }
    // Here are the various reported on the excel export
    catch (err){
      // if this is the case, instead of the results we add an a custom error message
      if (err.message == "invalid dimensionId") {
        result[dateColumn[0]] = "This data is not available by " + ctx.params.periodicity;
        result.fill = errorRow.fill;
      } else {
      // if it's some other error, we send this error in the excel
        result[dateColumn[0]] = err.message;
        result.fill = errorRow.fill;
      }
    } finally{
      if (isPercentage){
        baseline /= 100;
        target /= 100;
      }
    }
  }
  result.name = name;
  result.baseline = baseline;
  result.target = target;
  return result;
}

async function indicatorToCCRows(project, indicators, timeslot) {

  let indicatorResults = {
    error: {}
  };
  // Creates a list of all possible dates for a project
  const projectDates = Array.from(
    timeSlotRange(
      TimeSlot.fromDate(
        new Date(project.start + "T00:00:00Z"),
        'semester'
      ),
      TimeSlot.fromDate(
        new Date(project.end + "T00:00:00Z"),
        'semester'
      )
    )
  ).map((ts) => ts.value).filter(ts => timeslot.includes(ts));

  for (let date of projectDates) {
    indicatorResults[date] = {};
  }

  for (const indicator of indicators) {
    // Sets error and skips to next loop if indicator not in the project or no computation
    if (!project.crossCutting[indicator._id] || !project.crossCutting[indicator._id].computation) {
      indicatorResults.error[indicator._id] =
        indicator.themes.some(theme => project.themes.find(t => t === theme)) ? 'missing-calc' : 'no-indicator';
      continue;
    }
  
    // Takes care of static value formulas
    if (JSON.stringify(project.crossCutting[indicator._id].computation.parameters) === JSON.stringify({})) {
      if (!projectDates.some(date => timeslot.includes(date))) {
        indicatorResults.error[indicator._id] = 'outside-range';
      }
      for (let date of projectDates) {
        if (timeslot.includes(date)) {
          indicatorResults[date][indicator._id] = +project.crossCutting[indicator._id].computation.formula;
        }
      }
    // Does a query to get all values
    } else {
      const query = {
        projectId: project.id,
        computation: project.crossCutting[indicator._id].computation,
        filter: project.filter ? project.filter : {},
        dimensionIds: ['semester'],
        withTotals: false,
        withGroups: false
      };
      let queryResult = {};
      // this function can throw an error in case the periodicity asked is not compatible with the data
      try{
        queryResult = JSON.parse(await queryReportingSubprocess(query)).items;
      }
      // Here are the various reported on the excel export
      catch (err){
        // if this is the case, instead of the results we add an a custom error message
        if (err.message == "invalid dimensionId") {
          indicatorResults.error[indicator._id] = 'not-available-by-semester';
        } else {
        // if it's some other error, we send this error in the excel
          indicatorResults.error[indicator._id] = err.message;
        }
      } finally{
        if (!Object.keys(queryResult).some(date => timeslot.includes(date) && projectDates.includes(date))) {
          indicatorResults.error[indicator._id] = 'outside-range';
        }
        for(let date of Object.keys(queryResult)) {
          if (timeslot.includes(date) && projectDates.includes(date)) {
            if (isNaN(queryResult[date])) {
              indicatorResults[date][indicator._id] = queryResult[date];
            } else {
              indicatorResults[date][indicator._id] = Number(queryResult[date]);
            }
          }
        }
      }
    }
  }
  const resultRows = [];
  if (projectDates.some(date => JSON.stringify(indicatorResults[date]) !== JSON.stringify({}))) {
    for (const date of projectDates) {
      if (JSON.stringify(indicatorResults[date]) === JSON.stringify({})) {
        continue;
      }
      let result = {
        name: project.display,
        date: date,
      }
      for (const indicator of indicators) {
        result[indicator._id] =
          indicatorResults.error[indicator._id] ||
          indicatorResults[date][indicator._id] !== undefined ?
            indicatorResults[date][indicator._id] :
            'outside-range';
      }
      resultRows.push(result);
    } 
  } else {
    let result = {
      name: project.display,
      date: '',
    }
    for (const indicator of indicators) {
      result[indicator._id] = indicatorResults.error[indicator._id];
    }
    resultRows.push(result);
  }
  return resultRows;
}

// TODO: Optimize this method.
function generateAllCombinations(partitionIndex, computation, name, formElement, list){
  if (partitionIndex === formElement.partitions.length){
    list.push({computation: JSON.parse(JSON.stringify(computation)), display: name, outlineLevel: 1, hidden: true, font: partitionsCollapsed.font, numFmt: getNumberFormat(computation)});
  }
  else{
    for(let partitionOption of formElement.partitions[partitionIndex].elements){
      computation.parameters.a.filter[formElement.partitions[partitionIndex].id] = [partitionOption.id]
      generateAllCombinations(partitionIndex + 1, computation, name + ((name !== "    ") ? " / ":"") + partitionOption.name, formElement, list);
      delete computation.parameters.a.filter[formElement.partitions[partitionIndex].id];
    }
  }
}
// TODO: Optimize this method.
function buildAllPartitionsPossibilities(formElement){
  let computation = {
    formula: 'a',
    parameters: {
      a: {
        elementId: formElement.id,
        filter: {}
      }
    }
  }
  let list = [];
  generateAllCombinations(0, computation, "    ", formElement, list);
  return list
}

function buildPartitionsForCalculations(simplerComputation, project, element){
  const newLines = [];

  for (const [parameter, value] of Object.entries(simplerComputation.parameters)){
    for (const [partitionId, valuePartitions] of Object.entries(value.filter)){
      const partition = element.partitions.find(p => p.id === partitionId);
      for (const partitionElementId of valuePartitions){
        if (typeof partition !== "undefined") {
          const partitionElement = partition.elements.find(p => p.id === partitionElementId)
          if (typeof partitionElement !== "undefined") {
            let newComputation = JSON.parse(JSON.stringify(simplerComputation))
            newComputation.parameters[parameter].filter[partitionId] = [partitionElement.id]
            const newLine = {
              computation: newComputation, display: "    " + "    " + partitionElement.name, outlineLevel: 1, hidden: true, font: partitionsCollapsed.font, numFmt: getNumberFormat(simplerComputation)
            }
            newLines.push(newLine);
          }
        }
      }
    }
  }

  return newLines;
}

function buildFormulas(indicator, project){
  let newLines = [];
  if (indicator.computation){
    newLines.push({name: '    Formula: ' + indicator.computation.formula, outlineLevel: 1, hidden: true, font: partitionsCollapsed.font});

    for (const [parameter, value] of Object.entries(indicator.computation.parameters)){
      const simplerComputation = {
        formula: parameter,
        parameters: {}
      }
      simplerComputation.parameters[parameter] = {
        elementId: value.elementId,
        filter: value.filter
      }

      let element = null;
      for (const f of project.forms){
        let aux = f.elements.find(e => e.id === value.elementId);
        if (aux){
          element = aux;
          break;
        }
      }

      if (element) {
        newLines.push({computation: JSON.parse(JSON.stringify(simplerComputation)), display: "    "+parameter+" ("+element.name+")", outlineLevel: 1, hidden: true, font: partitionsCollapsed.font, numFmt: getNumberFormat(simplerComputation)});
        newLines = newLines.concat(buildPartitionsForCalculations(simplerComputation, project, element))
      }
    }
  }
  return newLines;
}

function buildWorksheet(workbook, name) {
  // Cleaning the name replacing all special characters by a space
  name = name.replace(/[^a-zA-Z0-9]/g,' ');

  let newWorksheet = workbook.addWorksheet(name);

  // TODO: translate baseline

  const baselineTranslation = {
    'en': 'Baseline',
    'es': 'Valor de base',
    'fr': 'Valeur initiale'
  }
  const targetTranslation = {
    'en': 'Target',
    'es': 'Objetivo',
    'fr': 'Valeur cible',
  }

  newWorksheet.columns = [{header: '', key: 'name'}, {header: baselineTranslation[lang], key: 'baseline'}, {header: targetTranslation[lang], key: 'target'}].concat(dateColumn.map(name => {
    return {
      header: name,
      key: name
    }
  })).concat([{header: 'Total', key: '_total'}]);

  // force the columns to be at least as long as their header row.
  newWorksheet.columns.forEach(column => {
    column.width = column.header.length < 12 ? 12 : column.header.length
  })
  return newWorksheet;
}

function buildCCWorksheet(workbook, name, lang, indicators) {
  // Cleaning the name replacing all special characters by a space
  name = name.replace(/[^a-zA-Z0-9]/g,' ');

  let newWorksheet = workbook.addWorksheet(name);

  // TODO: translate baseline

  const nameTranslation = {
    'en': 'Name of the project',
    'es': 'Nombre del proyecto',
    'fr': 'Nom du projet'
  }
  const dateTranslation = {
    'en': 'Year-semester',
    'es': 'Año-semestre',
    'fr': 'Annee-semestre'
  }

  newWorksheet.columns = [
    {header: nameTranslation[lang], key: 'name', width: 60},
    {header: dateTranslation[lang], key: 'date', width: 20}
  ].concat(indicators.map(indicator => {
    return {
      header: [indicator.name[lang]],
      key: indicator._id,
      width: 40
    }
  }));

  newWorksheet.getColumn(1).alignment = {wrapText: true};
  // force the columns to be at least as long as their header row.
  newWorksheet.columns.forEach(column => {
    // column.width = column.header.length < 12 ? 12 : column.header.length;
    column.eachCell(function(cell, rowNumber) {
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.font = {
        name: 'Calibri',
        size: 12,
        bold: true,
        color: { argb: 'ffffff' }
      };
      cell.fill = {
        type: 'pattern',
        pattern:'solid',
        fgColor:{argb:'005ec5'}
      };
    })
  })
  return newWorksheet;
}

function getNumberFormat(computation){
  if (computation !== null && computation.formula.indexOf('100') !== -1){
    return percentageCellStyle.numFmt;
  }
  return numberCellStyle.numFmt;
}

/**
 * Gets the item type from the id.
 * 
 * @param {String} id Id of a Project or an Indicator.
 * @returns {String} String indicating id type.
 */
function getIdType(id) {
  return id.split(':')[0];
}

async function generateProjectDownload(filename, project, ctx) {

  // iterate over all the logical frame layers and puts all indicators in the same list
  // an indicator is being represented by its name and computation
  let logicalFrameCompleteIndicators = [];
  const LogicalFrameName = {
    en: "Logical Framework: ",
    es: "Marco Lógico: ",
    fr: "Cadre Logique: ",
  };
  for (let logicalFrame of project.logicalFrames) {
    // this creates a row to act as a header for the section
    // this row has a different style and font size
    logicalFrameCompleteIndicators.push({
      name: LogicalFrameName[ctx.params.lang] + logicalFrame.name,
      fill: sectionHeader.fill,
      font: sectionHeader.font,
    });

    // TODO: add translations for the titles
    logicalFrameCompleteIndicators.push({
      name: "General objective: " + logicalFrame.goal,
      fill: blueFill[0],
    });

    // TODO: To be simplified with a recursive function
    for (let indicator of logicalFrame.indicators) {
      logicalFrameCompleteIndicators.push({
        computation: indicator.computation,
        display: indicator.display,
        filter: {
          _start: logicalFrame.start,
          _end: logicalFrame.end,
          entity: logicalFrame.entities,
        },
        baseline: indicator.baseline,
        target: indicator.target,
        numFmt: getNumberFormat(indicator.computation),
      });
      logicalFrameCompleteIndicators = logicalFrameCompleteIndicators.concat(
        buildFormulas({ computation: indicator.computation }, project)
      );
    }
    for (let purpose of logicalFrame.purposes) {
      logicalFrameCompleteIndicators.push({
        name: "Specific objective: " + purpose.description,
        fill: blueFill[1],
      });

      for (let indicator of purpose.indicators) {
        logicalFrameCompleteIndicators.push({
          computation: indicator.computation,
          display: indicator.display,
          filter: {
            _start: logicalFrame.start,
            _end: logicalFrame.end,
            entity: logicalFrame.entities,
          },
          baseline: indicator.baseline,
          target: indicator.target,
          numFmt: getNumberFormat(indicator.computation),
        });
        logicalFrameCompleteIndicators = logicalFrameCompleteIndicators.concat(
          buildFormulas({ computation: indicator.computation }, project)
        );
      }
      for (let output of purpose.outputs) {
        logicalFrameCompleteIndicators.push({
          name: "Result: " + output.description,
          fill: blueFill[2],
        });
        for (let indicator of output.indicators) {
          logicalFrameCompleteIndicators.push({
            computation: indicator.computation,
            display: indicator.display,
            filter: {
              _start: logicalFrame.start,
              _end: logicalFrame.end,
              entity: logicalFrame.entities,
            },
            baseline: indicator.baseline,
            target: indicator.target,
            numFmt: getNumberFormat(indicator.computation),
          });
          logicalFrameCompleteIndicators =
            logicalFrameCompleteIndicators.concat(
              buildFormulas({ computation: indicator.computation }, project)
            );
        }
        for (let activity of output.activities) {
          logicalFrameCompleteIndicators.push({
            name: "Activity: " + activity.description,
            fill: blueFill[3],
          });
          for (let indicator of activity.indicators) {
            logicalFrameCompleteIndicators.push({
              computation: indicator.computation,
              display: indicator.display,
              filter: {
                _start: logicalFrame.start,
                _end: logicalFrame.end,
                entity: logicalFrame.entities,
              },
              baseline: indicator.baseline,
              target: indicator.target,
              numFmt: getNumberFormat(indicator.computation),
            });
            logicalFrameCompleteIndicators =
              logicalFrameCompleteIndicators.concat(
                buildFormulas({ computation: indicator.computation }, project)
              );
          }
        }
      }
    }
  }

  // match the cross cutting id saved inside the project with the id of the global indicators in the database
  // and add them to the list too
  let crossCuttingCompleteIndicators = [];
  const CrosscuttingName = {
    en: "Crosscutting indicators",
    es: "Indicadores transversales",
    fr: "Indicateurs transversaux",
  };
  crossCuttingCompleteIndicators.push({
    name: CrosscuttingName[ctx.params.lang],
    fill: sectionHeader.fill,
    font: sectionHeader.font,
  });

  let listIndicators = await Indicator.storeInstance.list();

  // build a set with all the themes in the project
  const projectThemes = new Set(project.themes);

  for (const indicator of listIndicators) {
    // checks if the indicator has at least one theme in common with the project
    if (indicator.themes.some((themeId) => projectThemes.has(themeId))) {
      // if so we add it to the report
      let currentComputation = null;
      if (project.crossCutting[indicator._id]) {
        currentComputation = project.crossCutting[indicator._id].computation;
      }
      crossCuttingCompleteIndicators.push({
        computation: currentComputation,
        display: indicator.name[ctx.params.lang],
        baseline: indicator.baseline,
        target: indicator.target,
        numFmt: getNumberFormat(currentComputation),
      });
      crossCuttingCompleteIndicators = crossCuttingCompleteIndicators.concat(
        buildFormulas({ computation: currentComputation }, project)
      );
    }
  }

  // iterate over the extra indicators and adds them to the list in the same format
  let extraCompleteIndicators = [];
  const ExtraIndicatorsName = {
    en: "Extra indicators",
    es: "Indicadores adicionales",
    fr: "Indicateurs annexés",
  };
  extraCompleteIndicators.push({
    name: ExtraIndicatorsName[ctx.params.lang],
    fill: sectionHeader.fill,
    font: sectionHeader.font,
  });
  for (let indicator of project.extraIndicators) {
    extraCompleteIndicators.push({
      computation: indicator.computation,
      display: indicator.display,
      baseline: indicator.baseline,
      target: indicator.target,
      numFmt: getNumberFormat(indicator.computation),
    });
    extraCompleteIndicators = extraCompleteIndicators.concat(
      buildFormulas(indicator, project)
    );
  }

  // data sources don't have a computation field, but their computation use always the same formula,
  // so we can create a computation and represent them as an indicator
  let dataSourcesCompleteIndicators = [];
  const DataSourceName = {
    en: "Data source: ",
    es: "Datos de base: ",
    fr: "Données de base: ",
  };
  for (let form of project.forms) {
    dataSourcesCompleteIndicators.push({
      name: DataSourceName[ctx.params.lang] + form.name,
      fill: sectionHeader.fill,
      font: sectionHeader.font,
    });
    for (let element of form.elements) {
      let computation = {
        formula: "a",
        parameters: {
          a: {
            elementId: element.id,
            filter: {},
          },
        },
      };
      dataSourcesCompleteIndicators.push({
        computation: computation,
        display: element.name,
        numFmt: getNumberFormat(computation),
      });

      if (element.partitions.length > 0) {
        dataSourcesCompleteIndicators = dataSourcesCompleteIndicators.concat(
          buildAllPartitionsPossibilities(element)
        );
      }
    }
  }

  // creates a list for the names of the columns based on the periodicity received as a parameter
  dateColumn = Array.from(
    timeSlotRange(
      TimeSlot.fromDate(
        new Date(project.start + "T00:00:00Z"),
        ctx.params.periodicity
      ),
      TimeSlot.fromDate(
        new Date(project.end + "T00:00:00Z"),
        ctx.params.periodicity
      )
    )
  ).map((ts) => ts.value);

  // create the excel file
  const writeStream = fs.createWriteStream(`${filename}.temp`, { flags: 'w' });
  const options = {
    stream: writeStream,
    useStyles: true,
    useSharedStrings: true
  };

  let workbook = new Excel.stream.xlsx.WorkbookWriter(options);

  let worksheet = buildWorksheet(workbook, "Global");

  // combine all the lists into one
  let allCompleteIndicators = [].concat(
    logicalFrameCompleteIndicators,
    crossCuttingCompleteIndicators,
    extraCompleteIndicators,
    dataSourcesCompleteIndicators
  );

  sectionHeader.fill.fgColor.argb = "999999";

  let bool = 0;

  // Adding the data
  for (let indicator of allCompleteIndicators) {
    // Note: in Excel the rows are 1 based, meaning the first row is 1 instead of 0.
    // row 1 is the header.
    // const rowIndex = index + 2;

    // By using destructuring we can easily dump all of the data into the row without doing much
    // We can add formulas pretty easily by providing the formula property.
    let row;

    // if it has a computation (meaning that is an indicator) we get the values and put dump in the sheet
    if (indicator.computation !== undefined) {
      // get values
      // when no filter is provided it means we want data from all sites
      let res = await indicatorToRow(
        ctx,
        ctx.params.id,
        indicator.computation,
        indicator.display,
        indicator.baseline,
        indicator.target,
        indicator.filter
      );
      // Dump all the data into Excel
      row = worksheet.addRow(res);

      // Format the numbers with no decimal places
      if (indicator.numFmt !== undefined) {
        row.numFmt = indicator.numFmt;
      }
      // Make it collapsed. 1 is one level. 2 is 2 level.....
      if (indicator.outlineLevel !== undefined) {
        row.outlineLevel = indicator.outlineLevel;
      }
      // This hide the first level when we want to collapse.
      if (indicator.hidden !== undefined) {
        row.hidden = indicator.hidden;
      }
      // All the font configuration
      if (indicator.font !== undefined) {
        row.font = indicator.font;
      }
      // Background color
      if (indicator.fill !== undefined) {
        row.fill =
          indicator.fill === undefined
            ? undefined
            : JSON.parse(JSON.stringify(indicator.fill));
      }
      if (res.fill !== undefined) {
        row.fill =
          res.fill === undefined
            ? undefined
            : JSON.parse(JSON.stringify(res.fill));
      }
    }
    // if the row is a section header
    else {
      // Dump all the data into Excel
      row = worksheet.addRow(indicator);

      // Make it collapsed. 1 is one level. 2 is 2 level.....
      if (indicator.outlineLevel !== undefined) {
        row.outlineLevel = indicator.outlineLevel;
      }
      // This hide the first level when we want to collapse.
      if (indicator.hidden !== undefined) {
        row.hidden = indicator.hidden;
      }
      // apply the styles
      row.fill =
        indicator.fill === undefined
          ? undefined
          : JSON.parse(JSON.stringify(indicator.fill));
      row.font = indicator.font;
    }
    row.commit();
  }

  worksheet.columns[0].width = 45;
  worksheet.commit();

  const COLORS = [
    "1f77b4",
    "ff7f0e",
    "2ca02c",
    "d62728",
    "9467bd",
    "8c564b",
    "e377c2",
    "7f7f7f",
    "bcbd22",
    "17becf",
  ];
  let colorIdx = 0;

  if (!ctx.params.minimized) {
    // iterates over the sites
    for (let site of project.entities) {
      // creating a tab for each site

      // Cleaning the name replacing all special characters by a space
      site.name = site.name.replace(/[^a-zA-Z0-9]/g, " ");

      let newWorksheet = buildWorksheet(workbook, site.name);

      // create a custom filter to get only the data relate to that specific site
      let customFilter = { entity: [site.id] };

      sectionHeader.fill.fgColor.argb = COLORS[colorIdx];
      colorIdx = (colorIdx + 1) % 10;

      let siteMaxLength = 0;
      for (let e of allCompleteIndicators) {
        let row;
        if (e.computation !== undefined) {
          let res = await indicatorToRow(
            ctx,
            ctx.params.id,
            e.computation,
            e.display,
            e.baseline,
            e.target,
            customFilter
          );
          row = newWorksheet.addRow(res);

          siteMaxLength = Math.max(siteMaxLength, res.name.length);

          if (e.numFmt !== undefined) {
            row.numFmt = e.numFmt;
          }
          if (e.outlineLevel !== undefined) {
            row.outlineLevel = e.outlineLevel;
          }
          if (e.hidden !== undefined) {
            row.hidden = e.hidden;
          }
          if (e.font !== undefined) {
            row.font = e.font;
          }
          if (e.fill !== undefined) {
            row.fill =
              e.fill === undefined
                ? undefined
                : JSON.parse(JSON.stringify(e.fill));
          }
          if (res.fill !== undefined) {
            row.fill =
              res.fill === undefined
                ? undefined
                : JSON.parse(JSON.stringify(res.fill));
          }
        } else {
          row = newWorksheet.addRow(e);

          // Make it collapsed. 1 is one level. 2 is 2 level.....
          if (e.outlineLevel !== undefined) {
            row.outlineLevel = e.outlineLevel;
          }
          // This hide the first level when we want to collapse.
          if (e.hidden !== undefined) {
            row.hidden = e.hidden;
          }

          siteMaxLength = Math.max(siteMaxLength, e.name.length);

          row.fill =
            e.fill === undefined
              ? undefined
              : JSON.parse(JSON.stringify(e.fill));
          row.font = e.font;
        }
        row.commit();
      }
      newWorksheet.columns[0].width = 45;
      newWorksheet.commit();
    }
  }

  await workbook.commit();

  fs.rename(`${filename}.temp`, `${filename}`, function(err) {
    if ( err ) console.log('ERROR: ' + err);
  });
}

async function generateIndicatorDownload(filename, indicator, ctx) {
  const relatedProjects = await Project.storeInstance.listByIndicator(indicator._id, true);

  // match the cross cutting id saved inside the project with the id of the global indicators in the database
  // and add them to the list too
  let completeProjects = [];
  let earliestStart;
  let latestEnd;
  const currentDate = new Date();

  for (const project of relatedProjects) {
      // if so we add it to the report
      let currentComputation = null;
      let currentBaseline = null;
      let currentTarget = null;
      if (project.crossCutting[indicator._id]) {
        currentComputation = project.crossCutting[indicator._id].computation;
        currentBaseline = project.crossCutting[indicator._id].baseline;
        currentTarget = project.crossCutting[indicator._id].target;
        // Only set dates if the crossCutting indicator is in the project
        const start = new Date(project.start + "T00:00:00Z");
        const end = new Date(project.end + "T00:00:00Z");
        if (!earliestStart || earliestStart > start) {
          earliestStart = start;
        }
        if (!latestEnd || latestEnd < end) {
          latestEnd = end;
        }
      }
      completeProjects.push({
        computation: currentComputation,
        display: `${project.country} - ${project.name}`,
        baseline: currentBaseline,
        target: currentTarget,
        numFmt: getNumberFormat(currentComputation),
        id: project._id
      });
      let indicatorFormulas = buildFormulas({ computation: currentComputation }, project);
      indicatorFormulas.map(formula => {formula.id = project._id});
      completeProjects = completeProjects.concat(indicatorFormulas);
  }
  
  // creates a list for the names of the columns based on the periodicity received as a parameter
  dateColumn = Array.from(
    timeSlotRange(
      TimeSlot.fromDate(
        earliestStart,
        ctx.params.periodicity
      ),
      TimeSlot.fromDate(
        currentDate > latestEnd ? latestEnd : currentDate,
        ctx.params.periodicity
      )
    )
  ).map((ts) => ts.value);

  // create the excel file
  const writeStream = fs.createWriteStream(`${filename}.temp`, { flags: 'w' });
  const options = {
    stream: writeStream,
    useStyles: true,
    useSharedStrings: true
  };

  let workbook = new Excel.stream.xlsx.WorkbookWriter(options);

  let worksheet = buildWorksheet(workbook, "Global");

  sectionHeader.fill.fgColor.argb = "999999";

  // Adding the data
  for (let project of completeProjects) {
    // Note: in Excel the rows are 1 based, meaning the first row is 1 instead of 0.
    // row 1 is the header.
    // const rowIndex = index + 2;

    // By using destructuring we can easily dump all of the data into the row without doing much
    // We can add formulas pretty easily by providing the formula property.
    let row;

    // if it has a computation (meaning that is an indicator) we get the values and put dump in the sheet
    if (project.computation !== undefined) {
      // get values
      // when no filter is provided it means we want data from all sites
      let res = await indicatorToRow(
        ctx,
        project.id,
        project.computation,
        project.display,
        project.baseline,
        project.target,
        project.filter
      );
      // Dump all the data into Excel
      row = worksheet.addRow(res);
      // Format the numbers with no decimal places
      if (project.numFmt !== undefined) {
        row.numFmt = project.numFmt;
      }
      // Make it collapsed. 1 is one level. 2 is 2 level.....
      if (project.outlineLevel !== undefined) {
        row.outlineLevel = project.outlineLevel;
      }
      // This hide the first level when we want to collapse.
      if (project.hidden !== undefined) {
        row.hidden = project.hidden;
      }
      // All the font configuration
      if (project.font !== undefined) {
        row.font = project.font;
      }
      // Background color
      if (project.fill !== undefined) {
        row.fill =
          project.fill === undefined
            ? undefined
            : JSON.parse(JSON.stringify(project.fill));
      }
      if (res.fill !== undefined) {
        row.fill =
          res.fill === undefined
            ? undefined
            : JSON.parse(JSON.stringify(res.fill));
      }
      row.commit();
    }
    // if the row is a section header
    else {
      // Dump all the data into Excel
      row = worksheet.addRow(project);

      // Make it collapsed. 1 is one level. 2 is 2 level.....
      if (project.outlineLevel !== undefined) {
        row.outlineLevel = project.outlineLevel;
      }
      // This hide the first level when we want to collapse.
      if (project.hidden !== undefined) {
        row.hidden = project.hidden;
      }
      // apply the styles
      row.fill =
      project.fill === undefined
          ? undefined
          : JSON.parse(JSON.stringify(project.fill));
      row.font = project.font;
    }
    row.commit();
  }

  worksheet.columns[0].width = 45;
  worksheet.commit();

  const COLORS = [
    "1f77b4",
    "ff7f0e",
    "2ca02c",
    "d62728",
    "9467bd",
    "8c564b",
    "e377c2",
    "7f7f7f",
    "bcbd22",
    "17becf",
  ];
  let colorIdx = 0;

  if (!ctx.params.minimized) {
    // iterates over the sites
    for (let project of relatedProjects) {
      // creating a tab for each site

      // Cleaning the name replacing all special characters by a space
      project.country = project.country.replace(/[^a-zA-Z0-9]/g, " ");

      let newWorksheet = buildWorksheet(workbook, project.country);
      
      let projectComputation = null;
      let projectBaseline = null;
      let projectTarget = null;

      let projectIndicators = [];

      let projectStart = new Date(project.start + "T00:00:00Z");;
      let projectEnd = new Date(project.end + "T00:00:00Z");;

      if (project.crossCutting[indicator._id]) {
        projectComputation = project.crossCutting[indicator._id].computation;
        projectBaseline = project.crossCutting[indicator._id].baseline;
        projectTarget = project.crossCutting[indicator._id].target;
      }

      // creates a list for the names of the columns based on the periodicity received as a parameter
      dateColumn = Array.from(
        timeSlotRange(
          TimeSlot.fromDate(
            projectStart,
            ctx.params.periodicity
          ),
          TimeSlot.fromDate(
            currentDate > projectEnd ? projectEnd : currentDate,
            ctx.params.periodicity
          )
        )
      ).map((ts) => ts.value);

      for (let entity of project.entities) {
        projectIndicators.push({
          computation: projectComputation,
          display: entity.name,
          baseline: projectBaseline,
          target: projectTarget,
          numFmt: getNumberFormat(projectComputation),
          id: project._id,
          filter: { entity: [entity.id] }
        });
        let indicatorFormulas = buildFormulas({ computation: projectComputation }, project);
        indicatorFormulas.map(formula => {
          formula.id = project._id;
          formula.filter = { entity: [entity.id] };
        });
        projectIndicators = projectIndicators.concat(indicatorFormulas);
      }

      sectionHeader.fill.fgColor.argb = COLORS[colorIdx];
      colorIdx = (colorIdx + 1) % 10;

      let siteMaxLength = 0;
      for (let e of projectIndicators) {
        let row;
        if (e.computation !== undefined) {
          let res = await indicatorToRow(
            ctx,
            e.id,
            e.computation,
            e.display,
            e.baseline,
            e.target,
            e.filter
          );
          row = newWorksheet.addRow(res);

          siteMaxLength = Math.max(siteMaxLength, res.name.length);

          if (e.numFmt !== undefined) {
            row.numFmt = e.numFmt;
          }
          if (e.outlineLevel !== undefined) {
            row.outlineLevel = e.outlineLevel;
          }
          if (e.hidden !== undefined) {
            row.hidden = e.hidden;
          }
          if (e.font !== undefined) {
            row.font = e.font;
          }
          if (e.fill !== undefined) {
            row.fill =
              e.fill === undefined
                ? undefined
                : JSON.parse(JSON.stringify(e.fill));
          }
          if (res.fill !== undefined) {
            row.fill =
              res.fill === undefined
                ? undefined
                : JSON.parse(JSON.stringify(res.fill));
          }
        } else {
          row = newWorksheet.addRow(e);

          // Make it collapsed. 1 is one level. 2 is 2 level.....
          if (e.outlineLevel !== undefined) {
            row.outlineLevel = e.outlineLevel;
          }
          // This hide the first level when we want to collapse.
          if (e.hidden !== undefined) {
            row.hidden = e.hidden;
          }

          siteMaxLength = Math.max(siteMaxLength, e.name.length);

          row.fill =
            e.fill === undefined
              ? undefined
              : JSON.parse(JSON.stringify(e.fill));
          row.font = e.font;
        }
        row.commit();
      }
      newWorksheet.columns[0].width = 45;
      newWorksheet.commit();
    }
  }

  await workbook.commit();

  fs.rename(`${filename}.temp`, `${filename}`, function(err) {
    if ( err ) console.log('ERROR: ' + err);
  });
}

async function generateCCIndicatorDownload(filename, indicators, lang, countries, continents, timeSlotStart, timeSlotEnd) {
  const relatedProjects = await Project.storeInstance.listByIndicators(indicators);
  // match the cross cutting id saved inside the project with the id of the global indicators in the database
  // and add them to the list too
  let completeProjects = [];
  let earliestStart;
  let latestEnd;
  const currentDate = new Date();

  for (const project of relatedProjects) {
      // filtering
      if (countries.length > 0) {
        if (!countries.includes(project.country)) {
          continue;
        }
      } else if (continents.length > 0) {
        if (!project.continent || !continents.includes(project.continent)) {
          continue;
        }
      }
      
      const projectStart = new Date(project.start + "T00:00:00Z");
      const projectEnd = new Date(project.end + "T00:00:00Z");
      if (!earliestStart || earliestStart > projectStart) {
        earliestStart = projectStart;
      }
      if (!latestEnd || latestEnd < projectEnd) {
        latestEnd = projectEnd;
      }
      
      completeProjects.push({
        // computation: currentComputation,
        display: `${project.country} - ${project.name}`,
        start: project.start,
        end: project.end,
        crossCutting: project.crossCutting,
        // numFmt: getNumberFormat(currentComputation),
        id: project._id,
        themes: project.themes
      });
  }
  
  // creates a list for the names of the columns based on the periodicity received as a parameter
  const dateRange = Array.from(
    timeSlotRange(
      timeSlotStart || TimeSlot.fromDate(earliestStart, 'semester'),
      timeSlotEnd || TimeSlot.fromDate((currentDate > latestEnd ? latestEnd : currentDate), 'semester')
    )
  ).map((ts) => ts.value);

  // create the excel file
  const writeStream = fs.createWriteStream(`${filename}.temp`, { flags: 'w' });
  const options = {
    stream: writeStream,
    useStyles: true,
    useSharedStrings: true
  };

  let workbook = new Excel.stream.xlsx.WorkbookWriter(options);

  let worksheet = buildCCWorksheet(workbook, "Global", lang, indicators);

  // Adding the data
  for (let project of completeProjects) {
    // Note: in Excel the rows are 1 based, meaning the first row is 1 instead of 0.
    // row 1 is the header.
    // const rowIndex = index + 2;

    // By using destructuring we can easily dump all of the data into the row without doing much
    // We can add formulas pretty easily by providing the formula property.
    let row;

    // if it has a computation (meaning that is an indicator) we get the values and put dump in the sheet

      // get values
      // when no filter is provided it means we want data from all sites
      let rows = await indicatorToCCRows(
        project,
        indicators,
        dateRange
      );
      for (let res of rows) {
        // Dump all the data into Excel
        row = worksheet.addRow(res);
        // Format the numbers with no decimal places
        if (project.numFmt !== undefined) {
          row.numFmt = project.numFmt;
        }
        // All the font configuration
        if (project.font !== undefined) {
          row.font = project.font;
        }
        // Background color
        if (project.fill !== undefined) {
          row.fill =
            project.fill === undefined
              ? undefined
              : JSON.parse(JSON.stringify(project.fill));
        }
        for (let indicator of indicators) {
          let cell = row.getCell(indicator._id)
          if (isNaN(cell.value) || !project.crossCutting[indicator._id]) {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.fill = {
              type: 'pattern',
              pattern:'solid',
              fgColor:{argb:'d3d3d3'}
            };
            cell.value = errorTranslations[cell.value] ? errorTranslations[cell.value][lang] : cell.value;
          } else {
            if (project.crossCutting[indicator._id].isPercentage) {
              cell.numFmt = percentageCellStyle.numFmt;
              cell.value /= 100;
            } else {
              cell.numFmt = numberCellStyle.numFmt;
            }
          }
        }
        row.commit();
      }
  }
  
  worksheet.commit();

  const COLORS = [
    "1f77b4",
    "ff7f0e",
    "2ca02c",
    "d62728",
    "9467bd",
    "8c564b",
    "e377c2",
    "7f7f7f",
    "bcbd22",
    "17becf",
  ];
  let colorIdx = 0;

  await workbook.commit();

  fs.rename(`${filename}.temp`, `${filename}`, function(err) {
    if ( err ) console.log('ERROR: ' + err);
  });
}

function getFilename(name, minimized = false) {
  return encodeURI(`(${name.replace(/[`;,.\\\/]/gi, '')})-${minimized ? 'global-excel-export' : 'detailed-excel-export'}.xlsx`);
}
function getCCFilename(ctx) {

  const ids = ctx.params.ids.split('+').map(id => id.split(':')[1].split('-')[0]).join('+');
  let filename = `new_cc_export_${ids}_${ctx.params.lang}`;
  if (ctx.params.countries && ctx.params.countries != '_') { filename += `_${ctx.params.countries}` };
  if (ctx.params.continents && ctx.params.continents != '_') { filename += `_${ctx.params.continents}` };
  
  const timeSlotStart = (ctx.params.start && ctx.params.start != '_')? TimeSlot.fromDate(
    new Date(ctx.params.start),
    'semester'
  ) : '';
  const timeSlotEnd = (ctx.params.end && ctx.params.end != '_')? TimeSlot.fromDate(
    new Date(ctx.params.end),
    'semester'
  ) : '';
  filename += `_${timeSlotStart}_${timeSlotEnd}`;

  return `${filename}.xlsx`
}

/**
 * Checks if a file stream with the passed params for the excel export already exists.
 * Returns a the request with a message indicating the state of the file stream. 
 */
router.get('/export/:id/:periodicity/:lang/:minimized?/check', async ctx => {
  let filename;

  switch (getIdType(ctx.params.id)) {
    case 'indicator':
      const indicator = await Indicator.storeInstance.get(ctx.params.id);
      filename = getFilename(indicator.name.en, ctx.params.minimized);
      break;
    case 'project':
      const project = await Project.storeInstance.get(ctx.params.id);
      filename = getFilename(project.country, ctx.params.minimized);
      break;
    default:
      break;
  }

  if (fs.existsSync(filename)){
    ctx.status = 200;
    ctx.body = '{ "message": "done" }'
  } else {
    ctx.status = 200;
    ctx.body = '{ "message": "not done" }'
  }
})

/**
 * Checks if a file stream with the passed params for the excel export already exists.
 * Returns a the request with a message indicating the state of the file stream. 
 */
router.get('/export-newCC/:ids/:lang/:countries?/:continents?/:start?/:end?/check', async ctx => {

  let filename = getCCFilename(ctx);

  if (fs.existsSync(filename)){
    ctx.status = 200;
    ctx.body = '{ "message": "done" }'
  } else {
    ctx.status = 200;
    ctx.body = '{ "message": "not done" }'
  }
})

router.get('/export/:id/:periodicity/:lang/:minimized?/file', async ctx => {
  
  let filename;

  switch (getIdType(ctx.params.id)) {
    case 'indicator':
      const indicator = await Indicator.storeInstance.get(ctx.params.id);
      filename = getFilename(indicator.name.en, ctx.params.minimized);
      break;
    case 'project':
      const project = await Project.storeInstance.get(ctx.params.id);
      filename = getFilename(project.country, ctx.params.minimized);
      break;
    default:
      break;
  }

  // check if the file already exists
  if (fs.existsSync(filename)){
    ctx.set('Content-disposition', 'attachment; filename=' + filename);
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.body = fs.createReadStream(filename);
  }
  else{
    ctx.status = 404;
    ctx.message = 'File not found';
  }
})

router.get('/export-newCC/:ids/:lang/:countries?/:continents?/:start?/:end?/file', async ctx => {
  
  let filename = getCCFilename(ctx);

  // check if the file already exists
  if (fs.existsSync(filename)){
    ctx.set('Content-disposition', 'attachment; filename=' + filename);
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    ctx.body = fs.createReadStream(filename);
  }
  else{
    ctx.status = 404;
    ctx.message = 'File not found';
  }
})

/** Render file containing all data entry up to a given date */
router.get("/export/:id/:periodicity/:lang/:minimized?", async (ctx) => {
  // Get export type;
  const type = getIdType(ctx.params.id);

  console.log(`\nStart download for ${ctx.params.id}...\n`);

  // Get data depending on the id type;
  const data = await(
    type === 'indicator' ?
    Indicator.storeInstance.get(ctx.params.id) :
    Project.storeInstance.get(ctx.params.id)
  );

  // Set filename;
  const filename = getFilename(
    (type === 'indicator' ? data.name.en : data.country),
    ctx.params.minimized
  );

  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename, (err) => console.log(err));
  }
  if (fs.existsSync(filename + '.temp')) {
    ctx.body = '{ "message": "not done" }';
    return;
  }

  console.log(`\nGenerating file ${filename}...\n`);

  // Generate file data;
  await (
    type === 'indicator' ?
    generateIndicatorDownload(filename, data, ctx) :
    generateProjectDownload(filename, data, ctx)
  );

  console.log(`\nFile ${filename} is ready to download\n`);
  ctx.body = '{ "message": "done" }';
});

/** Render file containing all data entry up to a given date */
router.get("/export-newCC/:ids/:lang/:countries?/:continents?/:start?/:end?", async (ctx) => {

  console.log(`\nStart download for newCrossCutting...\n`);

  // Set filename;
  let filename = getCCFilename(ctx);

  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename, (err) => console.log(err));
  }
  if (fs.existsSync(filename + '.temp')) {
    // fs.unlinkSync(filename + '.temp', (err) => console.log(err));
    ctx.body = '{ "message": "not done" }';
    return;
  }
  
  console.log(`\nGenerating file ${filename}...\n`);

  const indicatorIds = ctx.params.ids.split('+');
  const countries = !ctx.params.countries || ctx.params.countries == '_' ? [] : ctx.params.countries.split('+');
  const continents = !ctx.params.continents || ctx.params.continents == '_' ? []: ctx.params.continents.split('+');
  const timeSlotStart = (ctx.params.start && ctx.params.start != '_')? TimeSlot.fromDate(
    new Date(ctx.params.start),
    'semester'
  ) : null;
  const timeSlotEnd = (ctx.params.end && ctx.params.end != '_')? TimeSlot.fromDate(
    new Date(ctx.params.end),
    'semester'
  ) : null;
  let data = [];
  for (let id of indicatorIds) {
    const indicator = await Indicator.storeInstance.get(id);
    data.push(indicator);
  }
  // Generate file data;
  await (generateCCIndicatorDownload(filename, data, ctx.params.lang, countries, continents, timeSlotStart, timeSlotEnd));

  console.log(`\nFile ${filename} is ready to download\n`);
  ctx.body = '{ "message": "done" }';
});

router.post('/export/currentView', async (ctx) => {
  // get body from request
  const body = ctx.request.body;

  // paddings from the original table will be used to indent the rows
  // and determine the fill/outline level
  const {data, paddings, headers} = body;

  const rowObjToRowArray = (rowObj, index) => headers.map(col => {
    const value = rowObj[col];
    if (value === undefined) return '';
    if (col === 'Name') return '    '.repeat(paddings[index]) + value;
    // remove all dots from numbers
    return value.replace(/\./g, '');
  });

  // create the excel file
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet('Current view');

  let maxLength = 0;

  worksheet.addRow(headers);
  for (let i = 0; i < data.length; i++) {
    const row = worksheet.addRow(rowObjToRowArray(data[i], i));
    const padding = paddings[i];
    row.outlineLevel = padding > 2 ? (padding - 1) / 2 + 1: padding;
    if (padding === 0) {
      row.font = sectionHeader.font;
      row.fill = sectionHeader.fill;
    }
    maxLength = Math.max(maxLength, data[i].Name.length || 0);
  }

  // sets row that only has one column (Name) in bold
  for (let i = 0; i < data.length; i++) {
    if (Object.keys(data[i]).length === 1) {
      worksheet.getRow(i + 2).font = { bold: true };
    }
  }

  // the minimum size of the column should be 30 and the maximum 100
  const minimumColWidth = 30;
  const maximumColWidth = 100;
  worksheet.columns[0].width = Math.min(
    Math.max(maxLength + 10, minimumColWidth),
    maximumColWidth
  );

  // remove the text in A1
  worksheet.getCell('A1').value = '';

  // set the width from the 4th column to the last column to 110
  worksheet.columns.forEach((col, index) => {
    if (index > 2) col.width = 15;
  });

  worksheet.views = [
    { state: "frozen", xSplit: 1, ySplit: 0, activeCell: "A1" },
  ];
  
  // final name will be monitool-<country>.xlsx, this will be done in the frontend
  await workbook.xlsx.writeFile('currViewReport.xlsx');
  ctx.set('Content-disposition', 'attachment; filename=currViewReport.xlsx');
  ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  const stream = fs.createReadStream('currViewReport.xlsx');
  ctx.status = 200;
  ctx.body = stream;
});

/** Export of users */
router.get("/export/users", async (ctx) => {
  // check that user is admin
  const user = ctx.state.user;

  if (user.role !== "admin") {
    ctx.status = 403;
    ctx.body = { message: "You are not authorized to access this resource" };
    return;
  }

  // get all users from the database
  const users = await User.storeInstance.list();

  // get language from the request
  const lang = ctx.request.query.lang || lang;

  // Translations
  const headers = {
    en: ["User", "Email", "Type", "Name", "Role", "Last connection", 'Deleted'],
    es: [
      "Usuario",
      "Correo electrónico",
      "Tipo",
      "Nombre",
      "Rol",
      "Última conexión",
      'Eliminado',
    ],
    fr: ["Utilisateur", "E-mail", "Type", "Nom", "Rôle", "Dernière connexion", 'Supprimé'],
  };

  // create the excel file
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(headers[lang][0]);

  const missingData = {
    en: "Missing data",
    es: "Datos faltantes",
    fr: "Données manquantes",
  };

  const yesNo = {
    en: {
      true: "Yes",
      false: "No",
    },
    es: {
      true: "Sí",
      false: "No",
    },
    fr: {
      true: "Oui",
      false: "Non",
    },
  };

  const userType = {
    en: {
      user: 'MdM account',
      partner: 'Partner account',
    },
    es: {
      user: 'Cuenta de MdM',
      partner: 'Cuenta de socio',
    },
    fr: {
      user: 'Compte MdM',
      partner: 'Compte partenaire',
    }
  }

  // add the headers
  const headerRow = worksheet.addRow(headers[lang]);

  // set the styles for the header
  headerRow.font = sectionHeader.font;
  headerRow.fill = sectionHeader.fill;

  // set the width of the columns
  worksheet.columns = [
    { width: 30 },
    { width: 45 },
    { width: 15 },
    { width: 30 },
    { width: 10 },
    { width: 25 },
    { width: 10 },
  ];

  // add the data
  for (let i = 0; i < users.length; i++) {
    // if the user has no last login, add the missing data text
    const lastLogin = users[i].lastLogin
      ? new Date(users[i].lastLogin).toLocaleString(lang)
      : missingData[lang];

    const user = users[i]._id.split(":")[1];
    const type = users[i].type === 'user'
      ? userType[lang].user
      : userType[lang].partner;

    worksheet.addRow([
      user,
      `${user}@medecinsdumonde.net`,
      type,
      users[i].name,
      users[i].role,
      lastLogin,
      !users[i].active ? yesNo[lang].true : yesNo[lang].false,
    ]);
  }
  // write the file
  await workbook.xlsx.writeFile("users.xlsx");
  ctx.set("Content-disposition", "attachment; filename=users.xlsx");
  ctx.set(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  const stream = fs.createReadStream("users.xlsx");
  ctx.status = 200;
  ctx.body = stream;
});

export default router;
