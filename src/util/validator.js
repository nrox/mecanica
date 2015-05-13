function Validator() {
}

Validator.prototype.parseOptions = function (typeConstructor) {
  //assure its a string representation of a function
  typeConstructor = "" + typeConstructor;
  var match = typeConstructor.match(/include[\W\w]*\{[\W\w]*\}\);/im);
  if (!match) return {};
  match = match[0];
  match = "(" + match.match(/\{[\W\w]*/);
  return eval(match);
};

Validator.prototype.parseRequired = function (typeConstructor) {
  //assure its a string representation of a function
  typeConstructor = "" + typeConstructor;
  var match = typeConstructor.match(/notifyUndefined[\W\w]*\);/im);
  if (!match) return [];
  match = match[0];
  match = "(" + match.match(/\([\W\w]*/);
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


