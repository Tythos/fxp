/* https://matplotlib.org/api/pyplot_api.html#matplotlib.pyplot.plot

   Once figure/axis handle is initialized, the dependency tree for new series
   and handle property modifications is, order of update required:
    #. <svg/> dimensions
	#. margin
	#. title, xlabel, ylabel positions
	#. x/y scales
	#. x/y axes
	#. point positions
	#. line positions
*/

define(function(require, exports, module) {
	var d3 = require("d3");
	
	function FXP(svg) {
		/* Constructs a new FXP figure/axis/plot object around a given SVG element.
		*/
		this.svg = d3.select(svg);
		this.body = this.svg.append("g");
		this.margin = { top: 0.1, right: 0.0, bottom: 0.2, left: 0.1 };
		this.series = [];
		var w = parseInt(this.svg.attr("width"));
		if (!w) {
			w = 640;
			this.svg.attr("width", w + "px");
		}
		var h = parseInt(this.svg.attr("height"));
		if (!h) {
			h = 480;
			this.svg.attr("height", h + "px");
		}
		
		var width = w * (1 - this.margin.left - this.margin.right);
		var height = h * (1 - this.margin.top - this.margin.bottom);
		this.xScale = d3.scaleLinear().domain([0, 1]).range([0, width]);
		this.yScale = d3.scaleLinear().domain([0, 1]).range([height, 0]);

		var gLeft = w * this.margin.left;
		var gTop = h * this.margin.top;
		this.body.attr("transform", "translate(" + gLeft + "," + gTop + ")");

		// Add title
		this.title = this.svg.append("text")
			.text("The Title")
			.attr("transform", "translate(" + (0.5 * w) + "," + (0.5 * h * this.margin.top) + ")")
			.attr("dominant-baseline", "center")
			.attr("text-anchor", "middle");
		this.xLabel = this.svg.append("text")
			.text("The X Axis")
			.attr("transform", "translate(" + (this.margin.left * w + 0.5 * width) + "," + (this.margin.top * h + height + this.margin.bottom * 0.5 * h) + ")")
			.attr("dominant-baseline", "center")
			.attr("text-anchor", "middle");
		this.yLabel = this.svg.append("text")
			.text("The Y Axis")
			.attr("transform", "translate(" + (0.5 * this.margin.left * w) + "," + (this.margin.top * h + 0.5 * height) + ") rotate(-90)")
			.attr("dominant-baseline", "center")
			.attr("text-anchor", "middle");

		// Define axes
		this.xAxis = this.body.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height + ")");
		this.yAxis = this.body.append("g")
			.attr("class", "axis axis-y");
		return this;
	}

	FXP.prototype.updateScales = function(newData) {
		/* Updates the xScale and yScale domains based on the data in existing
		   selections and the new dataset provided here. Also updates plot properties
		   that depend upon the scales, such as axes.
		*/
		var xMin = d3.min(newData, function(d) { return d[0]; });
		var xMax = d3.max(newData, function(d) { return d[0]; });
		var yMin = d3.min(newData, function(d) { return d[1]; });
		var yMax = d3.max(newData, function(d) { return d[1]; });
		var xLim = this.series.length > 0 ? this.xScale.domain() : [xMin,xMax];
		var yLim = this.series.length > 0 ? this.yScale.domain() : [yMin,yMax];
		if (xMin < xLim[0]) {
			xLim[0] = xMin;
		}
		if (xLim[1] < xMax) {
			xLim[1] = xMax;
		}
		if (yMin < yLim[0]) {
			yLim[0] = yMin;
		}
		if (yLim[1] < yMax) {
			yLim[1] = yMax;
		}
		this.xScale.domain(xLim);
		this.yScale.domain(yLim);
		this.xAxis.call(d3.axisBottom(this.xScale));
		this.yAxis.call(d3.axisLeft(this.yScale));
	};

	FXP.prototype.moveSeries = function() {
		/* Recomputes position of each item in each series based on scales that have
		   likely changed.
		*/
		this.series.forEach(function(series) {
			if (series.classed("PointSeries")) {
				series.selectAll("circle")
					.attr("cx", function(d) { return this.xScale(d[0]); }.bind(this))
					.attr("cy", function(d) { return this.yScale(d[1]); }.bind(this));
			} else if (series.classed("LineSeries")) {
				var line = d3.line()
					.x(function(d) { return this.xScale(d[0]); }.bind(this))
					.y(function(d) { return this.yScale(d[1]); }.bind(this));
					//.curve(d3.curveBasis); // easy eay to implement curved line series
				series.select("path").attr("d", line);
			} else {
				console.warn("Unrecognized series class, ignoring for move");
			}
		}, this);
	};

	FXP.prototype.scatter = function(data) {
		/* Adds a point series to the figure. Returns the d3 selection of all points
		   (circles) for any additional modification.
		*/
		this.updateScales(data);
		this.moveSeries();
		var series = this.body.append("g")
			.attr("class", "PointSeries");
		var points = series.selectAll("circle")
			.data(data)
			.enter()
				.append("circle")
				.attr("cx", function(d) { return this.xScale(d[0]); }.bind(this))
				.attr("cy", function(d) { return this.yScale(d[1]); }.bind(this))
				.attr("r", 4);
		this.series.push(series);
		return series;
	};

	FXP.prototype.plot = function(x, y) {
		/* Adds a line series to the figure. Returns the d3 eelection of all line
		   segments for any additional modification. Some default styling is included
		   to make sure it isn't rendered as closed path.
		*/
		var data = x.map(function(v, i) { return [v, y[i]]; });
		this.updateScales(data);
		this.moveSeries();
		var series = this.body.append("g")
			.attr("class", "LineSeries")
			.attr("fill", "none")
			.attr("stroke", "black");
		var line = d3.line()
			.x(function(d) { return this.xScale(d[0]); }.bind(this))
			.y(function(d) { return this.yScale(d[1]); }.bind(this));
			//.curve(d3.curveBasis); // easy way to implement curved line series
		var path = series.append("path")
			.datum(data)
			.attr("stroke-linejoin", "round")
			.attr("stroke-linecap", "round")
			.attr("stroke-width", 1.5)
			.attr("d", line);
		this.series.push(series);
		return series;
	};

	return FXP;
});

