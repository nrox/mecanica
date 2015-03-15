(function () {
  var $ = require('../lib/jquery.js');
  var utils = require('./utils.js');
  var _ = require('../lib/underscore.js');
  var GET_VALUE = 'getValue';
  var SET_VALUE = 'setValue';

  function templateForSystem(key, value, parentTemplate, types) {
    if (_.contains(['x', 'y', 'z', 'w'], key)) {
      return {type: 'number', validator: function (v) {
        return isNaN(v) ? 0 : Number(v);
      }};
    }
    if (_.contains(['dx', 'dy', 'dz', 'r', 'mass', 'fov', 'distance', 'inertia'], key)) {
      return {type: 'number', validator: function (v) {
        return Math.max(0, isNaN(v) ? 0 : Number(v));
      }};
    }
    if (_.contains(['segments'])) {
      return {type: 'number', validator: function (v) {
        return ~~Math.max(1, isNaN(v) ? 0 : Number(v));
      }};
    }
    if (/color/i.test(key)) {
      return {type: 'color'};
    }
  }

  function templateFor(key, value, parentTemplate, types) {
    if (typeof value == 'object') {
      return parentTemplate && parentTemplate[key] || {};
    }
    //full specification: ex {type: 'range'}
    if (parentTemplate && parentTemplate[key] && parentTemplate[key].type && types[parentTemplate[key].type]) {
      return _.clone(parentTemplate[key]);
    }
    //short specification: ex 'range'
    if (parentTemplate && parentTemplate[key] && (typeof parentTemplate[key] == 'string') && types[parentTemplate[key]]) {
      return {type: parentTemplate[key]};
    }
    if (typeof value == 'function') {
      return {type: 'function'};
    }
    if (value === true || value === false) {
      return {type: 'boolean'};
    }
    return {type: 'string'};
  }

  function editor() {
    var thisEditor = this;
    var template = {};
    var jsonObject, reference;
    var FOLDER_SYMBOL = ' {...}';
    var updaters = [];

    var css = {
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
        'font-weight': 'bold',
        'user-select': 'none'
      },
      rangeValue: {
        'margin-left': '1em',
        'background-color': '#999',
        'padding': '1px 10px',
        'margin': '0px 3px',
        'cursor': 'pointer',
        'border-radius': '3px',
        'border': '0px solid transparent'
      },
      range: {
        'cursor': 'auto',
        'background-color': 'transparent',
        'padding': '0px 2px'
      },
      'function': {
        'border': '0',
        'margin': '2px 3px',
        'min-width': '30px',
        'font-weight': 'normal',
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
        'cursor': 'pointer',
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
      }
    };

    var types = {
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
        return this.string(k, v, specs);
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
        var e = $('<span />');
        e.html(specs.caption);
        e.on('click', function () {
          if (typeof v == 'function') v.call(thisEditor);
        });
        return e;
      },
      list: function (k, v, specs) {
        _.defaults(specs, {
          type: 'function', values: []
        });
        var e = $('<select />');
        _.each(specs.values, function (val) {
          var o = $('<option>' + val + '</option>');
          if (val == v) o.attr('selected', 'selected');
          o.css(css.list);
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
          plus: '+', minus: '-', editable: true
        });
        var $wrapper = $('<span />');
        var $v = $('<span>' + v + '</span>');
        if (specs.editable) $v.attr('contenteditable', 'true');
        $v.css(css.rangeValue);
        var values = specs.values;
        var step = Number(specs.step);
        var max = specs.max;
        var min = specs.min;
        _.each(['minus', 'plus'], function (d, i) {
          var $d = $('<span />');
          $d.text(specs[d]);
          $d.css(css.pm);
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
            timeoutId = setTimeout(u, utils.time(time) < 1000 ? 150 : 30);
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

    function build(obj, temp, ref, $parent) {
      if (!$parent) {
        $parent = $('<div />');
        $parent.css(css.level);
      }
      _.each(obj, function (v, k) {
        var specs = templateFor(k, v, temp, types);
        var type = specs.type;
        var $wrapper = $('<div />');
        $wrapper.css(css.wrapper);
        var $key = $('<span />');
        $key.text(k + '');
        $key.css(css.key);
        var $value;
        if (typeof v == 'object') { //folders
          var $folded = $('<span>' + FOLDER_SYMBOL + '</span>');
          $folded.css(css.folded);
          $value = build(v, specs, ref[k] = {});
          $key.append($folded);
          $key.css(css.object);
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
          $value = types[type](k, v, specs);
          if ($value[GET_VALUE]) {
            updaters.push(function () {
              obj[k] = $value[GET_VALUE]();
            });
          }
          ref[k] = $value;
          $value.css(css.value);
          $value.css(css[type] || {});
        }
        if (specs.onChange) $value.on('change', specs.onChange);
        //extend css from specs
        $key.css(specs.keyCSS || {});
        $value.css(specs.valueCSS || {});
        $wrapper.css(specs.wrapperCSS || {});

        if (!specs.noKey) $wrapper.append($key);
        $wrapper.append($value);
        $parent.append($wrapper);
      });
      return $parent;
    }

    //TODO use prototype?
    _.extend(this, {
      useTemplate: function (t) {
        template = t;
      },
      getValues: function () {
        _.each(updaters, function (fn) {
          try {
            fn();
          } catch (e) {
          }
        });
        return jsonObject;
      },
      setValues: function (v) {
        jsonObject = v;
      },
      showEditor: function (selector) {
        while (updaters.length) {
          updaters.pop();
        }
        reference = {};
        var domElements = build(jsonObject, template, reference, undefined);
        $(selector).html(domElements);
      },
      getReference: function () {
        return reference;
      },
      css: css,
      types: types
    });
  }

  module.exports = editor;
})();
