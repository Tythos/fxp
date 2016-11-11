fxp
===

Figure / Axis paradigm plotting for easy in-browser, SVG plots in a MATLAB /
MatPlotLib-like ontology (though slightly streamlined).

Figure
------

To initialize a figure/axis, pass an existing <svg/> element to the *figure()*
method. The element object will be returned, with a number of properties and
methods attached. Several figure-specific options can be passed in an object
as the second argument to this method.

title
~~~~~

The text that will appear at the top of the figure.

xlabel
~~~~~~

The text that will appear beneath the x-axis.

ylabel
~~~~~~

The text that will appear beneath the y-axis.

Scatter
-------

The *scatter()* method is attached to the results of a *figure()* invocation.
It accepts an Array of x values and an Array of y values. A third, optional
argument can be passed to specify point properties. This method returns a
PointSeries-like object, which is also pushed to the <svg/> object's *series*
Array property.

color
~~~~~

The color of the point. See `Colors`_ for more information on how colors can be
specified.

size
~~~~

The size of the scatter plot points.

edgecolor
~~~~~~~~~

The color of the point edge. See `Colors`_ for more information on how colors
can be specified.

Plot
----

The *plot()* method is attached to the results of a *figure()* invocation. It
accepts an Array of x values and an Array of y values. A third, optional
argument can be passed to specify line properties. This method returns a
LineSeries-like object, which is also pushed to the <svg/> object's *series*
Array property.

color
~~~~~

The color of the line. See `Colors`_ for more information on how colors can be
specified.

width
~~~~~

The width of the plotted lines.

style
~~~~~

The line style (solid, dashed, etc.) See `Line Style`_ for more information on
how line styles can be specified.

supportcolor
~~~~~~~~~~~~

Defaults to null, in which case a normal line is plotted. Otherwise, can be a
color specification (see `Colors`_ for more information on how colors can be
specified) that indicates the color used to shade the area between the line and
the x axis.

Patch
-----

The *patch()* method is attached to the results of a *figure()* invocation. It
accepts an Array of x values and an Array of y values. A third, optional
argument can be passed to specify patch properties. This method returns a
PatchSeries-like object, which is also pushed to the <svg/> object's *series*
Array property.

color
~~~~~

The color of the patch fill. See `Colors`_ for more information on how colors
can be specified.

width
~~~~~

The width of the line forming the edge of the patch.

edgecolor
~~~~~~~~~

The color of the patch edge. See `Colors`_ for more information on how colors
can be specified.

Colors
------

Like MATLAB and MatPlotLib, colors can be specified in several ways. These are
organized here by the data type of the argument provided.

string
~~~~~~

A color can be specified by full name. Supported names are taken from MATLAB and
MatPlotLib references, and include the following values:

* 'red'
* 'firebrick'
* 'magenta'
* 'cyan'
* 'yellow'
* 'blue'
* 'gray'
* 'green'
* 'darkgoldenrod'
* 'white'
* 'purple'
* 'black'

A color can also be specified by initial. Supported initials are taken from
MATLAB and MatPlotLib references, and include the following values:

* 'b'
* 'c'
* 'g'
* 'k'
* 'm'
* 'r'
* 'w'
* 'y'

Lastly, a color can be specified in CSS-style hexidecimal values (in string
representation). These values must be preceeded by a pound character ('#'), and
can include 3- or 6-character hexidecimal characters indicating the RGB value in
a 4- or 8-bit-per-component RGB range of values. For example, the following
both define a cyan-like shade of blue:

* '#0ff'
* '#00ffff'

array
~~~~~

A color can also be specified by 3- or 4-component numerical Arrays. Each value
in the Array be a number between 0 and 1 (inclusive). 3-component numerical
Arrays are assumed to have no transparency. 4-component numerical Arrays use the
4th component to specify transparency (where 0 is transparent and 1 is opaque).
For example, the following numerical Arrays express a shade of green and a
semi-transparent shade of gray, respectively:

* [0,1,0]
* [0.5,0.5,0.5,0.5]

number
~~~~~~

A single numerical value can also be used to specify a hue-like property of a
color. This interpolates between red, green, and blue shades for values between
0 and 1 (inclusive). For example, the following numeric values will be
interpreted as red, green, and blue color values:

* 0.0
* 0.5
* 1.0

Line Style
----------

A line style determines the pattern with which a line is drawn. This can range
from a solid line (default) to a mix of dashed and dotted patterns. Each
supported pattern can be specified either by name or by character, based on the
specifications from MATLAB and MatPlotLib documentation:

* 'solid' ('-')
* 'dashed' ('--')
* 'dashdot' ('-.')
* 'dotted' (':')

Demos
-----

See the *ref* package folder to see static HTML files with *fxp* examples.
