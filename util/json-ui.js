(function () {
  var $ = require('../lib/jquery.js');
  var utils = require('./utils.js');
  var _ = require('../lib/underscore.js');
  var thisEditor;
  var GET_VALUE = 'getValue';
  var SET_VALUE = 'setValue';

  var template = {};
  var jsonObject, reference;
  var FOLDER_SYMBOL = ' {...}';
  var updaters = [];

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
        plus: '+', minus: '-'
      });
      var $wrapper = $('<span />');
      var $v = $('<span>' + v + '</span>');
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
        }

        return u;
      }

      $wrapper[GET_VALUE] = function () {
        return $v.text();
      };
      $wrapper[SET_VALUE] = function (a) {
        $v.text(a);
      };
      return $wrapper;
    }
  };

  var css = {
    level: {
      'border': '1px dashed transparent',
      'margin': '0 1em'
    },
    property: {
      'margin': '2px 1px',
      'font-size': '0.8rem',
      'padding': '1px'
    },
    string: {
      'padding': '1px 5px',
      'cursor': 'auto',
      'color': '#112',
      'font-style': 'italic'
    },
    boolean: {
      'font-weight': 'bold'
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
      'border-radius': '1em'
    },
    key: {
      'margin': '1px'
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
    folder: {
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

  function build(obj, temp, ref, $parent) {
    if (!$parent) {
      $parent = $('<div />');
      $parent.css(css.level);
    }
    _.each(obj, function (v, k) {
      var $wrapper = $('<div />');
      $wrapper.css(css.property);
      var $key = $('<span />');
      $key.text(k + '');
      $key.css(css.key);
      var $value;
      if (typeof v == 'object') { //folders
        $value = build(v, temp[k] || {}, ref[k] = {});
        var $folded = $('<span>' + FOLDER_SYMBOL + '</span>');
        $folded.css(css.folded);
        $key.append($folded);
        $key.css(css.folder);
        $key.on('click', function () {
          $value.toggle();
          $folded.toggle();
        });
        $wrapper.append($key);
        $wrapper.append($value);
        if (temp[k] && temp[k].folded) {
          $folded.show();
          $value.hide();
        } else {
          $folded.hide();
          $value.show();
        }
        $parent.append($wrapper);
        return;
      }
      var type;
      if (typeof v == 'function') {
        type = 'function';
      } else if (v === true || v === false) {
        type = 'boolean';
      } else {
        type = 'string';
      }
      var specs = {type: type};
      if ((typeof(temp[k]) == 'string') && (types[temp[k]])) {
        type = temp[k];
      } else if ((typeof(temp[k]) == 'object') && (types[temp[k].type])) {
        type = temp[k].type;
        specs = temp[k];
      }
      $value = types[type](k, v, specs);
      if ($value[GET_VALUE]) {
        updaters.push(function () {
          obj[k] = $value[GET_VALUE]();
        });
      }
      ref[k] = $value;
      $value.css(css.value);
      $value.css(css[type] || {});
      if (!specs.noKey) $wrapper.append($key);
      $wrapper.append($value);
      $parent.append($wrapper);
    });
    return $parent;
  }

  module.exports = thisEditor = {
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
  };
})();
