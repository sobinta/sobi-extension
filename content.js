// FloatTodo v5 - Content Script

(function () {
  'use strict';
  if (document.getElementById('ft-panel')) return;

  var todos=[], filter='all', sortMode='newest', theme='purple';
  var darkMode=true, searchQ='', isMini=false, tabY=40, editingTodoId=null;

  var THEMES={purple:'#7c6ff7',rose:'#f06292',cyan:'#26c6da',green:'#66bb6a',amber:'#ffa726',red:'#ef5350'};
  var PRI={high:'#ef5350',medium:'#ffa726',low:'#66bb6a',none:'#7c6ff7'};
  var PANEL, TAB;

  // ── Storage ──────────────────────────────────────────────────────────────
  function save() {
    try { chrome.storage.local.set({ft3_todos:todos,ft3_theme:theme,ft3_dark:darkMode,ft3_mini:isMini,ft3_tabY:tabY}); } catch(e){}
  }
  
  function load(cb) {
    try {
      chrome.storage.local.get(['ft3_todos','ft3_theme','ft3_dark','ft3_mini','ft3_tabY'],function(r){
        todos=Array.isArray(r.ft3_todos)?r.ft3_todos:[];
        theme=r.ft3_theme||'purple'; darkMode=r.ft3_dark!==false;
        isMini=r.ft3_mini===true; tabY=typeof r.ft3_tabY==='number'?r.ft3_tabY:40;
        cb();
      });
    } catch(e){cb();}
  }
  
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  // ── Show/Hide ────────────────────────────────────────────────────────────
  function showPanel(){
    isMini=false;
    TAB.style.cssText='position:fixed!important;display:none!important;';
    PANEL.style.cssText='position:fixed!important;bottom:0!important;right:0!important;width:320px!important;max-height:560px!important;display:flex!important;flex-direction:column!important;z-index:2147483647!important;';
    save();
  }
  
  function showTab(){
    isMini=true;
    PANEL.style.cssText='position:fixed!important;display:none!important;';
    TAB.style.cssText=[
      'position:fixed!important',
      'right:0!important',
      'top:'+tabY+'%!important',
      'transform:translateY(-50%)!important',
      'z-index:2147483647!important',
      'display:flex!important',
      'flex-direction:column!important',
      'align-items:center!important',
      'width:14px!important',
      'padding:12px 0!important',
      'border-radius:6px 0 0 6px!important',
      'background:'+( THEMES[theme]||'#7c6ff7')+'!important',
      'cursor:ns-resize!important',
      'user-select:none!important',
      'box-shadow:-2px 0 8px rgba(0,0,0,.35)!important',
      'gap:4px!important',
    ].join(';');
    save();
  }

  // ── Theme ────────────────────────────────────────────────────────────────
  function applyTheme(){
    var c=THEMES[theme]||THEMES.purple;
    PANEL.style.setProperty('--ac',c);
    PANEL.setAttribute('data-dark',darkMode?'1':'0');
    var hdr=document.getElementById('ft-hdr');
    if(hdr) hdr.style.background=c;
    var db=document.getElementById('ft-dark-btn');
    if(db) db.textContent=darkMode?'☀️':'🌙';
    // اگه تب نشونه، رنگش رو آپدیت کن
    if(isMini) TAB.style.background=c+'!important';
    document.querySelectorAll('.ftdot').forEach(function(d){
      d.style.outline=d.dataset.t===theme?'2px solid #fff':'none';
      d.style.outlineOffset='2px';
      d.style.transform=d.dataset.t===theme?'scale(1.25)':'scale(1)';
    });
  }

  // ── List ─────────────────────────────────────────────────────────────────
  function updateProgress(){
    var total=todos.length, done=todos.filter(function(t){return t.done;}).length;
    var active=total-done, pct=total>0?Math.round(done/total*100):0;
    var fill=document.getElementById('ft-pfill'), txt=document.getElementById('ft-ptxt');
    if(fill) fill.style.width=pct+'%';
    if(txt) txt.textContent=total+' وظیفه — '+done+' انجام شده ('+pct+'%)';
    // نشانگر تعداد روی تب
    var dot=document.getElementById('ft-tab-dot');
    if(dot){ dot.style.display=active>0?'block':'none'; }
  }

  function updateFilters(){
    var c=THEMES[theme]||THEMES.purple;
    document.querySelectorAll('.ftfbtn').forEach(function(b){
      var on=b.dataset.f===filter;
      b.classList.toggle('active',on);
      b.style.background=on?c:(darkMode?'#252538':'#e8e8f0');
      b.style.color=on?'#fff':(darkMode?'#aaa':'#555');
    });
  }

  function updateList(){
    var list=document.getElementById('ft-list');
    if(!list) return;
    var items=todos.slice();
    if(filter==='active') items=items.filter(function(t){return !t.done;});
    if(filter==='done')   items=items.filter(function(t){return t.done;});
    if(searchQ){var q=searchQ.toLowerCase();items=items.filter(function(t){return t.text.toLowerCase().indexOf(q)!==-1;});}
    if(sortMode==='priority'){var o={high:0,medium:1,low:2,none:3};items.sort(function(a,b){return(o[a.priority]||3)-(o[b.priority]||3);});}
    else if(sortMode==='due'){items.sort(function(a,b){if(!a.due&&!b.due)return 0;if(!a.due)return 1;if(!b.due)return -1;return new Date(a.due)-new Date(b.due);});}
    else if(sortMode==='alpha'){items.sort(function(a,b){return a.text.localeCompare(b.text,'fa');});}
    else{items.sort(function(a,b){return b.createdAt-a.createdAt;});}
    
    if(!items.length){
      list.innerHTML='<div class="ftempty">'+(searchQ?'🔍 چیزی پیدا نشد':'✨ وظیفه‌ای نداری!')+'</div>';
      return;
    }
    
    list.innerHTML=items.map(function(t){
      var c=PRI[t.priority]||PRI.none, ov=t.due&&!t.done&&new Date(t.due)<new Date();
      return '<div class="ftitem'+(t.done?' ftdone':'')+'" style="border-right:3px solid '+c+'">'+
        '<div class="ftcb'+(t.done?' ftcbon':'')+'" data-chk="'+t.id+'" style="border-color:'+c+';'+(t.done?'background:'+c+';color:#fff;':'')+'">'+( t.done?'✓':'')+
        '</div><div class="ftbody"><div class="fttxt">'+esc(t.text)+'</div>'+
        '<div class="ftmeta">'+
          (t.category?'<span class="fttag">'+esc(t.category)+'</span>':'')+
          (t.priority&&t.priority!=='none'?'<span class="fttag" style="color:'+c+'">'+(t.priority==='high'?'🔴 زیاد':t.priority==='medium'?'🟡 متوسط':'🟢 کم')+'</span>':'')+
          (t.due?'<span class="ftdue'+(ov?' ftov':'')+'">📅 '+t.due+(ov?' ⚠️':'')+'</span>':'')+
        '</div></div>'+
        '<button class="ftedit" data-edt="'+t.id+'">✏️</button>'+
        '<button class="ftdel" data-del="'+t.id+'">✕</button></div>';
    }).join('');
    
    list.querySelectorAll('[data-chk]').forEach(function(el){
      el.addEventListener('click',function(e){e.stopPropagation();
        for(var i=0;i<todos.length;i++){if(todos[i].id===el.dataset.chk){todos[i].done=!todos[i].done;break;}}
        save();updateList();updateProgress();});
    });
    
    list.querySelectorAll('[data-del]').forEach(function(el){
      el.addEventListener('click',function(e){e.stopPropagation();
        todos=todos.filter(function(x){return x.id!==el.dataset.del;});
        if(editingTodoId === el.dataset.del) {
          cancelEditTodo();
        }
        save();updateList();updateProgress();});
    });

    list.querySelectorAll('[data-edt]').forEach(function(el){
      el.addEventListener('click',function(e){e.stopPropagation();
        var todo = todos.find(function(x){return x.id===el.dataset.edt;});
        if(todo) {
          startEditTodo(todo);
        }
      });
    });
  }

  // ── Edit Mode Logic ──────────────────────────────────────────────────────
  function startEditTodo(todo) {
    editingTodoId = todo.id;
    var inp = document.getElementById('ft-inp');
    var pri = document.getElementById('ft-pri');
    var cat = document.getElementById('ft-cat');
    var due = document.getElementById('ft-due');
    var addBtn = document.getElementById('ft-addbtn');
    
    if (inp) inp.value = todo.text;
    if (pri) pri.value = todo.priority || 'none';
    
    if (cat) {
      // چک کردن وجود مقدار دسته‌بندی در لیست، در غیر این‌صورت درج پویای آن
      var exists = false;
      for (var i = 0; i < cat.options.length; i++) {
        if (cat.options[i].value === todo.category) {
          exists = true;
          break;
        }
      }
      if (!exists && todo.category) {
        var opt = document.createElement('option');
        opt.value = todo.category;
        opt.textContent = todo.category;
        cat.insertBefore(opt, cat.lastElementChild);
      }
      cat.value = todo.category || '';
    }
    
    if (due) due.value = todo.due || '';
    if (addBtn) addBtn.innerHTML = '💾'; // تغییر دکمه افزودن به دکمه دیسک/ذخیره
    if (inp) inp.focus();
  }

  function cancelEditTodo() {
    editingTodoId = null;
    var addBtn = document.getElementById('ft-addbtn');
    if (addBtn) addBtn.innerHTML = '+';
    
    var inp = document.getElementById('ft-inp');
    if (inp) inp.value = '';
    if (document.getElementById('ft-pri')) document.getElementById('ft-pri').value = 'none';
    if (document.getElementById('ft-cat')) document.getElementById('ft-cat').value = '';
    if (document.getElementById('ft-due')) document.getElementById('ft-due').value = '';
  }

  function saveTodo(){
    var inp=document.getElementById('ft-inp'), txt=inp?inp.value.trim():'';
    if(!txt) return;

    var priVal = (document.getElementById('ft-pri')||{}).value||'none';
    var catVal = (document.getElementById('ft-cat')||{}).value||'';
    var dueVal = (document.getElementById('ft-due')||{}).value||'';

    if (editingTodoId) {
      // حالت ویرایش
      for (var i = 0; i < todos.length; i++) {
        if (todos[i].id === editingTodoId) {
          todos[i].text = txt;
          todos[i].priority = priVal;
          todos[i].category = catVal;
          todos[i].due = dueVal;
          break;
        }
      }
      editingTodoId = null;
      var addBtn = document.getElementById('ft-addbtn');
      if (addBtn) addBtn.innerHTML = '+';
    } else {
      // حالت ایجاد جدید
      todos.unshift({
        id:Math.random().toString(36).slice(2),
        text:txt,
        done:false,
        priority:priVal,
        category:catVal,
        due:dueVal,
        createdAt:Date.now()
      });
    }

    if(inp) inp.value='';
    if(document.getElementById('ft-pri')) document.getElementById('ft-pri').value='none';
    if(document.getElementById('ft-cat')) document.getElementById('ft-cat').value='';
    if(document.getElementById('ft-due')) document.getElementById('ft-due').value='';

    save();updateList();updateProgress();
  }

  // ── Build ────────────────────────────────────────────────────────────────
  function build(){
    // ── تب کناری ─────────────────────────────────────────────────────────
    TAB=document.createElement('div');
    TAB.id='ft-tab';
    // یه نقطه قرمز کوچیک برای نشون دادن وظیفه باقیمانده
    var dot=document.createElement('span');
    dot.id='ft-tab-dot';
    dot.style.cssText='width:6px;height:6px;border-radius:50%;background:#ef5350;display:none;flex-shrink:0;';
    TAB.appendChild(dot);
    document.body.appendChild(TAB);

    // drag تب — تشخیص drag از click
    var startY, startTopPx, moved;
    TAB.addEventListener('mousedown',function(e){
      if(e.button!==0) return;
      e.preventDefault();
      e.stopPropagation();
      startY=e.clientY;
      startTopPx=TAB.getBoundingClientRect().top+TAB.getBoundingClientRect().height/2;
      moved=false;

      function onMove(e2){
        var dy=e2.clientY-startY;
        if(Math.abs(dy)>3) moved=true;
        if(moved){
          var newCenter=startTopPx+dy;
          var pct=Math.max(5,Math.min(90,newCenter/window.innerHeight*100));
          tabY=pct;
          TAB.style.top=pct+'%';
        }
      }
      
      function onUp(){
        document.removeEventListener('mousemove',onMove,true);
        document.removeEventListener('mouseup',onUp,true);
        if(moved){
          save();
        } else {
          // کلیک — باز کردن پنل
          showPanel();applyTheme();updateList();updateProgress();updateFilters();
        }
      }
      document.addEventListener('mousemove',onMove,true);
      document.addEventListener('mouseup',onUp,true);
    });

    // ── پنل اصلی ─────────────────────────────────────────────────────────
    PANEL=document.createElement('div');
    PANEL.id='ft-panel';
    PANEL.setAttribute('data-dark','1');
    PANEL.innerHTML=
      '<div id="ft-hdr">'+
        '<span style="color:#fff;font-weight:700;font-size:14px;font-family:Tahoma,sans-serif">📋 Float Todo</span>'+
        '<div style="display:flex;gap:6px">'+
          '<button class="fthbtn" id="ft-dark-btn">☀️</button>'+
          '<button class="fthbtn" id="ft-mini-btn" title="کوچیک کردن">⊟</button>'+
        '</div>'+
      '</div>'+
      '<div id="ft-trow">'+
        Object.entries(THEMES).map(function(e){return '<span class="ftdot" data-t="'+e[0]+'" style="background:'+e[1]+'"></span>';}).join('')+
      '</div>'+
      '<div id="ft-filters">'+
        '<button class="ftfbtn active" data-f="all">همه</button>'+
        '<button class="ftfbtn" data-f="active">باقی‌مانده</button>'+
        '<button class="ftfbtn" data-f="done">انجام‌شده</button>'+
      '</div>'+
      '<div id="ft-addrow">'+
        '<input id="ft-inp" type="text" placeholder="وظیفه جدید..." autocomplete="off"/>'+
        '<button id="ft-addbtn">+</button>'+
      '</div>'+
      '<div id="ft-opts">'+
        '<select id="ft-pri"><option value="none">اولویت</option><option value="high">🔴 زیاد</option><option value="medium">🟡 متوسط</option><option value="low">🟢 کم</option></select>'+
        '<select id="ft-cat"><option value="">دسته</option><option value="کار">کار</option><option value="شخصی">شخصی</option><option value="خرید">خرید</option><option value="تحصیل">تحصیل</option><option value="custom">دیگر...</option></select>'+
        '<input id="ft-due" type="date"/>'+
      '</div>'+
      '<input id="ft-srch" type="text" placeholder="🔍 جستجو..." autocomplete="off"/>'+
      '<div id="ft-prog"><div id="ft-pbar"><div id="ft-pfill"></div></div><div id="ft-ptxt"></div></div>'+
      '<div id="ft-list"></div>'+
      '<div id="ft-foot">'+
        '<button id="ft-clr">🗑 پاک کردن انجام‌شده</button>'+
        '<select id="ft-srt"><option value="newest">جدیدترین</option><option value="priority">اولویت</option><option value="due">سررسید</option><option value="alpha">الفبا</option></select>'+
      '</div>';
    document.body.appendChild(PANEL);

    // events
    document.getElementById('ft-mini-btn').addEventListener('click',function(e){e.stopPropagation();showTab();});
    document.getElementById('ft-dark-btn').addEventListener('click',function(e){e.stopPropagation();darkMode=!darkMode;applyTheme();save();});
    PANEL.querySelectorAll('.ftdot').forEach(function(d){d.addEventListener('click',function(e){e.stopPropagation();theme=d.dataset.t;applyTheme();save();});});
    PANEL.querySelectorAll('.ftfbtn').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();filter=b.dataset.f;updateFilters();updateList();});});
    document.getElementById('ft-addbtn').addEventListener('click',function(e){e.stopPropagation();saveTodo();});
    document.getElementById('ft-inp').addEventListener('keydown',function(e){e.stopPropagation();if(e.key==='Enter')saveTodo();});
    document.getElementById('ft-srch').addEventListener('input',function(){searchQ=this.value;updateList();});
    document.getElementById('ft-srt').addEventListener('change',function(){sortMode=this.value;updateList();});
    document.getElementById('ft-clr').addEventListener('click',function(e){e.stopPropagation();todos=todos.filter(function(t){return !t.done;});save();updateList();updateProgress();});
    PANEL.querySelectorAll('input,select,button').forEach(function(el){el.addEventListener('click',function(e){e.stopPropagation();});});
    
    // دکمه انتخاب دسته‌بندی با قابلیت درج دستی دیگر گزینه‌ها
    document.getElementById('ft-cat').addEventListener('change', function(e) {
      if (this.value === 'custom') {
        var customVal = prompt('نام دسته جدید را وارد کنید:');
        if (customVal && customVal.trim()) {
          var cleanVal = customVal.trim();
          var opt = document.createElement('option');
          opt.value = cleanVal;
          opt.textContent = cleanVal;
          this.insertBefore(opt, this.lastElementChild);
          this.value = cleanVal;
        } else {
          this.value = '';
        }
      }
    });

    try {
      chrome.runtime.onMessage.addListener(function(msg){
        if(msg && msg.type === 'ft-show-btn'){
          showPanel();applyTheme();updateList();updateProgress();updateFilters();
        } else if (msg && msg.type === 'ft-refresh-ui') {
          load(function() {
            updateList();updateProgress();
          });
        }
      });
    } catch(e){}

    if(isMini){showTab();}else{showPanel();}
    applyTheme();updateList();updateProgress();updateFilters();
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init(){
    if(document.getElementById('ft-panel')) return;
    if(!document.body){setTimeout(init,150);return;}
    load(function(){build();});
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}
})();
