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

    // Set filename;
    let filename = (dataSource.name || 'data-source') + '.xlsx';

    if (fs.existsSync(filename)) {
        fs.unlinkSync(filename, (err) => console.log(err));
    }

    let input = undefined;
    if (ctx.params.siteId && ctx.params.period) {
      input = await Input.storeInstance.get(ctx.params.id, ctx.params.dataSourceId, ctx.params.siteId, ctx.params.period, true);
    }

    // create the excel file
    const writeStream = fs.createWriteStream(`${filename}`, { flags: 'w' });
    const options = {
        stream: writeStream,
        useStyles: true,
        useSharedStrings: true
    };

    let workbook = new Excel.stream.xlsx.WorkbookWriter(options);

    // For every variable of the form
    for (const element of dataSource.elements) {

      const cols = [];
      const rows = [];

      let numberCols = 0;
      let numberRows = 0;

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

      const table = [];
      const numberValueRows = numberRows - cols.length - (rows.length > 0 ? 1 : 0); // Number of value rows (without headers and total)
      const numberValueColumns = numberCols - rows.length - (cols.length > 0 ? 1 : 0); // Number of column rows (without headers and total)

      for (i = 0; i < numberRows; i += 1) {
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
            table[i].push(input.values[element.id][currentRow * numberValueColumns + currentColumn]);
          }
          // Set the total formulas
          else if (currentRow === numberValueRows || currentColumn === numberValueColumns) {
            let sum = '';
            if (currentRow === numberValueRows) {
              sum += getCellFromTable(j, cols.length, j, numberRows - 2);
            }
            if (currentColumn === numberValueColumns) {
              if (sum !== '') {
                sum += ', ';
              }
              sum += getCellFromTable(rows.length, i, numberCols - 2, i);
            }
            table[i].push({formula: `SUM(${sum})`});
          }
          // Fill everything else with empty cells
          else {
            table[i].push(null);
          }
        }
      }

      let worksheet = workbook.addWorksheet(element.name, {views:[{state: 'frozen', xSplit: rows.length, ySplit: cols.length}]});
      worksheet.columns = Array(numberCols).fill().map((e, i) => ({key: i * 1, width: 20}));

      fillCollumnLabels(rows, cols, table);
      fillRowLabels(rows, cols, table);
      fillTotalLabels(rows, cols, table, numberCols, numberRows);

      for (let value of table) {
        let row = worksheet.addRow(value);
      }

      // Merge headers rows
      for (let i = 0; i < rows.length;) {
        i++;
        const col = worksheet.getColumn(i);
        let lastCell = { index: cols.length, val: ''};
        col.eachCell((cell, index) => {
            if (index <= cols.length) return;
            const value = cell.value;
            cell.fill = header.fill;
            if (value !== '' && value !== lastCell.val) {
                if (lastCell.index < index - 1) {
                    worksheet.mergeCells(lastCell.index, i, index - 1, i);
                }
                lastCell = { index: index, val: value };
            }
        })
      }
      
      // Merge header columns
      for (let i = 0; i < cols.length;) {
        i++;
        const row = worksheet.getRow(i);
        let lastCell = { index: rows.length, val: ''};
        row.eachCell((cell, index) => {
            if (index <= rows.length) return;
            const value = cell.value;
            if (value !== '' && value !== lastCell.val) {
                if (lastCell.index < index - 1) {
                    worksheet.mergeCells(i, lastCell.index, i, index - 1);
                }
                lastCell = { index: index, val: value };
            }
        })
        row.fill = header.fill;
      }

      worksheet.commit();
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

const fillCollumnLabels = (rows, cols, table) => {
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

const getCellFromTable = (colStart, rowStart, colEnd, rowEnd) => {
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

export default router;