(function () {
  var $ = require('../lib/jquery.js');
  var utils = require('./utils.js');
  var _ = require('../lib/underscore.js');

  var template = {};
  var json;

  var types = {
    'object': function (k, v, specs) {
      specs = _.extend({
        type: 'string', tag: 'span'
      }, specs);
      var e = $('<' + specs.tag + ' />', {contenteditable: 'true'});
      e.text(v);
      return e;
    },
    string: function (k, v, specs) {
      specs = _.extend({
        type: 'string', tag: 'span'
      }, specs);
      var e = $('<' + specs.tag + ' />', {contenteditable: 'true'});
      e.text(v);
      return e;
    },
    boolean: function (k, v, specs) {
      specs = _.extend({
        type: 'boolean', t: true, f: false
      }, specs);
      var e = $('<span />');
      e.text(v);
      e.on('click', function (evt) {
        var tgt = $(evt.target);
        tgt.text(tgt.text() == '' + specs.t ? specs.f : specs.t);
      });
      return e;
    },
    'function': function (k, v, specs) {
      specs = _.extend({
        type: 'function', caption: '&nbsp;'
      }, specs);
      var e = $('<span />');
      e.html(specs.caption);
      e.on('click', function () {
        if (typeof v == 'function') v();
      });
      return e;
    },
    list: function (k, v, specs) {
      specs = _.extend({
        type: 'function', values: []
      }, specs);
      var e = $('<select />');
      _.each(specs.values, function (val) {
        var o = $('<option>' + val + '</option>');
        if (val == v) o.attr('selected', 'selected');
        o.css(css.list);
        e.append(o);
      });
      return e;
    },
    range: function (k, v, specs) {
      specs = _.extend({
        type: 'range', step: 1,
        min: undefined, max: undefined, values: undefined
      }, specs);
      var $wrapper = $('<span />');
      var $v = $('<span>' + v + '</span>');
      var $minus = $('<span>-</span>');
      var $plus = $('<span>+</span>');
      var values = specs.values;
      var step = Number(specs.step);
      var max = specs.max;
      var min = specs.min;
      $minus.css(css.pm);
      $plus.css(css.pm);
      $wrapper.append($minus);
      $wrapper.append($plus);
      $wrapper.append($v);
      $minus.on('mousedown', update(-1));
      $plus.on('mousedown', update(1));
      $minus.on('mouseup', cancel);
      $plus.on('mouseup', cancel);
      $minus.on('mouseout', cancel);
      $plus.on('mouseout', cancel);
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

      return $wrapper;
    }
  };

  var css = {
    jec: {
      border: '1px solid transparent',
      'border-radius': '3px',
      margin: '2px 10px'
    },
    jee: {
      'border-radius': '3px',
      padding: '2px',
      margin: '1px 1px 1px 10px'
    },
    string: {
      padding: '1px 5px',
      margin: '2px 0',
      cursor: 'auto',
      'border-radius': '2px',
      color: '#112'
    },
    boolean: {
      'font-weight': 'bold'
    },
    range: {
      cursor: 'auto'
    },
    'function': {
      'background-color': '#b99',
      'min-width': '30px'
    },
    key: {
      'font-size': '0.8em'
    },
    value: {
      'background-color': '#999',
      color: '#111',
      'font-size': '0.9em',
      padding: '1px 20px',
      cursor: 'pointer',
      'border-radius': '6px',
      border: '0px solid transparent'
    },
    folder: {
      'color': '#ccc',
      'font-weight': 'bold',
      'cursor': 'pointer',
      'font-size': '0.9em',
      margin: '2px'
    },
    list: {
      color: '#111',
      'border-radius': '2px'
    },
    folded: {
      color: '#555'
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

  function build(obj, temp, $parent) {
    if (!$parent) {
      $parent = $('<div />', { 'class': 'jec' });
      $parent.css(css.jec);
    }
    _.each(obj, function (v, k) {
      var $wrapper = $('<div />');
      $wrapper.css(css.jee);
      var $key = $('<div />');
      $key.text(k + '');
      $key.css(css.key);
      var $value;
      if (typeof v == 'object') { //folders
        $value = build(v, temp[k] || {});
        var $folded = $('<span> {}</span>');
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
      var type = (v === true || v === false) ? 'boolean' : 'string';
      var specs = {type: type};
      if ((typeof(temp[k]) == 'string') && (types[temp[k]])) {
        type = temp[k];
      } else if ((typeof(temp[k]) == 'object') && (types[temp[k].type])) {
        type = temp[k].type;
        specs = temp[k];
      }
      $value = types[type](k, v, specs);
      $value.css(css.value);
      $value.css(css[type]);
      $wrapper.append($key);
      $wrapper.append($value);
      $parent.append($wrapper);
    });
    return $parent;
  }

  module.exports = {
    useTemplate: function (t) {
      template = utils.deepCopy(t);
    },
    getValues: function () {

    },
    setValues: function (v) {
      json = v;
    },
    showEditor: function (selector) {
      var dom = build(json, template);
      $(selector).html(dom);
    },
    css: css,
    types: types
  };
})();
