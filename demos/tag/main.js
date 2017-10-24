const basicallyZero = 1e-100

function log(s, i, n) {
  let im = 2;
  if (typeof n === 'undefined') {
    n = 1;
  }
  if (typeof i === 'undefined') {
    i = 0;
  }
  i = i*im;
  let l = " ".repeat(i) + s + "\n".repeat(n);
  $('.log').append(l);
}

function compoundProbablities(matrices) {

  let indexes = [ ];
  for (var m in matrices) {
    indexes.push(0);
  }
  let result = [ ];

  while (true) {
    // Actual work
    let key = [ ];
    let product = 1;
    let temp = { };
    for (var q=0; q<matrices.length; q++) {
      product = product * matrices[q][indexes[q]][Object.keys(matrices[q][indexes[q]])[0]];
      key.push(Object.keys(matrices[q][indexes[q]])[0]);
    }
    temp[key.join(' ')] = product;
    result.push(temp);

    // Check
    let check = true;
    for (var x=0; x<matrices.length; x++) {
      if (indexes[x] < matrices[x].length-1) {
        check = false;
      }
    }
    if (check) {
      break;
    }

    // Update indexes
    let thisIndex;
    let nextIndex;
    let thisMax;
    for (var y=indexes.length-1; y>=0; y--) {
      thisIndex = indexes[y];
      nextIndex = indexes[y-1];
      thisMax = matrices[y].length-1;
      if (thisIndex < thisMax) {
        indexes[y] += 1;
        break;
      } else {
        indexes[y] = 0;
      }
    }
  }

  return result;
}

function mostLikelyChain(initialState, model, steps, finalState) {
  // console.log(initialState, model, steps);
  let possibleStates = Object.keys(model.types);
  let pile = { };
  pile[initialState] = 1;
  let newPile = { };
  for (var step=0; step < steps; step++) {
    for (var key in pile) {
      for (var i=0; i<possibleStates.length; i++) {
        let sequenceString = "";
        sequenceString += key;
        sequenceString += " ";
        sequenceString += possibleStates[i];

        let lastState = key.split(' ')[key.split(' ').length-1];
        newPile[sequenceString] = pile[key] * model.getNextProbs(lastState)[possibleStates[i]];
      }
    }
    pile = { };
    Object.assign(pile, newPile);
    newPile = { };
  }
  for (var key in pile) {
    let lastState = key.split(' ')[key.split(' ').length-1];
    newPile[key + " " + finalState] = pile[key] * model.getNextProbs(lastState)[finalState];
  }
  pile = { };
  Object.assign(pile, newPile);

  let bestChain = Object.keys(pile).reduce(function(a, b) { return pile[a] > pile[b] ? a : b });
  let tmp = { };
  tmp[bestChain] = pile[bestChain];
  return tmp;
}

function zipTag(a,b) {
  if (typeof a === 'string') {
    a = stripString(a).split(/\s/);
  }
  if (typeof b === 'string') {
    b = b.split(' ');
  }
  let result = [ ];
  a.map(function(t, i) {
    let x = { };
    x.token = t;
    x.tag = b[i];
    result.push(x);
  })
  return result;
}

function markovModel(source) {
  if (typeof source === 'object') {
    this.source = source;
  }

  this.tokenCount = 0;
  this.types = { };

  this.getType = function(typename) {
    if (this.types.hasOwnProperty(typename)) {
      return this.types[typename];
    }
  }

  this.getAfterTypes = function(typename) {
    if (this.types.hasOwnProperty(typename)) {
      return this.types[typename].afterTypes;
    }
  }

  this.getTags = function(typename) {
    if (this.types.hasOwnProperty(typename)) {
      return this.types[typename].tags;
    }
  }

  this.getNextProbs = function(typename) {
    let type = this.types[typename];
    let afterTypes = Object.assign({}, type.afterTypes);
    let total = type.tokenCount;

    Object.keys(afterTypes).map(function(item, index) {
      afterTypes[item] = afterTypes[item] / total;
    })

    for (var t in this.types) {
      if (!afterTypes.hasOwnProperty(t)) {
        afterTypes[t] = basicallyZero;
      }
    }

    return afterTypes;
  }

  this.getTagProbs = function(typename) {
    let type = this.getType(typename);
    let tags = Object.assign({}, type.tags);
    let total = type.tokenCount;

    Object.keys(tags).map(function(item, index) {
      tags[item] = tags[item] / total;
    })

    return tags;
  }

  this.mostLikelyTag = function(typename) {
    let type = this.getType(typename);
    if (typeof type === 'undefined') {
      return undefined;
    }
    let tags = Object.assign({}, type.tags);
    let total = type.tokenCount;
    let bestTag = "";
    let bestProb = 0;

    Object.keys(tags).map(function(item, index) {
      if (tags[item]/total > bestProb) {
        bestTag = item;
        bestProb = tags[item] / total;
      }
    })

    return {
      tag: bestTag,
      prob: bestProb,
    }
  }

  this.produce = function(n) {
    let sentence = [];
    let start = randArrayChoice(Object.keys(this.types));
    sentence.push(start);

    let last = start;
    for (var i=0; i < n; i++) {
      let afterTypes = this.getType(last).afterTypes;
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

  this.getHierarchy = function(typename, value, depth, limit) {
    let result = { };
    let type = this.getType(typename);
    result.name = typename;
    result.value = value;
    if (depth > 1 && typeof type !== 'undefined' && value >= limit) {
      result.afterTypes = [ ];
      for (var key in type.afterTypes) {
        result.afterTypes.push(this.getHierarchy(key, type.afterTypes[key], depth-1, limit));
      }
    }
    return result;
  }

  this.train = function(data) {
    // Data should be array of objects with token and tag props.
    if (typeof data !== 'object') {
      data = this.source;
    }
    this.source = data;

    data.push({token: "EOS", tag: "EOS"});
    data.unshift({token: "BOS", tag: "BOS"});

    for (var i = 0; i < data.length; i++) {
      let thisType = data[i];
      let nextType = data[i+1];
      if (!this.types.hasOwnProperty(thisType.token)) {
        this.types[thisType.token] = new markovModelType(thisType.token);
      }
      this.types[thisType.token].tokenCount += 1;
      if (typeof nextType !== 'undefined') {
        this.types[thisType.token].bumpAfterType(nextType.token);
      }
      this.types[thisType.token].bumpTag(thisType.tag)
      this.tokenCount += 1;
      // }
    }
    return {
      model: this.types,
      allTypes: Object.keys(this.types),
      tokenCount: this.tokenCount,
    };
  }

  this.fillGap = function(gap, before, after) {
    let lastTag = before.tag;
    let nextTag = after.tag;
    let gapLength = gap.length;
    log("Last tag was " + lastTag, 2);

    if (lastTag !== undefined && nextTag !== undefined) {
      // let gapTagPossibilities = [ ];
      // let possibleTags;
      // let tempArray = [ ];
      // possibleTags = T.getNextProbs(lastTag);
      //
      // Object.keys(possibleTags).map(
      //   function(item, index) {
      //     if (possibleTags[item] <= basicallyZero) {
      //       delete possibleTags[item];
      //     } else {
      //       var tmp = { };
      //       tmp[item] = possibleTags[item];
      //       tempArray.push(tmp);
      //     }
      //   });

      let bestChain = mostLikelyChain(lastTag, T, gapLength, nextTag);

      let chainString = Object.keys(bestChain)[0];
      chainString = chainString.split(' ');
      chainString.pop();
      chainString.shift();

      let result = [ ];
      chainString.map(function(item, index) {
        result.push({
          tag: item,
          token: gap[index].token,
        })
      })

      return result
    }
  }

  this.tag_gapfill = function(s) {
    s.push("EOS");
    s.unshift("BOS");
    log("Tagging function received input [" + s + "]");
    let result = [ ];
    for (var i=0; i<s.length; i++) {
      let x = { };
      x.token = s[i];
      // If there is a near 100% probability of this token being a tag, give it that tag.
      let mostLikely = this.mostLikelyTag(s[i]);
      if (mostLikely.prob > 0.99) {
        x.tag = mostLikely.tag;
      }
      result.push(x);
    }
    log("Tags assigned to tokens with 100% probability", 0, 2);
    log("Scan for untagged tokens...")
    for (var i=1; i<result.length; i++) {
      log("Checking " + result[i].token, 1);
      if (result[i].tag === undefined || !result[i].hasOwnProperty('tag')) {
        log("This token has no assigned tag", 2);
        let lastTag = result[i-1].tag;
        let nextTag = result[i+1].tag;
        result[i] = this.fillGap([result[i]], result[i-1], result[i+1])[0];
      }
    }
    return result;
  }

}

function markovModelType(name) {
  this.name = name;
  this.tags = { };
  this.afterTypes = { };
  this.tokenCount = 0;

  this.addTypeAfter = function(typename) {
    this.afterTypes[typename] = 0;
  }

  this.addTag = function(tagname) {
    this.tags[tagname] = 0;
  }

  this.bumpAfterType = function(typename) {
    if (this.afterTypes.hasOwnProperty(typename)) {
      this.afterTypes[typename] += 1;
    } else {
      this.addTypeAfter(typename);
      this.afterTypes[typename] += 1;
    }
  }
  this.bumpTag = function(tagname) {
    if (this.tags.hasOwnProperty(tagname)) {
      this.tags[tagname] += 1;
    } else {
      this.addTag(tagname);
      this.tags[tagname] += 1;
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
    pattern: /'|’|"|\*|‘|“|”/g,
  },
  {
    type: 'replace',
    pattern: /\?|!|\*|—|;|:|\(|\)|\n|\r/g,
    replace: ' ',
  },
  {
    type: 'replace',
    pattern: /\./g,
    replace: ' . ',
  },
  {
    type: 'replace',
    pattern: /,/g,
    replace: ' , ',
  },
  {
    type: 'replace',
    pattern: /\s+/g,
    replace: ' '
  },
  {
    type: 'replace',
    pattern: /\s+$/g,
    replace: ''
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
  $('.main').append('<pre class="log"></pre>');

  // let data = "A large cat licks a small dog.";
  let tokenstring = "A pink cat licks a small dog. A big giraffe eats a dog taco. A rabbit jumps. A cute fluffy platypus watches TV. Why are we here?";
  // FS = full stop
  let tagstring = "D J N V D J N FS D J N V D J N FS D N V FS D J J N V N FS WH V N P Q";
  let data = zipTag(tokenstring, tagstring);

  window.M = new markovModel(data);
  M.train();

  let tagdata = [ ];
  data.map(function(item, index) {
    let t = { };
    t.token = item.tag;
    t.tag = "tag";
    tagdata.push(t);
  })

  window.T = new markovModel(tagdata);
  T.train();
  log("Model trained on sentence \"" + data.map(function(t,i) {return t.token}).join(' ') + '"');

  let test = "A dog cat eats a dog.";
  log("Testing on sentence \"" + test + '"', 0, 2);

  let tagged = M.tag_gapfill(stripString(test).split(/\s/));
  for (var i=0; i<tagged.length; i++) {
    log(tagged[i].token + "\t: " + tagged[i].tag);
  }
});
