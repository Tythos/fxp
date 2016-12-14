/* Defines an AMD-/Require.js-module (using the CommonJS wrapper) as a single
   function that transforms an <svg/> element by attaching a number of plotting
   methods based on a common figure/axis plot model.
*/
define(function(require, exports, module) {
	// Augment Array and Object prototypes with some handy method
	Array.prototype.min = function() { return Math.min.apply(null, this); };
	Array.prototype.max = function() { return Math.max.apply(null, this); };
	Object.prototype.copy = function() {
		return JSON.parse(JSON.stringify(this));
	};
	Object.prototype.concat = function(rhs) {
		var lhs = this.copy();
		Object.keys(rhs).forEach(function(key,ndx) {
			lhs[key] = rhs[key];
		});
		return lhs;
	};
	
	module.exports = {
		svgXmlNs: 'http://www.w3.org/2000/svg',
		plottingMethods: {
			'scatter': scatter,
			'plot': plot,
			'patch': patch,
			'text': text
		}, defaults: {
			// Define default options for each public method
			figure: {
				xlabel: 'X',
				ylabel: 'Y',
				title: '[untitled plot]'
			}, all: {
				color: null,
			}, scatter: {
				size: 3,
				edgecolor: null,
			}, plot: {
				width: 3,
				style: '-',
				supportcolor: null
			}, patch: {
				width: 3,
				edgecolor: null,
			}, text: {
				fontfamily: null,
				fontsize: null,
				isitalic: false,
				isbold: false,
				isunderline: false,
				halign: 'center',
				valign: 'middle'
			}
		}, colorNames: {
			// Pulled from matplotlib.colors.ColorConverted.cache. Extended with HTML
			// 4.01 specification color names.
			"white":         [1.0, 1.0, 1.0, 1.0],
			"gray":          [0.5, 0.5, 0.5, 1.0],
			"black":         [0.0, 0.0, 0.0, 1.0],
			"red":           [1.0, 0.0, 0.0, 1.0],
			"yellow":        [1.0, 1.0, 0.0, 1.0],
			"green":         [0.0, 0.5, 0.0, 1.0],
			"blue":          [0.0, 0.0, 1.0, 1.0],
			"firebrick":     [0.7, 0.1, 0.1, 1.0],
			"magenta":       [1.0, 0.0, 1.0, 1.0],
			"cyan":          [0.0, 1.0, 1.0, 1.0],
			"darkgoldenrod": [0.7, 0.5, 0.0, 1.0],
			"purple":        [0.5, 0.0, 0.5, 1.0],
			"silver":        [0.8, 0.8, 0.8, 1.0], // This and subsequent colors are unique to HTML 4.01
			"maroon":        [0.5, 0.0, 0.0, 1.0],
			"olive":         [0.5, 0.5, 0.0, 1.0],
			"lime":          [0.0, 1.0, 0.0, 1.0],
			"aqua":          [0.0, 1.0, 1.0, 1.0],
			"teal":          [0.0, 0.5, 0.5, 1.0],
			"navy":          [0.0, 0.0, 0.5, 1.0],
			"fuschia":       [1.0, 0.0, 1.0, 1.0]
		}, colorChars: {
			// Pulled from matplotlib.colors.ColorConverted.colors
			"b": [0.0, 0.0, 1.0, 1.0],
			"c": [0.0, 0.8, 0.8, 1.0],
			"g": [0.0, 0.5, 0.0, 1.0],
			"k": [0.0, 0.0, 0.0, 1.0],
			"m": [0.8, 0.0, 0.8, 1.0],
			"r": [1.0, 0.0, 0.0, 1.0],
			"w": [1.0, 1.0, 1.0, 1.0],
			"y": [0.8, 0.8, 0.0, 1.0]
		}, dashPatterns: {
			// Dash types ('line styles') translated into stroke-dasharray
			'solid': [0,0],
			'dashed': [5,5],
			'dashdot': [5,5,1,5],
			'dotted': [1,5],
			'-': [0,0],
			'--': [5,5],
			'-.': [5,5,1,5],
			':': [1,5]
		},
		
		getMachEps: function() { return 7/3 - 4/3 - 1; },

		getByClass: function(ele, cls) {
			// Specifically for SVG elements, as IE tracks HTML children differently
			var f = ele.getElementsByClassName;
			if (typeof(f) == 'undefined') {
				var result = [];
				var chi = ele.childNodes;
				for (var i = 0; i < chi.length; i++) {
					var ch = chi[i];
					if (typeof(ch.hasAttribute) == 'function' && ch.hasAttribute('class') && ch.getAttribute('class').indexOf(cls) > -1) {
						result.push(ch);
					}
					result = result.concat(getByClass(ch, cls));
				}
				return result;
			} else {
				return ele.getElementsByClassName(cls);
			}
		},
		
		log10: function(x) {
			var f = Math.log10;
			if (typeof(f) == 'undefined') {
				return Math.log(x) * Math.LOG10E;
			} else {
				return f(x);
			}
		},

		encodeColor: function(rgba) {
			// Converts a 4-element numeric Array to RGBA string for element properties
			return 'rgba(' +
				Math.round(rgba[0] * 255) + ',' +
				Math.round(rgba[1] * 255) + ',' +
				Math.round(rgba[2] * 255) + ',' +
				Math.round(rgba[3] * 255) + ')';
		},
	
		encodeAlign: function(txt) {
			// Converts alignments into corresponding SVG <text/> attribute value.
			// This includes both 'halign' and 'valign' values.
			txt = txt.toLowerCase();
			if (['left','center','right'].indexOf(txt) >= 0) {
				if (txt == 'left') {
					return {'text-anchor': 'start'};
				} else if (txt == 'right') {
					return {'text-anchor': 'end'};
				} else {
					return {'text-anchor': 'middle'};
				}
			} else if (['top','middle','bottom'].indexOf(txt) >= 0) {
				if (txt == 'top') {
					return {'alignment-baseline': 'hanging'};
				} else if (txt == 'bottom') {
					return {'alignment-baseline': 'baseline'};
				} else {
					return {'alignment-baseline': 'central'};
				}
			} else {
				console.error('Invalid alignment value ("' + txt + '")');
			}
		},

		getColor: function(colorSpec) {
			// Converts multiple color specs into a single 4-digit RGBA representation;
			// supports single-character strings, color words, 3-digit RGB, and
			// CSS-style hex values ('#', followed by a 3- or 6-character hex value).
			var rgba = [0.0, 0.0, 0.0, 1.0];
			if (typeof(colorSpec) == 'string') {
				var cs = colorSpec.toLowerCase();
				if (cs in colorNames) {
					rgba = colorNames[cs];
				} else if (cs in colorChars) {
					rgba = colorChars[cs];
				} else if (cs[0] == '#' && cs.length == 4) {
					var r = parseInt(cs[1], 16);
					var g = parseInt(cs[2], 16);
					var b = parseInt(cs[3], 16);
					rgba = [r/15, g/15, b/15, 1.0];
				} else if (cs[0] == '#' && cs.length == 7) {
					var r = parseInt(cs.substr(1,3), 16);
					var g = parseInt(cs.substr(3,5), 16);
					var b = parseInt(cs.substr(5,7), 16);
					rgba = [r/255, g/255, b/255, 1.0];
				} else {
					rgba = null;
				}
			} else if (Array.isArray(colorSpec)) {
				var cs = colorSpec.copy();
				if (colorSpec.length == 3) {
					rgba = [cs[0], cs[1], cs[2], 1.0];
				} else if (colorSpec.length == 4) {
					rgba = cs;
				} else {
					rgba = null;
				}
			} else if (typeof(colorSpec) == 'number') {
				// Single-digit number assumed to be hue, translated w/ 1.0
				// saturation and value
				var cs = colorSpec;
				if (cs >= 0 && cs <= 1.0) {
					rgba[0] = cs < 0.5 ? 1 - 2 * cs : 0; 			// 1 @ 0, 0 @ 0.5, 0 @ 0
					rgba[1] = cs < 0.5 ? 2 * cs : 2  - 2 * cs;		// 0 @ 0, 1 @ 0.5, 0 @ 1
					rgba[2] = cs > 0.5 ? 2 * (cs - 0.5) : 0;		// 0 @ 0, 0 @ 0.5, 1 @ 1
				} else {
					rgba = null;
				}
			}
			if (rgba == null) {
				console.error('Invalid color spec ("' + rgba + '")');
			}
			return rgba;
		},

		appendClass: function(el, cls) {
			// Adds the given class name to the given element
			var c = el.getAttribute('class');
			el.setAttribute('class', c == null ? cls : c + ' ' + cls);
		},

		getTitle: function(svg) {
			// Returns the 'title' SVG group element
			return getByClass(svg, 'fxpTitle')[0];
		},

		getAxis: function(svg, ax) {
			// Returns the 'x' or 'y' axis SVG group element
			var axis = null;
			if (ax.toLowerCase() == 'x') {
				axis = getByClass(svg, 'fxpXaxis')[0];
			} else if (ax.toLowerCase() == 'y') {
				axis = getByClass(svg, 'fxpYaxis')[0];
			} else {
				console.error('Axis character must be "x" or "y"');
			}
			return axis;
		},

		series2points: function(series) {
			// Converts a 2-element Array of n-element number Arrays into an n-element
			// Array of 2-element number Arrays
			var points = [];
			if (series[0].length != series[1].length) {
				console.error('Uneven series lengths');
			}
			for (var i = 0; i < series[0].length; i++) {
				points.push([series[0][i], series[1][i]]);
			}
			return points;
		},

		points2series: function(points) {
			// Converts an n-element Array of 2-element number Arrays into an 2-element
			// Array of n-element number Arrays
			var series = [[], []];
			for (var i = 0; i < points.length; i++) {
				series[0].push(points[i][0]);
				series[1].push(points[i][1]);
			}
			return series;
		},

		hasField: function(svg, field) {
			// Returns 'true' if the given SVG element object has the given field (not
			// an XML attribute).
			return Object.keys(svg).indexOf(field) >= 0;
		},

		mergeLims: function(lim, series) {
			// Combines the given min/max limit Array with the min/max values from the
			// given series (n-element Array of number values).
			return [
				Math.min(lim[0], series.min()),
				Math.max(lim[1], series.max()) ];
		},

		xScale: function(svg, x) {
			// Converts a numeric x value to a value within the [0,1] domain, then
			// returns that value scaled by the SVG graph width
			var xlim = svg.xlim;
			var nx = (x - xlim[0]) / (xlim[1] - xlim[0]);
			return nx * getSvgDims(getGraph(svg))[0];
		},

		yScale: function(svg, y) {
			// Converts a numeric y value to a value within the [0,1] range, then
			// returns that value scaled by the SVG graph height (flipped for
			// displacement from the top)
			var ylim = svg.ylim;
			var ny = (y - ylim[0]) / (ylim[1] - ylim[0]);
			return (1 - ny) * getSvgDims(getGraph(svg))[1];
		},

		getSvgDims: function(el) {
			// Returns the width and height of the given SVG element, either from the
			// "width" and "height" elements or from the SVG measurements.
			var dims = [0,0];
			if (el.hasAttribute('width')) {
				dims[0] = parseFloat(el.getAttribute('width'));
			} else {
				dims[0] = el.width.baseVal.value;
			}
			if (el.hasAttribute('height')) {
				dims[1] = parseFloat(el.getAttribute('height'));
			} else {
				dims[1] = el.height.baseVal.value;
			}
			return dims;
		},

		makeSvgEl: function(type, options) {
			// Creates a new SVG element of the given type and attaches the given
			// options as attributes.
			var el = document.createElementNS(svgXmlNs, type);
			if (typeof(options) == 'object') {
				Object.keys(options).forEach(function(key,ndx) {
					el.setAttribute(key, options[key]);
				});
			}
			return el;
		},

		makeSvgArea: function(x, y, w, h, lbl) {
			// Returns a figure area within an SVG plot with the given list of labels
			// as 'fxp'-prefixed, camel-notation classes.
			var cls = [];
			lbl.forEach(function(val,ndx) {
				cls.push('fxp' + val[0].toUpperCase() + val.substr(1));
			});
			var g = makeSvgEl('g', {
				'transform': 'translate(' + x + ',' + y + ')',
				'width': w,
				'height': h,
				'class': cls.join(' ') });
			var r = makeSvgEl('rect', {
				'width': w,
				'height': h });
			g.appendChild(r);
			return g;
		},

		getGraph: function(svg) {
			// Returns the graph SVG 'group' element within the given <svg> element.
			return getByClass(svg, 'fxpGraph')[0];
		},

		getTicks: function(lim) {
			// Returns an array of values at which ticks will be placed,
			// based on the given limits.
			var dLim = lim[1] - lim[0];
			var tickMag = log10(dLim - getMachEps() * dLim);
			var dTick = Math.pow(10, Math.floor(tickMag - getMachEps() * tickMag));
			var tLim = [
				dTick * Math.floor(lim[0] / dTick),
				dTick * Math.ceil(lim[1] / dTick) ];
			var ticks = [tLim[0]];
			while (ticks[ticks.length-1] < tLim[1]) {
				ticks.push(ticks[ticks.length-1] + dTick);
			}
			return ticks;
		},

		setXAxis: function(svg) {
			// Updates the x-axis with the assigned limits, and re-renders the axis
			// graphical artifacts (labels, bar, ticks, and tick labels).
			var hx = getAxis(svg, 'x');
			while (hx.childNodes.count > 0) {
				hx.removeChild(hx.firstChild);
			}
			var d = getSvgDims(hx);
			var t = 'translate(' + (0.5 * d[0]) + ',' + (0.5 * d[1]) + ')';
			var lbl = makeSvgEl('text', {
				'text-anchor': 'middle',
				'alignment-baseline': 'central',
				'transform': t,
				'class': 'fxpXlabel'
			});
			var line = makeSvgEl('line', {
				'x1': 0,
				'x2': d[0],
				'y1': 0,
				'y2': 0
			});
			var ticks = getTicks(svg.xlim);
			svg.xlim = [ticks[0],ticks[ticks.length-1]];
			ticks.forEach(function(val,ndx) {
				var x = xScale(svg, val);
				if (ndx > 0) {
					var l = makeSvgEl('line', {
						'x1': x,
						'x2': x,
						'y1': 0,
						'y2': 0.1 * d[1],
						'shape-rendering': 'crispEdges'
					});
					hx.appendChild(l);
				}
				var t = makeSvgEl('text', {
					'text-anchor': 'middle',
					'dominant-baseline': 'hanging',
					'transform': 'translate(' + x + ',' + (0.15 * d[1]) + ')'
				});
				t.textContent = val.toFixed(1);
				hx.appendChild(t);
			});
			lbl.textContent = svg.xlabel;
			hx.appendChild(lbl);
			hx.appendChild(line);
		},

		setYAxis: function(svg) {
			// Updates the y-axis with the assigned limits, and re-renders the axis
			// graphical artifacts (labels, bar, ticks, and tick labels).
			var hx = getAxis(svg, 'y');
			while (hx.childNodes.count > 0) {
				hx.removeChild(hx.firstChild);
			}
			var d = getSvgDims(hx);
			var t = 'translate(' + (0.5 * d[0]) + ',' + (0.5 * d[1]) + ')';
			var lbl = makeSvgEl('text', {
				'text-anchor': 'middle',
				'dominant-baseline': 'central',
				'transform': t + 'rotate(-90)',
				'class': 'fxpYlabel'
			});
			var line = makeSvgEl('line', {
				'x1': d[0],
				'x2': d[0],
				'y1': 0,
				'y2': d[1]
			});
			var ticks = getTicks(svg.ylim);
			svg.ylim = [ticks[0],ticks[ticks.length-1]];
			ticks.forEach(function(val,ndx) {
				var y = yScale(svg, val);
				if (ndx > 0) {
					var l = makeSvgEl('line', {
						'x1': 0.9 * d[0],
						'x2': d[0],
						'y1': y,
						'y2': y,
						'shape-rendering': 'crispEdges'
					});
					hx.appendChild(l);
				}
				var t = makeSvgEl('text', {
					'text-anchor': 'middle',
					'alignment-baseline': 'auto',
					'transform': 'translate(' + (0.85 * d[0]) + ',' + y + ')rotate(-90)'
				});
				t.textContent = val.toFixed(1);
				hx.appendChild(t);
			});
			lbl.textContent = svg.ylabel;
			hx.appendChild(lbl);
			hx.appendChild(line);
		},

		setTitle: function(svg) {
			// Sets the title of the given figure based on the title property of the
			// SVG element object.
			var ht = getTitle(svg);
			while (ht.childNodes.length > 0) {
				ht.removeChild(ht.firstChild);
			}
			var d = getSvgDims(ht);
			var t = makeSvgEl('text', {
				'x': 0.5 * d[0],
				'y': 0.5 * d[1],
				'text-anchor': 'middle',
				'alignment-baseline': 'central'
			});
			t.textContent = svg.title;
			ht.appendChild(t);
		},

		setField: function(obj, field, has, hasnt) {
			// Assigns, to the given field of the given object, one of two values
			// depending on whether or not the field already exists. If values are
			// functions, the field is assigned the result of invoking that function.
			if (!hasField(obj, field)) {
				if (typeof(hasnt) == 'function') {
					obj.field = hasnt();
				} else {
					obj.field = hasnt;
				}
			} else {
				if (typeof(has) == 'function') {
					obj.field = has();
				} else {
					obj.field = has;
				}
			}
		},

		overrideObject: function(defaults, provided) {
			// Copies the default object, then overrides fields in the provided object
			var values = defaults.copy();
			Object.keys(values).forEach(function(key,val) {
				if (key in provided) {
					values[key] = provided[key];
				}
			});
			return values;
		}

		clearGroup: function(g) {
			while (g.childElementCount > 0) {
				g.removeChild(g.firstChild);
			}
		},

		repopulate: function(svg) {
			// Re-renders series attached to the given SVG object
			svg.series.forEach(function(val,ndx) {
				if (val.type == 'PointSeries') {
					renderPoints(svg, val);
				} else if (val.type == 'LineSeries') {
					renderLines(svg, val);
				} else if (val.type == 'PatchSeries') {
					renderPatches(svg, val);
				} else if (val.type == 'TextSeries') {
					renderText(svg, val);
				}
			});
		},

		renderPoints: function(svg, ps) {
			// Adds and attaches graphical artifacts to the SVG graph based on the given
			// PointSeries-type object.
			var options = ps.copy();
			var graph = getGraph(svg);
			var xy = points2series(ps.data);
			var x = xy[0]; var y = xy[1];
			var fill = options.color == null ? [0,0,0,1] : getColor(options.color);
			var stroke = options.edgecolor == null ? [0,0,0,1] : getColor(options.edgecolor);
			var artifacts = [];
			
			// Plot each point
			for (var i = 0; i < x.length; i++) {
				var xy = [
					xScale(svg, x[i]),
					yScale(svg, y[i]) ];
				var c = makeSvgEl('circle', {
					'cx': xy[0],
					'cy': xy[1],
					'r': options.size,
					'fill': encodeColor(fill),
					'fill-opacity': fill[3],
					'stroke': encodeColor(stroke),
					'stroke-opacity': stroke[3] });
				graph.appendChild(c);
				artifacts.push(c);
			}
			ps.artifacts = artifacts;
		},

		renderLines: function(svg, ls) {
			// Adds and attaches graphical artifacts to the SVG graph based on the
			// given LineSeries-type object.
			var options = ls.copy();
			var graph = getGraph(svg);
			var xy = points2series(ls.data);
			var x = xy[0]; var y = xy[1];
			var stroke = options.color == null ? [0,0,0,1] : getColor(options.color);
			var support = options.supportcolor == null ? null : getColor(options.supportcolor);
			var style = dashPatterns[options.style];
			var artifacts = [];
			var yMin = svg.ylim[0];
			
			// Plot each line segment
			for (var i = 1; i < x.length; i++) {
				var xy1 = [
					xScale(svg, x[i-1]),
					yScale(svg, y[i-1]) ];
				var xy2 = [
					xScale(svg, x[i]),
					yScale(svg, y[i]) ];
				var l = makeSvgEl('line', {
					'x1': xy1[0],
					'x2': xy2[0],
					'y1': xy1[1],
					'y2': xy2[1],
					'stroke-width': options.width,
					'stroke-dasharray': style,
					'stroke': encodeColor(stroke),
					'stroke-opacity': stroke[3] });
				graph.appendChild(l);
				artifacts.push(l);
				
				// Add optional supporting patch
				if (support != null) {
					var points = [
						xy1[0] + ',' + yScale(svg, yMin),
						xy2[0] + ',' + yScale(svg, yMin),
						xy2[0] + ',' + xy2[1],
						xy1[0] + ',' + xy1[1] ];
					var p = makeSvgEl('polygon', {
						'points': points.join(' '),
						'fill': encodeColor(support),
						'fill-opacity': support[3],
						'stroke-width': 0
					});
					graph.appendChild(p);
					artifacts.push(p);
				}
			}
			ls.artifacts = artifacts;
		},
	
		renderPatches: function(svg, ps) {
			// Adds and attaches graphical artifacts to the SVG graph based on the
			// given PatchSeries-type object.
			var options = ps.copy();
			var graph = getGraph(svg);
			var fill = options.color == null ? [0,0,0,1] : getColor(options.color);
			var stroke = options.edgecolor == null ? [0,0,0,1] : getColor(options.edgecolor);
			
			// Plot the patch as an SVG <polygon/> element
			var points = [];
			ps.data.forEach(function(val,ndx) {
				var x = xScale(svg, val[0]);
				var y = yScale(svg, val[1]);
				points.push(Math.round(x) + ',' + Math.round(y));
			});
			var p = makeSvgEl('polygon', {
				'points': points.join(' '),
				'fill': encodeColor(fill),
				'fill-opacity': fill[3],
				'stroke-width': options.width,
				'stroke': encodeColor(stroke),
				'stroke-opacity': stroke[3] });
			ps.artifacts = [p];
			graph.appendChild(p);
		},
	
		renderText: function(svg, ts) {
			// Adds and attaches graphical artifacts to the SVG graph based on the
			// given TextSeries-type object.
			var options = ts.copy();
			var graph = getGraph(svg);
			var fill = options.color == null ? [0,0,0,1] : getColor(options.color);
			var artifacts = [];
			
			// Add the <text/> element to the graph with the appropriate alignment
			var attrs = {
				'fill': encodeColor(fill),
				'style': 'fill:' + encodeColor(fill),
				'fill-opacity': fill[3],
				'x': xScale(svg, ts.data[0][0]),
				'y': yScale(svg, ts.data[0][1]),
				'font-family': options.fontfamily == null ? "inherit" : options.fontfamily,
				'font-size': options.fontsize == null ? "inherit" : options.fontsize,
				'font-style': options.isitalic ? "italic" : "normal",
				'font-weight': options.isbold ? "bold" : "normal",
				'text-decoration': options.isunderline ? "underline" : "none",
			};
			attrs = attrs.concat(encodeAlign(options.halign));
			attrs = attrs.concat(encodeAlign(options.valign));
			var t = makeSvgEl('text', attrs);
			t.textContent = ts.text;
			ts.artifacts = [t];
			graph.appendChild(t);
		},

		scatter: function(x, y, options) {
			// Assign/adjust axis limits (eventually, this will need to be
			// proceduralized to ensure x and y axes are updated, too)
			if (!hasField(this, 'xlim')) {
				this.xlim = [x.min(),x.max()];
			} else {
				this.xlim = mergeLims(this.xlim, x);
			}
			if (!hasField(this, 'ylim')) {
				this.ylim = [y.min(),y.max()];
			} else {
				this.ylim = mergeLims(this.ylim, y);
			}
			if (x.length != y.length) {
				console.error('Uneven series lengths');
			}
			
			// Determine rendering options
			if (typeof(options) == 'undefined') { options = {}; }
			options = overrideObject(defaults.all.concat(defaults.scatter), options);
			
			// Reset axes, title, etc.
			clearGroup(getGraph(this));
			clearGroup(getAxis(this, 'x'));
			clearGroup(getAxis(this, 'y'));
			setXAxis(this);
			setYAxis(this);
			setTitle(this);
			repopulate(this);
			
			// Construct PointSeries-like object (scatter options w/ data points)
			var ps = options.copy();
			ps.data = series2points([x,y]);
			ps.type = 'PointSeries';
			this.series.push(ps);
			renderPoints(this, ps);
			return ps;
		},

		plot: function(x, y, options) {
			// Assign/adjust axis limits (eventually, this will need to be
			// proceduralized to ensure x and y axes are updated, too)
			if (!hasField(this, 'xlim')) {
				this.xlim = [x.min(),x.max()];
			} else {
				this.xlim = mergeLims(this.xlim, x);
			}
			if (!hasField(this, 'ylim')) {
				this.ylim = [y.min(),y.max()];
			} else {
				this.ylim = mergeLims(this.ylim, y);
			}
			if (x.length != y.length) {
				console.error('Uneven series lengths');
			}
			
			// Determine rendering options
			if (typeof(options) == 'undefined') { options = {}; }
			options = overrideObject(defaults.all.concat(defaults.plot), options);
			
			// Reset axes, title, etc.
			clearGroup(getGraph(this));
			clearGroup(getAxis(this, 'x'));
			clearGroup(getAxis(this, 'y'));
			setXAxis(this);
			setYAxis(this);
			setTitle(this);
			repopulate(this);
			
			// Construct LineSeries-like object (plot options w/ data points)
			var ls = options.copy();
			ls.data = series2points([x,y]);
			ls.type = 'LineSeries';
			this.series.push(ls);
			renderLines(this, ls);
			return ls;
		},

		patch: function(x, y, options) {
			// Assign/adjust axis limits (eventually, this will need to be
			// proceduralized to ensure x and y axes are updated, too)
			if (!hasField(this, 'xlim')) {
				this.xlim = [x.min(),x.max()];
			} else {
				this.xlim = mergeLims(this.xlim, x);
			}
			if (!hasField(this, 'ylim')) {
				this.ylim = [y.min(),y.max()];
			} else {
				this.ylim = mergeLims(this.ylim, y);
			}
			if (x.length != y.length) {
				console.error('Uneven series lengths');
			}
			
			// Determine rendering options
			if (typeof(options) == 'undefined') { options = {}; }
			options = overrideObject(defaults.all.concat(defaults.patch), options);
			
			// Reset axes, title, etc.
			clearGroup(getGraph(this));
			clearGroup(getAxis(this, 'x'));
			clearGroup(getAxis(this, 'y'));
			setXAxis(this);
			setYAxis(this);
			setTitle(this);
			repopulate(this);
			
			// Construct PatchSeries-like object (plot options w/ data points)
			var ps = options.copy();
			ps.data = series2points([x,y]);
			ps.type = 'PatchSeries';
			this.series.push(ps);
			renderPatches(this, ps);
			return ps;
		},
	
		text: function(x, y, txt, options) {
			// Since there is no range specified in the x,y coordinates alone, we
			// don't adjust the limits unless they don't exist--in which case, we
			// use the 0-value axis for that dimension, and twice the coordinate.
			if (!hasField(this, 'xlim')) {
				this.xlim = x > 0 ? [0,2*x] : [2*x,0];
			}
			if (!hasField(this, 'ylim')) {
				this.ylim = y > 0 ? [0,2*y] : [2*y,0];
			}
			
			// Determine rendering options
			if (typeof(options) == 'undefined') { options = {}; }
			options = overrideObject(defaults.all.concat(defaults.text), options);
			
			// Note that, since text doesn't modify the state of the axis, we don't
			// re-render all series objects. Instead, skip directly to constructing
			// and rendering the TextSeries object.
			var ts = options.copy();
			ts.data = [[x,y]];
			ts.text = txt;
			ts.type = 'TextSeries';
			this.series.push(ts);
			renderText(this, ts);
			return ts;
		},
	
		setAttribute: function(key, val) {
			// The default *setAttribute* method has been renamed *setDomAttribute*.
			// This *setAttribute* method will, instead, check for any
			// camel-notation accessors for the given property. If one exists, it
			// will be invoked instead; otherwise, fall back to *setDomAttribute*.
			var setterName = 'set' + key[0].toUpperCase() + key.substr(1);
			if (typeof(this[setterName]) == 'function') {
				this[setterName](val);
			} else {
				this.setDomAttribute(key, val);
			}
			return this;
		},
	
		setXlabel: function(val) {
			var xAxis = getAxis(this, 'x');
			var xLabel = getByClass(xAxis, 'fxpXlabel')[0];
			xLabel.textContent = val;
		},

		setYlabel: function(val) {
			var yAxis = getAxis(this, 'y');
			var yLabel = getByClass(yAxis, 'fxpYlabel')[0];
			yLabel.textContent = val;
		},
	
		setXlim: function(val) {
			this.xlim = val;
			clearGroup(getGraph(this));
			clearGroup(getAxis(this, 'x'));
			clearGroup(getAxis(this, 'y'));
			setXAxis(this);
			setYAxis(this);
			setTitle(this);
			repopulate(this);
		},
		
		setYlim: function(val) {
			this.ylim = val;
			clearGroup(getGraph(this));
			clearGroup(getAxis(this, 'x'));
			clearGroup(getAxis(this, 'y'));
			setXAxis(this);
			setYAxis(this);
			setTitle(this);
			repopulate(this);
		},
	
		extend: function(methods) {
			// Extends plotting methods by attaching them to 'this' svg/fxp
			methods.forEach(function(val,ndx) {
			});
		},

		figure: function(svg, options) {
			if (typeof(options) == 'undefined') { options = {}; }
			options = overrideObject(defaults.figure, options);
			Object.keys(options).forEach(function(key,ndx) {
				svg[key] = options[key];
			});
			svg.series = [];
			svg.setAttribute('xmlns', svgXmlNs);
			appendClass(svg, 'fxpFigure');
			
			var m = [0.1,0.1,0.2,0.2];
			var w = parseInt(svg.getAttribute('width'));
			var h = parseInt(svg.getAttribute('height'));
			
			svg.appendChild(makeSvgArea(w * m[3],       0,              w * (1 - m[1] - m[3]), h * m[0],              ['title']));
			svg.appendChild(makeSvgArea(w * (1 - m[1]), h * m[0],       w * m[1],              h * (1 - m[0] - m[2]), ['legend']));
			svg.appendChild(makeSvgArea(w * m[3],       h * (1 - m[2]), w * (1 - m[1] - m[3]), h * m[2],              ['axis', 'xaxis']));
			svg.appendChild(makeSvgArea(0,              h * m[0],       w * m[3],              h * (1 - m[0] - m[2]), ['axis','yaxis']));
			
			// Set graph w/ overflow / clip area
			var x = w * m[3];
			var y = h * m[0];
			var w = w * (1 - m[1] - m[3]);
			var h = h * (1 - m[0] - m[2]);
			var graph = makeSvgArea(x, y, w, h, ['graph']);
			var clip = makeSvgEl('rect', {
				x: 0,
				y: 0,
				width: w,
				height: h });
			var d = makeSvgEl('defs');
			var cp = makeSvgEl('clipPath', {
				id: 'fxpGraphClip' });
			cp.appendChild(clip);
			d.appendChild(cp);
			svg.appendChild(d);
			graph.setAttribute('clip-path', 'url(#fxpGraphClip)');
			svg.appendChild(graph);
			
			// Define plotting interfaces from plottingMethods (can be extended)
			Object.keys(plottingMethods).forEach(function(key) {
				svg[key] = plottingMethods[key];
			});
			
			// Augment with debugging and extension methods
			svg.makeSvgArea = makeSvgArea;
			svg.extend = extend;
			
			// Define and attach figure-level accessors
			svg.setDomAttribute = svg.setAttribute;
			svg.setAttribute = setAttribute;
			svg.setTitle = function(val) {
				svg.title = val;
				setTitle(svg); };
			svg.setXlabel = setXlabel;
			svg.setYlabel = setYlabel;
			svg.setXlim = setXlim;
			svg.setYlim = setYlim;
			
			return svg;
		}
	
	return {
		figure: figure };
});
