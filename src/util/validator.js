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
  _.each(json, function (groupObjects, group) {
    if (this.allOptions[group] === undefined) {
      //TODO check system options
      if (['position', 'rotation', 'lengthUnits'].indexOf(group) > -1) {
        return;
      }
      report[group] = [this.STATUS.UNKNOWN_GROUP, group];
      return;
    }
    report[group] = {};
    if (group == 'system') {
      _.each(groupObjects, function (options, id) {
        //console.log(id, options);

        report[group][id] = {};
        this.reportErrors(options, report[group][id]);
      }, this);
      return;
    }
    _.each(groupObjects, function (options, id) {
      var type = options.type || Component.prototype.defaultType[group];
      if (!type) {
        report[group][id] = [this.STATUS.NO_TYPE];
      } else if (this.allOptions[group][type] === undefined) {
        report[group][id] = [this.STATUS.WRONG_TYPE, type];
      } else {
        var defaultOptions = this.allOptions[group][type];
        var required = this.requiredFor(group, type);
        var notPresent = _.filter(required, function (option) {
          //if option is present but the value is null, or if it is not present but the default value is not undefined
          return (options.hasOwnProperty(option)) && (options[option] == undefined)
            || (!options.hasOwnProperty(option)) && (defaultOptions[option] == undefined);
        });
        if (notPresent.length > 0) {
          report[group][id] = [this.STATUS.UNDEFINED_VALUES].concat(notPresent);
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
    if (typeof groupObject == 'string') {
      if (groupObject != this.STATUS.OK) {
        resume.push([path + '.' + groupName, groupObject]);
      }
    } else if (groupName == 'system') {
      _.each(groupObject, function (system, id) {
        this.resumeErrors(system, resume, path + ".system." + id);
      }, this);
    } else if (groupObject instanceof Array) { //unknown group
      resume.push([path + '.' + groupObject[1], groupObject]);
    } else {
      _.each(groupObject, function (result, id) {
        if (result != this.STATUS.OK) {
          resume.push([path + '.' + id, result]);
        }
      }, this);
    }
  }, this);
  return resume;
};

Validator.prototype.hasErrors = function (json, warn) {
  var report = this.reportErrors(json);
  var resume = this.resumeErrors(report);
  if (resume.length && warn) {
    _.each(resume, function (error) {
      console.warn.apply(console, error);
    }, this);
  }
  return resume.length;
};

Validator.prototype.STATUS = {
  UNKNOWN_GROUP: 'unknown group',
  OK: 'ok',
  NO_TYPE: 'no type specified',
  WRONG_TYPE: 'unknown type',
  UNDEFINED_VALUES: 'undefined values'
};

Validator.prototype.push = function (group, id, json) {
  if (!this.pushBag) {
    this.pushBag = {};
  }
  if (!this.pushBag[group]) {
    this.pushBag[group] = {};
  }
  if (this.pushBag[group][id]) {
    throw new Error(group + '.' + id + ' already exists');
  }
  this.pushBag[group][id] = json;
  var errors;
  if (errors = this.hasErrors(this.pushBag, true)) {
    console.log(group + '.' + id, ':', utils.stringify(json));
    throw new Error(errors + ' error(s) where found.');
  }
};

_.each({settings: {}, system: {}, shape: {}, material: {}, body: {}, constraint: {}, method: {}},
  function (o, group) {
    Validator.prototype[group] = function (id, json) {
      this.push(group, id, json);
    };
  }
);

Validator.prototype.getObject = function () {
  return this.pushBag || {};
};


