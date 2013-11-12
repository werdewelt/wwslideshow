wwslideshow
===========

A responsive-friendly javascript slideshow


Usage Example
-----------
Just include the plugin in your site and call the function in your main javascript file.

### Basic Example (default options):

  $("#imagecontainer").wwslideshow();

You can customize the default parameters within the function:

### Slower transition:

  $("#imagecontainer").wwslideshow({delay: 4000, speed: 2000});


Default options
-----------

```
autoplay: true,
random: true,     // randomize the image order
startindex: null,
delay: 2000,      // delay between slides
speed: 1000,      // transition speed
paginator: null,  // selector
nums: false,      // set the selectors to numbers
debug: false,
fadeover: false,
upscale: false,
overscale: false,
fxinterval: 13,
fitheight: false,
realhide: false,
easing: "swing",
center: false,
startdelay: 0,
text: false
```

### Prev&Next Buttons

  $("#wwcontroler .prev").click(function() {
    $("#imagecontainer").wwslideshow("prev");
  });