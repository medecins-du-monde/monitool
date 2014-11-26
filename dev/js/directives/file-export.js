
angular.module('monitool.directives.fileexport', [])
	.directive('svgSave', function() {
		var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

		var s = document.createElement('style');
		s.setAttribute('type', 'text/css');
		s.innerHTML = "<![CDATA[\n" + 
			'svg{background-color:white}' + 
			' svg{font:10px sans-serif} line, path{fill:none;stroke:#000} text{-webkit-user-select:none;-moz-user-select:none;user-select:none}.c3-bars path,.c3-event-rect,.c3-legend-item-tile,.c3-xgrid-focus,.c3-ygrid{shape-rendering:crispEdges}.c3-chart-arc path{stroke:#fff}.c3-chart-arc text{fill:#fff;font-size:13px}.c3-grid line{stroke:#aaa}.c3-grid text{fill:#aaa}.c3-xgrid,.c3-ygrid{stroke-dasharray:3 3}.c3-text.c3-empty{fill:gray;font-size:2em}.c3-line{stroke-width:1px}.c3-circle._expanded_{stroke-width:1px;stroke:#fff}.c3-selected-circle{fill:#fff;stroke-width:2px}.c3-bar{stroke-width:0}.c3-bar._expanded_{fill-opacity:.75}.c3-chart-arcs-title{font-size:1.3em}.c3-target.c3-focused{opacity:1}.c3-target.c3-focused path.c3-line,.c3-target.c3-focused path.c3-step{stroke-width:2px}.c3-target.c3-defocused{opacity:.3!important}.c3-region{fill:#4682b4;fill-opacity:.1}.c3-brush .extent{fill-opacity:.1}.c3-legend-item{font-size:10px}.c3-legend-background{opacity:.75;fill:#fff;stroke:#d3d3d3;stroke-width:1}.c3-tooltip-container{z-index:10}.c3-tooltip{border-collapse:collapse;border-spacing:0;background-color:#fff;empty-cells:show;-webkit-box-shadow:7px 7px 12px -9px #777;-moz-box-shadow:7px 7px 12px -9px #777;box-shadow:7px 7px 12px -9px #777;opacity:.9}.c3-tooltip tr{border:1px solid #CCC}.c3-tooltip th{background-color:#aaa;font-size:14px;padding:2px 5px;text-align:left;color:#FFF}.c3-tooltip td{font-size:13px;padding:3px 6px;background-color:#fff;border-left:1px dotted #999}.c3-tooltip td>span{display:inline-block;width:10px;height:10px;margin-right:6px}.c3-tooltip td.value{text-align:right}.c3-area{stroke-width:0;opacity:.2}.c3-chart-arcs .c3-chart-arcs-background{fill:#e0e0e0;stroke:none}.c3-chart-arcs .c3-chart-arcs-gauge-unit{fill:#000;font-size:16px}.c3-chart-arcs .c3-chart-arcs-gauge-max,.c3-chart-arcs .c3-chart-arcs-gauge-min{fill:#777}.c3-chart-arc .c3-gauge-value{fill:#000}'
			+ "\n]]>";

		var svgAsDataUri = function(el, scaleFactor, cb) {
			scaleFactor = scaleFactor || 1;

				var outer = document.createElement("div");
				var clone = el.cloneNode(true);
				var width = parseInt(
					clone.getAttribute('width')
						|| clone.style.width
						|| out$.getComputedStyle(el).getPropertyValue('width')
				);
				var height = parseInt(
					clone.getAttribute('height')
						|| clone.style.height
						|| out$.getComputedStyle(el).getPropertyValue('height')
				);

				var xmlns = "http://www.w3.org/2000/xmlns/";

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
				if (cb)
					cb(uri);
		};

		var saveSvgAsPng = function(el, name, scaleFactor) {
			svgAsDataUri(el, scaleFactor, function(uri) {
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
			});
		};

		return {
			link: function(scope, element, attributes) {
				console.log('coucou')
				element.bind('click', function() {
					var filename  = (attributes.svgSave || 'file.png'),
						sourceSVG = document.querySelector("svg");

					saveSvgAsPng(sourceSVG, filename, 1);
				});
			}
		}
	});
