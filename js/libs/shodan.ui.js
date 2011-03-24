/**
 *  Shodan
 **/
var Shodan = window.Shodan || {};

/**
 *  Shodan.UI
 **/
Shodan.UI = {};

/** section: Shodan UI
 *  class Shodan.UI.Base
 *
 *  Base class that all Shodan.UI components are based on.
 **/
Shodan.UI.Base = Class.create({
  initialize: function(el, options) {
    this.el = $(el);
  }
});
/** section: Shodan UI
 *  class Shodan.UI.SlideyPanel < Shodan.UI.Base
 *
 *  A mechanism for hiding and showing content with a nice, sliding animation. Pretty common
 *  around teh Interwebs although I've never really found a proper name for them. Unless informed
 *  otherwise, I hereby name them "Slidey Panels".
 **/
Shodan.UI.SlideyPanel = Class.create(Shodan.UI.Base, {
  /**
   *  new Shodan.UI.SlideyPanel(element[, options])
   *  - element (String): DOM Element or ID of the slidey panel container
   *  - options (Object): Object containing various configuration options
   *
   **/
  initialize: function($super, el, options) {
    this.options = Object.extend({
      // autoHide (Bool)
      // set to true if content should be hidden initially
      autoHide: true,

      // callback (Function)
      // Callback function to be executed after show / hide animation
      callback: null,

      // contentSelector (String)
      // CSS selector for the content to be toggled. Should be unique.
      contentSelector: '.content',

      // duration (Int)
      // Duration in seconds, defaults to 0.5 (a fifth of a second).
      duration: '0.5',

      // openClass (String)
      // CSS class to be applied to container when content is showing.
      openClass: 'open',

      // toggleSelector (String)
      // CSS selector for the toggle. Should be unique.
      toggleSelector: '.hd',

      // transition (String)
      // Scripty2 animation transition preset.
      // See http://scripty2.com/doc/scripty2%20fx/s2/fx/transitions.html
      transition: 'sinusoidal'
    }, options || {});
    $super(el, this.options);
    this.build();
  },
  animate: function(content, _style, after) {
    this.animation = new S2.FX.Morph(content, {
      after: function() {
        this.animating = false;
        if (typeof after === 'function') {
          after();
        }
      }.bind(this),
      before: function() {
        this.animating = true;
      }.bind(this),
      style: _style,
      duration: this.options.duration,
      transition: this.options.transition
    }).play();
  },
  /**
   *  Shodan.UI.SlideyPanel.build()
   **/
  build: function() {
    var content = this.el.down(this.options.contentSelector);

    // Curried functions. Use these two with the pre baked arguments
    this._hide = this.hideContent.curry(content, function() {
      this.el.removeClassName(this.options.openClass);
      // if one has been, set execute the callback function
      if (typeof this.options.callback === 'function') {
        this.options.callback();
      }
    }.bind(this));
    this._reveal = this.revealContent.curry(content, function() {
      this.el.addClassName(this.options.openClass);
      // if one has been, set execute the callback function
      if (typeof this.options.callback === 'function') {
        this.options.callback();
      }
    }.bind(this));

    // santitize the CSS of the content element
    this.resetContentCSS(content);

    // if autohide is set, auto... hide...
    if (this.options.autoHide) {
      this._hide();
    }
    this.el.on('click', this.options.toggleSelector, this.onClick.bind(this));
  },
  /**
   *  Shodan.UI.SlideyPanel.hideContent(after, content)
   *  - after (Function): Callback function to run after hiding the content
   *  - content (DOMElement): target DOM element
   **/
  hideContent: function(content, after) {
    // grab the height of the content and store it on the
    // element for later. We do this every time on the off
    // chance that the content height might change.
    var h = content.measure('margin-box-height');
    content.store('openHeight', h);
    this.animate(content, 'height: 0', after);
  },
  /**
   *  Shodan.UI.SlideyPanel.onClick(event, el)
   *  - event (Event): native event instance
   *  - el (DOMElement): target DOM element
   **/
  onClick: function(e, el) {
    e.stop();
    (this.el.hasClassName(this.options.openClass)) ? this._hide() : this._reveal();
  },
  /**
   *  Shodan.UI.SlideyPanel.resetContentCSS(content)
   *  - content (DOMElement): target DOM element
   *
   *  Sanitize the CSS on the content container
   **/
  resetContentCSS: function(content) {
    content.setStyle({
      border: 'none',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    });
    content.store('openHeight', content.measure('margin-box-height'));
  },
  /**
   *  Shodan.UI.SlideyPanel.revealContent(after, content)
   *  - after (Function): Callback function to run after hiding the content
   *  - content (DOMElement): target DOM element
   **/
  revealContent: function(content, after) {
    // grab the content height from the elements data store
    var h = content.retrieve('openHeight');
    this.animate(content, 'height: '+h+'px', after);
  }
});
/** section: Shodan UI
 *  class Shodan.UI.Accordion < Shodan.UI.SlideyPanel
 *
 *  An extension of the slidey panel.
 **/
Shodan.UI.Accordion = Class.create(Shodan.UI.SlideyPanel, {
  /**
   *  new Shodan.UI.Accordion(element[, options])
   *  - element (String): DOM Element or ID of the slidey panel container
   *  - options (Object): Object containing various configuration options
   *
   **/
  initialize: function($super, el, options) {
    this.options = Object.extend({
      // allowMultiOpen (String)
      // Set to true if more than one item can be open at once.
      allowMultiOpen: false,

      // contentSelector (String)
      // CSS selector for the sub menu to be toggled.
      contentSelector: '.sub',

      // initialOpenItem (String|bool)
      // Determines if the accordion starts with an item initially open. Use
      // 'first' to have the first item open or a CSS selector to select the
      // initially open item.
      initialOpenItem: false
    }, options || {});
    $super(el, this.options);
  },
  /**
   *  Shodan.UI.Accordion.build()
   **/
  build: function() {
    // when the component is initialised, add the click handler
    this.el.observe('component:ready', function() {
      this.el.on('click', this.options.toggleSelector, this.onClick.bind(this));
    }.bind(this));

    this.callback = function() {
      if (typeof this.options.callback === 'function') {
        this.options.callback();
      }
    }.bind(this);

    this.el.select('ul.root>li>'+this.options.contentSelector).each(function(el) {
      this.resetContentCSS(el);
      el.setStyle('height: 0');
    }, this);

    if (this.options.initialOpenItem) {
      var initialItem, cb;

      if (this.options.initialOpenItem === 'first') {
        initialItem = this.el.down('li');
      } else {
        initialItem = this.el.down(this.options.initialOpenItem);
      }

      cb = function() {
        initialItem.addClassName(this.options.openClass);
        this.callback();
        this.el.fire('component:ready');
      }.bind(this);

      this.revealContent(initialItem.down(this.options.contentSelector), cb);
    } else {
      this.el.fire('component:ready');
    }
  },
  /**
   *  Shodan.UI.Accordion.onClick(event, el)
   *  - event (Event): native event instance
   *  - el (DOMElement): target DOM element
   **/
  onClick: function(e, el) {
    if (!this.animating) {

      var content = $(el).next(this.options.contentSelector),
          clickedLi = el.up('li'),
          open;

      if (clickedLi.hasClassName(this.options.openClass)) {

        // user toggles an open item
        this.hideContent(clickedLi.down(this.options.contentSelector), function() {
          clickedLi.removeClassName(this.options.openClass);
          this.callback();
        }.bind(this));

      } else {

        // user toggles a closed item. Are we allowing multiple open items?
        // If not, close the current open item
        if ((open = this.el.down('.'+this.options.openClass)) && !this.options.allowMultiOpen) {
          this.hideContent(open.down(this.options.contentSelector), function() {
            open.removeClassName(this.options.openClass);
            this.callback();
          }.bind(this));
        }

        // Now open the item the user clicked on
        this.revealContent(content, function() {
          content.up('li').addClassName(this.options.openClass);
          this.callback();
        }.bind(this));

      }
    }
  }
});
/** section: Shodan UI
 *  class Shodan.UI.Slideshow < Shodan.UI.Base
 *
 *  A simple image slideshow
 **/
Shodan.UI.Slideshow = Class.create(Shodan.UI.Base, {
  initialize: function($super, el, options) {
    this.options = Object.extend({
      // delay (Integer)
      // Thye delay between slide transitions
      delay: 3,

      // displayTitle (Bool)
      // Set to false to hide the slide title
      displayTitle: true,

      // height (Integer)
      // The height of the slideshow
      height: 350,

      // slideSelector (String)
      // CSS selector for the slides
      slideSelector: '.sh-ui-slideshow-slide',

      // transitionDuration (Int)
      // The duration of the transition effect
      transitionDuration: 0.5,

      // width (Integer)
      // The width of the slideshow
      width: 500
    }, options || {});
    $super(el, this.options);
    this.index = 0;
    this.slides = [];
    this.build();
    this.play();
  },
  build: function() {
    this.el.setStyle({
      height: this.options.height+'px',
      overflow: 'hidden',
      position: 'relative',
      width: this.options.width+'px'
    });

    if (this.options.displayTitle) {
      this.slideTitle = new Element('div').addClassName('sh-ui-slideshow-title');
      this.el.insert(this.slideTitle);
    }
    this.el.select(this.options.slideSelector).each(function(el, idx) {
      el.writeAttribute('id', 'sh-ui-slide-'+idx);
      el.setStyle({
        display: 'block',
        height: '100%',
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%'
      });
      this.slides.push(el);
    }, this);
    // bring the first slide to the top of the stack
    this.slides[0].setStyle({zIndex: 10});
    if (this.options.displayTitle) {
      this.slideTitle.update(this.slides[0].readAttribute('alt'));
    }
    this.size = this.slides.length;
  },
  next: function(){
    if (this.index === this.size-1) {
      this.transition(0, function() { this.index = 0; }.bind(this));
    } else {
      this.transition(this.index+1, function() { this.index++; }.bind(this));
    }
  },
  pause: function(){
    this.p.stop();
  },
  play: function() {
    this.p = new PeriodicalExecuter(this.next.bind(this), this.options.delay);
  },
  previous : function() {
    if (this.index === 0) {
      this.transition(this.size-1, function() { this.index = this.size-1; }.bind(this));
    } else {
      this.transition(this.index-1, function() { this.index--; }.bind(this));
    }
  },
  transition: function(idx, after) {
    if (idx != this.index) {
      var currentSlide = this.slides[this.index],
          nextSlide = this.slides[idx];

      if (this.slideAnimating) {
        this.slideFx.cancel();
      }

      if (this.options.displayTitle) {
        this.updateTitle(this.slides[idx].readAttribute('alt'));
      }

      this.slideFx = new S2.FX.Morph(nextSlide, {
        after: function() {
          this.slideAnimating = false;
          if (typeof after === 'function') {
            after();
          }
        }.bind(this),
        before: function() {
          currentSlide.setStyle({ zIndex: 10 });
          nextSlide.setStyle({ zIndex: 20 }).setOpacity(0);
          this.slideAnimating = true;
        }.bind(this),
        duration: this.options.transitionDuration,
        engine: "javascript",
        style: "opacity: 1"
      }).play();
    }
  },
  updateTitle: function(text) {
    this.slideTitle.morph('opacity: 0', {
      after: function() {
        this.slideTitle.morph('opacity: 1', {
          before: function() {
            this.slideTitle.
              setOpacity(0).
              update(text);
          }.bind(this),
          duration: (this.options.transitionDuration / 2)
        });
      }.bind(this),
      duration: (this.options.transitionDuration / 2)
    });
  }
});
