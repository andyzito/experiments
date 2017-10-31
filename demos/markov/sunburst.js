const SB = { };

SB.maxDepth = 3;

SB.Sentence = {
  locked: [ ],
  active: [ ],
  getContent: function() {
    return this.locked.concat(this.active).join(' ');
  }
}

SB.mar = {
  top: 30,
  right: 50,
  bottom: 100,
  left: 50,
}

$(document).ready(function() {

  SB.getData = function(word) {
    let data = M.getHierarchy(word, 1, 3, 0);
    data = d3.hierarchy(data, function(d) { return d.afterTypes; });
    // data.sum(function(d) {
    //   return d.value
    //   if (!d.hasOwnProperty('afterTypes')) {
    //     return d.value;
    //   } else {
    //     return 0;
    //   }
    // })
    data.sort(function(a,b) {
      return b.value - a.value;
    })
    return data;
  }

  SB.arcTweenZoom = function(d) {
    var xd = d3.interpolate(SB.scaleX.domain(), [d.x0, d.x1]),
        yd = d3.interpolate(SB.scaleY.domain(), [d.y0, 1]),
        yr = d3.interpolate(SB.scaleY.range(), [d.y0 ? 20 : 0, SB.dim.radius]);
    return function(d, i) {
      return i
          ? function(t) { return SB.arc(d); }
          : function(t) { SB.scaleX.domain(xd(t)); SB.scaleY.domain(yd(t)).range(yr(t)); return SB.arc(d); };
    }
  };

  SB.arcTweenData = function(a, i) {
    var oi = d3.interpolate({x: a.x0, dx: a.dx0}, a);
    function tween(t) {
      var b = oi(t);
      a.x0 = b.x0;
      a.dx0 = b.dx0;
      return SB.arc(b);
    }
    if (i == 0) {
     // If we are on the first arc, adjust the x domain to match the root node
     // at the current zoom level. (We only need to do this once.)
     let node = SB.data;
      var xd = d3.interpolate(SB.scaleX.domain(), [node.x0, node.x1]);
      return function(t) {
        SB.scaleX.domain(xd(t));
        return tween(t);
      };
    } else {
      return tween;
    }
  }

  SB.lastWord = function() {
    if (SB.Sentence.locked.length > 1) {
      SB.Sentence.locked.pop();
      let startWord = SB.Sentence.locked[SB.Sentence.locked.length-1];
      SB.Sentence.active = [ ];
      SB.data = SB.getData(startWord);
      SB.updateChart();
      SB.updateSentence();
    }
  }

  SB.nextWord = function(d) {
    let startWord = SB.Sentence.active[SB.Sentence.active.length-1];
    SB.Sentence.locked= SB.Sentence.locked.concat(SB.Sentence.active);
    SB.Sentence.active = [ ];
    // console.log(SB.data.children.filter(function(item) {
    //   return item == d;
    // }));
    // SB.data.children[SB.data.children.indexOf(d)] = SB.getData(startWord);
    // SB.svg.transition()
    //       .duration(3000)
    //       .tween("scale", function() {
    //         var xd = d3.interpolate(SB.scaleX.domain(), [d.x0, d.x1]),
    //             yd = d3.interpolate(SB.scaleY.domain(), [d.y0, 1]),
    //             yr = d3.interpolate(SB.scaleY.range(), [50, SB.dim.radius]);
    //         return function(t) {
    //           SB.scaleX.domain(xd(t));
    //           SB.scaleY.domain(yd(t))
    //           .range(yr(t));
    //         };
    //       })
    //     .selectAll(".arc")
    //       .attrTween("d", function(d) { return function() { return SB.arc(d); }; });
    setTimeout(function(startWord) {
      SB.data = SB.getData(startWord);
      SB.scaleX = d3.scaleLinear()
                    .range([0, 2 * Math.PI]);
      SB.scaleY = d3.scaleSqrt()
                    .range([20, SB.dim.radius]);
      SB.updateChart();
    }, 0, startWord);
    // SB.svg.transition()
    //       .duration(750)
    //       .tween("scale", function() {
    //         var xd = d3.interpolate(SB.scaleX.domain(), [d.x0, d.x1]),
    //             yd = d3.interpolate(SB.scaleY.domain(), [d.y0, 1]),
    //             yr = d3.interpolate(SB.scaleY.range(), [20, SB.dim.radius]);
    //         return function(t) { SB.scaleX.domain(xd(t)); SB.scaleY.domain(yd(t)).range(yr(t)); };
    //       })
    //     .selectAll(".arc")
    //       .attrTween("d", function(d) { return function() { return SB.arc(d); }; });
    // d3.selectAll('.arc').transition()
    //         .duration(1000)
    //         .attrTween("d", SB.arcTweenData)
    // d3.selectAll('.arc').transition()
    //   .duration(1000)
    //   .attrTween("d", SB.arcTweenZoom);

  }

  SB.initChart = function() {
    SB.svg = d3.select('.chart-sunburst')
                  .attr('width', '100%')
                  .attr('height', '100%');

    SB.dim = { // "inner" dimensions, i.e., within the margins
      height: $('.chart-sunburst').height() - (SB.mar.top + SB.mar.bottom),
      width: $('.chart-sunburst').width() - (SB.mar.left + SB.mar.right),
    }

    SB.dim.radius = Math.min(SB.dim.height, SB.dim.width)/2;

    SB.scaleX = d3.scaleLinear()
                  .range([0, 2 * Math.PI]);
    SB.scaleY = d3.scaleSqrt()
                  .range([20, SB.dim.radius]);
    // SB.color = d3.scaleOrdinal(d3.schemeCategory20);
    SB.nformat = d3.format('.2%');

    SB.wrapper = SB.svg
                  .append('g')
                    .attr("class", "wrapper")
                    .attr('width', SB.dim.width - (SB.mar.left + SB.mar.right))
                    .attr('height', SB.dim.height - (SB.mar.top + SB.mar.bottom))
                    .attr('transform', 'translate(' + SB.mar.left + ',' + SB.mar.top + ')');
    SB.layer1 = SB.wrapper.append('g').attr("class", "layer-1");
    SB.layer2 = SB.wrapper.append('g').attr("class", "layer-2");

    SB.sentence = SB.svg.append("text")
                        .attr("x", $(".chart-sunburst").width()/2)
                        .attr("y", $(".chart-sunburst").height() -10)
                        .attr("class", "sentence")
                        .style("font-size", "2rem");

    SB.arc = d3.arc()
        .startAngle(function(d) {
          return Math.max(0, Math.min(2 * Math.PI, SB.scaleX(d.x0)));
        })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, SB.scaleX(d.x1))); })
        .innerRadius(function(d) { return Math.max(0, SB.scaleY(d.y0)); })
        .outerRadius(function(d) { return Math.max(0, SB.scaleY(d.y1)); });

    SB.layout = d3.partition()
    SB.arcGroup = SB.layer1.append('g')
              .attr('class', 'arcs')
              .attr('transform', 'translate(' + SB.dim.width/2 + ',' + SB.dim.height/2 + ')');
    SB.allArcs = SB.arcGroup.selectAll("path.arc");
    SB.labels = SB.arcGroup.selectAll("text.arc-label");
    SB.centerBack = SB.arcGroup.append("circle")
                      .attr("class", "center-back-button")
                      .attr("r", SB.scaleY.range()[0])
                      .on("click", SB.lastWord)
  }

  SB.mouseEnter = function(d) {
        d3.selectAll('.arc:not(.depth-0)').classed('active', false);
        SB.Sentence.active = [ ];

        if (d.depth > 0) {

          let currentNode = d;
          for (var i=d.depth; i>0; i--) {
            d3.selectAll(".arc").filter(function(d) {
              let a = d.depth === i;
              let b = d.data.name === currentNode.data.name;
              let c = d.parent === currentNode.parent;
              return a && b && c;
            }).classed("active", true);
            SB.Sentence.active[i-1] = currentNode.data.name;
            currentNode = currentNode.parent;
          }
          SB.updateSentence();
        }
      }

  SB.mouseLeave = function(d) {
    d3.selectAll('.arc:not(.depth-0)').classed('active', false);
    SB.Sentence.active = [ ];
    SB.updateSentence();
  }

  SB.updateChart = function(d) {
    let arcs = SB.arcGroup.selectAll('path.arc').data(SB.layout(SB.data).descendants());

    arcs.exit().remove();
    arcs.attr("d", SB.arc)
        .attr("class", function(d) { return [d.data.name, "depth-" + d.depth, "height-" + d.height, "arc"].join(' '); })

    arcs.enter().append("path")
        .attr("d", SB.arc)
        .attr("class", function(d) { return [d.data.name, "depth-" + d.depth, "height-" + d.height, "arc"].join(' '); })


    // SB.allArcs = SB.arcGroup.selectAll("path.arc");

    // SB.allArcs
    d3.selectAll('.arc')
        .on("mouseenter", SB.mouseEnter)
        .on("mouseleave", SB.mouseLeave)
        .on("click", SB.nextWord)

    let labels = SB.arcGroup.selectAll('text.arc-label').data(SB.layout(SB.data).descendants());
    labels.exit().remove()
    labels.enter().append("text")
          .attr("class", "arc-label")
        .merge(labels).attr("x", function(d) {
          return SB.arc.centroid(d)[0];
        })
        .attr("y", function(d) {
          return SB.arc.centroid(d)[1];
        })
        .text(function(d) {
          let startAngle = Math.max(0, Math.min(2 * Math.PI, SB.scaleX(d.x0)));
          let endAngle = Math.max(0, Math.min(2 * Math.PI, SB.scaleX(d.x1)));
          let angle = endAngle - startAngle;

          if (d.depth < 2 && angle>(d.data.name.length*0.04)) {
            return d.data.name;
          }
        })
  }

  SB.updateSentence = function() {
    SB.sentence.text(SB.Sentence.getContent());
  }


  SB.data = SB.getData("alice");
  // let temp = { };
  // temp.data = {name: 'test', value: '7'};
  // temp.depth = 3;
  // temp.height = 0;
  // temp.parent = SB.data.children[0].children[0];
  // temp.value = 7;
  // temp.x0 = 0;
  // temp.x1 = 1;
  // temp.y0 = 0;
  // temp.y1 = 1;
  // SB.data.children[0].children[0].children = [temp];
  SB.Sentence.locked.push("off");
  SB.initChart();
  SB.updateChart();
  SB.updateSentence();

});
