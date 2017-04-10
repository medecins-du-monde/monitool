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

"use strict";

const express = require('express'),
	  Project = require('../resource/model/project'),
	  PdfPrinter = require('pdfmake');

/**
 * Boilerplate needed to start-up pdfmake
 */
const fontDescriptors = {
	Roboto: {
		normal: 'node_modules/roboto-fontface/fonts/Roboto/Roboto-Regular.ttf',
		bold: 'node_modules/roboto-fontface/fonts/Roboto/Roboto-Medium.ttf',
		italics: 'node_modules/roboto-fontface/fonts/Roboto/Roboto-RegularItalic.ttf',
		bolditalics: 'node_modules/roboto-fontface/fonts/Roboto/Roboto-MediumItalic.ttf'
	}
};

/**
 * More boilerplate needed to start-up pdfmake
 */
const styles = {
	header: {
		fontSize: 22,
		bold: true,
		alignment: 'center',
		margin: [100, 0, 100, 0]
	},
	header3: {
		fontSize: 22,
		bold: true,
		alignment: 'center',
		margin: [0, 0, 0, 10]
	},
	header2: {
		fontSize: 18,
		bold: true,
		margin: [0, 15, 0, 0]
	},
	variableName: {
		fontSize: 12,
		bold: true,
		margin: [0, 10, 0, 5]
	},
	bold: {
		bold: true
	},
	normal: {
		fontSize: 11
	},
	italic: {
		fontSize: 11,
		italics: true,
		margin: [10, 0, 0, 0]
	}
};


module.exports = express.Router()

	/**
	 * Render a PDF file describing the given logical frame.
	 */
	.get('/project/:id/logical-frame/:index.pdf', function(request, response) {
		// This document is not accessible to partners with no access to this project.
		if (request.user.type == 'partner' && request.params.id !== request.user.projectId)
			return response.jsonError(new Error('forbidden'));
		
		Project.storeInstance.get(request.params.id)
			.then(function(project) {
				// Create document definition.
				let docDef = project.logicalFrames[request.params.index].getPdfDocDefinition(request.query.orientation);
				docDef.styles = styles;

				// Transform definition to pdf stream.
				var printer = new PdfPrinter(fontDescriptors);
				var doc = printer.createPdfKitDocument(docDef);

				// Send to user.
				response.header("Content-Type", 'application/pdf');
				doc.pipe(response);
				doc.end();
			})
			.catch(function(error) {
				// Should we give a PDF document instead of JSON error?
				response.jsonError(error);
			});
	})

	/**
	 * Render a PDF file containing a sample paper form (for a datasource).
	 */
	.get('/project/:id/data-source/:dataSourceId.pdf', function(request, response) {
		// This document is not accessible to partners with no access to this project.
		if (request.user.type == 'partner' && request.params.id !== request.user.projectId)
			return response.jsonError(new Error('forbidden'));
		
		Project.storeInstance.get(request.params.id)
			.then(function(project) {
				// Create document definition.
				let docDef = project.getDataSourceById(request.params.dataSourceId).getPdfDocDefinition(request.query.orientation);
				docDef.styles = styles;

				// Transform definition to pdf stream.
				var printer = new PdfPrinter(fontDescriptors);
				var doc = printer.createPdfKitDocument(docDef);

				// Send to user.
				response.header("Content-Type", 'application/pdf');
				doc.pipe(response);
				doc.end();
			})
			.catch(function(error) {
				// Should we give a PDF document instead of JSON error?
				response.jsonError(error);
			});
	});

