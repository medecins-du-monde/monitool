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


import Router from 'koa-router';
import PdfPrinter from 'pdfmake';

import Project from '../resource/model/project';

const router = new Router();


/**
 * More boilerplate needed to start-up pdfmake
 */
const styles = {
	header: {
		fontSize: 16,
		bold: true,
		alignment: 'center',
		margin: [100, 0, 100, 0]
	},
	header3: {
		fontSize: 16,
		bold: true,
		alignment: 'center',
		margin: [0, 0, 0, 10]
	},
	header2: {
		fontSize: 14,
		bold: true,
		margin: [0, 15, 0, 0]
	},
	variableName: {
		fontSize: 10,
		bold: true,
		margin: [0, 10, 0, 5]
	},
	bold: {
		bold: true
	},
	normal: {
		fontSize: 9
	},
	italic: {
		fontSize: 9,
		italics: true,
		margin: [10, 0, 0, 0]
	}
};

/**
 * Create preconfigured printer
 */
const printer = new PdfPrinter({
	Roboto: {
		normal: 'node_modules/roboto-fontface/fonts/Roboto/Roboto-Regular.ttf',
		bold: 'node_modules/roboto-fontface/fonts/Roboto/Roboto-Medium.ttf',
		italics: 'node_modules/roboto-fontface/fonts/Roboto/Roboto-RegularItalic.ttf',
		bolditalics: 'node_modules/roboto-fontface/fonts/Roboto/Roboto-MediumItalic.ttf'
	}
});


/**
 * Render a PDF file describing the given logical frame.
 */
router.get('/resources/project/:id/logical-frame/:index.pdf', async ctx => {
	const [project, visibleIds] = await Promise.all([
		Project.storeInstance.get(ctx.params.id),
		Project.storeInstance.listVisibleIds(ctx.state.user)
	]);

	if (visibleIds.indexOf(project._id) === -1)
		throw new Error('forbidden');

	// Create document definition.
	const logicalFrame = project.logicalFrames[ctx.params.index];
	const docDef = logicalFrame.getPdfDocDefinition(request.query.orientation, project.forms);
	docDef.styles = styles;

	// Send to user.
	ctx.response.type = 'application/pdf';
	ctx.response.body = printer.createPdfKitDocument(docDef);
});


/**
 * Render a PDF file containing a sample paper form (for a datasource).
 */
router.get('/resources/project/:id/data-source/:dataSourceId.pdf', async ctx => {
	const [project, visibleIds] = await Promise.all([
		Project.storeInstance.get(ctx.params.id),
		Project.storeInstance.listVisibleIds(ctx.state.user)
	]);

	if (visibleIds.indexOf(project._id) === -1)
		throw new Error('forbidden');

	// Create document definition.
	let docDef = project
		.getDataSourceById(ctx.params.dataSourceId)
		.getPdfDocDefinition(request.query.orientation);

	docDef.styles = styles;

	// Send to user.
	ctx.response.type = 'application/pdf';
	ctx.response.body = printer.createPdfKitDocument(docDef);
});

export default router;
