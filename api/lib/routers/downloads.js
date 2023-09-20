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
    if (key !== 'name') {
      if (typeof value === 'string' && value !== "missing-data") {
        let temp = Number(value);
        result[key] = temp.toFixed(1) + "%";
      } else if (typeof value === "number") {
        result[key] = value.toFixed(1) + "%";
      }
    }
  }
}


// Call the database and get the computed values
// Add the name of the indicator to the result of the computation
async function indicatorToRow(ctx, computation, name, baseline=null, target=null, filter){
  const query = {
		projectId: ctx.params.projectId,
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
      result = JSON.parse(await queryReportingSubprocess(query));
      if (isPercentage) {
        convertToPercentage(result);
      }
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
    'es': 'Objectivo',
    'fr': 'Valeur cible',
  }

  newWorksheet.columns = [{header: '', key: 'name'}, {header: baselineTranslation[lang], key: 'baseline'}, {header: targetTranslation[lang], key: 'target'}].concat(dateColumn.map(name => {
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
  if (computation !== null && computation.formula.indexOf('100') !== -1){
    return percentageCellStyle.numFmt;
  }
  return numberCellStyle.numFmt;
}


router.get('/export/:projectId/:periodicity/:lang/:minimized?/check', async ctx => {
  const project = await Project.storeInstance.get(ctx.params.projectId);
  const filename = 'monitool-' + project.country + '.xlsx';
  if (fs.existsSync(filename)){
    ctx.status = 200;
    ctx.body = '{ "message": "done" }'
  } else {
    ctx.status = 200;
    ctx.body = '{ "message": "not done" }'
  }
})

router.get('/export/:projectId/:periodicity/:lang/:minimized?/file', async ctx => {
  const project = await Project.storeInstance.get(ctx.params.projectId);

  const filename = 'monitool-' + project.country + '.xlsx';

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
router.get("/export/:projectId/:periodicity/:lang/:minimized?", async (ctx) => {
  const project = await Project.storeInstance.get(ctx.params.projectId);

  const filename = "monitool-" + project.country + ".xlsx";
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename, (err) => console.log(err));
  }

  lang = ctx.params.lang;
  let minimized = ctx.params.minimized;

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
  const writeStream = fs.createWriteStream("./monitool-" + project.country + ".xlsx", { flags: 'w' });
  const options = {
    stream: writeStream,
    useStyles: true
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

  if (!minimized) {
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

      // newWorksheet.views = [
      //   { state: "frozen", xSplit: 1, ySplit: 0, activeCell: "A1" },
      // ];
      // newWorksheet.columns[0].width = Math.max(siteMaxLength + 10, 30);
      newWorksheet.columns[0].width = 45;
      newWorksheet.commit();
    }
  }

  // worksheet.views = [
  //   { state: "frozen", xSplit: 1, ySplit: 0, activeCell: "A1" },
  // ];

  worksheet.columns[0].width = 45;
  worksheet.commit();

  await workbook.commit();

  // ctx.set('Content-disposition', `attachment; filename=`+`monitool-`+project.country+`.xlsx`);
  // ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  // workbook.xlsx.writeFile("monitool-" + project.country + ".xlsx");

  // Write to memory, buffer
  // const buffer = await workbook.xlsx.writeBuffer()
  // ctx.body = buffer;

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
    en: ["User", "Email", "Type", "Name", "Role", "Last connection"],
    es: [
      "Usuario",
      "Correo electrónico",
      "Tipo",
      "Nombre",
      "Rol",
      "Última conexión",
    ],
    fr: ["Utilisateur", "E-mail", "Type", "Nom", "Rôle", "Dernière connexion"],
  };

  // create the excel file
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(headers[lang][0]);

  const missingData = {
    en: "Missing data",
    es: "Datos faltantes",
    fr: "Données manquantes",
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
    { width: 7 },
    { width: 30 },
    { width: 10 },
    { width: 25 },
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
