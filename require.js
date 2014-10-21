var _availableFiles;

/**
 * A custom version of require for this library purpose
 * It was developed, instead of using browserify, because of Ammo.js trying to require fs and path
 * @param script the relative the url
 * @param arg the argument for test scripts
 * @returns {module.exports || undefined}
 */
function require(script, arg) {

  if (!arg) arg = undefined;

  function fileName(script) {
    return script.substr(script.lastIndexOf('/') + 1);
  }

  //some caveats:
  //listdir.sh should be run whenever the directory structure changes
  //FIXME: html files with the same name
  function scriptURL(script) {
    var url;
    var scriptFragments = script.split('/');
    var htmlFile = location.pathname;
    if (htmlFile.lastIndexOf('/') === (htmlFile.length - 1)) {
      htmlFile = htmlFile.substr(0, htmlFile.length - 1);
    }
    var reconFiles = [];
    var reconHtml = [];
    for (var i = 0; i < _availableFiles.length; i++) {
      var file = _availableFiles[i];
      if (htmlFile.lastIndexOf(file) >= 0 && ((htmlFile.lastIndexOf(file) + file.length) == htmlFile.length)) {
        reconHtml.push(file);
      }
      var has = 0;
      for (var f = 0; f < scriptFragments.length; f++) {
        var frag = scriptFragments[f];
        if (!frag || frag == '.' || frag == '..') {
          has++;
        } else if (file.split('/').indexOf(frag) >= 0) {
          has++;
        }
      }
      if (has == scriptFragments.length) {
        reconFiles.push(file);
      }
    }
    if (reconHtml.length != 1 || reconFiles.length != 1) {
      console.log('html', reconHtml);
      console.log('files', reconFiles);
      console.warn('TODO in require : reconHtml.length!=1 || reconFiles.length!=1');
      console.warn('HINT: run listdir.sh');
    }
    url = location.origin + htmlFile.substr(0, htmlFile.lastIndexOf(reconHtml[0])) + reconFiles[0];
    //console.log(url);
    return url;
  }

  function isAmmo(script) {
    return fileName(script) == 'ammo.js';
  }

  function isLocalhost() {
    return location.hostname == 'localhost';
  }

  if (script.lastIndexOf('.js') < 0) return;
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


(function () {
  var url = 'list.js';
  var list;
  for (var i = 0; !list && (i < 5); i++) {
    $.ajax(url, {
      async: false, //important async: false to return the required object immediately
      dataType: 'text', //don't run automatically
      error: function () {
      },
      global: false,
      success: function (data) {
        list = eval(data);
        for (var i = 0; i < list.length; i++) {
          list[i] = list[i].substr(2);
          if (list[i].indexOf('/') === 0) list[i] = list[i].substr(1);
        }
        _availableFiles = list;
      },
      type: 'GET'
    }).fail(function () {
        url = '../' + url;
      }
    );
  }
})();

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