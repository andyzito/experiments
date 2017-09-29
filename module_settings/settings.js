function getSetting(name) {
  let s = 'setting-' + name;
  let els = $('.' + s + ' input[id^=' + s + ']');
  let type = els.attr('type');
  if (type === 'checkbox') {
    return els[0].checked;
  } else if (type === 'radio') {
    return els.filter(':checked').val() === 'true';
  }
}

function setSetting(name, val) {
  let s = 'setting-' + name;
  let els = $('.' + s + ' input[id^=' + s + ']');
  let type = els.attr('type');
  if (type === 'checkbox') {
    return els[0].checked = val;
  } else if (type === 'radio') {
    return els.filter('[value=' + val + ']')[0].checked = 'true';
  }
}

function initializeSettings() {
  for (var name in defaults) {
    setSetting(name, defaults[name]);
  }
}

function updateSettings() {
  $('.settings-menu .setting .setting[condition-on]').each(function() {
    let name = $(this).attr('class').match(/setting-(.*?)(\s|$)/)[1];
    let conditionOn = $(this).attr('condition-on').split(',');
    let settingVal = getSetting(conditionOn[0]);
    if (String(settingVal) == conditionOn[1]) {
      $(this).show();
    } else {
      setSetting(name, defaults[name]);
      $(this).hide();
    }
  })
}
