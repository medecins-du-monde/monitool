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

import angular from 'angular';
import c3css from '!css-loader!c3/c3.min.css';

const module = angular.module(
	'monitool.components.shared.reporting.export-svg',
	[
	]
);

module.component('exportSvg', {
	bindings: {
		filename: '<'
	},
	template: require('./export-svg.html'),
	controller: class ExportSvgController {

		onClick() {
			var sourceSVG = document.querySelector("svg");

			this._saveSvgAsPng(sourceSVG, this.filename + '.png' || 'file.png', 1);
		}

		_saveSvgAsPng(el, name, scaleFactor) {
			const uri = this._svgAsDataUri(el, scaleFactor)

			var image = new Image();
			image.src = uri;
			image.onload = function() {
				var canvas = document.createElement('canvas');
				canvas.width = image.width;
				canvas.height = image.height;
				var context = canvas.getContext('2d');
				context.drawImage(image, 0, 0);

				var a = document.createElement('a');
				a.download = name;
				a.href = canvas.toDataURL('image/png');
				document.body.appendChild(a);
				a.click();
			}
		}

		_svgAsDataUri(el, scaleFactor) {
			scaleFactor = scaleFactor || 1;

			// from "https://github.com/exupero/saveSvgAsPng.git#gh-pages"
			var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

			var s = document.createElement('style');
			s.setAttribute('type', 'text/css');
			s.innerHTML =
				'<![CDATA[\nsvg{background-color:white}' +
				c3css.toString().replace(/\.c3/g, '')
				+ "\n]]>";

			var outer  = document.createElement("div"),
				clone  = el.cloneNode(true),
				width  = parseInt(clone.getAttribute('width') || clone.style.width || out$.getComputedStyle(el).getPropertyValue('width')),
				height = parseInt(clone.getAttribute('height') || clone.style.height || out$.getComputedStyle(el).getPropertyValue('height')),
				xmlns  = "http://www.w3.org/2000/xmlns/";

			clone.setAttribute("version", "1.1");
			clone.setAttributeNS(xmlns, "xmlns", "http://www.w3.org/2000/svg");
			clone.setAttributeNS(xmlns, "xmlns:xlink", "http://www.w3.org/1999/xlink");
			clone.setAttribute("width", width * scaleFactor);
			clone.setAttribute("height", height * scaleFactor);
			clone.setAttribute("viewBox", "0 0 " + width + " " + height);
			outer.appendChild(clone);

			clone.querySelector('defs').appendChild(s)

			var svg = doctype + outer.innerHTML;
			var uri = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));
			return uri;
		}
	}
});

export default module;