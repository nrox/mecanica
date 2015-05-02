(function (window, $) {

  var availablePaths;

  var url = ['../dist/list.js', 'dist/list.js', '../../dist/list.js'];
  var list;
  for (var i = 0; !list && (i < url.length); i++) {
    $.ajax(url[i], {
      async: false, //important async: false to return the required object immediately
      dataType: 'text', //don't run automatically
      global: false,
      success: function (data) {
        list = eval(data);
        for (var i = 0; i < list.length; i++) {
          list[i] = list[i].substr(2);
          if (list[i].indexOf('/') === 0) list[i] = list[i].substr(1);
        }
        availablePaths = list;
      },
      type: 'GET'
    });
  }

  function httpRoot() {
    var locationHref = (location.origin + location.pathname).split('').reverse().join('');
    if (locationHref.indexOf('/') === 0) locationHref = locationHref.substr(1);
    var longest = 0;
    for (var i = 0; i < availablePaths.length; i++) {
      if (locationHref.indexOf(availablePaths[i].split('').reverse().join('')) == 0) {
        if (availablePaths[i].length > longest) {
          longest = availablePaths[i].length;
        }
      }
    }
    var root;
    if (longest) {
      root = locationHref.substr(longest).split('').reverse().join('');
    }
    return root;
  }

  function requiredPath(script) {
    //TODO make this more understandable
    script = script.replace('/../', '/');
    while (script.indexOf('/../') > 0) script = script.replace('/../', '/');
    while (script.indexOf('./') == 0) script = script.substr(2);
    while (script.indexOf('../') == 0) script = script.substr(3);
    while (script.indexOf('//') > 0) script = script.replace('//', '/');
    while (script.indexOf('/') == 0) script = script.substr(1);
    var fragments = script.split('/');
    var ret;
    var failed;
    for (var i = 0; i < availablePaths.length; i++) {
      if (script == availablePaths[i]) {
        ret = script;
        break;
      }
      failed = false;
      var pathFragments = availablePaths[i].split('/');
      for (var j = 0; j < fragments.length; j++) {
        if (fragments[fragments.length - j - 1] != pathFragments[pathFragments.length - j - 1]) {
          failed = true;
          break;
        }
      }
      if (!failed) {
        ret = availablePaths[i];
        break;
      }
    }
    return ret;
  }

  window.availablePaths = function () {
    return availablePaths;
  };

  window.requireURL = function (script) {
    return httpRoot() + requiredPath(script);
  };

  /**
   * A custom version of require for this library purpose
   * It was developed, instead of using browserify, because of Ammo.js trying to require fs and path
   * @param script the relative the url
   * @param arg the argument for test scripts
   * @returns {module.exports || undefined}
   */
  window.require = function (script, arg) {

    if (arg === undefined) arg = undefined;

    function fileName(script) {
      return script.substr(script.lastIndexOf('/') + 1);
    }


    function isAmmo(script) {
      return fileName(script) == 'ammo.js';
    }

    function isLocalhost() {
      return location.hostname == 'localhost';
    }

    if (script.lastIndexOf('.js') < 0) return;
    var path = requiredPath(script);

    var url;
    if (!path) {
      url = script;
      console.warn(script + ' is not registered. Use: bash listdir.sh');
    } else {
      url = httpRoot() + path;
    }

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
    if (isAmmo(script)) {
      module = process = exports = undefined;
    }

    $.ajax(url, {
      cache: !isLocalhost(), //during development don't cache
      async: false, //important async: false to return the required object immediately
      dataType: 'text', //don't run automatically
      error: function (jqXHR, textStatus, errorThrown) {
        console.log('error in require ' + script);
        console.error(errorThrown);
      },
      global: false,
      success: function (data, textStatus, jqXHR) {
        if (isAmmo(script)) {
          eval(data);
          var Ammo = Ammo || {};
          module = {
            exports: Ammo
          };
        } else {
          try {
            eval('(function(){\n' + data + '\n})();');
          } catch (e) {
            console.error(e);
          }
        }
      },
      type: 'GET'
    });
    return module.exports;
  };
})(window, $);

/**
 * replace console
 */
(function (window, $) {
  var $console;
  var direction = 'append';
  var remove = ':first';
  var maximum = 500;
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
      $console[direction]("<pre class='" + type + "'>" + message + "</pre>");
      backups[type].apply(console, arguments);
      if ($console.children().length > maximum) {
        $console.children(remove).remove();
      }
    };
  };

  window.setConsole = function (selector, ontop, limit) {
    direction = ontop ? 'prepend' : 'append';
    remove = ontop ? ':last' : ':first';
    maximum = limit;
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

})(window, $);