var GET_VALUE = 'getValue';
var SET_VALUE = 'setValue';
var FOLDER_SYMBOL = "{...}";
var CLASS = "ui";
function UserInterface(options, system) {
  this.construct(options, system, 'basic');
}

UserInterface.prototype.types = {
  basic: function (options) {
    this.include(options, {
      values: undefined,
      template: {},
      container: undefined,
      title: 'User Interface',
      overrideCallbacks: false,
      css: undefined
    });
    if (this.runsRender()) {
      if (this.options().container === undefined) {
        this.options().container = this.container = this.globalSettings().uiContainer;
      }
      this.notifyUndefined(['container']);
      if (typeof $ === 'undefined') {
        $ = jQuery;
      }
      this.updaters = [];
      this.reference = {};
      if (this.values) this.showEditor();
    }
  }
};


UserInterface.prototype.showEditor = function () {
  this.destroy();
  var domElements = this.build(this.values, this.template, this.reference);
  var $domElements = $(domElements);
  $domElements.attr('id', this.domId = this.nextId('ui') + new Date().getTime());
  $domElements.removeClass('level');
  $domElements.addClass(CLASS);
  _.each(this.css, function (css, sel) {
    $domElements.find(sel).css(css);
  });
  if (this.title) {
    var $title = $('<h3 />', {'class': 'title'});
    $title.text(this.title);
    $domElements.prepend($title);
  }
  $(this.container).append($domElements);
};


UserInterface.prototype.reuseWith = function (options) {
  this.destroy();
  _.extend(this._options, options);
  this.construct(this._options, this.parentSystem, this.options().type);
};

UserInterface.prototype.getValues = function () {
  _.each(this.updaters, function (fn) {
    try {
      if (typeof fn == 'function') fn();
    } catch (e) {
    }
  });
  return this.values;
};

UserInterface.prototype.getReference = function () {
  return this.reference;
};

UserInterface.prototype.objectInPath = function (path) {
  return utils.pathObject(this.values, path);
};

UserInterface.prototype.pathInReference = function (child, ancestor, values, path) {
  if (path === undefined) {
    path = [];
    ancestor = this.reference;
    values = this.values;
  }
  var found = false;
  if (typeof values == 'object') {
    _.each(values, function (v, key) {
      if (found) return;
      if (child === ancestor[key]) {
        found = true;
      } else {
        found = this.pathInReference(child, ancestor[key], v, path);
      }
      if (found) path.unshift(key);
    }, this);
  }
  if (found) return path;
};

UserInterface.prototype.transferValues = function (to, from) {
  from || (from = this.getValues());
  to || (to = {});
  _.each(from, function (value, key) {
    if (typeof value == 'object') {
      this.transferValues(to[key] || (to[key] = {}), value);
    } else if (typeof value == 'function') {
    } else {
      to[key] = value;
    }
  }, this);
  return to;
};

UserInterface.prototype.copyValues = function (from) {
  this.transferValues(this.values, from);
};

UserInterface.prototype.setCallback = function (fun) {
  this._callbackOverride = fun;
};

UserInterface.prototype.useCallback = function (eventName, domElement) {
  var _this = this;
  domElement.off(eventName);
  domElement.on(eventName, function () {
    var data = {
      event: eventName,
      values: _this.transferValues(),
      path: _this.pathInReference(domElement)
    };
    if (!_this._callbackOverride) throw new Error('need to setCallback in UserInterface');
    _this._callbackOverride.call(_this, data);
  });
};

UserInterface.prototype.applyRemote = function (data) {
  this.copyValues(data.values);
  var value = this.objectInPath(data.path);
  if ((typeof value == 'function')) {
    value.call(this);
  } else if (data.event == 'change') {
    var template = utils.pathObject(this.template, data.path);
    if (template && template.change) {
      template.change.call(this);
    }
  }
};

UserInterface.prototype.destroy = function () {
  try {
    this.reference = {};
    if (this.updaters) {
      while (this.updaters.pop()) {
      }
    }
    if (this.domId) $('#' + this.domId).remove();
    delete this.domId;
  } catch (e) {
    console.log(this.group, this.id, e.message || e);
    throw e;
  }
};

UserInterface.prototype.build = function (obj, temp, ref, $parent) {
  var _this = this;
  if (!$parent) {
    $parent = $('<div />', {'class': 'level'});
  }
  _.each(obj, function (v, k) {
    var specs = _this.templateFor(k, v, temp);
    var type = specs.type;
    var $wrapper = $('<div />', {'class': 'wrapper'});
    var $key = $('<div />', {'class': 'key'});
    $key.text(k + '');
    $key.addClass('length' + ~~($key.text().length / 4));
    var $value;
    if (typeof v == 'object') { //folders
      var $folded = $('<span>' + FOLDER_SYMBOL + '</span>', {'class': 'folded'});
      $value = _this.build(v, specs, ref[k] = {});
      $key.append($folded);
      $key.addClass('object');
      $key.on('click', function () {
        $value.toggle();
        $folded.toggle();
      });
      if (specs.folded) {
        $folded.show();
        $value.hide();
      } else {
        $folded.hide();
        $value.show();
      }
    } else {
      $value = _this.inputs[type].call(_this, k, v, specs);
      if ($value[GET_VALUE]) {
        _this.updaters.push(function () {
          obj[k] = $value[GET_VALUE]();
          if (obj[k] === false || obj[k] === true) {
          } else if (!isNaN(obj[k])) {
            obj[k] = Number(obj[k]);
          }
        });
      }
      ref[k] = $value;
      $value.addClass('value');
      $value.addClass(type);
    }
    if (typeof(specs.change) == 'function') {
      if (!_this.overrideCallbacks) {
        $value.on('change', function () {
          specs.change.call(_this);
        });
      } else {
        _this.useCallback('change', $value);
      }
    }
    //extend css from specs
    if (specs.keyCSS) $key.css(specs.keyCSS);
    if (specs.valueCSS) $value.css(specs.valueCSS);
    if (specs.wrapperCSS) $wrapper.css(specs.wrapperCSS);

    if (specs.noKey) $key.html('');
    $wrapper.append($key);
    $wrapper.append($value);
    $parent.append($wrapper);
  });
  return $parent;
};

UserInterface.prototype.templateFor = function (key, value, parentTemplate) {
  if (typeof value == 'object') {
    return parentTemplate && parentTemplate[key] || {};
  }
  //full specification: ex {type: 'range'}
  if (parentTemplate && parentTemplate[key] && parentTemplate[key].type && this.inputs[parentTemplate[key].type]) {
    return _.clone(parentTemplate[key]);
  }
  //short specification: ex 'range'
  if (parentTemplate && parentTemplate[key] && (typeof parentTemplate[key] == 'string') && this.inputs[parentTemplate[key]]) {
    return {type: parentTemplate[key]};
  }
  if (typeof value == 'function') {
    return {type: 'function'};
  }
  //colors
  if (typeof value == 'number' && (/color/i).test(key)) {
    return {type: 'color'};
  }
  //opacity, ...
  if ((typeof value == 'number') && (value >= 0 && value <= 1) && ((/opacity/i).test(key))) {
    return {type: 'range', min: 0, max: 1, step: 0.1};
  }
  if (value === true || value === false) {
    return {type: 'boolean'};
  }
  return {type: 'string'};
};

UserInterface.prototype.inputs = {
  string: function (k, v, specs) {
    _.defaults(specs, {
      type: 'string', tag: 'span'
    });
    var e = $('<' + specs.tag + ' />', {contenteditable: 'true'});
    e.text(v);
    e[GET_VALUE] = function () {
      return e[specs.val || 'text']();
    };
    e[SET_VALUE] = function (a) {
      e[specs.val || 'text'](a);
    };
    return e;
  },
  number: function (k, v, specs) {
    return this.inputs.string(k, v, specs);
  },
  boolean: function (k, v, specs) {
    _.defaults(specs, {
      type: 'boolean', t: true, f: false
    });
    specs.t += '';
    specs.f += '';
    var e = $('<span />');
    e.text(v);
    e.on('click', function (evt) {
      var tgt = $(evt.target);
      tgt.text(tgt.text() == specs.t ? specs.f : specs.t);
    });
    e[GET_VALUE] = function () {
      var txt = e.text();
      return txt === specs.t;
    };
    e[SET_VALUE] = function (a) {
      e.text(a ? specs.t : specs.f);
    };
    return e;
  },
  color: function (k, v, specs) {
    _.defaults(specs, {
      type: 'color', tag: 'span'
    });
    var e = $('<' + specs.tag + ' />', {contenteditable: 'true', spellcheck: 'false'});
    e[GET_VALUE] = function () {
      var val = e[specs.val || 'text']();
      val = val.replace(/0x/gi, '');
      val = val.replace(/#/, '');
      return parseInt(val, 16);
    };
    e[SET_VALUE] = function (a) {
      a = "0x" + a.toString(16);
      e[specs.val || 'text'](a);
    };
    e.on('keyup', function () {
      var val = e[specs.val || 'text']();
      val = val.replace(/0x/gi, '');
      val = val.replace(/#/, '');
      if (val.length == 6)  e.css('background-color', '#' + val);
    });
    e[SET_VALUE](v);
    setTimeout(function () {
      e.trigger('keyup');
    }, 0);
    return e;
  },
  'function': function (k, v, specs) {
    _.defaults(specs, {
      type: 'function', caption: k, noKey: true
    });
    var _this = this;
    var e = $('<span />');
    e.html(specs.caption);
    if (!_this.overrideCallbacks) {
      e.on('click', function () {
        if (typeof v == 'function') v.call(_this);
      });
    } else {
      _this.useCallback('click', e);
    }
    return e;
  },
  list: function (k, v, specs) {
    _.defaults(specs, {
      type: 'function', values: []
    });
    var e = $('<select />');
    _.each(specs.values, function (val) {
      var o = $('<option>' + val + '</option>', {'class': 'list'});
      if (val == v) o.attr('selected', 'selected');
      e.append(o);
    });
    e[GET_VALUE] = function () {
      return e.val();
    };
    e[SET_VALUE] = function (a) {
      e.val(a);
    };
    return e;
  },
  range: function (k, v, specs) {
    _.defaults(specs, {
      type: 'range', step: 1,
      min: undefined, max: undefined, values: undefined,
      plus: '+', minus: '-', editable: true, velocity: 1
    });
    var $wrapper = $('<div />', {'class': 'range-wrapper'});
    var $v = $('<div>' + v + '</div>');
    if (specs.editable) $v.attr('contenteditable', 'true');
    $v.addClass('range-value');
    var values = specs.values;
    var step = Number(specs.step);
    var max = specs.max;
    var min = specs.min;
    _.each(['minus', 'plus'], function (d, i) {
      var $d = $('<div />', {'class': 'pm'});
      $d.text(specs[d]);
      $wrapper.append($d);
      $d.on('mousedown', update(2 * i - 1));
      $d.on('mouseup', cancel);
      $d.on('mouseout', cancel);
    });
    $wrapper.append($v);
    var timeoutId;
    var time = 0;

    function cancel() {
      clearTimeout(timeoutId);
      time = 0;
    }

    function update(sign) {
      function u() {
        if (!time) time = utils.time();
        timeoutId = setTimeout(u, (utils.time(time) < 1000 ? 150 : 30) / specs.velocity);
        var val = $v.text();
        var next;
        if (values instanceof Array) {
          if (typeof v == 'number') {
            val = Number(val);
          }
          var i = values.indexOf(val) + sign;
          if (i < 0) i = 0;
          if (i >= values.length) i = values.length - 1;
          next = values[i];
        } else {
          val = Number(val);
          next = val + sign * step;
          if (max !== undefined) {
            next = next < max ? next : max;
          }
          if (min !== undefined) {
            next = next > min ? next : min;
          }
          next = Math.round(next / specs.step) * specs.step;
          next = String(next);
          var point = next.indexOf('.');
          if (point > -1) {
            var end = point - Math.log10(specs.step) + 1;
            next = Number(next.substring(0, end));
          }
        }
        $v.text(next.toString());
        $v.trigger('change');
      }

      return u;
    }

    $wrapper[GET_VALUE] = function () {
      return typeof(v) == 'number' ? Number($v.text()) : $v.text();
    };
    $wrapper[SET_VALUE] = function (a) {
      $v.text(a);
    };
    return $wrapper;
  }
};

extend(UserInterface, Component);
Component.prototype.maker.ui = UserInterface;
Component.prototype.defaultType.ui = 'basic';


