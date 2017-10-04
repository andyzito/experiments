<html>
  <head>
    <link href="https://fonts.googleapis.com/css?family=Roboto+Condensed" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="../../style/d3_frequency/main.css">
    <script src="../../module_settings/settings.js"></script>
    <script
      src="https://code.jquery.com/jquery-3.2.1.min.js"
      integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4="
      crossorigin="anonymous"></script>
    <script src="https://d3js.org/d3.v4.js"></script>
    <script src="../../demos/d3_frequency/main.js"></script>
  </head>

  <body>
    <div class="sidebar">
      <div class="settings-menu">
        <div class="setting setting-svg">
          <label for="setting-svg-true">
            <input type="radio" id="setting-svg-true" name="setting-svg" value="true">
            SVG
            </label>
          <label for="setting-svg-false">
            <input type="radio" id="setting-svg-false" name="setting-svg" value="false">
            HTML
            </label>
        </div>
        <div class="setting setting-percent">
          <label for="setting-percent-false">
            <input type="radio" id="setting-percent-false" name="setting-percent" value="false">
            Count
            </label>
          <label for="setting-percent-true">
            <input type="radio" id="setting-percent-true" name="setting-percent" value="true">
            Percent
            </label>
          <div class="setting setting-actual-freq-overlay" condition-on="percent,true">
            <label for="setting-actual-freq-overlay">
              <input type="checkbox" id="setting-actual-freq-overlay">
              Display overlay of actual English letter frequencies
              </label>
          </div>
        </div>
      </div>
    </div>
    <div class="main">
      <div class="chart-wrapper">
        <div class="chart chart-html">
        </div>
        <svg class="chart chart-svg">
        </svg>
      </div>
      <textarea>Here is some text to demonstrate this app, which finds the frequencies of letters in the content of this text area and displays the data in a bar graph using D3.js.</textarea>
    </div>
  </body>

</html>
