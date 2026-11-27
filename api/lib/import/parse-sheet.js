import {getTableLayout, fillColumnLabels, fillRowLabels} from './sheet-layout';

// Reporting cubes store values in an Int32Array (olap/cube.js): larger values would wrap.
const MAX_VALUE = 2147483647;

const isBlank = cell => cell === null || cell === undefined || (typeof cell === 'string' && cell.trim() === '');
const isBlankRow = row => !row || row.every(isBlank);
const cellText = cell => isBlank(cell) ? '' : String(cell).trim();

const columnLetter = col => {
    let result = '';
    for (let n = col; n >= 0; n = Math.floor(n / 26) - 1)
        result = String.fromCharCode(65 + (n % 26)) + result;
    return result;
};

/**
 * Whole, non-negative numbers only. Returns null for an empty cell, and undefined if the cell is invalid.
 */
export const readCellValue = cell => {
    if (isBlank(cell))
        return null;

    let value;
    if (typeof cell === 'number')
        value = cell;
    else if (typeof cell === 'string' && /^\d+$/.test(cell.trim()))
        value = Number(cell.trim());
    else
        return undefined;

    return Number.isInteger(value) && value >= 0 && value <= MAX_VALUE ? value : undefined;
};

const outsideTableError = (rows, from, to, errors) => {
    for (let i = from; i < to; i++)
        if (!isBlankRow(rows[i])) {
            errors.push({key: 'import.error.content-outside-table', extra: {row: i + 1}});
            return;
        }
};

const checkLabels = (element, layout, rows, tableStart, errors) => {
    const {rows: rowPartitions, cols: colPartitions, numberRows, numberCols} = layout;

    const expected = [];
    for (let x = 0; x < numberRows; x++)
        expected.push(new Array(numberCols).fill(''));
    fillColumnLabels(rowPartitions, colPartitions, expected);
    fillRowLabels(rowPartitions, colPartitions, expected);

    for (let x = 0; x < numberRows; x++)
        for (let y = 0; y < numberCols; y++) {
            const isLabel = x < colPartitions.length || y < rowPartitions.length;
            const isTotal = (colPartitions.length > 0 && y === numberCols - 1) || (rowPartitions.length > 0 && x === numberRows - 1);
            if (!isLabel || isTotal)
                continue;

            const row = rows[tableStart + x] || [];
            if (cellText(row[y]) !== cellText(expected[x][y])) {
                errors.push({
                    key: 'import.error.bad-header',
                    extra: {element: element.name, row: tableStart + x + 1, col: columnLetter(y), expected: expected[x][y], value: cellText(row[y])}
                });
                return false;
            }
        }

    return true;
};

/**
 * Read one sheet of a multi-site workbook, strictly following the layout of the all-sites export.
 *
 * @param {DataSource} dataSource
 * @param {Array.<Array>} rows Rows of the sheet (XLSX.utils.sheet_to_json with {header: 1}).
 * @return {{values: Object, errors: Array}} values by variable id, in the same order as Input.values.
 */
export default function parseSheet(dataSource, rows) {
    const values = {};
    const errors = [];

    // End of the previous table: titles are searched from here so that duplicate variable
    // names, or a row label equal to a variable's name, can't be mistaken for a title.
    let cursor = 0;
    let inSync = true;

    for (const element of dataSource.elements) {
        const name = cellText(element.name);
        let title = -1;
        for (let i = cursor; i < rows.length && title < 0; i++) {
            const row = rows[i] || [];
            if (cellText(row[0]) === name && row.slice(1).every(isBlank))
                title = i;
        }

        if (title < 0) {
            errors.push({key: 'import.error.no-table', extra: {element: element.name}});
            inSync = false;
            continue;
        }

        if (inSync)
            outsideTableError(rows, cursor, title, errors);
        inSync = true;

        const layout = getTableLayout(element);
        const tableStart = title + 2;
        cursor = tableStart + layout.numberRows;

        if (!isBlankRow(rows[title + 1])) {
            errors.push({key: 'import.error.bad-table', extra: {element: element.name}});
            continue;
        }

        let isValid = checkLabels(element, layout, rows, tableStart, errors);

        for (let x = 0; x < layout.numberRows; x++) {
            const row = rows[tableStart + x] || [];
            if (row.slice(layout.numberCols).some(cell => !isBlank(cell))) {
                errors.push({key: 'import.error.bad-number-of-cols', extra: {element: element.name}});
                isValid = false;
                break;
            }
        }

        const elementValues = [];
        for (let x = 0; x < layout.numberValueRows; x++) {
            const rowIndex = tableStart + layout.cols.length + x;
            const row = rows[rowIndex] || [];

            for (let y = 0; y < layout.numberValueColumns; y++) {
                const colIndex = layout.rows.length + y;
                const value = readCellValue(row[colIndex]);

                if (value === undefined) {
                    errors.push({
                        key: 'import.error.not-whole-number',
                        extra: {element: element.name, row: rowIndex + 1, col: columnLetter(colIndex), value: String(row[colIndex])}
                    });
                    isValid = false;
                }
                else
                    elementValues.push(value);
            }
        }

        if (isValid)
            values[element.id] = elementValues;
    }

    if (inSync)
        outsideTableError(rows, cursor, rows.length, errors);

    return {values, errors};
}
