/**
 TODO:
   - fallback to left/right
 */
window.MoveIt = (function(win, doc) {
  var undef,

      vendor        = (/webkit/i).test(navigator.appVersion) ? 'webkit' :
        (/firefox/i).test(navigator.userAgent) ? 'Moz' :
        (/trident/i).test(navigator.userAgent) ? 'ms' :
        'opera' in window ? 'O' : '',

      // some constants:
      HAS_3D        = 'WebKitCSSMatrix' in win && 'm11' in new WebKitCSSMatrix(),
      HAS_TRANSFORM = vendor + 'Transform' in document.documentElement.style,
      HAS_TRANSITION_END = 'on' + vendor + 'transitionend' in win,

      // check this in http://developer.mozilla.org/en/CSS/CSS_transitions#section_8
      transitionEndName   = (vendor === 'Moz') ? 'transitionend' : vendor + 'TransitionEnd',

      transformJS         = vendor + 'Transform',
      transformDurationJS = vendor + 'TransitionDuration',
      transformEasingJS   = vendor + 'TransitionTimingFunction',
      translateCSS        = 'translate' + (HAS_3D ? '3d' : ''),

      isNumber = function(number) {
        return typeof number === 'number';
      },

      // RequestAnimationFrame Shims from Paul Irish
      requestAnimationFrame = (function() {
        return win.requestAnimationFrame
        || win.webkitRequestAnimationFrame
        || win.mozRequestAnimationFrame
        || win.oRequestAnimationFrame
        || win.msRequestAnimationFrame
        || function(callback) {
             return win.setTimeout(callback, 1000/60);
           };
      }()),
      cancelAnimationFrame = (function () {
          return win.cancelRequestAnimationFrame
          || win.webkitCancelAnimationFrame
          || win.webkitCancelRequestAnimationFrame
          || win.mozCancelRequestAnimationFrame
          || win.oCancelRequestAnimationFrame
          || win.msCancelRequestAnimationFrame
          || clearTimeout;
      }()),

      addEvent, removeEvent,

      getTranslationCoords = function(element) {
        var matrix = getComputedStyle(element, null)[transformJS].replace(/[^0-9-.,]/g, '').split(',');
        return { x: ~~matrix[4], y: ~~matrix[5] };
      },
      getPositionCoords = function(element) {
        var style = getComputedStyle(element, null);
        return {
          x: ~~style.left.replace('px', ''),
          y: ~~style.top.replace('px', '')
        };
      },
      translate = function(element, x, y) {
        element.style[transformJS] = translateCSS + '(' + (isNumber(x) ? x + 'px' : x) + ',' + (isNumber(y) ? y + 'px' : y) + (HAS_3D ? ',0' : '') + ')';
      },
      duration = function(element, seconds) {
        element.style[transformDurationJS] = isNumber(seconds) ? seconds + 's' : seconds + '';
      },
      easing = function(element, easing) {
        element.style[transformEasingJS] = easing;
      },
      moveWithLoop = function(element, x, y, seconds, callback) {
        var duration  = seconds * 1000,
            startTime = Date.now(),
            endTime   = startTime + duration,
            source    = getPositionCoords(element),

            loopingMethod = function() {
              var now = Date.now(),
                  position = now > endTime ? 1 : (now - startTime) / duration;
              element.style.left = (source.x + (x - source.x) * position) + 'px';
              element.style.top  = (source.y + (y - source.y) * position) + 'px';
              if (position === 1) {
                cancelAnimationFrame(loop);
                callback && callback();
              } else {
                loop = requestAnimationFrame(loopingMethod);
              }
            },
            loop = requestAnimationFrame(loopingMethod);
        return loop;
      };


  if (window.addEventListener) {
    addEvent = function(element, eventName, callback) {
      element.addEventListener(eventName, callback);
    };
    removeEvent = function(element, eventName, callback) {
      element.removeEventListener(eventName, callback);
    };
  } else if (document.attachEvent) {
    addEvent = function(element, eventName, callback) {
      element.attachEvent('on' + eventName, callback);
    };
    removeEvent = function(element, eventName, callback) {
      element.removeEvent('on' + eventName, callback);
    };
  }

  /**
   * Creates Element MoveIt Instance
   * @param {Element} element The element to move
   * @param {Boolean} [options.useTransforms=true] Shall we use CSS3 transformations if available?
   * @param {Boolean} [options.use3DTransforms=true] Shall we use CSS3 3D transformations if available?
   */
  var MoveIt = function(element, config) {
    this.element = typeof element === 'string' ? doc.getElementById(element) : element;
    this.config = config || {};
    if (this.config.useTransforms === undef) {
      this.config.useTransforms = true;
    }
  };

  MoveIt.version = '0.0.14';

  /**
   * Sets duration of animation
   * @param {Number|String} seconds Time in seconds or string used in transform-duration css property
   */
  MoveIt.prototype.duration = function(seconds) {
    this.time = seconds;
    return this;
  };

  /**
   * Sets easing method for animation
   * @param {String} easing Easing string
   */
  MoveIt.prototype.ease = function(easing) {
    this.easing = easing;
    return this;
  };

  /**
   * Moves an element relatively to actual coordinates
   * @param {Number|String} x        x destination coord
   * @param {Number|String} y        y destination coord
   * @param {Function}      callback Method to call on finish
   */
  MoveIt.prototype.move = function(x, y, callback) {
    var form;
    if (HAS_TRANSFORM && this.config.useTransforms) {
      from = getTranslationCoords(this.element);
    } else {
      from = getPositionCoords(this.element);
    }
    this.moveTo(from.x + x, from.y + y, callback);
    return this;
  };

  /**
   * Moves an element absolutely to given coords
   * @param {Number|String} x        x destination coord
   * @param {Number|String} y        y destination coord
   * @param {Function}      callback Method to call on finish
   */
  MoveIt.prototype.moveTo = function(x, y, callback) {
    var time = this.time || 0,
        self = this,
        cb   = function() {
          callback && callback.call(self);
          HAS_TRANSITION_END && removeEvent(self.element, transitionEndName, cb);
        };
    if (HAS_TRANSFORM && this.config.useTransforms) {
      easing(this.element, this.easing || '');
      duration(this.element, time);
      translate(this.element, x, y);
      if (callback) {
        if (HAS_TRANSITION_END) {
          addEvent(this.element, transitionEndName, cb);
        } else {
          setTimeout(cb, time*1000);
        }
      }
    } else {
      moveWithLoop(this.element, x, y, time, cb);
    }
    return this;
  };

  MoveIt.prototype.x = function(x, callback) {
    if (x === undef) {
      return getTranslationCoords(this.element).x;
    }
    this.moveTo(x, getTranslationCoords(this.element).y, callback);
    return this;
  };

  MoveIt.prototype.y = function(y, callback) {
    if (y === undef) {
      return getTranslationCoords(this.element).y;
    }
    this.moveTo(getTranslationCoords(this.element).x, y, callback);
    return this;
  };

  MoveIt.prototype.addX = function(x, callback) {
    this.moveTo(getTranslationCoords(this.element).x + x, getTranslationCoords(this.element).y, callback);
    return this;
  };

  MoveIt.prototype.addY = function(y, callback) {
    this.moveTo(getTranslationCoords(this.element).x, getTranslationCoords(this.element).y + y, callback);
    return this;
  };

  /**
   * Returns object with x and y position
   * @return {Object}
   */
  MoveIt.prototype.position = function() {
    return getTranslationCoords(this.element);
  };

  /**
   * Converts transformations to left, right positions
   */
  MoveIt.prototype.convertTransform = function() {
    var pos         = getPositionCoords(this.element),
        translation = getTranslationCoords(this.element);
    this.element.style.left = (pos.x + translation.x) + 'px';
    this.element.style.top  = (pos.y + translation.y) + 'px';
    duration(this.element, 0);
    translate(this.element, 0, 0);
    return this;
  };

  return MoveIt;
})(window, document);
