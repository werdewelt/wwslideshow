// Copyright (c) 2013 werdewelt GmbH

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


(function($) {


// Constructor
// =============================================================================

var wwSlideshow = function(selector, options) {
  var self = this;

  if (selector.children().length === 0) return;

  this.defaultopts = {
    autoplay: true,
    random: true,
    startindex: null,
    delay: 2000,      // delay between slides
    speed: 1000,      // transition speed
    paginator: null,  // selector
    nums: false,
    debug: false
  }

  if (typeof selector === "string") {
    selector = $(selector)
  }

  if (typeof options === "undefined") {
    options = {}
  }

  if (typeof options.autoplay !== "undefined" && !options.autoplay && typeof options.random == "undefined"){
    options.random = false
  }
  if (typeof options.startindex !== "undefined"){ 
    options.random = false;
  }

  // Merge user options into default options
  this.options = {};
  $.extend(this.options, this.defaultopts, options);
  options = this.options;

  // Init attributes
  this.active_index = 0;
  this.next_index = 0;
  this.count = 0;
  this.selector = selector;
  this.paginators = null;
  this.timer = null;

  // Prepare contents
  this.slides = selector.children().css({
    opacity: 0,
    position: 'absolute'
  });
  // Find tallest content
  var max_size=0;
  var max_elem;
  selector.children().each(function (i, e) {
    var elem = $(e);
    var size = elem.outerHeight()
    if ( size > max_size ) {
      max_elem=elem;
      max_size = size;
    }
  });
  max_elem.css('position', 'relative');
  
  this.count = this.slides.length;

  this._createDots();

  // Find starting image

  if (options.random) {
    this.active_index = Math.floor(this.count * Math.random())
  } else {
    this.active_index = options.startindex % this.count;
  }

  // Activate current page
  if (options.paginator) this.paginators.children().eq(this.active_index).removeClass("inact").addClass("act");


  // Show first image
  this.slides.eq(this.active_index).css({opacity: 1.0});

  // Shedule next slide
  if (options.autoplay) this.timer = setTimeout(function(){self._next()}, options.delay + 1);
};


// Public
// =============================================================================

wwSlideshow.prototype.constructor = wwSlideshow;

wwSlideshow.prototype.prev = function() {
  var self = this;
  var options = this.options;
  if (options.debug) console.log('prev')

  clearTimeout(this.timer);
  options.autoplay = false;
  this._prev();
};

wwSlideshow.prototype.next = function() {
  var self = this;
  var options = this.options;
  if (options.debug) console.log('next')

  clearTimeout(this.timer);
  options.autoplay = false;
  this._next(); 
};

wwSlideshow.prototype.show = function(index) {
  var self = this;
  var options = this.options;
  if (options.debug) console.log("show")

  if (index == this.active_index) return;

  this.next_index = index;
  this._beforeSlide(this.next_index);
  this.slides.eq(this.active_index).animate({opacity: 0.0}, options.speed);
  this.active_index = this.next_index;
  this.slides.eq(this.active_index).animate({opacity: 1.0}, options.speed, function(){ self._afterSlide()});
}


// Private
// =============================================================================

wwSlideshow.prototype._prev = function() { 
  if (this.options.debug) console.log('_prev')
  this.show((this.count + this.active_index - 1) % this.count)
};

wwSlideshow.prototype._next = function() {
  if (this.options.debug) console.log('_next')
  this.show((this.active_index + 1) % this.count)
};

wwSlideshow.prototype._beforeSlide = function(nextindex) {
  var self = this;
  var options = this.options;
  if (options.debug) console.log("before")

  if (options.timer) {
    clearTimeout(this.timer);
  }

  if (options.paginator) {
    this.paginators.children().removeClass("act").addClass("inact")
    this.paginators.children().eq(nextindex).removeClass("inact").addClass("act");
  }
}

wwSlideshow.prototype._afterSlide = function(nextindex) {
  var self = this; 
  var options = this.options;
  if (options.debug) console.log("after")

  if (options.autoplay) {
    clearTimeout(this.timer);
    this.timer = setTimeout(function(){self._next()}, options.delay);
  }
}

wwSlideshow.prototype._createDots = function() {
  var self = this;
  var options = this.options;
  if (options.debug) console.log("createDots")

  if (options.paginator) {
    this.paginators = $("<div/>").appendTo(options.paginator).addClass('paginator').css({
      position: 'absolute',
      'z-index': 20000
    })
    for (i=0; i<this.count; i++) {
      page = $("<a/>").appendTo(this.paginators).addClass('page inact').attr('href','#');

      if (options.nums) page.text(i+1);

      page.click( function() {
        pageindex = $(this).index();
        self.options.autoplay = false;
        clearTimeout(self.timer);
        self.show(pageindex);
        return false;
      });
    }
  }
}


// jQuery plugin
// =============================================================================

var methods = {
  init: function(options) { 
    var slideshow = new wwSlideshow(this, options);
    this.data("slideshow",slideshow);
    return this;
  },
  next: function() {
    this.data("slideshow").next()
  },
  prev: function() { 
    this.data("slideshow").prev()
  },
  show: function(index) { 
    this.data("slideshow").show(index)
  }
};

$.fn.wwslideshow = function(method_options) {
  if ( methods[method_options] ) {
    return methods[method_options].apply( this, Array.prototype.slice.call( arguments, 1 ));
  } else if ( typeof method_options === 'object' || ! method_options ) {
    return methods.init.apply( this, arguments );
  } else {
    $.error( 'Method ' +  method_options + ' does not exist on jQuery.tooltip' );
  }
}

})(jQuery);