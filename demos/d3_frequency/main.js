const defaults = {
  svg: true,
  percent: false,
  'actual-freq-overlay': false,
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
const actualFrequencies = {
  'E': 12.0,
  'T': 9.10,
  'A': 8.12,
  'O': 7.68,
  'I': 7.31,
  'N': 6.95,
  'S': 6.28,
  'R': 6.02,
  'H': 5.92,
  'D': 4.32,
  'L': 3.98,
  'U': 2.88,
  'C': 2.71,
  'M': 2.61,
  'F': 2.30,
  'Y': 2.11,
  'W': 2.09,
  'G': 2.03,
  'P': 1.82,
  'B': 1.49,
  'V': 1.11,
  'K': 0.69,
  'X': 0.17,
  'Q': 0.11,
  'J': 0.10,
  'Z': 0.07,
}
Object.keys(actualFrequencies).map(function(key, index) {
  actualFrequencies[key] /= 100; // get the frequencies into proper decimal form for later use as percentages.
});

function getLetterFrequencies(string, percent) {
  // Set default for 'percent' (whether or not to use percentages).
  if (typeof percent != 'boolean') {
    percent = false;
  };

  // Make an object mapping letters to 0 (for saving frequencies).
  let frequencies = alphabet.reduce(function(result, item, index, array) {
    result[item] = 0;
    return result;
  }, {});

  let total = 0;
  string = string.split('');

  for (i=0; i<string.length; i++) {
    var char = string[i].toUpperCase();
    if (alphabet.includes(char)) {
      frequencies[char] += 1;
      total += 1;
    }
  }

  // If percent is true, convert counts to percentages.
  if (percent) {
    for (var key in frequencies) {
      if (total === 0) { // Accounting for empty case.
        frequencies[key] = 0;
      } else {
        frequencies[key] = frequencies[key]/total;
      }
    }
  }
  return frequencies;
}

function maxDecimals(number, dec) {
  let nstring =  String(number).split('.');
  if (nstring.length > 1) {
    return Number(nstring[0] + '.' + nstring[1].substr(0, dec));
  } else {
    return Number(nstring[0]);
  }
}

function d3_multibind(selectors, data, parent) {
  selectors.map(function(item) {
    parent.selectAll(item).data(data);
  })
}

function initializeChart() {
  if (getSetting('svg')) {
    $('.chart-html').hide();
  } else {
    $('.chart-svg').hide();
  }
  initializeChartHTML();
  initializeChartSVG();
}

function updateChart() {
  if (getSetting('svg')) {
    updateChartSVG();
  } else {
    updateChartHTML();
  }
}

function initializeChartSVG() {
  // Wrap
  let chart = d3.select('.chart-svg').append('g');

  // Layers
  let layer1 = chart.append('g').attr('class', 'layer layer-1');
  let layer2 = chart.append('g').attr('class', 'layer layer-2');

  // Axes
  layer2.append('g').attr('class', 'axis axis-x');
  layer2.append('g').attr('class', 'axis axis-y');

  layer1.selectAll('rect.user-frequencies.bar')
              .data(alphabet).enter()
              .append('rect')
                .attr('class', 'bar user-frequencies');
  layer2.selectAll('text.user-frequencies.label')
              .data(alphabet).enter()
              .append('text')
                .attr('class', 'label user-frequencies');

  layer1.selectAll('rect.actual-frequencies.bar')
              .data(d3.entries(actualFrequencies)).enter()
              .append('rect')
                .attr('class', 'bar actual-frequencies');
  layer2.selectAll('text.actual-frequencies.label')
              .data(d3.entries(actualFrequencies)).enter()
              .append('text')
                .attr('class', 'label actual-frequencies');
}


function updateChartSVG() {
  if ($('.chart-svg').css('display') === 'none') {
    $('.chart-svg').show();
    $('.chart-html').hide();
  }

  let percent = false;
  if (getSetting('percent')) {
    percent = true;
  }

  let padding = {
    bottom: 60,
    top: 40,
    left: 40,
    right: 40,
    inner: 0.2,
    labelKey: 10,
    labelVal: 10,
    axis: 0,
  }

  let wrapperHeight = $('.chart-svg').height();
  let wrapperWidth = $('.chart-svg').width();

  let chart = d3.select('.chart-svg > g')
    .attr('transform', function() {
      return 'translate(' + padding.top + ',' + padding.left + ')';
    })
    .attr('width', wrapperWidth - padding.left - padding.right)
    .attr('height', wrapperHeight - padding.top - padding.bottom);

  let dimensions = {
    chartHeight: Number(chart.attr('height')),
    chartWidth: Number(chart.attr('width')),
  }

  let data = getLetterFrequencies($('textarea').val(),percent);

  let range_max = percent ? 1 : d3.max(d3.values(data))+1;

  let y = d3.scaleLinear()
            .domain([0, range_max])
            .range([1, dimensions.chartHeight]);
  let scaleAxisY = y.copy() // scale for use with the y axis (flipped).
                    .range([dimensions.chartHeight, 1])

  let x = d3.scaleBand()
            .domain(alphabet)
            .rangeRound([0, dimensions.chartWidth])
            .paddingInner(padding.inner);

  dimensions.barWidth = x.bandwidth();

  let axisX = d3.axisBottom(x)
                .tickSizeInner(5)
                .tickSizeOuter(0)
                .tickPadding(7);
  let axisY = d3.axisLeft(scaleAxisY)
                .tickSizeInner(3)
                .tickSizeOuter(8)
                .tickPadding(5);

  if (percent) {
    axisY.ticks(10, '%');
  }

  let axisG = d3.select('.chart-svg .axis-x');
  axisG.call(axisX);
  axisG.attr('transform', 'translate(0,' + (dimensions.chartHeight + padding.axis) + ')');

  axisG = d3.select('.chart-svg .axis-y');
  axisG.call(axisY);
  axisG.attr('transform')

  d3_multibind(['rect.user-frequencies', 'text.user-frequencies'], d3.entries(data), chart);
  // let barsActual = chart.selectAll('.actual-frequencies');

  chart.selectAll('.bar, .label').attr('transform', function(d, i) {
    let tstring = "translate(";
    tstring += x(d.key); // horizontal spread.
    tstring += ',';
    tstring += dimensions.chartHeight - y(d.value);
    tstring += ')';
    return tstring;
  });
  chart.selectAll('.bar').attr("height", function(d) {
        return y(d.value);
      })
      .attr("width", dimensions.barWidth);
  chart.selectAll('.label')
    .attr('x', dimensions.barWidth/2)
    .attr('y', -padding.labelVal)
    .attr('text-anchor', 'middle')
    .text(function(d) {
      if (percent) {
        return maxDecimals(d.value * 100, 1) + '%';
      }
      return d.value;
    });

  d3.selectAll('.bar.actual-frequencies').attr("width", dimensions.barWidth/2);
  d3.selectAll('.label.actual-frequencies')
    .style('dominant-baseline', 'hanging')
    .attr("y", function(d) { return y(d.value) + padding.labelVal*3 + 3; });
  if (getSetting('actual-freq-overlay')) {
    d3.selectAll('rect.actual-frequencies').style("opacity", 0.5);
    d3.selectAll('text.actual-frequencies').style("opacity", 1);
  } else {
    d3.selectAll('.actual-frequencies').style("opacity", 0);
  }
}

function initializeChartHTML() {
  let bars = d3.select('.chart-html').selectAll('div')
                .data(alphabet).enter()
                .append('div')
                  .attr('class', function(d) { return d + "-bar bar" });
  bars.append('div')
      .attr('class', function(d) { return d + '-label label label-key' })
      .text(function(d) { return d; });
  bars.append('div')
      .attr('class', function(d) { return d + '-label label label-val' })
      .text(function(d) { return 0; });
}

function updateChartHTML() {
  if ($('.chart-html').css('display') === 'none') {
    $('.chart-html').show();
    $('.chart-svg').hide();
  }
  // Settings
  let percent = getSetting('percent');

  // Main body
  let data = getLetterFrequencies($('textarea').val(),percent);

  let range_max = percent ? 1 : d3.max(d3.values(data));

  let x = d3.scaleLinear()
              .domain([0, range_max])
              .range([1, 500]);
  let bars = d3.select('.chart-html').selectAll('.bar').data(d3.entries(data));
  bars.style("height", function(d) { return x(d.value) + 'px'; });
  bars.select('.label-val')
      .text(function(d) {
        if (percent) {
          return (d.value*100).toFixed(1) + '%';
        }
        return d.value;
      });
}


$(document).ready(function(){
  initializeSettings();
  updateSettings();
  initializeChart();
  updateChart();

  $('textarea').on('keyup change', function(){
    updateChart();
  });

  $('input').change(function() {
    updateSettings();
    updateChart();
  });

});
