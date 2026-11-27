/**
 * Layout of a variable's table in the data entry workbooks.
 *
 * The first `element.distribution` partitions are rows, the others are columns.
 * Row and column counts include label rows, label columns and totals.
 */
export const getTableLayout = element => {
    const rows = element.partitions.slice(0, element.distribution);
    const cols = element.partitions.slice(element.distribution);
    const product = partitions => partitions.reduce((m, p) => m * p.elements.length, 1);

    const numberRows = (rows.length ? product(rows) : 0) + cols.length + 1;
    const numberCols = (cols.length ? product(cols) : 0) + rows.length + 1;

    return {
        rows,
        cols,
        numberRows,
        numberCols,
        numberValueRows: numberRows - cols.length - (rows.length > 0 ? 1 : 0),
        numberValueColumns: numberCols - rows.length - (cols.length > 0 ? 1 : 0)
    };
};

export const fillTotalLabels = (rows, cols, table, numberCols, numberRows) => {
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
};

export const fillRowLabels = (rows, cols, table) => {
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
    };

    fillCurrentRowLabel(rows, cols, 0);
};

export const fillColumnLabels = (rows, cols, table) => {
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
    };

    fillCurrentColLabel(cols, 0);
};
