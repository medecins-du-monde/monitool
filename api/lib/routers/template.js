import Router from 'koa-router';
import Input from "../resource/model/input";
import Project from '../resource/model/project';

const router = new Router();
const Excel = require('exceljs');
const fs = require('fs');

const header = {
  // gray background
  fill: {
    type: 'pattern',
    pattern:'solid',
    fgColor:{argb:'eeeeee'}
  },
  // bold and bigger font
  font: {
    name: 'Calibri',
    size: 12,
    bold: true
  }
}

/**
 * Render a PDF file containing a sample paper form (for a datasource).
 */
router.get('/resources/project/:id/data-source/:dataSourceId.xlsx/:siteId?/:period?', async ctx => {
    if (!ctx.visibleProjectIds.has(ctx.params.id))
        throw new Error('forbidden');
        
    console.log(`\nStart download for template...\n`);

    const project = await Project.storeInstance.get(ctx.params.id);
    const dataSource = project.getDataSourceById(ctx.params.dataSourceId);

    let input = undefined;
    let site = undefined;
    if (ctx.params.siteId && ctx.params.period) {
      const inputId = 'input:' + ctx.params.id + ":" + ctx.params.dataSourceId + ":" + ctx.params.siteId + ":" + ctx.params.period;
      input = await Input.storeInstance.get(inputId);
      site = project.entities.find(ent => ent.id === ctx.params.siteId);
    }

    // Set filename;
    let filename = truncateString(project.name, 25) + ' - ' + truncateString(dataSource.name || 'data-source', 25);

    if (input) {
      filename += ' - ' + truncateString(site.name, 25) + ' - ' + input.period + '.xlsx';
    } else {
      filename += ' template.xlsx';
    }

    if (fs.existsSync(filename)) {
        fs.unlinkSync(filename, (err) => console.log(err));
    }

    // create the excel file
    const writeStream = fs.createWriteStream(`${filename}`, { flags: 'w' });
    const options = {
        stream: writeStream,
        useStyles: true,
        useSharedStrings: true
    };

    let workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Monitool';
    workbook.lastModifiedBy = 'Monitool';
    workbook.created = new Date();
    let worksheet = workbook.addWorksheet((site ? site.name.replace(/[\/\\\?\*\[\]]/g, '-') : 'Collection site'), {views: [{showGridLines: false}], properties: {defaultColWidth: 20}});

    // For every variable of the form
    for (const element of dataSource.elements) {

      const cols = [];
      const rows = [];

      let numberCols = 0;
      let numberRows = 0;

      // calculates the total number of rows and cols of the table based on the number of partitions
      // let i = 0;

      // element.distribution is the number of partitions that are going to form rows in the table
      // the first partitions are rows, the last partitions are cols
      // the number represented by element.distribution says how many of the first partitions are rows

      // we loop through the partitions that are going to be rows
      for (let i = 0; i < element.distribution; i += 1) {
        rows.push(element.partitions[i]);
        if (numberRows === 0) { numberRows = 1; }
        numberRows *= element.partitions[i].elements.length;
      }
      // we loop through the remaining partition, they are going to form cols
      for (let i = element.distribution; i < element.partitions.length; i += 1) {
        cols.push(element.partitions[i]);
        if (numberCols === 0) { numberCols = 1; }
        numberCols *= element.partitions[i].elements.length;
      }

      numberRows = numberRows + cols.length + 1;
      numberCols = numberCols + rows.length + 1;

      const table = [];
      const numberValueRows = numberRows - cols.length - (rows.length > 0 ? 1 : 0); // Number of value rows (without headers and total)
      const numberValueColumns = numberCols - rows.length - (cols.length > 0 ? 1 : 0); // Number of column rows (without headers and total)

      for (let i = 0; i < numberRows; i += 1) {
        table.push([]);
        const currentRow = i - cols.length; // Current row (Starts from 1)
        
        for (let j = 0; j < numberCols; j += 1) {
          const currentColumn = j - rows.length; // Current column (Starts from 1)
          // leave the cells on the top-left corner empty
          if (currentRow < 0 || currentColumn < 0) {
            table[i].push('');
          }
          // Get the values from the existing input
          else if (input && input.values[element.id] && currentRow < numberValueRows &&  currentColumn < numberValueColumns) {
            const rawValue = input.values[element.id][currentRow * numberValueColumns + currentColumn];
            table[i].push(rawValue === null || rawValue === undefined ? '' : rawValue);
          }
          // Set the total formulas
          else if (currentRow === numberValueRows || currentColumn === numberValueColumns) {
            // let sum = '';
            // Last row, means the total will be from all the table rows for that column
            if (currentRow === numberValueRows) {
              table[i].push('totalCol');
            // Last column, means the total will be from all the table columns for that row
            } else {
              table[i].push('totalRow');
            }
          }
          // Fill everything else with empty cells
          else {
            table[i].push('');
          }
        }
      }

      // let worksheet = workbook.addWorksheet(element.name, {views:[{state: 'frozen', xSplit: rows.length, ySplit: cols.length}]});
      // worksheet.columns = Array(numberCols).fill().map((e, i) => ({key: i * 1, width: 20}));

      let tableNameRow = worksheet.addRow([element.name]);
      tableNameRow.fill = header.fill;
      tableNameRow.font = { bold: true };
      tableNameRow.border = {
        bottom: {style:'double'},
      }
      worksheet.addRow([]);

      fillColumnLabels(rows, cols, table);
      fillRowLabels(rows, cols, table);
      fillTotalLabels(rows, cols, table, numberCols, numberRows);

      let rowlength = worksheet.getColumn(1)['_worksheet']['_rows'].length;
      for (let [i, value] of table.entries()) {
        value = value.map((cellVal, j) => {
          if (cellVal === 'totalRow') {
            cellVal = {formula: getTotalFormula(getCellRangeFromTable(rows.length, rowlength + i, j - 1, rowlength + i), 'sum')};
          }
          if (cellVal === 'totalCol') {
            cellVal = {formula: getTotalFormula(getCellRangeFromTable(j, rowlength + cols.length, j, rowlength + i - 1), 'sum')};
          }
          return cellVal;
        })
        let row = worksheet.addRow(value);
        row.eachCell({ includeEmpty: true }, (cell, colNum) => {
          cell.border = {
            top: {style:'thin', color: {argb: 'cccccc'}},
            left: {style:'thin', color: {argb: 'cccccc'}},
            bottom: {style:'thin', color: {argb: 'cccccc'}},
            right: {style:'thin', color: {argb: 'cccccc'}}
          };
          if (colNum <= rows.length || i < cols.length) {
            cell.fill = header.fill;
            cell.alignment = {wrapText: true, vertical: 'top', horizontal: 'left'};
          }
          if ((cols.length > 0 && colNum === value.length) || (rows.length > 0 && i === table.length - 1)) {
            cell.font = header.font;
          }
        });
      }

      worksheet.addRow([]);
      worksheet.addRow([]);
    }

    await workbook.commit();
    
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
});

const fillTotalLabels = (rows, cols, table, numberCols, numberRows) => {
    if (cols.length > 0) {
        const y = numberCols - 1;
        for (let x = 0; x < cols.length; x += 1) {
            table[x][y] = 'Total';
        }
    }
    if (rows.length > 0) {
        const x = numberRows - 1;
        for (let y = 0; y < rows.length; y += 1) {
            table[x][y] = 'Total';
        }
    }
}

const fillRowLabels = (rows, cols, table) => {
    let x = cols.length;
    let y = 0;
    
    const fillCurrentRowLabel = (rows, cols, pos) => {
        if (pos >= rows.length) { return; }
        if (pos === rows.length - 1) {
            for (const e of rows[pos].elements) {
            table[x][y] = e.name;
            x += 1;
            }
            return;
        }

        for (const e of rows[pos].elements) {
            table[x][y] = e.name;
            y += 1;

            fillCurrentRowLabel(rows, cols, pos + 1);
            y -= 1;
        }
    }

    fillCurrentRowLabel(rows, cols, 0);
}

const fillColumnLabels = (rows, cols, table) => {
    let x = 0;
    let y = rows.length;

    const fillCurrentColLabel = (cols, pos) => {
        if (pos >= cols.length) { return; }
        if (pos === cols.length - 1) {
            for (const e of cols[pos].elements) {
                table[x][y] = e.name;
                y += 1;
            }
            return;
        }

        for (const e of cols[pos].elements) {
            table[x][y] = e.name;
            x += 1;
            fillCurrentColLabel(cols, pos + 1);
            x -= 1;
        }
    }

    fillCurrentColLabel(cols, 0);
}

const getTotalFormula = (range, type) => {
  // Types = "sum", "average", "highest", "lowest", "last"
  switch (type) {
    case "sum":
      return `SUM(${range})`;
    case "average":
      return `AVERAGE(${range})`
    case "highest":
      return `MAX(${range})`
    case "lowest":
      return `MIN(${range})`
    case "last":
      return `${range.split(":")[1]}`
    default:
      return undefined
  }
}

const getCellRangeFromTable = (colStart, rowStart, colEnd, rowEnd) => {
  colStart = getColFromNumber(colStart);
  colEnd = getColFromNumber(colEnd);
  rowStart += 1;
  rowEnd += 1;
  return `${colStart}${rowStart}:${colEnd}${rowEnd}`;
}

const getColFromNumber = (col) => {
  let result = '';
  while (col >= 0) {
    const letter = String.fromCharCode(65 + (col % 26));
    result = letter + result;
    col = Math.floor(col / 26) - 1;
  }
  return result;
}

const truncateString = (str, num) => {
  if (str.length > num) {
    return str.replace(/\//g, "-").slice(0, num) + "...";
  } else {
    return str.replace(/\//g, "-");
  }
}

const logError = (prop, expected, received, name) => {
  console.log(
    `\n`,
    `INVALID ${prop.toUpperCase()} -> "${name}"`,
    `\n`,
    `Expected ${prop}: ${expected}`,
    `\n`,
    `Received ${prop}: ${received}`,
    `\n`
  );
}

const realParseFloat = (s) => {
    if (s == null || s === '') return null;
    s = s.toString().replace(/[^\d,.-]/g, ''); // strip everything except numbers, dots, commas and negative sign
    if (/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s)) // Matches #,###.######
    {
        s = s.replace(/,/g, ''); // strip out commas
        return parseFloat(s); // convert to number
    }
    else if (/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s)) // Not match #,###.###### and now matches #.###,########
    {
        s = s.replace(/\./g, ''); // strip out dots
        s = s.replace(/,/g, '.'); // replace comma with dot
        return parseFloat(s);
    }
    else // try #,###.###### anyway
    {
        s = s.replace(/,/g, ''); // strip out commas
        return parseFloat(s); // convert to number
    }
}

/**
 * Checks if the passed data has the correct structure to be imported and parse it.
 */
router.put('/resources/project/:id/data-source/:dataSourceId/:siteId/:period/check', async ctx => {
    if (!ctx.visibleProjectIds.has(ctx.params.id))
        throw new Error('forbidden');

    const body = ctx.request.body;
    if (!body || body.length <= 0)
      throw new Error('forbidden');

    const project = await Project.storeInstance.get(ctx.params.id);
    const dataSource = project.getDataSourceById(ctx.params.dataSourceId);

    // If the file has the bad number of sheets we return an error and stop the process.
    if (body.length !== 1) {
      logError('number of sheets', dataSource.elements.length, body.length, '');
      ctx.status = 404;
      
      ctx.body = [{
        error: 'Bad number of sheets',
        key: 'import.error.bad-number-of-sheets',
      }];
      return;
    }

    const result = {};
    let errors = [];

    // For every variable of the form
    for (let pos = 0; dataSource.elements[pos]; pos++) {
      const element = dataSource.elements[pos];

      const cols = [];
      const rows = [];

      let numberCols = 0;
      let numberRows = 0;
    
      const elementErrors = [];

      // calculates the total number of rows and cols of the table based on the number of partitions
      let i = 0;

      // element.distribution is the number of partitions that are going to form rows in the table
      // the first partitions are rows, the last partitions are cols
      // the number represented by element.distribution says how many of the first partitions are rows

      // we loop through the partitions that are going to be rows
      for (i = 0; i < element.distribution; i += 1) {
        rows.push(element.partitions[i]);
        if (numberRows === 0) { numberRows = 1; }
        numberRows *= element.partitions[i].elements.length;
      }
      // we loop through the remaining partition, they are going to form cols
      for (i = element.distribution; i < element.partitions.length; i += 1) {
        cols.push(element.partitions[i]);
        if (numberCols === 0) { numberCols = 1; }
        numberCols *= element.partitions[i].elements.length;
      }

      numberRows = numberRows + cols.length + 1;
      numberCols = numberCols + rows.length + 1;

      // Find table and limit
      const tableIndex = body[0].data.findIndex(data => data[0] === element.name);
      if (tableIndex < 0) {
        logError('Table', element.name);
        
        errors.push({
          error: 'No table for ' + element.name,
          key: 'import.error.no-table',
          extra: { element: element.name },
        });
        continue;
      }
      
      let tableStart;
      let tableEnd;

      for (let i = tableIndex + 1; i < body[0].data.length; i++) {
        if (!tableStart && body[0].data[i].length > 0) {
          tableStart = i;
        }
        if (tableStart && (!body[0].data[i + 1] || body[0].data[i + 1].length <= 0)) {
          tableEnd = i + 1;
          break;
        }
      }

      if (!tableStart || !tableEnd) {
        logError('Table', element.name);
        
        errors.push({
          error: 'Bad table for ' + element.name,
          key: 'import.error.bad-table',
          extra: { element: element.name },
        });
        continue;
      }

      const elementTable = body[0].data.slice(tableStart, tableEnd);

      const importRows = elementTable.length;

      if (numberRows !== importRows) {
        logError('rows', numberRows, importRows, element.name);
        elementErrors.push({
          error: 'Bad number of rows on table ' + element.name,
          key: 'import.error.bad-number-of-rows',
          extra: { element: element.name },
        });
      }
      
      const importCols = Math.max(...elementTable.map(row => row.length));

      if (importCols > numberCols) {
        logError('cols', numberCols, importCols, element.name);
        elementErrors.push({
          error: 'Bad number of cols on table ' + element.name,
          key: 'import.error.bad-number-of-cols',
          extra: { element: element.name },
        });
      }
      
      if (elementErrors.length > 0) {
        errors = errors.concat(elementErrors);
        continue;
      }

      const numberValueRows = numberRows - cols.length - (rows.length > 0 ? 1 : 0); // Number of value rows (without headers and total)
      const numberValueColumns = numberCols - rows.length - (cols.length > 0 ? 1 : 0); // Number of column rows (without headers and total)

      result[element.id] = [];

      for (let row = 0; row < numberValueRows; row++) {
        for (let col = 0; col < numberValueColumns; col++) {
          const cellValue = typeof elementTable[row + cols.length][col + rows.length] === 'undefined' ? null : elementTable[row + cols.length][col + rows.length];
          if (isNaN(cellValue)) {
            logError('value', 'A number', cellValue, element.name);
            elementErrors.push({
              error: 'Bad value on table ' + element.name,
              key: 'import.error.bad-value',
              extra: { element: element.name, row: row + cols.length + 1, col: col + rows.length + 1, value: cellValue },
            });
          } else {
            result[element.id].push(realParseFloat(cellValue));
          }
        }
      }

      if (elementErrors.length > 0) {
        errors = errors.concat(elementErrors);
      }
    }
    
    console.log(errors);
    if (errors.length > 0) {
      ctx.status = 404;
      
      ctx.body = errors;
      return;
    }

    ctx.response.body = result;
    return;
});

/**
 * Render a PDF file containing a sample paper form (for a datasource).
 */
router.get('/resources/project/:id/data-source-all-sites/:dataSourceId.xlsx/:period?', async ctx => {
    if (!ctx.visibleProjectIds.has(ctx.params.id))
        throw new Error('forbidden');
        
    console.log(`\nStart download for template...\n`);

    const project = await Project.storeInstance.get(ctx.params.id);
    const dataSource = project.getDataSourceById(ctx.params.dataSourceId);

    let sites = [];
    let inputs = [];

    for (let entity of dataSource.entities) {
      const site = project.entities.find(ent => ent.id === entity);

      if (site) {
        sites.push(site);
        if (ctx.params.period) {
          const inputId = 'input:' + ctx.params.id + ":" + ctx.params.dataSourceId + ":" + entity + ":" + ctx.params.period;
          await Input.storeInstance.get(inputId).then(input => {inputs.push(input);}).catch(() => {inputs.push(undefined);});
        }
      }
    }

    // Set filename;
    let filename = truncateString(project.name, 25) + ' - ' + truncateString(dataSource.name || 'data-source', 25);

    if (ctx.params.period) {
      filename += ' - ' + 'All sites' + ' - ' + ctx.params.period + '.xlsx';
    } else {
      filename += 'All sites template.xlsx';
    }

    if (fs.existsSync(filename)) {
        fs.unlinkSync(filename, (err) => console.log(err));
    }

    // create the excel file
    const writeStream = fs.createWriteStream(`${filename}`, { flags: 'w' });
    const options = {
        stream: writeStream,
        useStyles: true,
        useSharedStrings: true
    };

    let workbook = new Excel.stream.xlsx.WorkbookWriter(options);
    workbook.creator = 'Monitool';
    workbook.lastModifiedBy = 'Monitool';
    workbook.created = new Date();

    for (let [index, entity] of sites.entries()) {
      let worksheet = workbook.addWorksheet(entity.name.replace(/[\/\\\?\*\[\]]/g, '-'), {views: [{showGridLines: false}], properties: {defaultColWidth: 20}});
      const input = inputs.length > 0 ? inputs[index] : undefined;
      // For every variable of the form
      for (const element of dataSource.elements) {

        const cols = [];
        const rows = [];

        let numberCols = 0;
        let numberRows = 0;

        // calculates the total number of rows and cols of the table based on the number of partitions
        // let i = 0;

        // element.distribution is the number of partitions that are going to form rows in the table
        // the first partitions are rows, the last partitions are cols
        // the number represented by element.distribution says how many of the first partitions are rows

        // we loop through the partitions that are going to be rows
        for (let i = 0; i < element.distribution; i += 1) {
          rows.push(element.partitions[i]);
          if (numberRows === 0) { numberRows = 1; }
          numberRows *= element.partitions[i].elements.length;
        }
        // we loop through the remaining partition, they are going to form cols
        for (let i = element.distribution; i < element.partitions.length; i += 1) {
          cols.push(element.partitions[i]);
          if (numberCols === 0) { numberCols = 1; }
          numberCols *= element.partitions[i].elements.length;
        }

        numberRows = numberRows + cols.length + 1;
        numberCols = numberCols + rows.length + 1;

        const table = [];
        const numberValueRows = numberRows - cols.length - (rows.length > 0 ? 1 : 0); // Number of value rows (without headers and total)
        const numberValueColumns = numberCols - rows.length - (cols.length > 0 ? 1 : 0); // Number of column rows (without headers and total)

        for (let i = 0; i < numberRows; i += 1) {
          table.push([]);
          const currentRow = i - cols.length; // Current row (Starts from 1)
          
          for (let j = 0; j < numberCols; j += 1) {
            const currentColumn = j - rows.length; // Current column (Starts from 1)
            // leave the cells on the top-left corner empty
            if (currentRow < 0 || currentColumn < 0) {
              table[i].push('');
            }
            // Get the values from the existing input
            else if (input && input.values[element.id] && currentRow < numberValueRows &&  currentColumn < numberValueColumns) {
              const rawValue = input.values[element.id][currentRow * numberValueColumns + currentColumn];
              table[i].push(rawValue === null || rawValue === undefined ? '' : rawValue);
            }
            // Set the total formulas
            else if (currentRow === numberValueRows || currentColumn === numberValueColumns) {
              // let sum = '';
              // Last row, means the total will be from all the table rows for that column
              if (currentRow === numberValueRows) {
                table[i].push('totalCol');
              // Last column, means the total will be from all the table columns for that row
              } else {
                table[i].push('totalRow');
              }
            }
            // Fill everything else with empty cells
            else {
              table[i].push('');
            }
          }
        }

        // let worksheet = workbook.addWorksheet(element.name, {views:[{state: 'frozen', xSplit: rows.length, ySplit: cols.length}]});
        // worksheet.columns = Array(numberCols).fill().map((e, i) => ({key: i * 1, width: 20}));

        let tableNameRow = worksheet.addRow([element.name]);
        tableNameRow.fill = header.fill;
        tableNameRow.font = { bold: true };
        tableNameRow.border = {
          bottom: {style:'double'},
        }
        worksheet.addRow([]);

        fillColumnLabels(rows, cols, table);
        fillRowLabels(rows, cols, table);
        fillTotalLabels(rows, cols, table, numberCols, numberRows);

        let rowlength = worksheet.getColumn(1)['_worksheet']['_rows'].length;
        for (let [i, value] of table.entries()) {
          value = value.map((cellVal, j) => {
            if (cellVal === 'totalRow') {
              cellVal = {formula: getTotalFormula(getCellRangeFromTable(rows.length, rowlength + i, j - 1, rowlength + i), 'sum')};
            }
            if (cellVal === 'totalCol') {
              cellVal = {formula: getTotalFormula(getCellRangeFromTable(j, rowlength + cols.length, j, rowlength + i - 1), 'sum')};
            }
            return cellVal;
          })
          let row = worksheet.addRow(value);
          row.eachCell({ includeEmpty: true }, (cell, colNum) => {
            cell.border = {
              top: {style:'thin', color: {argb: 'cccccc'}},
              left: {style:'thin', color: {argb: 'cccccc'}},
              bottom: {style:'thin', color: {argb: 'cccccc'}},
              right: {style:'thin', color: {argb: 'cccccc'}}
            };
            if (colNum <= rows.length || i < cols.length) {
              cell.fill = header.fill;
              cell.alignment = {wrapText: true, vertical: 'top', horizontal: 'left'};
            }
            if ((cols.length > 0 && colNum === value.length) || (rows.length > 0 && i === table.length - 1)) {
              cell.font = header.font;
            }
          });
        }

        worksheet.addRow([]);
        worksheet.addRow([]);
      }
        
      await worksheet.commit();
    }

    await workbook.commit();
    
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
});

export default router;