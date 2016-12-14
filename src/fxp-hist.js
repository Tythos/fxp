define(function(require, exports, module) {
	var fxp = require('fxp');
	
	var defaults = {
		width: 1,
		edgecolor: null,
		nBins: 16 };
	
	function hist(hf, x, options) {
		// Builds on the patch() method after grouping the given data set
		if (typeof(options) == 'undefined') { options = {}; }
		options = hf.overrideObject(hf.defaults.all.concat(defaults.hist), options);
		var psi = [];
		var lim = [x.min(),x.max()];
		var n = options.nBins;
		var dx = (lim[1] - lim[0]) / n;
		var bins = []; // a bin entry has lim and pop attributes
		
		// Compute bin limits and populations
		for (var i = 0; i < n; i++) {
			var low = lim[0] + i * dx;
			var high = lim[0] + (i + 1) * dx;
			var pop = 0;
			x.forEach(function(val,ndx) {
				if (low < val && val < high) { pop++; }
			});
			bins.push({
				lim: [low,high],
				size: pop
			});
		}
		
		// Recurse to patch() method and accumulate patch collections
		var psi = null;
		bins.forEach(function(bin,ndx) {
			var x = [bin.lim[0], bin.lim[1], bin.lim[1], bin.lim[0]];
			var y = [0, 0, bin.size, bin.size];
			var ps = hf.patch(x, y, options);
			if (psi == null) {
				psi = ps;
			} else {
				psi.artifacts.concat(ps.artifacts);
				psi.data.concat(ps.data);
			}
		});
		return psi;
	}
	
	fxp.plottingMethods.hist = hist;
	module.exports = fxp;
});
