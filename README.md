wwslideshow
===========

A responsive-friendly javascript slideshow


Usage Example
-----------
Just call the function in your main javascript file or in your html file.

### Basic Example (default options):

	$("#imagecontainer").wwslideshow();

You can customize the default parameters within the function:

### Slower transition:

	$("#imagecontainer").wwslideshow({delay: 4000, speed: 2000});


Default options
-----------

	autoplay: true,  	
	random: true,			// randomize the image order
	startindex: null, 
	delay: 2000,      // delay between slides
	speed: 1000,      // transition speed
	paginator: null,  // selector
	nums: false,			// set the selectors to numbers
	debug: false