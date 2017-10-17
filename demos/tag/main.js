const basicallyZero = 1e-100

function log(s) {
  $('.log').append(s + "\n");
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
    if (typeof data !== 'object') {
      data = this.source;
    }
    this.source = data;
    // data.push() = "BOS " + string + " EOS";
    // string = stripString(string).split(/\s/);

    for (var i = 0; i < data.length; i++) {
      let thisType = data[i];
      // if (thisType !== "bos" && thisType !== "eos") {
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

  this.tag = function(s) {
    log("Tagging function received input [" + s + "]");
    let result = []
    for (var i=0; i<s.length; i++) {
      let x = { };
      x.token = s[i];
      if (this.types.hasOwnProperty(s[i])) {
        if (Object.keys(this.getTagProbs(s[i])).length === 1) {
          x.tag = Object.keys(this.getTags(s[i]))[0];
        }
      }
      result.push(x);
    }
    log("Tags assigned to tokens with 100% probability");
    log("");
    log("Scan for untagged tokens...")
    for (var i=1; i<result.length -1; i++) {
      log(" Checking " + result[i].token);
      if (result[i].tag === undefined || !result[i].hasOwnProperty('tag')) {
        log("  This token has no assigned tag");
        let lastTag = result[i-1].tag;
        log("  Last tag was " + lastTag);
        if (lastTag !== undefined) {
          let possibleTags = T.getNextProbs(lastTag);
          Object.keys(possibleTags).map(function(item, index) {
            if (possibleTags[item] <= basicallyZero) {
              delete possibleTags[item];
            }
          });
          log("  Possible tags for " + result[i].token + " are " + Object.keys(possibleTags));
          let bestTag = "";
          let bestProb = 0;
          let nextTag = result[i+1].tag;
          log("  The next tag is " + nextTag);
          for (var thisTag in possibleTags) {
            let abProb = possibleTags[thisTag]; // prob of last tag -> this tag
            let bcProb = T.getNextProbs(thisTag)[nextTag]; // prob of this tag -> next tag
            log("  " + [lastTag, abProb, thisTag, bcProb, nextTag].join(' -> '));
            if (abProb * bcProb > bestProb) {
              bestProb = abProb * bcProb;
              bestTag = thisTag;
            }
          }
          log("  Best tag was " + bestTag + " with a compound probability of " + bestProb);
          // thisTag = Object.keys(thisTag).reduce(function(a, b){ return thisTag[a] > thisTag[b] ? a : b });
          result[i].tag = bestTag;
        }
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
  let data = [
    { token: "a",
      tag: "D",
    },
    // { token: "large",
    //   tag: "ADJ",
    // },
    { token: "cat",
      tag: "N",
    },
    { token: "licks",
      tag: "V",
    },
    { token: "a",
      tag: "D",
    },
    { token: "small",
      tag: "ADJ",
    },
    { token: "dog",
      tag: "N",
    },
  ]

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
  let test = "A large cat licks a small dog.";
  log("Testing on sentence \"" + test + '"');
  log("");
  let tagged = M.tag(stripString(test).split(/\s/));
  log("");
  for (var i=0; i<tagged.length; i++) {
    log(tagged[i].token + "\t: " + tagged[i].tag);
  }
});
