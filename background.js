// FloatTodo - Background Service Worker v1.5

// ── ابزارهای تاریخ ─────────────────────────────────────────
function getDateStr(offset) {
  var d = new Date();
  d.setDate(d.getDate() + (offset || 0));
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

// ── Alarms & Startup ─────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(function() {
  setupAlarms();
  checkDueTodos();
});

chrome.runtime.onStartup.addListener(function() {
  setupAlarms();
  checkDueTodos();
});

function setupAlarms() {
  // بررسی کارهای دارای سررسید هر ۱ دقیقه یک‌بار (حداقل زمان آلارم MV3 برای چک کردن کارهای فوری)
  chrome.alarms.create('ft-minute-check', {
    delayInMinutes: 1,
    periodInMinutes: 1
  });
}

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'ft-minute-check') {
    checkDueTodos();
    checkPomoTimer();
  }
});

// ── بررسی آلارم‌های سررسید وظایف ───────────────────────────────────────────────
function checkDueTodos() {
  chrome.storage.local.get(['ft3_todos', 'ft_notified'], function(res) {
    var todos    = Array.isArray(res.ft3_todos) ? res.ft3_todos : [];
    var notified = res.ft_notified || {};
    
    var now = new Date();
    var todayStr = getDateStr(0);
    var tomorrowStr = getDateStr(1);
    
    var currentHourMin = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    var dueToday = [], dueTomorrow = [], overdue = [];

    todos.forEach(function(t) {
      if (t.done || !t.due) return;
      
      // اگر کار ساعت دقیق دارد، در بررسی دقیقه چک شود
      var hasTime = !!t.time;
      var isOverdue = false;
      var isToday = false;
      var isTomorrow = false;
      
      if (t.due < todayStr) {
        isOverdue = true;
      } else if (t.due === todayStr) {
        if (hasTime) {
          if (t.time <= currentHourMin) {
            isToday = true;
          }
        } else {
          isToday = true;
        }
      } else if (t.due === tomorrowStr) {
        isTomorrow = true;
      }

      if (isOverdue) overdue.push(t);
      else if (isToday) dueToday.push(t);
      else if (isTomorrow) dueTomorrow.push(t);
    });

    var newNotified = Object.assign({}, notified);
    var shouldShow  = false;

    // ارسال نوتیفیکیشن کارهای امروز
    var unnotifiedToday = dueToday.filter(function(t) {
      var key = t.id + '-today-' + todayStr;
      return !notified[key];
    });

    if (unnotifiedToday.length > 0) {
      sendNotif('ft-today', '📋 یادآوری وظایف امروز',
        unnotifiedToday.slice(0,3).map(function(t) {
          var timePart = t.time ? ' (' + t.time + ')' : '';
          return (t.priority==='high'?'🔴 ':t.priority==='medium'?'🟡 ':'') + t.text + timePart;
        }).join('\n') + (unnotifiedToday.length > 3 ? '\n...و ' + (unnotifiedToday.length-3) + ' مورد دیگر' : '')
      );
      unnotifiedToday.forEach(function(t) {
        newNotified[t.id + '-today-' + todayStr] = true;
      });
      shouldShow = true;
    }

    // ارسال نوتیفیکیشن کارهای فردا (یک‌بار در روز)
    if (dueTomorrow.length > 0 && !notified['tomorrow-' + tomorrowStr]) {
      sendNotif('ft-tomorrow', '⏰ یادآوری کارهای فردا',
        dueTomorrow.slice(0,3).map(function(t) { return '• ' + t.text; }).join('\n')
      );
      newNotified['tomorrow-' + tomorrowStr] = true;
      shouldShow = true;
    }

    // ارسال نوتیفیکیشن کارهای عقب‌افتاده
    var unnotifiedOverdue = overdue.filter(function(t) {
      var key = t.id + '-overdue-' + todayStr;
      return !notified[key];
    });

    if (unnotifiedOverdue.length > 0) {
      sendNotif('ft-overdue', '⚠️ وظایف عقب‌افتاده شما!',
        unnotifiedOverdue.slice(0,3).map(function(t) { return '• ' + t.text + ' (' + t.due + ')'; }).join('\n')
      );
      unnotifiedOverdue.forEach(function(t) {
        newNotified[t.id + '-overdue-' + todayStr] = true;
      });
      shouldShow = true;
    }

    // پاک کردن نوتیفیکیشن‌های قدیمی تر از ۴ روز پیش
    var cutoff = getDateStr(-4);
    Object.keys(newNotified).forEach(function(k) {
      var parts = k.split('-');
      var datePart = parts.slice(1).join('-');
      if (datePart && datePart < cutoff) delete newNotified[k];
    });

    chrome.storage.local.set({ ft_notified: newNotified });

    // ارسال سیگنال لرزش یا بازشدگی به صفحات وب
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

// ── مدیریت پومودورو در بک‌گراند ────────────────────────────────────────────────
function checkPomoTimer() {
  chrome.storage.local.get(['ft_pomo_end', 'ft_pomo_state', 'ft_pomo_mode'], function(r) {
    if (r.ft_pomo_state === 'running' && r.ft_pomo_end) {
      var now = Date.now();
      if (now >= r.ft_pomo_end) {
        // پایان تایمر پومودورو
        var nextMode = r.ft_pomo_mode === 'work' ? 'break' : 'work';
        var msg = r.ft_pomo_mode === 'work' 
          ? '🍅 زمان تمرکز شما به پایان رسید! وقت استراحت است.' 
          : '🍃 زمان استراحت به پایان رسید! آماده تمرکز بعدی هستید؟';
        
        sendNotif('ft-pomo-notif', 'پومودورو FloatTodo', msg);

        // بروزرسانی وضعیت در استوریج
        chrome.storage.local.set({
          ft_pomo_state: 'idle',
          ft_pomo_mode: nextMode,
          ft_pomo_end: null
        }, function() {
          // خبر دادن به تمامی تب‌ها جهت آپدیت پویای تایمر
          chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, { type: 'ft-refresh-ui' }, function() {
                if (chrome.runtime.lastError) {}
              });
              // ارسال سیگنال صوتی پومودورو به تب‌ها جهت بوق زدن
              chrome.tabs.sendMessage(tab.id, { type: 'ft-play-pomo-sound' }, function() {
                if (chrome.runtime.lastError) {}
              });
            });
          });
        });
      }
    }
  });
}

// ── ارسال نوتیفیکیشن‌ها ────────────────────────────────────────────────────────
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

// گوش دادن به دکمه‌های اقدام سریع در نوتیفیکیشن دسکتاپ
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
