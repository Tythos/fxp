/* Defines MATLAB/MatPlotLib-like plotting models. Axis-like plotting methods
   are attached to a given SVG element by the axis ("Axis") method. These
   perform plotting operations with a dataset and optional configurations. The
   resulting artifact group (PointGroup, LineGroup, etc.) is returned for
   subsequent modification, if desired. Group attributes can be either assigned
   explicitly, or given as functions of each data point value and index::
    > var svg = document.getElementsByTagName('svg')[0];
	> var hx = fxp.Axis(svg, {options});
   
   Supported plotting methods include::
    > var pointGroup = hx.scatter([[0,1], [2,3]], {options});
    > var lineGroup = hx.plot([[0,1], [2,3]], {options});
    > var polygonGroup = hx.patch([[0,0,1,1], [1,0,1,2]], {options});
    > var polygonGroup = hx.vbar([1,2,4,8], {options});
    > var polygonGroup = hx.hbar([2,3,5,7], {options});
	
   In addition to plotting methods, the SVG element (Axis object) is extended to
   include a number of Axis properties exposed with closure accessors. Group
   objects can be modified in the same manner, once generated by a plotting
   method, but they can be specified by either static values or functions of
   data point and index::
    > var xlim = hx.xlim();
	> hx.title('Title');
	> var lg = hx.plot([[1,2], [2,3]]);
	> lg.color(function(d,n) { return [0,1,-1/n+1]; });
	
   Note that this file is written for one of two use cases::
    # It can be included by a <script/> tag within an HTML document, in which
	  case the module contents are assigned to the global variable *fxp*.
	# It can be loaded by *require()* or similar module-loading techniques, in
	  which case the module contents are assigned to the usual *module.exports*.
	  
   Note that font styles are assumed to be specified by CSS (as any other SVG
   element); apply a style rule and check the appropriate class for the desired
   element. One exception is 'TextGroup' objects, which (like other plotted
   groups) supports style options.
*/

var isExt = typeof(module) == 'undefined';
if (isExt) { var module = {}; }
module.exports = (function() {
	var svgNsUrl = 'http://www.w3.org/2000/svg';
	
	function setAttributes(dom, att) {
		// Assigns attribute field-value pairs to the given DOM element
		Object.keys(att).forEach(function(val) {
			dom.setAttribute(val, att[val]);
		});
		return dom;
	}
	
	function assignAttributes(obj, att) {
		// Assigns the given attributes to the object '_options' property, and
		// adds accessor closure methods. Ignores if already present. When
		// properties are assigned by accessor closures, a refresh event needs
		// to be triggered; will have to figure out how to encode this later.
		if (Object.keys(obj).indexOf('_options') < 0) {
			obj['_options'] = {};
		}
		Object.keys(att).forEach(function(val,ndx) {
			if (Object.keys(obj._options).indexOf(val) < 0) {
				obj._options[val] = att[val];
			}
			if (Object.keys(obj).indexOf(val) < 0) {
				obj[val] = function(value) {
					if (typeof(value) == 'undefined') {
						return obj._options[val];
					} else {
						obj._options[val] = value;
						return obj;
					}
				};
			}
		});
	}
	
	var axisAttributes = {
		xlim: [null, null], // *null* value on either end => axis scales to min/max of data x values
		ylim: [null, null], // *null* value on either end => axis scales to min/max of data y values
		title: 'Untitled Figure', // eventually, it would be nice to support LaTeX markup
		xlabel: '', // "
		ylabel: '', // "
		xticks: null, // If not null, must be an array of increasing numeric values; setting to [] will disable xticks
		yticks: null, // If not null, must be an array of increasing numeric values; setting to [] will disable yticks
		xticklabels: null, // If not null, must be an array of strings matching the length of *xticks*
		yticklabels: null, // If not null, must be an array of strings matching the length of *yticks*
		bgcolor: [1,1,1], // Like all color values, can be a string (3- or 6-character hex), a 3-element numeric array, or a 4-element numeric array
		fgcolor: [1,1,1], // color (see above)
		axcolor: [1,1,1], // color (see above)
		showxgrid: false,
		showygrid: false,
		xgridcolor: [0.5,0.5,0.5],
		ygridcolor: [0.5,0.5,0.5],
		padding: [0.1,0.,0.2,0.2] // top, right, bottom, and left, in % of svg dims
	};
	
	var pointGroupAttributes = {
		size: 8, // not sure what units these should be in yet...
		marker: 'o', // see MATLAB/pyplot documentation
		facecolor: [0,0,1], // color (see above)
		edgecolor: [0,0,1], // color (see above)
		edgewidth: 1 // again, not sure what units...
	};
	
	function getLim(lim, data, ndx, op) {
		// Returns the limit *lim* as modified to include all index values of
		// the given dataset as compared within the given operation.
		if (lim == null) {
			data.forEach(function(group) {
				group.forEach(function(d,n) {
					lim = lim == null ? d[0] : op(lim, d[ndx]);
				});
			});
		}
		return lim;
	}
	
	function createSvgArea(svg, xy, wh, attrs) {
		// Creates a <g> area and <rect/> child under the given parent. Returns
		// <g> element. Attribute assignments are split between the two.
		var g = setAttributes(document.createElementNS(svgNsUrl, 'g'), {
			"transform": "translate(" + xy[0] + "," + xy[1] + ")",
			width: wh[0],
			height: wh[1]
		});
		var r = setAttributes(document.createElementNS(svgNsUrl, 'rect'), {
			x: 0,
			y: 0,
			width: wh[0],
			height: wh[1]
		});
		g.appendChild(setAttributes(r, attrs));
		svg.appendChild(g);
		return g;
	}
	
	function makeTitle(area, title) {
		// An area (g w/ bg rect returned by createSvgArea()) is extended to
		// include a text element containing the title.
		var t = document.createElementNS(svgNsUrl, 'text');
		t.innerHTML = title;
		area.appendChild(setAttributes(t, {
			'text-anchor': 'middle',
			'x': parseFloat(area.getAttribute('width')) * 0.5,
			'y': area.getAttribute('height'),
			'font-size': area.getAttribute('height')
		}));
		return area;
	}
	
	function axisRender() {
		// Clear SVG element of all children
		while (this.children.length > 0) {
			this.removeChild(this.children[0]);
		}
		this.classList.add('fxpAxis');
		var height = parseFloat(this.getAttribute('height'));
		var width = parseFloat(this.getAttribute('width'));
		var pad = this.padding();
		var svg = this;
		
		// Automatically determine axis bound from groups?
		var xlim0 = getLim(this.xlim()[0], this.groups, 0, Math.min);
		var xlim1 = getLim(this.xlim()[1], this.groups, 0, Math.max);
		var ylim0 = getLim(this.ylim()[0], this.groups, 1, Math.min);
		var ylim1 = getLim(this.ylim()[1], this.groups, 1, Math.max);
		
		// Define axis areas as <rect/> elements
		var title = makeTitle(createSvgArea(svg,
			[pad[3] * width, 0],
			[(1 - (pad[1] + pad[3])) * width, pad[0] * height],
			{'class': 'fxpTitle'} // used for CSS styling
		), this.title());
		
		var xaxis = setAttributes(document.createElementNS(svgNsUrl, 'rect'), {
			'x': pad[3] * width,
			'y': (1 - pad[2]) * height,
			'width': width * (1 - (pad[1] + pad[3])),
			'height': pad[2] * height,
			'class': 'fxpXaxis' // used for CSS styling
		});
		var yaxis = setAttributes(document.createElementNS(svgNsUrl, 'rect'), {
			'x': 0,
			'y': pad[0] * height,
			'width': pad[3] * width,
			'height': (1 - (pad[0] + pad[2])) * height,
			'class': 'fxpYaxis' // used for CSS styling
		});
		var graph = setAttributes(document.createElementNS(svgNsUrl, 'rect'), {
			'x': pad[3] * width,
			'y': pad[0] * height,
			'width': (1 - (pad[1] + pad[3])) * width,
			'height': (1 - (pad[0] + pad[2])) * height,
			'class': 'fxpGraph' // used for CSS styling
		});
		[title, xaxis, yaxis, graph].forEach(function(val) { svg.appendChild(val); });
		
		// Render x axis, ticks/ticklabels, and grid
		
		// Render y axis, ticks/ticklabels, and grid
		
		// Render each group within the inner plot space
		this.groups.forEach(function(group) { group.render(); });
	}
	
	function axis(svg) {
		// Assign config/options attributes and empty groups
		assignAttributes(svg, axisAttributes);
		svg.groups = [];
		svg.render = axisRender;
		
		// Render initial axis
		if (!svg.hasAttribute('xmlns')) {
			svg.setAttribute('xmlns', svgNsUrl)
		}
		svg.render();
		
		// Attach plotting methods
		svg.scatter = function(data, options) {
			
		};
		
		svg.plot = function(data, options) {
			
		};
		
		svg.patch = function(data, options) {
					
		};
		
		svg.vbar = function(data, options) {
			
		};
		
		svg.hbar = function(data, options) {
			
		};
		
		return svg;
	}
	
	// return { Axis: axis }; // release
	return { // debug
		Axis: axis,
		setAttributes: setAttributes,
		svgNsUrl: svgNsUrl };
})();
if (isExt) {
	fxp = module.exports; 
	module = undefined;
}
