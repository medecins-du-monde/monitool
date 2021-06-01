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

let timeColumns = [];

// add the name of the indicator to the result of the computation
async function indicatorToRow(ctx, computation, name, filter={}){
  let result = await getCalculationResult(ctx, computation, filter);
  result.name = name;
  return result;
}

// calls the database and get the computated values
async function getCalculationResult(ctx, computation, filter){
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
    result[timeColumns[0]] = "Calculation is missing";
    return result;
  }

  else if (JSON.stringify(computation.parameters) === JSON.stringify({})) {
    for (let timeColumn of timeColumns){
      result[timeColumn] = computation.formula;
    }

    return result;
  }

  else{
    // this function can throw an error in case the periodicity asked is not compatible with the data
    try{
      result = JSON.parse(await queryReportingSubprocess(query));
    }
    catch (err){
      // if this is the case, instead of the results we add an error message
      if (err.message == "invalid dimensionId"){
        result[timeColumns[0]] = "This data is not available by " + ctx.params.periodicity
      }else{
      // if it's some other error, we throw it again
        throw err;
      }
    }
    return result;
  }
}


function generateAllCombinations(partitionIndex, computation, name, formElement, list){
  if (partitionIndex === formElement.partitions.length){
    list.push({computation: JSON.parse(JSON.stringify(computation)), display: name, outlineLevel: 1, hidden: true})
  }
  else{
    for(let partitionOption of formElement.partitions[partitionIndex].elements){
      computation.parameters.a.filter[formElement.partitions[partitionIndex].id] = [partitionOption.id]
      generateAllCombinations(partitionIndex + 1, computation, name + ' / ' + partitionOption.name, formElement, list);
      delete computation.parameters.a.filter[formElement.partitions[partitionIndex].id];
    }
  }
}

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

  generateAllCombinations(0, computation, '', formElement, list);

  return list
}

/** Render file containing all data entry up to a given date */
router.get('/export/:projectId/:periodicity', async ctx => {
  
  const project = await Project.storeInstance.get(ctx.params.projectId);

  // iterate over all the logical frame layers and puts all indicators in the same list
  // an indicator is being represented by it's name and computation
  let logiFrameCompleteIndicators = [];
  for (let lf of project.logicalFrames){
    // this creates a row to act as a header for the section
    // this row has a different style and font size
    logiFrameCompleteIndicators.push({name: 'Logical Framework: ' + lf.name, fill: sectionHeader.fill, font: sectionHeader.font });
    for (let ind of lf.indicators){
      logiFrameCompleteIndicators.push({computation: ind.computation, display: ind.display});
    }
    for (let purpose of lf.purposes){
      for (let ind of purpose.indicators){
        logiFrameCompleteIndicators.push({computation: ind.computation, display: ind.display});
      }
      for (let output of purpose.outputs){
        for (let ind of output.indicators){
          logiFrameCompleteIndicators.push({computation: ind.computation, display: ind.display});
        }
        for (let activity of output.activities){
          for (let ind of activity.indicators){
            logiFrameCompleteIndicators.push({computation: ind.computation, display: ind.display});
          }
        }
      }
    }
  }

  // match the cross cutting id saved inside the project with the id of the global indicators in the database
  // and add them to the list too
  let crossCuttingCompleteIndicators = [];
  crossCuttingCompleteIndicators.push({name: 'Crosscutting indicators', fill: sectionHeader.fill, font: sectionHeader.font});
  for (const [indicatorID, value] of Object.entries(project.crossCutting)){
    let ind = await Indicator.storeInstance.get(indicatorID);
    crossCuttingCompleteIndicators.push({computation: value.computation, display: ind.name['en']});
  }

  // iterate over the extra indicators and adds them to the list in the same format
  let extraCompleteIndicators = [];
  extraCompleteIndicators.push({name: 'Extra indicators', fill: sectionHeader.fill, font: sectionHeader.font});
  for (let ind of project.extraIndicators){
    extraCompleteIndicators.push({computation: ind.computation, display: ind.display});
  }

  // data sources don't have a computation field, but their computation use always the same formula,
  // so we can create a computation and represent them as an indicator
  let dataSourcesCompleteIndicators = [];
  for(let form of project.forms){
    dataSourcesCompleteIndicators.push({ name: 'Data source: ' + form.name, fill: sectionHeader.fill, font: sectionHeader.font });
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
      dataSourcesCompleteIndicators.push({computation: computation, display: element.name});

      if (element.partitions.length > 0){
        dataSourcesCompleteIndicators = dataSourcesCompleteIndicators.concat(buildAllPartitionsPossibilities(element))
      } 
    }
  }
  
  // creates a list for the names of the columns based on the periodicity received as a parameter
  timeColumns = Array.from(
    timeSlotRange(
      TimeSlot.fromDate(new Date(project.start + 'T00:00:00Z'), ctx.params.periodicity),
      TimeSlot.fromDate(new Date(project.end + 'T00:00:00Z'), ctx.params.periodicity)
    )
  ).map(ts => ts.value);

  // create the excel file
  let workbook = new Excel.Workbook();
  // the Global tab will have the information of all sites combined
  let worksheet = workbook.addWorksheet('Global');

  // set the columns of the sheet with the right header and key
  worksheet.columns = [{header: '', key: 'name'}].concat(timeColumns.map(name => {
    return {
      header: name,
      key: name
    }
  }));

  // force the columns to be at least as long as their header row.
  // Have to take this approach because ExcelJS doesn't have an autofit property.
  worksheet.columns.forEach(column => {
      column.width = column.header.length < 12 ? 12 : column.header.length
  })

  
  // combine all the lists into one
  let allCompleteIndicators = [].concat(logiFrameCompleteIndicators, crossCuttingCompleteIndicators, extraCompleteIndicators, dataSourcesCompleteIndicators);

  // Adding the data
  for (let e of allCompleteIndicators){
    // Note: in Excel the rows are 1 based, meaning the first row is 1 instead of 0.
    // row 1 is the header.
    // const rowIndex = index + 2;

    // By using destructuring we can easily dump all of the data into the row without doing much
    // We can add formulas pretty easily by providing the formula property.
    let row;

    // if it has a computation (is an indicator) we get the values and put dump in the sheet
    if (e.computation !== undefined){
      // get values
      // when no filter is provided it means we want data from all sites
      let res = await indicatorToRow(ctx, e.computation, e.display);
      // Dump all the data into Excel
      row = worksheet.addRow(res);

      if (e.outlineLevel !== undefined){
        row.outlineLevel = e.outlineLevel;
      }
      if (e.hidden !== undefined){
        row.hidden = e.hidden
      }
    }
    // if the row is a section header 
    else {
      // Dump all the data into Excel
      row = worksheet.addRow(e);
      // apply the styles
      row.fill = e.fill;
      row.font = e.font;
    }
  };

  // iterates over the sites
  for (let site of project.entities){
    // creating a tab for each site
    let newWorksheet = workbook.addWorksheet(site.name);
    newWorksheet.columns = [{header: '', key: 'name'}].concat(timeColumns.map(name => {
      return {
        header: name,
        key: name
      }
    }));

    // force the columns to be at least as long as their header row.
    newWorksheet.columns.forEach(column => {
      column.width = column.header.length < 12 ? 12 : column.header.length
    })
  
    // create a custom filter to get only the data relate to that specific site
    let customFilter = { entity: [site.id] };

    for (let e of allCompleteIndicators){
      let row;
      if (e.computation !== undefined){
        let res = await indicatorToRow(ctx, e.computation, e.display, customFilter);
        row = newWorksheet.addRow(res);
      } else {
        row = newWorksheet.addRow(e);
        row.fill = e.fill;
        row.font = e.font;
      }
    }
  }
  
  ctx.set('Content-disposition', `attachment; filename=Project.xlsx`);
  ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  
  await workbook.xlsx.writeFile('Project.xlsx');

  // Write to memory, buffer
  const buffer = await workbook.xlsx.writeBuffer()

  ctx.body = buffer;
});

export default router;
