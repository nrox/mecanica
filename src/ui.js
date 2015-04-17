var GET_VALUE = 'getValue';
var SET_VALUE = 'setValue';
var FOLDER_SYMBOL = "{...}";

function UserInterface(options, system) {
  this.construct(options, system, 'basic');
}

UserInterface.prototype.types = {
  basic: function (options) {
    this.include(options, {
      values: undefined,
      template: {},
      container: this.getSettings().uiContainer
    });
    this.notifyUndefined(['values', 'container']);
    if (this.runsRender) {
      if (typeof $ === 'undefined') {
        $ = jQuery;
      }
      this.updaters = [];
      this.reference = {};
      this.showEditor();
    }
  }
};

UserInterface.prototype.reuseWith = function (options) {
  this.destroy();
  this.construct(options, this.parentSystem, this.options().type);
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

UserInterface.prototype.showEditor = function () {
  this.destroy();
  var domElements = this.build(this.values, this.template, this.reference);
  $(domElements).attr('id', this.domId = this.nextId('ui') + new Date().getTime());
  $(this.container).append(domElements);
};

UserInterface.prototype.destroy = function () {
  this.reference = {};
  while (this.updaters.pop()) {
  }
  if (this.domId) $('#' + this.domId).remove();
  delete this.domId;
};

UserInterface.prototype.build = function (obj, temp, ref, $parent) {
  var _this = this;
  if (!$parent) {
    $parent = $('<div />');
    $parent.css(_this.css.level);
  }
  _.each(obj, function (v, k) {
    var specs = _this.templateFor(k, v, temp);
    var type = specs.type;
    var $wrapper = $('<div />');
    $wrapper.css(_this.css.wrapper);
    var $key = $('<span />');
    $key.text(k + '');
    $key.css(_this.css.key);
    var $value;
    if (typeof v == 'object') { //folders
      var $folded = $('<span>' + FOLDER_SYMBOL + '</span>');
      $folded.css(_this.css.folded);
      $value = _this.build(v, specs, ref[k] = {});
      $key.append($folded);
      $key.css(_this.css.object);
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
          if (!isNaN(obj[k])) {
            obj[k] = Number(obj[k]);
          }
        });
      }
      ref[k] = $value;
      $value.css(_this.css.value);
      $value.css(_this.css[type] || {});
    }
    if (typeof(specs.onChange) == 'function') {
      $value.on('change', function () {
        specs.onChange.call(_this);
      });
    }
    //extend css from specs
    $key.css(specs.keyCSS || {});
    $value.css(specs.valueCSS || {});
    $wrapper.css(specs.wrapperCSS || {});

    if (!specs.noKey) $wrapper.append($key);
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
    var e = $('<span />');
    e.text(v);
    e.on('click', function (evt) {
      var tgt = $(evt.target);
      tgt.text(tgt.text() == ('' + specs.t) ? specs.f : specs.t);
    });
    e[GET_VALUE] = function () {
      var txt = e.text();
      return (txt === 'true' || txt === 'false') ? eval(txt) : txt;
    };
    e[SET_VALUE] = function (a) {
      e.text('' + a);
    };
    return e;
  },
  color: function (k, v, specs) {
    _.defaults(specs, {
      type: 'color', tag: 'span'
    });
    var e = $('<' + specs.tag + ' />', {contenteditable: 'true'});
    e[GET_VALUE] = function () {
      return e[specs.val || 'text']();
    };
    e[SET_VALUE] = function (a) {
      e[specs.val || 'text'](a);
    };
    e.on('keyup', function () {
      e.css('background-color', e[GET_VALUE]());
    });
    e.text(v);
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
    e.on('click', function () {
      if (typeof v == 'function') v.call(_this);
    });
    return e;
  },
  list: function (k, v, specs) {
    _.defaults(specs, {
      type: 'function', values: []
    });
    var _this = this;
    var e = $('<select />');
    _.each(specs.values, function (val) {
      var o = $('<option>' + val + '</option>');
      if (val == v) o.attr('selected', 'selected');
      o.css(_this.css.list);
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
    var _this = this;
    var $wrapper = $('<div />');
    var $v = $('<span>' + v + '</span>');
    if (specs.editable) $v.attr('contenteditable', 'true');
    $v.css(_this.css.rangeValue);
    var values = specs.values;
    var step = Number(specs.step);
    var max = specs.max;
    var min = specs.min;
    $wrapper.append($v);
    _.each(['minus', 'plus'], function (d, i) {
      var $d = $('<span />');
      $d.text(specs[d]);
      $d.css(_this.css.pm);
      $wrapper.append($d);
      $d.on('mousedown', update(2 * i - 1));
      $d.on('mouseup', cancel);
      $d.on('mouseout', cancel);
    });
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

UserInterface.prototype.css = {
  level: {
    'border': '1px dashed transparent',
    'margin': '0 1em'
  },
  wrapper: {
    'margin': '2px 1px',
    'font-size': '0.8rem',
    'padding': '1px',
    'clear': 'both'
  },
  string: {
    'padding': '1px 5px',
    'cursor': 'auto',
    'color': '#112',
    'font-style': 'italic',
    'float': 'left'
  },
  number: {
    'padding': '1px 5px',
    'cursor': 'auto',
    'color': '#112',
    'font-weight': 'bold',
    'float': 'left'
  },
  'color': {
    'color': 'black',
    'text-shadow': '1px 1px gray',
    'font-style': 'italic'
  },
  boolean: {
    'cursor': 'pointer',
    'font-weight': 'bold',
    'user-select': 'none'
  },
  range: {
    'white-space': 'nowrap',
    'cursor': 'auto',
    'background-color': 'transparent',
    'padding': '0px 2px'
  },
  rangeValue: {
    'min-width': '5em',
    'margin-left': '1em',
    'background-color': '#999',
    'padding': '1px 10px',
    'margin': '0px 3px',
    'border-radius': '3px',
    'border': '0px solid transparent'
  },
  pm: {
    'cursor': 'pointer',
    'color': '#311',
    'margin': '0 2px',
    'border': '1 px solid transparent',
    'border-radius': '10px',
    'padding': '0 5px',
    'background-color': '#777',
    'font-weight': 'normal',
    'user-select': 'none'
  },
  'function': {
    'cursor': 'pointer',
    'border': '0',
    'margin': '2px 3px',
    'min-width': '30px',
    'font-weight': 'bold',
    'border-radius': '0.3em'
  },
  key: {
    'margin': '1px',
    'float': 'left'
  },
  value: {
    'background-color': '#999',
    'color': '#111',
    'padding': '1px 10px',
    'margin': '1px 3px',
    'cursor': 'text',
    'border-radius': '3px',
    'border': '0px solid transparent'
  },
  'object': {
    'color': '#ccc',
    'font-weight': 'bold',
    'cursor': 'pointer'
  },
  list: {
    'color': '#111'
  },
  folded: {
    'color': '#777'
  }
};

extend(UserInterface, Component);
Component.prototype.maker.ui = UserInterface;


