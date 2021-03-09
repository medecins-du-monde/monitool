const Router = require('koa-router');
const Excel = require('exceljs')

const router = new Router();

/** Render file containing all data entry up to a given date */
router.get('/export/:projectId/:periodicity', async ctx => {

    const stuff = [{
        firstName: 'John',
        lastName: 'Bailey',
        purchasePrice: 1000,
        paymentsMade: 100
      }, {
        firstName: 'Leonard',
        lastName: 'Clark',
        purchasePrice: 1000,
        paymentsMade: 150
      }, {
        firstName: 'Phil',
        lastName: 'Knox',
        purchasePrice: 1000,
        paymentsMade: 200
      }, {
        firstName: 'Sonia',
        lastName: 'Glover',
        purchasePrice: 1000,
        paymentsMade: 250
      }, {
        firstName: 'Adam',
        lastName: 'Mackay',
        purchasePrice: 1000,
        paymentsMade: 350
      }, {
        firstName: 'Lisa',
        lastName: 'Ogden',
        purchasePrice: 1000,
        paymentsMade: 400
      }, {
        firstName: 'Elizabeth',
        lastName: 'Murray',
        purchasePrice: 1000,
        paymentsMade: 500
      }, {
        firstName: 'Caroline',
        lastName: 'Jackson',
        purchasePrice: 1000,
        paymentsMade: 350
      }, {
        firstName: 'Kylie',
        lastName: 'James',
        purchasePrice: 1000,
        paymentsMade: 900
      }, {
        firstName: 'Harry',
        lastName: 'Peake',
        purchasePrice: 1000,
        paymentsMade: 1000
      }];

    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet('Global');

    worksheet.columns = [
        {header: 'First Name', key: 'firstName'},
        {header: 'Last Name', key: 'lastName'},
        {header: 'Purchase Price', key: 'purchasePrice'},
        {header: 'Payments Made', key: 'paymentsMade'},
        {header: 'Amount Remaining', key: 'amountRemaining'},
        {header: '% Remaining', key: 'percentRemaining'}
      ]

    // force the columns to be at least as long as their header row.
    // Have to take this approach because ExcelJS doesn't have an autofit property.
    worksheet.columns.forEach(column => {
        column.width = column.header.length < 12 ? 12 : column.header.length
    })

    // Make the header bold.
    // Note: in Excel the rows are 1 based, meaning the first row is 1 instead of 0.
    worksheet.getRow(1).font = {bold: true}

    // Adding the data
    // Dump all the data into Excel
    stuff.forEach((e, index) => {
    // row 1 is the header.
    const rowIndex = index + 2

    // By using destructuring we can easily dump all of the data into the row without doing much
    // We can add formulas pretty easily by providing the formula property.
    worksheet.addRow({ e })
    })
    
    ctx.set('Content-disposition', `attachment; filename=Project.xlsx`);
    ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    await workbook.xlsx.writeFile('Project.xlsx');

    // Write to memory, buffer
    const buffer = await workbook.xlsx.writeBuffer()

    ctx.body = buffer;
});

export default router;
