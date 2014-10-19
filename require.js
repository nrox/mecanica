/**
 * A custom version of require for this library purpose
 * Allowing to run it with node and in the browser
 *
 * @param script the relative the url
 * @param arg the argument for test scripts
 * @returns {module.exports}
 */
function require(script, arg) {

  arg || (arg = undefined);

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

  //console.log('require ', script);

  jQuery.ajax(url, {
    cache: !isLocalhost(), //during development don't cache
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
  var $console;
  var backups = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };

  var replacement = function (type) {
    return function () {
      if (!$console.length) return;
      var message = '';
      for (var i = 0; i < arguments.length; i++) {
        message += arguments[i] + ' ';
      }
      message += '\n';
      $console.append("<pre class='" + type + "'>" + message + "</pre>");
      backups[type].apply(console, arguments);
    };
  };

  window.setConsole = function (selector) {
    if (selector) {
      window.clearConsole();
      $console = $(selector);
      if ($console.length) {
        $console.empty();
        console.log = replacement('log');
        console.info = replacement('info');
        console.error = replacement('error');
        console.warn = replacement('warn');
      }
    } else {
      console.log = backups.log;
      console.error = backups.error;
      console.warn = backups.warn;
      console.info = backups.info;
      $console = undefined;
    }
  };

  window.clearConsole = function () {
    $console && $console.empty();
  };
})();
