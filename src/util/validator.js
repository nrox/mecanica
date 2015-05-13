function Validator() {
  var allOptions = {};
  var allRequired = {};
  _.each(this.listGroups(), function (group) {
    allOptions[group] = {};
    allRequired[group] = {};
    _.each(this.listTypes(group), function (type) {
      if (type[0] == '_') return;
      allOptions[group][type] = this.optionsFor(group, type);
      allRequired[group][type] = this.requiredFor(group, type);
    }, this);
  }, this);
  this.allOptions = allOptions;
  this.allRequired = allRequired;
}

Validator.prototype.parseOptions = function (typeConstructor) {
  //assure its a string representation of a function
  typeConstructor = "" + typeConstructor;
  var match = typeConstructor.match(/include[\W\w]*\{[\W\w]*\}\)+/im);
  if (!match) return {};
  match = match[0];
  match = "(" + match.match(/\{[\W\w]*/);
  if (match.lastIndexOf('})') != match.indexOf('})')) {
    match = match.substr(0, match.indexOf('})') + 3);
  }
  return eval(match);
};

Validator.prototype.parseRequired = function (typeConstructor) {
  //assure its a string representation of a function
  typeConstructor = "" + typeConstructor;
  var match = typeConstructor.match(/notifyUndefined[\W\w]*\)+/);
  if (!match) return [];
  match = match[0];
  match = match.match(/\([\W\w]*/)[0];
  match = match.substr(0, match.indexOf(')') + 1);
  return eval(match);
};

Validator.prototype.constructorFor = function (group, type) {
  //console.log(group, type);
  var groupConstructor = Component.prototype.maker[group];
  var typeConstructor = groupConstructor.prototype.types[type];
  return typeConstructor;
};

Validator.prototype.listGroups = function () {
  return  _.keys(Component.prototype.maker);
};

Validator.prototype.listTypes = function (group) {
  var groupConstructor = Component.prototype.maker[group];
  return _.keys(groupConstructor.prototype.types);
};

Validator.prototype.optionsFor = function (group, type) {
  var typeCons = this.constructorFor(group, type);
  var options = this.parseOptions(typeCons);
  if (type[0] == '_') return options;
  //else add also options for accessory types, which start with _ {_abstract, _intro, _basic, _outro}
  var allTypes = this.listTypes(group);
  var accessoryTypes = _.filter(allTypes, function (type) {
    return type[0] == '_';
  });
  _.each(accessoryTypes, function (type) {
    _.defaults(options, this.optionsFor(group, type));
  }, this);
  return options;
};

Validator.prototype.requiredFor = function (group, type) {
  var typeCons = this.constructorFor(group, type);
  var required = this.parseRequired(typeCons);
  if (type[0] == '_') return required;
  //else add also required for accessory types, which start with _
  var allTypes = this.listTypes(group);
  var accessoryTypes = _.filter(allTypes, function (type) {
    return type[0] == '_';
  });
  _.each(accessoryTypes, function (type) {
    required = _.union(required, this.requiredFor(group, type));
  }, this);
  return required;
};

Validator.prototype.reportErrors = function (json, report) {
  report = report || {};
  //at system level
  var groupsList = this.listGroups();
  _.each(json, function (groupObjects, group) {
    if (groupsList.indexOf(group) < 0) {
      //TODO check system options
      report[group] = this.STATUS.UNKNOWN;
      return;
    }
    if (group == 'system') {
      report[group] = {};
      this.reportErrors(groupObjects, report[group]);
      return;
    }
    report[group] = {};
    _.each(groupObjects, function (options, id) {
      var type = options.type || Component.prototype.defaultType[group];
      if (!type) {
        report[group][id] = this.STATUS.NO_TYPE;
      } else if (this.allOptions[group][type] === undefined) {
        report[group][id] = [this.STATUS.WRONG_TYPE, type];
      } else {
        var required = this.requiredFor(group, type);
        var notPresent = _.filter(required, function (option) {
          return (options[option] == undefined);
        });
        if (notPresent.length > 0) {
          report[group][id] = [this.STATUS.UNDEFINED, notPresent];
        } else {
          report[group][id] = this.STATUS.OK;
        }
      }
    }, this);
  }, this);
  return report;
};

Validator.prototype.resumeErrors = function (report, resume, path) {
  resume || (resume = []);
  if (path == undefined) path = "";
  _.each(report, function (groupObject, groupName) {
    if (groupName == 'system') {
      this.resumeErrors(report, resume, path + ".system");
    } else {
      _.each(groupObject, function (result, id) {
        if (result != this.STATUS.OK) {
          resume.push([path + '.' + id, result]);
        }
      });
    }
  }, this);
  return resume;
};

Validator.prototype.STATUS = {
  UNKNOWN: 'unknown group',
  OK: 'ok',
  NO_TYPE: 'no type specified',
  WRONG_TYPE: 'unknown type',
  UNDEFINED: 'undefined values'
};


