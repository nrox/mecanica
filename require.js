(function () {

  var availablePaths;

  var url = ['../list.js', 'list.js', '../../list.js'];
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


  /**
   * A custom version of require for this library purpose
   * It was developed, instead of using browserify, because of Ammo.js trying to require fs and path
   * @param script the relative the url
   * @param arg the argument for test scripts
   * @returns {module.exports || undefined}
   */
  window.require = function (script, arg) {

    if (!arg) arg = undefined;

    function fileName(script) {
      return script.substr(script.lastIndexOf('/') + 1);
    }

    function httpRoot() {
      var locationHref = location.href.split('').reverse().join('');
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
      script = script.replace('/../', '/');
      while (script.indexOf('/../') > 0) script = script.replace('/../', '/');
      if (script.indexOf('./') == 0) script = script.substr(2);
      if (script.indexOf('../') == 0) script = script.substr(3);
      while (script.indexOf('//') > 0) script = script.replace('//', '/');
      while (script.indexOf('/') == 0) script = script.substr(1);
      var fragments = script.split('/');
      for (var i = 0; i < availablePaths.length; i++) {
        var pos = -1;
        for (var j = 0; j < fragments.length; j++) {
          pos = availablePaths[i].indexOf(fragments[j], pos);
        }
        if (pos > -1) {
          return availablePaths[i];
        }
      }
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
      console.warning(script + ' is not registered. Use: bash listdir.sh');
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
        } else
          eval('(function(){\n' + data + '\n})();');
      },
      type: 'GET'
    });
    return module.exports;
  }
})();

/**
 * replace console
 */
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