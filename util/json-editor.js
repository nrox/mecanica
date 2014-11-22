(function () {
  var $ = require('../lib/jquery.js');
  var utils = require('./utils.js');
  var _ = require('../lib/underscore.js');

  var template = {};
  var json;

  var types = {
    string: function (k, v, specs) {
      var e = $('<span />', {contenteditable: 'true'});
      e.text(v);
      return e;
    },
    boolean: function (k, v, specs) {
      var e = $('<span />');
      e.text(v);
      e.on('click', function (evt) {
        var tgt = $(evt.target);
        tgt.text(tgt.text() == '' + specs.t ? specs.f : specs.t);
      });
      return e;
    },
    'function': function (k, v, specs) {
      var e = $('<span />');
      e.html(specs.caption || '&nbsp;');
      e.on('click', function () {
        if (typeof v == 'function') v();
      });
      return e;
    },
    range: function (k, v, specs) {
      var e = $('<span />');
      v = $('<span>' + v + '</span>');
      var m = $('<span> - </span>');
      var p = $('<span> + </span>');
      var s = Number(specs.step) || 1;
      m.css(css.pm);
      p.css(css.pm);
      e.append(m);
      e.append(p);
      e.append(v);
      m.on('click', function (evt) {
        var n = Number(v.text());
        v.text((n -= s).toString());
      });
      p.on('click', function (evt) {
        var n = Number(v.text());
        v.text((n += s).toString());
      });
      return e;
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
      border: '0px solid transparent',
      'user-select': 'none'
    },
    pm: {
      cursor: 'pointer',
      'color': '#eee',
      'margin': '0 2px'
    }
  };

  function build(obj, temp, $parent) {
    if (!$parent) {
      $parent = $('<div />', { 'class': 'jec' });
      $parent.css(css.jec);
    }
    _.each(obj, function (v, k) {
      if (typeof v == 'object') {
        $parent.append(build(v, temp[k] || {}));
        return;
      }
      var type = (v === true || v === false) ? 'boolean' : 'string';
      var specs = type == 'boolean' ? {type: type, f: false, t: true} : {type: type};
      if ((typeof(temp[k]) == 'string') && (types[temp[k]])) {
        type = temp[k];
        specs = {type: type};
      } else if ((typeof(temp[k]) == 'object') && (types[temp[k].type])) {
        type = temp[k].type;
        specs = temp[k];
      }
      var $value = types[type](k, v, specs);
      $value.css(css.value);
      $value.css(css[type]);
      var $key = $('<div />');
      $key.text(k + '');
      $key.css(css.key);
      var $wrapper = $('<div />');
      $wrapper.css(css.jee);
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
    }
  };
})();
