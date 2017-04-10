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

var validator = require('is-my-json-valid'),
	Model     = require('./model'),
	schema    = require('../schema/logical-frame.json');

var validate = validator(schema);

class LogicalFrame extends Model {

	constructor(data, project) {
		super(data, validate);

		this._project = project;
	}

	getPdfDocDefinition(pageOrientation) {
		var doc = {};
		doc.pageSize = "A4";
		doc.pageOrientation = pageOrientation;

		doc.content = [
			{text: this.name, style: 'header3'}
		];

		var table = {
			headersRows: 1,
			width: ['auto', 'auto', 'auto', 'auto'],
			body: [
				[
					{text: "Intervention logic", style: "bold"},
					{text: "Indicators", style: "bold"},
					{text: "Sources of verification", style: "bold"},
					{text: "Assumptions", style: "bold"}
				]
			]
		};

		table.body.push([
			[
				{text: "Goal", style: "bold"},
				{text: this.goal, style: 'normal'}
			],
			{ul: this.indicators.map(i => i.display), style: 'normal'},
			{ul: this._computeSources(this.indicators), style: 'normal'},
			""
		]);

		this.purposes.forEach(function(purpose, purposeIndex) {
			table.body.push([
				[
					{text: "Purpose " + (this.purposes.length > 1 ? " " + (purposeIndex + 1) : ""), style: "bold"},
					{text: purpose.description, style: 'normal'}
				],
				{ul: purpose.indicators.map(i => i.display), style: 'normal'},
				{ul: this._computeSources(purpose.indicators), style: 'normal'},
				{text: purpose.assumptions, style: 'normal'}
			]);
		}, this);

		this.purposes.forEach(function(purpose, purposeIndex) {
			purpose.outputs.forEach(function(output, outputIndex) {
				table.body.push([
					[
						{text: "Output " + (this.purposes.length > 1 ? " " + (purposeIndex + 1) + '.' : "") + (outputIndex + 1), style: "bold"},
						{text: output.description, style: 'normal'}
					],
					{ul: output.indicators.map(i => i.display), style: 'normal'},
					{ul: this._computeSources(output.indicators), style: 'normal'},
					{text: output.assumptions, style: 'normal'}
				]);
			}, this);
		}, this);

		doc.content.push({table: table});
		return doc;
	}

	_computeSources(indicators) {
		var sources = {};

		indicators.forEach(function(indicator) {
			if (indicator.computation) {
				for (var key in indicator.computation.parameters) {
					var elementId = indicator.computation.parameters[key].elementId,
						form = this._project.forms.find(function(form) {
							return !!form.elements.find(el => el.id === elementId);
						}),
						element = form.elements.find(el => el.id === elementId);

					if (!sources[form.name])
						sources[form.name] = {};

					sources[form.name][element.name] = true;
				}
			}
		}, this);

		return Object.keys(sources).map(function(source) {
			return [source, {ol: Object.keys(sources[source]), style: 'italic'}];
		});
	}

}


module.exports = LogicalFrame;
