/**
 * A custom version of require for this library purpose
 * Allowing to run it with node and in the browser
 *
 * @param script the relative the url
 * @param arg the argument for test scripts
 * @returns {module.exports}
 */
function require(script, arg) {

  //all paths are converted to absolute
  var name = script.substr(script.lastIndexOf('/') + 1);
  if (script.lastIndexOf('.js') < 0) return;
  //and scripts location are predefined
  var url = (function () {
    var folder = (['ammo.js', 'three.js', 'underscore.js', 'jquery.js'].indexOf(name) > -1) ? '/lib/' : undefined;
    folder = folder || ((name.indexOf('test') == 0) ? '/tests/' : '/');
    return folder + name;
  })();

  //node.js stubs
  var process = {
    //an argument is necessary for some test-....js scripts
    argv: ['node', script, arg]
  };
  var __filename = script;
  var module = {
    exports: {}
  };
  var exports = {};

  //in case of ammo remove stubs, or it will require fs and path
  if (name == 'ammo.js') {
    module = process = exports = undefined;
  }
  jQuery.ajax(url, {
    cache: true, //!url.indexOf('/lib/'), //cache only if its under /lib/
    async: false, //important async: false
    dataType: 'text', //don't run automatically
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

function canRequire(script, arg) {
  return !!require(script, arg);
}

