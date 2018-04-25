/*
*/

require(['FXP'], function(FXP) {
	var svg = document.querySelector("#plot");
	var fx = new FXP(svg);
	ls0 = fx.plot([0,1,2,3], [2,3,5,7]);
	ls1 = fx.plot([1,2,4,8], [2,4,6,8]);
});

