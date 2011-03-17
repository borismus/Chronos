function renderChart(data) {
  // Renders a chart given some time data
  // time data consists of 3 arrays: [bar size in %], [left], [right label]
  var percent = data[0], left = data[1], right = data[2];
  $('#chart').empty();
  for (var i = 0; i < data[0].length; i++) {
    var style = 'width: ' + percent[i] + '%;' + 'opacity: ' + (100 - i)/100;
    $('#chart').append('<li><div class="label">' + left[i] + '</div>' +
    '<div class="data"><div class="bar" style="' + style + '">'+
      '<span class="bar-label">' + right[i] + '</span></div></div>'
    );
  }
  // Only show the bar label if user hovers over the bar
  $('#chart li').hover(function() {
    $(this).find('.bar-label').toggle();
  });
  return data;
}

function removeEntry(data, label) {
  var index = data[0].indexOf(label);
  if (index == -1) {
    // We couldn't find the label!
    return false;
  }
  data[0].splice(index, 1);
  var output = data[1].splice(index, 1)[0];
  return output;
}

function pluralize(value, unit) {
  var output = value + ' ' + unit;
  return (value > 1) ? output + 's' : output;
}

function formatTime(ms) {
  // Format time in seconds into something more human-friendly
  var s = parseInt(ms/1000, 10);
  var m = parseInt(s/60, 10);
  var h = parseInt(s/3600, 10);
  var d = parseInt(s/86400, 10);
  if (d > 0) {
    return pluralize(d, 'day');
  } else if (h > 0) {
    return pluralize(h, 'hour');
  } else if (m > 0) {
    return pluralize(m, 'minute');
  } else {
    return pluralize(s, 'second');
  }
}

function showData(data) {
  // Data is two arrays: [labels, times]
  var labels = data[0];
  var times = data[1];
  // Remove the entries about idle time and special time
  var inactiveTime = removeEntry(data, background.INACTIVE_DOMAIN);
  var specialTime = removeEntry(data, background.SPECIAL_DOMAIN);
  // Compute total active time
  var activeTime = 0;
  for (var i = 0; i < times.length; i++) {
    activeTime += times[i];
  }
  var totalTime = activeTime + inactiveTime;
  // Compute some percentages
  var percentages = [];
  var rightLabels = [];
  for (i = 0; i < times.length; i++) {
    var barPercent = parseInt(times[i] / times[0] * 100, 10);
    percentages.push(barPercent);
    var percent = parseInt(times[i] / activeTime * 100, 10);
    rightLabels.push(formatTime(times[i]) + ' (' + percent + '%)');
  }
  // Update some DOM
  $('#active_time').text(formatTime(activeTime));
  $('#idle_ratio').text(parseInt(100 * inactiveTime/(totalTime), 10));
  // Plot the data
  return renderChart([percentages, labels, rightLabels]);
}

function showError(message) {
  $('#chart').html('<div class="error">' + message + '</div>');
  $('#active_time, #idle_ratio').text("N/A");
}

function enterMode(mode) {
  console.log('entering mode ' + mode); // Make the new mode be the only selected mode
  $('#picker li').removeClass('selected');
  $('#' + mode).addClass('selected');
  // Get the data corresponding to the new mode
  background = chrome.extension.getBackgroundPage();
  var data = null;
  if (mode == 'all') {
    // Get the aggregate data for all time
    data = background.getAllData();
  } else if (mode == 'today') {
    // Get today's date
    // var today = parseInt((new Date()).valueOf() / 86400000, 10);
    var today = background.dayFromDate(new Date());
    data = background.getDailyData(today);
  } else if (mode == 'date') {
    // Get the date from the picker
    var date = $('#datepicker').datepicker('getDate');
    // var day = parseInt(date.valueOf() / 86400000, 10);
    var day = background.dayFromDate(date);
    data = background.getDailyData(day);
    if (! data) {
      showError("No timing data for the specified date.");
      return;
    }
  }

  showData(data);
}

$(function() {
  // Setup the date picker
  $("#datepicker").datepicker({
    onSelect: function(dateText, inst) {
      enterMode('date');
    }
  });
  // Hook up the mode picker
  $('#all, #today').click(function() {
    enterMode(this.id);
  });
  $('#date').click(function() {
    $('#datepicker').datepicker('show');
  });

  // What mode are we in? (get from localStorage)
  enterMode('today');
});

