const Router = require('koa-router');
const Excel = require('exceljs')

import Project from '../resource/model/project';
import { queryReportingSubprocess } from './reporting';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';
import Indicator from '../resource/model/indicator';

const router = new Router();

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
  numFmt: '### ### ### ##0'
}

let percentageCellStyle = {
  numFmt: '0%'
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

let dateColumn = [];

async function convertToPercentage(result){
  for (const [key, value] of Object.entries(result)) {
    if(key !== 'name' && typeof value === "number"){
      result[key] = value/100.0;
    }
  }
}


// Call the database and get the computed values
// Add the name of the indicator to the result of the computation
async function indicatorToRow(ctx, computation, name, filter={}){
  const query = {
		projectId: ctx.params.projectId,
		computation: computation,
		filter: filter,
		dimensionIds: [ctx.params.periodicity],
		withTotals: false,
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

  else{
    // this function can throw an error in case the periodicity asked is not compatible with the data
    try{
      result = JSON.parse(await queryReportingSubprocess(query));
      if (computation.formula === '100 * numerator / denominator'){
        convertToPercentage(result);
      }
    }
    // Here are the various reported on the excel export
    catch (err){
      // if this is the case, instead of the results we add an a custom error message
      if (err.message == "invalid dimensionId"){
        result[dateColumn[0]] = "This data is not available by " + ctx.params.periodicity;
        result.fill = errorRow.fill;
      }else{
      // if it's some other error, we send this error in the excel
        result[dateColumn[0]] = err.message;
        result.fill = errorRow.fill;
      }
    }
  }
  result.name = name;
  return result;
}

// TODO: Optimize this method.
function generateAllCombinations(partitionIndex, computation, name, formElement, list){
  if (partitionIndex === formElement.partitions.length){
    list.push({computation: JSON.parse(JSON.stringify(computation)), display: name, outlineLevel: 1, hidden: true, font: partitionsCollapsed.font, numFmt: getNumberFormat(computation)});
  }
  else{
    for(let partitionOption of formElement.partitions[partitionIndex].elements){
      computation.parameters.a.filter[formElement.partitions[partitionIndex].id] = [partitionOption.id]
      generateAllCombinations(partitionIndex + 1, computation, name + ((name !== '    ') ? " / ":"") + partitionOption.name, formElement, list);
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
  generateAllCombinations(0, computation, '    ', formElement, list);
  return list
}


function buildFormulas(indicator){
  const newLines = [];
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

      newLines.push({computation: JSON.parse(JSON.stringify(simplerComputation)), display: "    "+parameter, outlineLevel: 1, hidden: true, font: partitionsCollapsed.font, numFmt: getNumberFormat(simplerComputation)})
    }
  }
  return newLines;
}

function buildWorksheet(workbook, name) {
  // Cleaning the name replacing all special characters by a space
  name = name.replace(/[^a-zA-Z0-9]/g,' ');

  let newWorksheet = workbook.addWorksheet(name);

  newWorksheet.columns = [{header: '', key: 'name'}].concat(dateColumn.map(name => {
    return {
      header: name,
      key: name
    }
  }));

  // force the columns to be at least as long as their header row.
  newWorksheet.columns.forEach(column => {
    column.width = column.header.length < 12 ? 12 : column.header.length
  })

  return newWorksheet;
}

function getNumberFormat(computation){
  if (computation !== null && computation.formula === '100 * numerator / denominator'){
    return percentageCellStyle.numFmt;
  }
  return numberCellStyle.numFmt;
}

/** Render file containing all data entry up to a given date */
router.get('/export/:projectId/:periodicity/:lang', async ctx => {
  const project = await Project.storeInstance.get(ctx.params.projectId);

  // iterate over all the logical frame layers and puts all indicators in the same list
  // an indicator is being represented by his name and computation
  let logicalFrameCompleteIndicators = [];
  const LogicalFrameName = {
    en: 'Logical Framework: ',
    es: 'Marco Lógico: ',
    fr: 'Cadre Logique: '
  }
  for (let logicalFrame of project.logicalFrames){
    // this creates a row to act as a header for the section
    // this row has a different style and font size
    logicalFrameCompleteIndicators.push({name: LogicalFrameName[ctx.params.lang] + logicalFrame.name, fill: sectionHeader.fill, font: sectionHeader.font });
    // TODO: To be simplified with a recursive function
    for (let indicator of logicalFrame.indicators){
      logicalFrameCompleteIndicators.push({computation: indicator.computation, display: indicator.display, numFmt: getNumberFormat(indicator.computation)});
    }
    for (let purpose of logicalFrame.purposes){
      for (let indicator of purpose.indicators){
        logicalFrameCompleteIndicators.push({computation: indicator.computation, display: indicator.display, numFmt: getNumberFormat(indicator.computation)});
      }
      for (let output of purpose.outputs){
        for (let indicator of output.indicators){
          logicalFrameCompleteIndicators.push({computation: indicator.computation, display: indicator.display, numFmt: getNumberFormat(indicator.computation)});
        }
        for (let activity of output.activities){
          for (let indicator of activity.indicators){
            logicalFrameCompleteIndicators.push({computation: indicator.computation, display: indicator.display, numFmt: getNumberFormat(indicator.computation)});
          }
        }
      }
    }
  }

  // match the cross cutting id saved inside the project with the id of the global indicators in the database
  // and add them to the list too
  let crossCuttingCompleteIndicators = [];
  const CrosscuttingName = {
    en: 'Crosscutting indicators',
    es: 'Indicadores transversales',
    fr: 'Indicateurs transversaux'
  }
  crossCuttingCompleteIndicators.push({name: CrosscuttingName[ctx.params.lang], fill: sectionHeader.fill, font: sectionHeader.font});

  let listIndicators = await Indicator.storeInstance.list();

  // build a set with all the themes in the project
  const projectThemes = new Set(project.themes);

  for (const indicator of listIndicators){
    // checks if the indicator has at least one theme in common with the project
    if (indicator.themes.some(themeId => projectThemes.has(themeId))){
      // if so we add it to the report
      let currentComputation = null;
      if (project.crossCutting[indicator._id]){
        currentComputation = project.crossCutting[indicator._id].computation;
      }
      crossCuttingCompleteIndicators.push({computation: currentComputation, display: indicator.name[ctx.params.lang], numFmt: getNumberFormat(currentComputation)});
      crossCuttingCompleteIndicators = crossCuttingCompleteIndicators.concat(buildFormulas({computation: currentComputation}));
    }
  }

  // iterate over the extra indicators and adds them to the list in the same format
  let extraCompleteIndicators = [];
  const ExtraIndicatorsName = {
    en: 'Extra indicators',
    es: 'Indicadores adicionales',
    fr: 'Indicateurs annexés'
  }
  extraCompleteIndicators.push({name: ExtraIndicatorsName[ctx.params.lang], fill: sectionHeader.fill, font: sectionHeader.font});
  for (let indicator of project.extraIndicators){
    extraCompleteIndicators.push({computation: indicator.computation, display: indicator.display, numFmt: getNumberFormat(indicator.computation)});
    extraCompleteIndicators = extraCompleteIndicators.concat(buildFormulas(indicator));    
  }

  // data sources don't have a computation field, but their computation use always the same formula,
  // so we can create a computation and represent them as an indicator
  let dataSourcesCompleteIndicators = [];
  const DataSourceName = {
    en: 'Data source: ',
    es: 'Datos de base: ',
    fr: 'Données de base: '
  }
  for(let form of project.forms){
    dataSourcesCompleteIndicators.push({ name: DataSourceName[ctx.params.lang] + form.name, fill: sectionHeader.fill, font: sectionHeader.font });
    for (let element of form.elements){
      let computation = {
        formula: 'a',
        parameters: {
          a: {
            elementId: element.id,
            filter: {}
          }
        }
      }
      dataSourcesCompleteIndicators.push({computation: computation, display: element.name, numFmt: getNumberFormat(computation)});

      if (element.partitions.length > 0){
        dataSourcesCompleteIndicators = dataSourcesCompleteIndicators.concat(buildAllPartitionsPossibilities(element))
      } 
    }
  }
  
  // creates a list for the names of the columns based on the periodicity received as a parameter
  dateColumn = Array.from(
    timeSlotRange(
      TimeSlot.fromDate(new Date(project.start + 'T00:00:00Z'), ctx.params.periodicity),
      TimeSlot.fromDate(new Date(project.end + 'T00:00:00Z'), ctx.params.periodicity)
    )
  ).map(ts => ts.value);

  // create the excel file
  let workbook = new Excel.Workbook();
  
  let worksheet = buildWorksheet(workbook, 'Global');

  let maxLenght = 0;
  // combine all the lists into one
  let allCompleteIndicators = [].concat(
    logicalFrameCompleteIndicators,
    crossCuttingCompleteIndicators,
    extraCompleteIndicators,
    dataSourcesCompleteIndicators
  );

  // Adding the data
  for (let indicator of allCompleteIndicators){
    // Note: in Excel the rows are 1 based, meaning the first row is 1 instead of 0.
    // row 1 is the header.
    // const rowIndex = index + 2;

    // By using destructuring we can easily dump all of the data into the row without doing much
    // We can add formulas pretty easily by providing the formula property.
    let row;

    // if it has a computation (meaning that is an indicator) we get the values and put dump in the sheet
    if (indicator.computation !== undefined){
      // get values
      // when no filter is provided it means we want data from all sites
      let res = await indicatorToRow(ctx, indicator.computation, indicator.display);
      // Dump all the data into Excel
      row = worksheet.addRow(res);
      maxLenght = Math.max(maxLenght, res.name.length)

      // Format the numbers with no decimal places
      if (indicator.numFmt !== undefined){
        row.numFmt = indicator.numFmt;
      }
      // Make it collapsed. 1 is one level. 2 is 2 level.....
      if (indicator.outlineLevel !== undefined){
        row.outlineLevel = indicator.outlineLevel;
      }
      // This hide the first level when we want to collapse.
      if (indicator.hidden !== undefined){
        row.hidden = indicator.hidden;
      }
      // All the font configuration
      if (indicator.font !== undefined){
        row.font = indicator.font;
      }
      // Background color
      if (indicator.fill !== undefined){
        row.fill = indicator.fill;
      }
      if (res.fill !== undefined){
        row.fill = res.fill;
      }
    }
    // if the row is a section header 
    else {
      // Dump all the data into Excel
      row = worksheet.addRow(indicator);

      // Make it collapsed. 1 is one level. 2 is 2 level.....
      if (indicator.outlineLevel !== undefined){
        row.outlineLevel = indicator.outlineLevel;
      }
      // This hide the first level when we want to collapse.
      if (indicator.hidden !== undefined){
        row.hidden = indicator.hidden;
      }
      maxLenght = Math.max(maxLenght, indicator.name.length)
      // apply the styles
      row.fill = indicator.fill;
      row.font = indicator.font;
    }
  };

  // iterates over the sites
  for (let site of project.entities){
    // creating a tab for each site

    // Cleaning the name replacing all special characters by a space
    site.name = site.name.replace(/[^a-zA-Z0-9]/g,' ');

    let newWorksheet = buildWorksheet(workbook, site.name);
  
    // create a custom filter to get only the data relate to that specific site
    let customFilter = { entity: [site.id] };

    let siteMaxLenght = 0;
    for (let e of allCompleteIndicators){
      let row;
      if (e.computation !== undefined){
        let res = await indicatorToRow(ctx, e.computation, e.display, customFilter);
        row = newWorksheet.addRow(res);

        siteMaxLenght = Math.max(siteMaxLenght, res.name.length);

        if (e.numFmt !== undefined){
          row.numFmt = e.numFmt;
        }
        if (e.outlineLevel !== undefined){
          row.outlineLevel = e.outlineLevel;
        }
        if (e.hidden !== undefined){
          row.hidden = e.hidden;
        }
        if (e.font !== undefined){
          row.font = e.font;
        }
        if (e.fill !== undefined){
          row.fill = e.fill;
        }
        if (res.fill !== undefined){
          row.fill = res.fill;
        }
      } else {
        row = newWorksheet.addRow(e);

        // Make it collapsed. 1 is one level. 2 is 2 level.....
        if (e.outlineLevel !== undefined){
          row.outlineLevel = e.outlineLevel;
        }
        // This hide the first level when we want to collapse.
        if (e.hidden !== undefined){
          row.hidden = e.hidden;
        }

        siteMaxLenght = Math.max(siteMaxLenght, e.name.length);
        row.fill = e.fill;
        row.font = e.font;
      }
    }

    newWorksheet.views = [
      {state: 'frozen', xSplit: 1, ySplit: 0, topLeftCell: 'B1', activeCell: 'A1'}
    ];
    newWorksheet.columns[0].width = Math.max(siteMaxLenght + 10, 30);
  }

  worksheet.views = [
    {state: 'frozen', xSplit: 1, ySplit: 0, topLeftCell: 'B1', activeCell: 'A1'}
  ];

  // the minimun size of the colum should be 30 and the maximun 100

  const minimunColWidth = 30;
  const maximunColWidth = 100;
  worksheet.columns[0].width = Math.min(Math.max(maxLenght + 10, minimunColWidth), maximunColWidth);

  ctx.set('Content-disposition', `attachment; filename=`+`monitool-`+project.country+`.xlsx`);
  ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  
  await workbook.xlsx.writeFile('monitool-' + project.country + '.xlsx');

  // Write to memory, buffer
  const buffer = await workbook.xlsx.writeBuffer()

  ctx.body = buffer;
});

export default router;
