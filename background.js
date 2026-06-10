// FloatTodo - Background Service Worker v1.4

// ── ابزارهای تاریخ (اول تعریف میشن) ─────────────────────────────────────────
function getDateStr(offset) {
  var d = new Date();
  d.setDate(d.getDate() + (offset || 0));
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

// ── Alarms ────────────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(function() {
  chrome.alarms.create('ft-hourly-check', {
    delayInMinutes: 1,
    periodInMinutes: 60
  });
  checkDueTodos();
});

chrome.runtime.onStartup.addListener(function() {
  chrome.alarms.create('ft-hourly-check', {
    delayInMinutes: 1,
    periodInMinutes: 60
  });
  checkDueTodos();
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'ft-hourly-check') checkDueTodos();
});

// ── چک سررسیدها ───────────────────────────────────────────────────────────────
function checkDueTodos() {
  chrome.storage.local.get(['ft3_todos', 'ft_notified'], function(res) {
    var todos    = Array.isArray(res.ft3_todos) ? res.ft3_todos : [];
    var notified = res.ft_notified || {};
    var today    = getDateStr(0);
    var tomorrow = getDateStr(1);

    var dueToday = [], dueTomorrow = [], overdue = [];

    todos.forEach(function(t) {
      if (t.done || !t.due) return;
      if (t.due < today)           overdue.push(t);
      else if (t.due === today)    dueToday.push(t);
      else if (t.due === tomorrow) dueTomorrow.push(t);
    });

    var newNotified = Object.assign({}, notified);
    var shouldShow  = false;

    if (dueToday.length > 0 && !notified['today-' + today]) {
      sendNotif('ft-today', '📋 وظایف امروز — ' + dueToday.length + ' مورد',
        dueToday.slice(0,3).map(function(t) {
          return (t.priority==='high'?'🔴 ':t.priority==='medium'?'🟡 ':'') + t.text;
        }).join('\n') + (dueToday.length > 3 ? '\n...و ' + (dueToday.length-3) + ' مورد دیگر' : '')
      );
      newNotified['today-' + today] = true;
      shouldShow = true;
    }

    if (dueTomorrow.length > 0 && !notified['tomorrow-' + tomorrow]) {
      sendNotif('ft-tomorrow', '⏰ یادآوری — فردا ' + dueTomorrow.length + ' وظیفه داری',
        dueTomorrow.slice(0,3).map(function(t) { return '• ' + t.text; }).join('\n')
      );
      newNotified['tomorrow-' + tomorrow] = true;
      shouldShow = true;
    }

    if (overdue.length > 0 && !notified['overdue-' + today]) {
      sendNotif('ft-overdue', '⚠️ ' + overdue.length + ' وظیفه عقب‌افتاده!',
        overdue.slice(0,3).map(function(t) { return '• ' + t.text + ' (' + t.due + ')'; }).join('\n')
      );
      newNotified['overdue-' + today] = true;
      shouldShow = true;
    }

    // پاک کردن کلیدهای قدیمی
    var cutoff = getDateStr(-4);
    Object.keys(newNotified).forEach(function(k) {
      var d = k.split('-').slice(1).join('-');
      if (d && d < cutoff) delete newNotified[k];
    });

    chrome.storage.local.set({ ft_notified: newNotified });

    // اگه نوتیف فرستادیم، پنل رو در همه تب‌ها نشون بده
    if (shouldShow) {
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, { type: 'ft-show-btn' }, function() {
            if (chrome.runtime.lastError) {}
          });
        });
      });
    }
  });
}

function sendNotif(id, title, message) {
  chrome.notifications.clear(id, function() {
    chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      buttons: [{ title: '✓ علامت‌گذاری وظایف امروز به عنوان انجام‌شده' }],
      priority: 2
    });
  });
}

// گوش دادن به کلیک دکمه‌های نوتیفیکیشن دسکتاپ
chrome.notifications.onButtonClicked.addListener(function(notifId, btnIndex) {
  if (btnIndex === 0) {
    chrome.storage.local.get(['ft3_todos'], function(res) {
      var todos = Array.isArray(res.ft3_todos) ? res.ft3_todos : [];
      var today = getDateStr(0);
      var updated = false;

      todos.forEach(function(t) {
        if (!t.done && t.due && t.due <= today) {
          t.done = true;
          updated = true;
        }
      });

      if (updated) {
        chrome.storage.local.set({ ft3_todos: todos }, function() {
          // ارسال سیگنال رفرش به همه تب‌های فعال
          chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, { type: 'ft-refresh-ui' }, function() {
                if (chrome.runtime.lastError) {}
              });
            });
          });
        });
      }
    });
    chrome.notifications.clear(notifId);
  }
});

chrome.notifications.onClicked.addListener(function(id) {
  chrome.notifications.clear(id);
});
