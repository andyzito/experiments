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

  SB.getData = function() {
    let startWord = "off";
    let data = M.getHierarchy(startWord, M.getType(startWord).tokenCount, 3, 0);
    SB.Sentence.locked.push(startWord);
    this.data = d3.hierarchy(data, function(d) { return d.afterTypes; });
    this.data.sum(function(d) {
      if (!d.hasOwnProperty('afterTypes')) {
        return d.value;
      } else {
        return 0;
      }
    })
    this.data.sort(function(a,b) {
      return b.value - a.value;
    })
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
                  .range([0, SB.dim.radius]);
    SB.color = d3.scaleOrdinal(d3.schemeCategory20);
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
                        .text(SB.Sentence.getContent())
                        .attr("x", SB.dim.width/2 - 50)
                        .attr("y", $(".chart-sunburst").height() -10)
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

    SB.arcGroup.selectAll("path")
        .data(SB.layout(SB.data).descendants())
      .enter().append("path")
        .attr("d", SB.arc)
        .attr("class", function(d) { return [d.data.name, "depth-" + d.depth, "height-" + d.height, "arc"].join(' '); })
        .on("mouseenter", function(d) {
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
            SB.updateChart();
          }
        })
        .on("mouseleave", function(d) {
          d3.selectAll('.arc:not(.depth-0)').classed('active', false);
          SB.Sentence.active = [ ];
          SB.updateChart();
        })
        .on("click", function(d) {
          SB.svg.transition()
                .duration(750)
                .tween("scale", function() {
                  var xd = d3.interpolate(SB.scaleX.domain(), [d.x0, d.x1]),
                      yd = d3.interpolate(SB.scaleY.domain(), [d.y0, 1]),
                      yr = d3.interpolate(SB.scaleY.range(), [d.y0 ? 20 : 0, SB.dim.radius]);
                  return function(t) { SB.scaleX.domain(xd(t)); SB.scaleY.domain(yd(t)).range(yr(t)); };
                })
              .selectAll(".arc")
                .attrTween("d", function(d) { return function() { return SB.arc(d); }; });
        })
        // .style("fill", function(d) {
        //   if (d.parent !== null) {
        //     return SB.color((d.children ? d : d.parent).data.name);
        //   } else {
        //     return SB.color(d.data.name);
        //   }
        // })

      SB.arcGroup.selectAll("text")
          .data(SB.layout(SB.data).descendants())
        .enter().append("text")
          .attr("class", "arc-label")
          .attr("x", function(d) {
            return SB.arc.centroid(d)[0];
          })
          .attr("y", function(d) {
            return SB.arc.centroid(d)[1];
          })
          .text(function(d) {
            if (d.depth < 2) {
              return d.data.name;
            }
          })
  }

  SB.updateChart = function() {
    SB.sentence.text(SB.Sentence.getContent());

  }

  SB.getData();
  SB.initChart();
  SB.updateChart();

});
