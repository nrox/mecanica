(function () {
  var $ = require('../lib/jquery.js');
  var utils = require('./utils.js');
  var _ = require('../lib/underscore.js');
  var template = {};
  var json;
  var types = {
    _default: function (k, v, specs) {
      var e = $('<span />');
      e.text(v);
      return e;
    },
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
      m.css(css.pm);
      p.css(css.pm);
      e.append(m);
      e.append(v);
      e.append(p);
      m.on('click', function (evt) {
        var n = Number(v.text());
        v.text((--n).toString());
      });
      p.on('click', function (evt) {
        var n = Number(v.text());
        v.text((++n).toString());
      });
      return e;
    }
  };
  var css = {
    jec: {
      border: '1px solid transparent',
      'border-radius': '3px',
      padding: '5px',
      margin: '5px 2px'
    },
    jee: {
      //border: '1px solid #666',
      'border-radius': '3px',
      padding: '2px',
      margin: '1px 1px 1px 10px'
    },
    _default: {
      'background-color': '#454'
    },
    string: {
      margin: '2px 0',
      cursor: 'auto',
      'border-radius': '2px',
      color: '#112',
      'background-color': '#666'
    },
    boolean: {
      'background-color': '#999'
    },
    range: {
      cursor: 'auto',
      'background-color': '#445'
    },
    'function': {
      'background-color': '#544',
      'min-width': '30px'
    },
    key: {
      'font-size': '0.8em'
    },
    value: {
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
      'margin': '0 5px'
    }
  };

  function build(obj, temp, $parent) {
    if (!$parent) {
      $parent = $('<div />', { 'class': 'jec' });
      $parent.css(css.jec);
    }
    _.each(obj, function (v, k) {
      var specs = temp[k] && temp[k].type && types[temp[k].type] ? temp[k] : {type: '_default'};
      var e = types[specs.type](k, v, specs);
      e.css(css.value);
      e.css(css[specs.type]);
      var c = $('<div />');
      c.text(k + '');
      c.css(css.key);
      var w = $('<div />');
      w.css(css.jee);
      w.append(c);
      w.append(e);
      $parent.append(w);
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
