function Set(initial) {
  if (typeof initial === 'array') {
    this.items = initial;
  } else {
    this.items = [ ];
  }

  this.add = function(item) {
    if (!this.items.includes(item)) {
      console.log('adding item');
      this.items.push(item);
      return true;
    }
    return false;
  }
}

function markovModel(source) {
  if (typeof source === 'string') {
    this.source = source;
  }

  this.tokenCount = 0;
  this.types = {};

  this.getAfterProbs = function(type) {
    return this.types[type];
  }

  this.train = function(string) {
    if (typeof string !== 'string') {
      string = this.source;
    }
    this.source = string;
    string = stripString(string).split(' ');

    for (var i = 0; i < string.length; i++) {
      if (model.hasOwnProperty(string[i])) {
        model[string[i]][string[i+1]] = 0;
      } else {
        model[string[i]] = new markovModelType(string[i]);
      }
      this.tokenCount += 1;
    }
    return {
      model: model,
      allTypes: Object.keys(model),
    };
  }
}

function markovModelType(string) {
  this.string = string;
  this.typesAfter = { };

  this.addTypeAfter = function(type) {

  }
}

const patterns = [
  {
    type: 'remove',
    pattern: /\.\s|\.$/,
  },
  {
    type: 'remove',
    pattern: /,|\?|!|'|"/,
  },
]

function stripString(string) {
  for (var key in patterns) {
    let p = patterns[key];
    if (p.type === 'remove') {
      string = string.replace(p.pattern, '');
    }
  }
  return string.toLowerCase()
}

$(document).ready(function() {
  let M = new markovModel();
  console.log(M.train($('textarea').val()));
});
