const SB = { };

SB.mar = {
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
}

$(document).ready(function() {

  SB.getData = function() {
    // let temp = { };
    // Object.keys(M.types).map(function(item, index) {
    //   temp[item] = M.types[item].tokenCount;
    // })
    // let startWord = weightedChoice(temp);
    // let data = { };
    // data.name = startWord;
    // // data.value = 1;
    // data.afterTypes = [ ];
    // for (var key in M.getAfterTypes(startWord)) {
    //   let temp = { };
    //   temp.name = key;
    //   temp.value = M.getAfterTypes(startWord)[key];
    //   data.afterTypes.push(temp);
    // }
    // let data = {
    //   name: "The",
    //   afterTypes: [
    //     {
    //       name: "black",
    //       value: 60,
    //       afterTypes: [
    //         {
    //           name: "cat",
    //           value: "30",
    //         },
    //         {
    //           name: "dog",
    //           value: "30",
    //         },
    //       ]
    //     },
    //     {
    //       name: "blue",
    //       value: "40",
    //       afterTypes: [
    //         {
    //           name: "cat",
    //           value: "30",
    //         },
    //         {
    //           name: "dog",
    //           value: "10",
    //         },
    //       ]
    //     },
    //   ]
    // }
    let data = M.getHierarchy('the', 10);
    this.data = d3.hierarchy(data, function(d) { return d.afterTypes; });
    this.data.sum(function(d) {
      if (!d.hasOwnProperty('afterTypes')) {
        return d.value;
      } else {
        return 0;
      }
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

    SB.wrapper = SB.svg
                  .append('g')
                    .attr('width', SB.dim.width - (SB.mar.left + SB.mar.right))
                    .attr('height', SB.dim.height - (SB.mar.top + SB.mar.bottom))
                    .attr('transform', 'translate(' + SB.mar.left + ',' + SB.mar.top + ')');
    SB.layer1 = SB.wrapper.append('g');
    SB.layer2 = SB.wrapper.append('g');

    SB.arc = d3.arc()
        .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, SB.scaleX(d.x0))); })
        .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, SB.scaleX(d.x1))); })
        .innerRadius(function(d) { return Math.max(0, SB.scaleY(d.y0)); })
        .outerRadius(function(d) { return Math.max(0, SB.scaleY(d.y1)); });    //   .startAngle(function(d) { return d.x; })
    //   .endAngle(function(d) { return d.x + d.dx ; })
    //   .padAngle(.01)
    //   .padRadius(SB.dim.radius / 3)
    //   .innerRadius(function(d) { return SB.dim.radius / 3 * d.depth; })
    //   .outerRadius(function(d) { return SB.dim.radius / 3 * (d.depth + 1) - 1; });

    // root = d3.hierarchy(root);
    // root.sum(function(d) { return d.size; });
    SB.layout = d3.partition()
    SB.arcGroup = SB.layer1.append('g')
              .attr('class', 'arcs')
              .attr('transform', 'translate(' + SB.dim.width/2 + ',' + SB.dim.height/2 + ')');

    SB.arcGroup.selectAll("path")
        .data(SB.layout(SB.data).descendants())
      .enter().append("path")
        .attr("d", SB.arc)
        // .style("fill", function(d) { return color((d.children ? d : d.parent).data.name); })
        // .on("click", click)
      .append("title")
        .text(function(d) { return d.data.name + "\n" + d.value; });


    // SB.center = SB.layer1.append('circle')
    //               .attr('r', SB.dim.radius)
    //               .attr('cx', SB.dim.width/2)
    //               .attr('cy', SB.dim.height/2)
    //               .style('fill', 'white')
    //               .style('stroke', 'black')

  }

  SB.updateChart = function() {

  }

  SB.getData();
  SB.initChart();
  SB.updateChart();

});
