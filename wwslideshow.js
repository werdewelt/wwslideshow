/* @license
Copyright (c) 2014 werdewelt GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


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
    debug: false,
    fadeover: false,
    upscale: false,
    overscale: false,
    fxinterval: 13,
    fitheight: false,
    realhide: false,
    easing: 'swing',
    center: false,
    startdelay: 0,
    text: false,
    ajax: false,
    blockcontrols: true
  };

  if (typeof selector === 'string') {
    selector = $(selector);
  }

  if (typeof options === 'undefined') {
    options = {};
  }

  if (typeof options.autoplay !== 'undefined' && !options.autoplay && typeof options.random == 'undefined'){
    options.random = false;
  }
  if (typeof options.startindex !== 'undefined'){
    options.random = false;
  }

  // Merge user options into default options
  this.options = {};
  $.extend(this.options, this.defaultopts, options);
  options = this.options;

  // Init attributes
  this.last_index = 0;
  this.active_index = 0;
  this.next_index = 0;
  this.count = 0;
  this.selector = selector;
  this.paginators = null;
  this.timer = null;
  this.is_sliding = false;
  this.paginator_texts = false;

  // Find tallest content
  this._findTallest();

  // Prepare contents
  selector.css('position', 'relative');
  this._prepareContents();

  // Paginator Text
  var textfound = false;
  var texts = [];
  selector.children().each(function (i, e) {
    var elem = $(e);
    var text = elem.attr('data-paginator-text');
    if (text) {
      texts.push(text);
      textfound = true;
    }
    else {
      texts.push('');
    }
  });
  if (textfound) this.paginator_texts = texts;



  this.count = this.slides.length;

  if (options.scaleup) {
    $(window).resize(function() {
    });
  }

  this._createPaginator();

  // Find starting image
  if (options.random) {
    this.active_index = Math.floor(this.count * Math.random());
  } else {
    this.active_index = options.startindex % this.count;
  }

  // Activate current page
  if (options.paginator) {
    for (var index in this.paginators) {
      var paginator = this.paginators[index];
      $(paginator).children().eq(this.active_index).removeClass('inact').addClass('act');
    }
  }

  if (options.ajax) {
    this._loadSlide(this.active_index);
    this._loadSlide(this._nextIndex());
  }

  // Show first image
  this.slides.eq(this.active_index).css({
    'opacity': 1,
    'z-index': 1
  }).show();


  // Shedule next slide
  if (options.autoplay) this.timer = setTimeout(function(){self._next(); }, options.startdelay + options.delay + 1);
};


// Public
// =============================================================================

wwSlideshow.prototype.constructor = wwSlideshow;

wwSlideshow.prototype.prev = function() {
  var self = this;
  var options = this.options;
  if (options.debug) console.log('prev');

  clearTimeout(this.timer);
  options.autoplay = false;
  this._prev();
};

wwSlideshow.prototype.next = function() {
  var self = this;
  var options = this.options;
  if (options.debug) console.log('next');

  clearTimeout(this.timer);
  options.autoplay = false;
  this._next();
};

wwSlideshow.prototype.show = function(index) {
  var self = this;
  var options = this.options;

  if (options.debug) console.log('show', index);

  if (index > this.count) {
    console.error('index higher than number of slides');
    return;
  }
  
  if (this.is_sliding && options.blockcontrols) return;

  if (index == this.active_index) return;

  clearTimeout(this.timer);

  this._performSlide(index);
};

wwSlideshow.prototype.getIndex = function() {
  return this.active_index;
};

wwSlideshow.prototype.update = function() {
  this._resetContents();
  this._findTallest();
  this._prepareContents();
  this.slides.eq(this.active_index).css({
    'opacity': 1,
    'z-index': 1
  }).show();
};


// Private
// =============================================================================

wwSlideshow.prototype._findTallest = function() {
  var self = this;
  var selector = this.selector;
  var max_size=0;
  var max_elem = selector.children().first();
  selector.children().each(function (i, e) {
    var elem = $(e);
    var size = elem.height();
    if ( size > max_size ) {
      max_elem = elem;
      max_size = size;
    }
  });
  max_elem.data('wwslideshow-tallest', 'true');
};

wwSlideshow.prototype._prepareContents = function() {
  var self = this;
  var options = this.options;
  var selector = this.selector;

  if (options.realhide) selector.children().hide();
  selector.children().css({
    'opacity': 0,
    'top': 0,
    'left': 0,
    'right': 0,
    'z-index': 0
  });
  if (!options.text) {
    self.slides = selector.children().css({
      'bottom': 0
    });
  }
  else {
    self.slides = selector.children();
  }
  selector.children().each(function(){
    if ($(this).data('wwslideshow-tallest') === 'true') {
      $(this).css({position: 'relative'});
    }
    else {
      $(this).css({position: 'absolute'});
    }
  });

  // Fit height option
  if (options.fitheight) {
    selector.children().css({
      'height': 'inherit',
      'width': 'auto'
    });
  }

  // Center option
  if (options.center) {
    selector.children().each(function(){
      $(this).css('top', selector.height()/2-$(this).height()/2);
    });
  }
};

wwSlideshow.prototype._resetContents = function() {
  var self = this;
  var options = this.options;
  var selector = this.selector;

  selector.children().data('wwslideshow-tallest', '');
  selector.children().css({
    'opacity': '',
    'top': '',
    'bottom': '',
    'left': '',
    'right': '',
    'z-index': '',
    'width': '',
    'height': ''
  });
};

wwSlideshow.prototype._performSlide = function(index) {
  var self = this;
  // Before
  this.next_index = index;
  this._beforeSlide(this.next_index, function() {
    self._transition( self.active_index, self.next_index, function() {
      self.last_index = self.active_index;
      self.active_index = self.next_index;
      // After
      self._afterSlide();
    });
  });
};

wwSlideshow.prototype._transition = function(from_index, to_index, done) {
  var self = this;
  var options = this.options;
  var from = this.slides.eq(from_index);
  var to = this.slides.eq(to_index);

  var defaultInterval = jQuery.fx.interval;

  if (options.debug) console.log("transition");
  
  jQuery.fx.interval = options.fxinterval;
  if (options.fadeover) {
    from.css('z-index', 0);
    to.css('z-index', 1);
    to.animate({'opacity': 1}, options.speed, options.easing, function(){
      from.css('opacity',0);
      jQuery.fx.interval = defaultInterval;
      done();
    });
  } else {
    from.animate({'opacity': 0}, options.speed, options.easing, function() {
      if (options.realhide) from.hide();
    });
    if (options.realhide) to.show();
    to.animate({'opacity': 1}, options.speed, options.easing, function(){
      from.css('z-index', 0);
      to.css('z-index', 1);
      jQuery.fx.interval = defaultInterval;
      done();
    });
  }
};

wwSlideshow.prototype._prev = function() {
  if (this.options.debug) console.log('_prev');
  this.show(this._prevIndex());
};

wwSlideshow.prototype._next = function() {
  if (this.options.debug) console.log('_next');
  this.show(this._nextIndex());
};

wwSlideshow.prototype._prevIndex = function() {
  return (this.count + this.active_index - 1) % this.count;
};
wwSlideshow.prototype._nextIndex = function() {
  return (this.active_index + 1) % this.count;
};

wwSlideshow.prototype._beforeSlide = function(nextindex, done) {
  var self = this;
  var options = this.options;
  this.is_sliding = true;
  if (options.debug) console.log('before');

  if (options.timer) {
    clearTimeout(this.timer);
  }

  if (options.paginator) {
    for (var index in this.paginators) {
      var paginator = this.paginators[index];
      $(paginator).children().removeClass('act').addClass('inact');
      $(paginator).children().eq(nextindex).removeClass('inact').addClass('act');
    }
  }
  if (options.ajax) {
    this._loadSlide(nextindex, function() {
      done();
    });
    return;
  }
  done();
};

wwSlideshow.prototype._afterSlide = function(nextindex) {
  var self = this;
  var options = this.options;
  this.is_sliding = false;
  if (options.debug) console.log('after');

  if (options.autoplay) {
    clearTimeout(this.timer);
    this.timer = setTimeout(function(){self._next();}, options.delay);
  }
  if (options.ajax) {
    this._loadSlide(this._nextIndex());
  }
};

wwSlideshow.prototype._loadSlide = function(index, done) {
  var self = this;
  var options = this.options;
  var slide = this.selector.children().eq(index);
  var status = slide.data("ww-status");
  if (status == "loading") {
    slide.on("ww-loaded", done);
    return;
  }
  if (status == "loaded") { 
    if (done) done();
    return;
  }
  var urls = [];
  var bgElements, imgElements;

  if (options.debug) console.log("Loading slide", index);

  candidates = $();
  candidates = candidates.add(slide.filter("[data-ajax-background]"));
  candidates = candidates.add(slide.find("[data-ajax-background]"));
  candidates.each(function() {
    urls.push($(this).attr("data-ajax-background"));
    bgElements = $(this);
  });

  candidates = $();
  candidates = candidates.add(slide.filter("[data-ajax-src]"));
  candidates = candidates.add(slide.find("[data-ajax-src]"));
  candidates.each(function() {
    urls.push($(this).attr("data-ajax-src"));
    imgElements = $(this);
  });

  slide.data("ww-status", "loading");
  if (options.debug) console.log("Loading urls", urls);
  this._preloadImages(urls, function() {
    if (bgElements) {
      bgElements.each(function() {
        var url = $(this).attr("data-ajax-background");
        $(this).css("background-image", "url("+url+")");
      });
    }
    if (imgElements) {
      imgElements.each(function() {
        var url = $(this).attr("data-ajax-src");
        $(this).attr("src", url);
      });
    }
    slide.data("ww-status", "loaded");
    slide.trigger("ww-loaded");
    if (options.debug) console.log("Loaded", index);
    if (done) done();
  });
};


wwSlideshow.prototype._preloadImages = function(urls, done) {
  var counter = urls.length;
  counterFunc = function() {
    counter--;
    if (counter === 0) done();
  };
  for (var i in urls) {
    var url = urls[i];
    this._preloadImage(url, counterFunc);
  }
};

wwSlideshow.prototype._preloadImage = function(url, done) {
  var img = new Image();
  img.onload = function() {
    done();
  };
  img.src = url;
};

wwSlideshow.prototype._createPaginator = function() {
  var self = this;
  var options = this.options;
  if (options.debug) console.log('createPaginator');

  if (options.paginator) {

    this.paginators = [];
    if (typeof options.paginator === 'string') options.paginator = [options.paginator];

    for (var index in options.paginator) {
      var target = options.paginator[index];
      var paginator = target;
      for (i=0; i<this.count; i++) {
        page = $('<a/>').appendTo(paginator).addClass('page inact').attr('href','#');

        if (options.nums) page.text(i+1);
        else if (self.paginator_texts) {
          $('<span/>').appendTo(page).addClass('paginator-text').text(self.paginator_texts[i]);
        }

        page.click(function() {
          pageindex = $(this).index();
          self.options.autoplay = false;
          clearTimeout(self.timer);
          self.show(pageindex);
          return false;
        });
      }
      this.paginators.push(paginator);
    }
  }
};


// jQuery plugin
// =============================================================================

var methods = {
  init: function(options) {
    var slideshow = new wwSlideshow(this, options);
    this.data('slideshow',slideshow);
    return this;
  },
  next: function() {
    this.data('slideshow').next();
  },
  prev: function() {
    this.data('slideshow').prev();
  },
  show: function(index) {
    this.data('slideshow').show(index);
  },
  getIndex: function() {
    return this.data('slideshow').getIndex();
  },
  update: function() {
    this.data('slideshow').update();
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
};

})(jQuery);