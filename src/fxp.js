/* Defines MATLAB/MatPlotLib-like plotting models.
    - User creates a Figure ("var hf = new fxp.Figure();")
	- User uses the Figure to spawn an Axis ("var hx = hf.Axis();")
	- User defines Figure and Axes configurations by setting properties ("Figure.width = 1e3; Axes.xlabel = 'Stuff';")
	- User instantiates a Figure by attaching it to an SVG element ("hf.attach(document.getElementById('test'));")
	- User instantiates an Axis by rendering it with one or more datasets ("var hl = hx.lines([1,2,3,4], [2,3,5,7]); var hp = hx.points([1,2,3,4], [1,2,4,8]);")
*/

var isExt = typeof(module) == 'undefined';
if (isExt) { var module = {}; }
module.exports = (function() {
	function Figure(svg) {
		if (typeof(svg) == 'undefined') {
			console.error("Figure constructor requires an SVG element for attachment");
		}
		this.svg = svg;
		this.axes = [];
	}
	
	Figure.prototype.getAxes = function() {
		var hx = new Axes();
		this.axes.push(hx);
		return hx;
	};
	
	Figure.prototype.render() {
		this.axes.forEach(function(hx) {
			hx.render(this.svg);
		});
	};
	
	class Axes {
		constructor() {
			this.title = '';
			this.xLabel = '';
			this.xTickValues = [];
			this.xTickLabels = [];
			this.yLabel = '';
			this.yTickValues = [];
			this.yTickLabels = [];
			this.series = [];
		}
		
		scatter(data) {
			var ps = new PointSeries(data);
			this.series.push(ps);
			return ps;
		}
		
		render(svg) {
			this.series.forEach(function(hs) {
				hs.render(svg);
			});
		}
	}
	
	class Series {
		constructor(data) {
			this.data = data;
		}
		
		render(svg) {
			console.log("Rendering...");
		}
	}
	
	class PointSeries extends Series {
		constructor(data) {
			this.data = data;
			this.markerSize = 12;
			this.faceColor = '#0077ff';
			this.edgeColor = '#003355';
		}
	}
	
	class LineSeries extends Series {
		constructor(data) {
			this.data = data;
			this.lineWidth = 1;
			this.color = '#335577';
		}
	}
	
	class HBarSeries extends Series {
		constructor(data) {
			this.data = data;
			this.barSpacing = 0;
			this.faceColor = '#0077ff';
			this.edgeColor = '#003355';
		}
	}
	
	function BarChart() {
		var width = 900;
		var height = 400;
		var barPadding = 1;
		var fillColor = "steelblue";
		
		function chart(selection) {
			selection.each(function(data) {
				var barSpacing = height / data.length;
				var barHeight = barSpacing - barPadding;
				var maxValue = d3.max(data);
				var widthScale = width / maxValue;
				d3.select(this).append("svg")
					.attr("height", height)
					.attr("width", width)
					.selectAll("rect")
					.data(data)
					.enter()
						.append("rect")
						.attr("y", function(d,i) { return i * barSpacing; })
						.attr("height", barHeight)
						.attr("x", 0)
						.attr("width", function(d) { return d * widthScale; })
						.style("fill", fillColor);
			});
		}
		
		chart.width = function(value) {
			if (!arguments.length) return margin;
			width = value;
			return chart;
		};
		
		chart.height = function(value) {
			if (!arguments.length) return height;
			height = value;
			return chart;
		};
		
		chart.barPadding = function(value) {
			if (!arguments.length) return barPadding;
			barPadding = value;
			return chart;
		};
		
		chart.fillColor = function(value) {
			if (!arguments.length) return fillColor;
			fillColor = value;
			return chart;
		};
		
		return chart;
	}
	
	return {
		Figure: Figure,
		Axes: Axes,
		BarChart: BarChart,
		PointSeries: PointSeries,
		LineSeries: LineSeries,
		HBarSeries: HBarSeries
	};
})();
if (isExt) {
	fxp = module.exports; 
	module = undefined;
}
