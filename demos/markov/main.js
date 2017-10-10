function Set(initial) {
  if (typeof initial === 'array') {
    this.items = initial;
  } else {
    this.items = [ ];
  }

  this.add = function(item) {
    if (!this.items.includes(item)) {
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
  this.types = { };

  this.getType = function(typename) {
    return this.types[typename];
  }

  this.getAfterTypes = function(typename) {
    return this.types[typename].afterTypes;
  }

  this.getNextProbs = function(typename) {
    let type = this.types[typename];
    let afterTypes = Object.assign({}, type.afterTypes);
    let total = type.tokenCount;

    // console.log(type);
    // console.log(afterTypes);
    // console.log(total);

    Object.keys(afterTypes).map(function(item, index) {
      afterTypes[item] = afterTypes[item] / total;
    })

    // console.log(objSum(afterTypes));
    return afterTypes;
  }

  this.produce = function(n) {
    let sentence = [];
    let start = randArrayChoice(Object.keys(this.types));
    sentence.push(start);

    let last = start;
    for (var i=0; i < n; i++) {
      // console.log(last);
      let afterTypes = this.getType(last).afterTypes;
      // console.log(afterTypes);
      let nextType = weightedChoice(afterTypes);
      sentence.push(nextType);
      last = nextType;
    }

    return sentence.join(' ');
  }

  this.choose = function(typename) {
    let type = this.types[typename];
    let afterTypes = type[afterTypes];

    return randArrayChoice(Object.keys(afterTypes));
  }

  this.getHierarchy = function(typename, n) {
    let result = { };
    let type = this.getType(typename);
    if (typeof type === 'undefined') {
      return;
    }
    result.name = typename;
    result.value = type.tokenCount;
    if (n > 1) {
      result.afterTypes = [ ];
      for (var key in type.afterTypes) {
        if (key === 'undefined' || typeof key === 'undefined') {
          // console.log('The next one is UNDEFINED OH NO');
          // console.log(M.getType(typename));
        }
        result.afterTypes.push(this.getHierarchy(key, n-1));
      }
    }
    return result;
  }

  this.train = function(string) {
    if (typeof string !== 'string') {
      string = this.source;
    }
    this.source = string;
    string = "BOS " + string + " EOS";
    string = stripString(string).split(/\s/);

    for (var i = 0; i < string.length; i++) {
      let thisType = string[i];
      if (thisType !== "bos" && thisType !== "eos") {
        let nextType = string[i+1];
        if (!this.types.hasOwnProperty(thisType)) {
          this.types[thisType] = new markovModelType(thisType);
        }
        this.types[thisType].tokenCount += 1;
        this.types[thisType].bump(nextType);
        this.tokenCount += 1;
      }
    }
    return {
      model: this.types,
      allTypes: Object.keys(this.types),
      tokenCount: this.tokenCount,
    };
  }
}

function markovModelType(name, context) {
  this.name = name;
  this.context = context;
  this.afterTypes = { };
  this.tokenCount = 0;

  this.addTypeAfter = function(typename) {
    this.afterTypes[typename] = 0;
  }

  this.bump = function(typename) {
    if (this.afterTypes.hasOwnProperty(typename)) {
      this.afterTypes[typename] += 1;
    } else {
      this.addTypeAfter(typename);
      this.afterTypes[typename] += 1;
    }
  }
}

function randArrayChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function weightedChoice(choices) {
  let total = Object.values(choices).reduce(function(total, n) {
    return total + n;
  }, 0);

  let r = Math.random() * total;

  let offset = 0;
  for (var key in choices) {
    if (r < choices[key]+offset) {
      return key;
    }
    offset += choices[key];
  }
}

function objSum(obj) {
  return Object.values(obj).reduce(function(total, n) {
    return total + n;
  }, 0);
}

const patterns = [
  // {
  //   type: 'remove',
  //   pattern: /\.$/g,
  // },
  {
    type: 'remove',
    pattern: /'|’|"|\*|‘|\.|“|”/g,
  },
  {
    type: 'replace',
    pattern: /,|\?|!|\*|—|;|:|\(|\)|\n|\r/g,
    replace: ' ',
  },
  {
    type: 'replace',
    pattern: /\s+/g,
    replace: ' '
  },
]

function stripString(string) {
  for (var key in patterns) {
    let p = patterns[key];
    if (p.type === 'remove') {
      string = string.replace(p.pattern, '');
    } else if (p.type === 'replace') {
      string = string.replace(p.pattern, p.replace);
    }
  }
  return string.toLowerCase()
}



$(document).ready(function() {
  window.M = new markovModel();
  window.M.train(stripString($('textarea').val()));
  // console.log(M.produce(10));
  // console.log(M.getNextProbs('the'));
  // console.log(M.getHierarchy('the', 4));
});
