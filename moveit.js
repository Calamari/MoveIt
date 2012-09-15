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

      // Add Event Listener name detection
      addEvent = function(element, eventName, callback) {
        if (element.addEventListener) {
          element.addEventListener(eventName, callback);
        } else if (element.attachEvent) {
          element.attachEvent(eventName, callback);
        }
      },

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

  MoveIt.version = '0.0.11';

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
    if (HAS_TRANSFORM && this.config.useTransforms) {
      var from = getTranslationCoords(this.element);
    } else {
      var from = getPositionCoords(this.element);
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
        cb   = function() { callback && callback.call(self); };
    if (HAS_TRANSFORM && this.config.useTransforms) {
      easing(this.element, this.easing || '');
      duration(this.element, time);
      translate(this.element, x, y);
      if (callback) {
        if (HAS_TRANSITION_END) {
          addEvent(this.element, transitionEndName, cb)
        } else {
          setTimeout(cb, time*1000);
        }
      }
    } else {
      moveWithLoop(this.element, x, y, time, cb);
    }
    return this;
  };

  MoveIt.prototype.x = function(x) {
    this.moveTo(x, getTranslationCoords(this.element).y);
    return this;
  };

  MoveIt.prototype.y = function(y) {
    this.moveTo(getTranslationCoords(this.element).x, y);
    return this;
  };

  MoveIt.prototype.addX = function(x) {
    this.moveTo(getTranslationCoords(this.element).x + x, getTranslationCoords(this.element).y);
    return this;
  };

  MoveIt.prototype.addY = function(y) {
    this.moveTo(getTranslationCoords(this.element).x, getTranslationCoords(this.element).y + y);
    return this;
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
