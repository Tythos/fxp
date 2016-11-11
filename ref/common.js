/*
*/

svgXmlNs = "http://www.w3.org/2000/svg";

function makeSvgArea(x, y, w, h, lbl) {
	var g = document.createElementNS(svgXmlNs, 'g');
	g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
	g.setAttribute('width', w);
	g.setAttribute('height', h);
	
	var r = document.createElementNS(svgXmlNs, 'rect');
	r.setAttribute('width', w);
	r.setAttribute('height', h);
	r.setAttribute('class', 'fxp' + lbl[0].toUpperCase() + lbl.substr(1));
	
	var t = document.createElementNS(svgXmlNs, 'text');
	t.setAttribute('x', 0.5 * w);
	t.setAttribute('y', 0.5 * h);
	t.setAttribute('text-anchor', 'middle');
	t.setAttribute('alignment-baseline', 'central');
	t.innerHTML = '[' + lbl + ']';
	
	g.appendChild(r);
	g.appendChild(t);
	return g;
}

function figure(svg) {
	var m = [0.1,0.2,0.3,0.4];
	var w = parseInt(svg.getAttribute('width'));
	var h = parseInt(svg.getAttribute('height'));
	
	svg.appendChild(makeSvgArea(w * m[3],       0,              w * (1 - m[1] - m[3]), h * m[0],              'title'));
	svg.appendChild(makeSvgArea(w * (1 - m[1]), h * m[0],       w * m[1],              h * (1 - m[0] - m[2]), 'legend'));
	svg.appendChild(makeSvgArea(w * m[3],       h * (1 - m[2]), w * (1 - m[1] - m[3]), h * m[2],              'xaxis'));
	svg.appendChild(makeSvgArea(0,              h * m[0],       w * m[3],              h * (1 - m[0] - m[2]), 'yaxis'));
	svg.appendChild(makeSvgArea(w * m[3],       h * m[0],       w * (1 - m[1] - m[3]), h * (1 - m[0] - m[2]), 'graph'));

	return svg;
}

