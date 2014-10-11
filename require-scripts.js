/**
 * A custom version of require for this library purpose
 * Allowing to run it with node and in the browser
 *
 * @param script the relative the url
 * @param arg the argument for test scripts
 * @returns {module.exports}
 */
function require(script, arg) {

  console.log('require ', script);

  function scriptName(script) {
    return script.substr(script.lastIndexOf('/') + 1);
  }

  function scriptFolder(script) {
    var name = scriptName(script);
    var folder = (['ammo.js', 'three.js', 'underscore.js', 'jquery.js'].indexOf(name) > -1) ? '/lib/' : undefined;
    if (script.indexOf('/ware/' + name) > -1) folder = '/ware/';
    folder = folder || ((name.indexOf('test') == 0) ? '/tests/' : '/');
    return folder;
  }

  function requireRoot() {
    var hrefFolder = scriptFolder(location.href);
    var hrefName = scriptName(location.href);
    var index = location.href.indexOf(hrefFolder + hrefName);
    return location.href.substring(0, index);
  }

  function scriptURL(script) {
    return requireRoot() + scriptFolder(script) + scriptName(script);
  }

  function isAmmoScript(script) {
    return scriptName(script) == 'ammo.js';
  }

  function isLocalhost() {
    return location.hostname == 'localhost';
  }

  //all paths are converted to absolute
  if (script.lastIndexOf('.js') < 0) return;
  //and scripts location are predefined
  var url = scriptURL(script);

  //node.js stubs
  var process = {
    //an argument is necessary for some test-....js scripts
    argv: ['node', script, arg]
  };
  var __filename = script;
  var module = {
    exports: {}
  };
  var exports = module.exports;
  //in case of ammo remove stubs, or it will require fs and path
  if (isAmmoScript(script)) {
    module = process = exports = undefined;
  }

  jQuery.ajax(url, {
    cache: !isLocalhost(), //during development dont cache
    async: false, //important async: false to return the required object immediately
    dataType: 'text', //don't run automatically
    error: function (jqXHR, textStatus, errorThrown) {
      console.log('error in require ' + script);
      console.error(errorThrown);
    },
    global: false,
    success: function (data, textStatus, jqXHR) {
      if (isAmmoScript(script)) {
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

(function () {
  var logBackup = console.log;
  var errorBackup = console.error;
  var $console;

  window.setConsole = function (selector) {
    if (selector) {
      $console = $(selector);
      if ($console.length) {
        $console.empty();
        console.log = logToElement;
        console.error = errorToElement;
      }
    } else {
      console.log = logBackup;
      console.error = errorBackup;
    }
  };

  window.clearConsole = function () {
    $console && $console.empty();
  };

  function logToElement() {
    logBackup.apply(console, arguments);
    if (!$console) return;
    for (var i = 0; i < arguments.length; i++) {
      $console.append(arguments[i] + ' ');
    }
    $console.append('\n');
  }

  function errorToElement() {
    errorBackup.apply(console, arguments);
    if (!$console) return;
    for (var i = 0; i < arguments.length; i++) {
      $console.append(arguments[i] + ' ');
    }
    $console.append('\n');
  }
})();
