/**
 * A custom version of require for this library purpose
 * Allowing to run it with node and in the browser
 */
function require(script) {
  console.log('require ' + script);
  var name = script.substr(script.lastIndexOf('/') + 1);
  if (script.lastIndexOf('.js') < 0) return;
  function url(path) {
    var folder = (['ammo.js', 'three.js', 'underscore.js', 'jquery.js'].indexOf(name) > -1) ? '/lib/' : undefined;
    folder = folder || ((name.indexOf('test') == 0) ? '/tests/' : '/');
    return folder + name;
  }

  var process = {
    argv: ['node', script, arguments[1]]
  };
  var __filename = script;
  var module = {
    exports: {}
  };
  var exports = {};
  if (name == 'ammo.js') {
    module = process = exports = undefined;
  }
  jQuery.ajax(url(script), {
    cache: false,
    async: false,
    dataType: 'text',
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('error in require ' + script);
      console.error(errorThrown);
    },
    global: false,
    success: function (data, textStatus, jqXHR) {
      if (name == 'ammo.js') {
        eval(data);
        var Ammo = Ammo || {};
        module = {
          exports: Ammo
        };
      } else
        eval('(function(){\n' + data + '\n})();');
    },
    type: 'GET'
  });
  return module.exports;
}

function checkRequire(script, arg) {
  return !!require(script, arg);
}

