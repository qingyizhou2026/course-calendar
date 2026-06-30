// 数据存储管理
const STORAGE_KEY = 'course-calendar-lessons-v1';
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
let current = new Date();
current.setDate(1);
let lessons = loadLessons();
let editingId = null;

// DOM 元素
const calendar = document.getElementById('calendar');
const monthTitle = document.getElementById('monthTitle');
const form = document.getElementById('lessonForm');
const lessonDate = document.getElementById('lessonDate');
const studentName = document.getElementById('studentName');
const courseName = document.getElementById('courseName');
const lessonTime = document.getElementById('lessonTime');
const lessonDuration = document.getElementById('lessonDuration');
const lessonNote = document.getElementById('lessonNote');
const submitLesson = document.getElementById('submitLesson');
const editHint = document.getElementById('editHint');
const stats = document.getElementById('stats');
const records = document.getElementById('records');
const exportBtn = document.getElementById('exportData');
const importBtn = document.getElementById('importData');
const fileInput = document.getElementById('fileInput');

// 初始化
lessonDate.value = toDateInput(new Date());

// 事件监听
document.getElementById('prevMonth').addEventListener('click', () => {
  current.setMonth(current.getMonth() - 1);
  render();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  current.setMonth(current.getMonth() + 1);
  render();
});

document.getElementById('clearForm').addEventListener('click', resetForm);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const item = getFormItem(editingId || createId());
  if (!item.date || !item.course) return;

  if (editingId) {
    lessons = lessons.map(existing => existing.id === editingId ? item : existing);
  } else {
    lessons.push(item);
  }

  saveLessons();
  resetForm(item.date);
  render();
});

// 导出数据
exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify({
    version: '1.0',
    exportDate: new Date().toISOString(),
    lessons: lessons
  }, null, 2);

  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `课程日历-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert('数据已导出成功！');
});

// 导入数据
importBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (!data.lessons || !Array.isArray(data.lessons)) {
        throw new Error('数据格式不正确');
      }

      const confirmed = confirm(
        `确定要导入数据吗？\n\n` +
        `当前数据：${lessons.length} 条记录\n` +
        `导入数据：${data.lessons.length} 条记录\n\n` +
        `选择"确定"将替换当前所有数据，选择"取消"将取消导入。`
      );

      if (confirmed) {
        lessons = data.lessons;
        saveLessons();
        render();
        alert('数据导入成功！');
      }
    } catch (error) {
      alert('导入失败：' + error.message);
    }

    fileInput.value = '';
  };

  reader.readAsText(file);
});

// 数据操作函数
function loadLessons() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLessons() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function getFormItem(id) {
  return {
    id,
    date: lessonDate.value,
    student: studentName.value,
    course: courseName.value.trim(),
    time: lessonTime.value.trim(),
    duration: lessonDuration.value,
    note: lessonNote.value.trim()
  };
}

function resetForm(dateValue = toDateInput(new Date())) {
  editingId = null;
  form.reset();
  studentName.value = '悠悠';
  lessonDuration.value = '1';
  lessonDate.value = dateValue;
  submitLesson.textContent = '添加课程';
  editHint.hidden = true;
}

function editLesson(item) {
  editingId = item.id;
  lessonDate.value = item.date;
  studentName.value = item.student || '';
  courseName.value = item.course;
  lessonTime.value = item.time || '';
  lessonDuration.value = item.duration || '1';
  lessonNote.value = item.note || '';
  submitLesson.textContent = '保存修改';
  editHint.hidden = false;
  courseName.focus();
}

function toDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 渲染函数
function render() {
  renderCalendar();
  renderStats();
  renderRecords();
}

function renderCalendar() {
  calendar.innerHTML = '';

  // 渲染星期标题
  weekdays.forEach(day => {
    const el = document.createElement('div');
    el.className = 'weekday';
    el.textContent = day;
    calendar.appendChild(el);
  });

  const year = current.getFullYear();
  const month = current.getMonth();
  monthTitle.textContent = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const todayText = toDateInput(new Date());

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'day';
    let dayNumber;
    let cellDate;

    if (i < firstDay) {
      dayNumber = prevDays - firstDay + i + 1;
      cell.classList.add('muted');
      cellDate = toDateInput(new Date(year, month - 1, dayNumber));
    } else if (i >= firstDay + daysInMonth) {
      dayNumber = i - firstDay - daysInMonth + 1;
      cell.classList.add('muted');
      cellDate = toDateInput(new Date(year, month + 1, dayNumber));
    } else {
      dayNumber = i - firstDay + 1;
      cellDate = toDateInput(new Date(year, month, dayNumber));
    }

    if (cellDate === todayText) cell.classList.add('today');

    const dateRow = document.createElement('div');
    dateRow.className = 'date-row';
    dateRow.innerHTML = `<span>${dayNumber}</span>`;

    const addBtn = document.createElement('button');
    addBtn.className = 'add-mini';
    addBtn.type = 'button';
    addBtn.textContent = '+';
    addBtn.title = '在这一天添加课程';
    addBtn.addEventListener('click', () => {
      lessonDate.value = cellDate;
      courseName.focus();
    });
    dateRow.appendChild(addBtn);
    cell.appendChild(dateRow);

    lessons
      .filter(item => item.date === cellDate)
      .sort((a, b) => a.time.localeCompare(b.time, 'zh-CN'))
      .forEach(item => {
        const lesson = document.createElement('div');
        lesson.className = 'lesson';
        lesson.innerHTML = `<strong>${item.student ? escapeHtml(item.student) + ' · ' : ''}${escapeHtml(item.course)}</strong>${item.time ? escapeHtml(item.time) : '未填写时间'} · ${formatDuration(item.duration)}`;
        if (item.note) lesson.title = item.note;
        cell.appendChild(lesson);
      });

    calendar.appendChild(cell);
  }
}

function renderStats() {
  const counts = lessons.reduce((map, item) => {
    map[item.course] = (map[item.course] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) =>
    b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN')
  );

  stats.innerHTML = entries.length ? '' : '<div class="empty">还没有课程记录</div>';

  entries.forEach(([name, count]) => {
    const el = document.createElement('div');
    el.className = 'stat-item';
    el.innerHTML = `<strong>${escapeHtml(name)}</strong><span class="count">${count} 次</span>`;
    stats.appendChild(el);
  });
}

function renderRecords() {
  const sorted = [...lessons].sort((a, b) =>
    a.course.localeCompare(b.course, 'zh-CN') ||
    a.date.localeCompare(b.date) ||
    (a.time || '').localeCompare(b.time || '', 'zh-CN')
  );

  records.innerHTML = sorted.length ? '' : '<div class="empty">暂无记录</div>';

  const grouped = sorted.reduce((map, item) => {
    if (!map[item.course]) map[item.course] = [];
    map[item.course].push(item);
    return map;
  }, {});

  Object.entries(grouped).forEach(([course, items]) => {
    const group = document.createElement('section');
    group.className = 'subject-group';
    group.innerHTML = `<div class="subject-header"><h3>${escapeHtml(course)}</h3><span class="count">${items.length} 次</span></div>`;

    const list = document.createElement('div');
    list.className = 'subject-items';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'record-item';
      const note = item.note ? `<br><small>${escapeHtml(item.note)}</small>` : '';
      el.innerHTML = `<div><strong>${item.student ? escapeHtml(item.student) + ' · ' : ''}${escapeHtml(item.course)}</strong><br><small>${item.date}${item.time ? ' ' + escapeHtml(item.time) : ' 未填写时间'} · ${formatDuration(item.duration)}</small>${note}</div>`;

      const actions = document.createElement('div');
      actions.className = 'record-actions';

      const edit = document.createElement('button');
      edit.className = 'secondary';
      edit.type = 'button';
      edit.textContent = '编辑';
      edit.addEventListener('click', () => editLesson(item));

      const del = document.createElement('button');
      del.className = 'danger';
      del.type = 'button';
      del.textContent = '删除';
      del.addEventListener('click', () => {
        if (!confirm('确定删除这条课程记录吗？')) return;
        lessons = lessons.filter(x => x.id !== item.id);
        if (editingId === item.id) resetForm();
        saveLessons();
        render();
      });

      actions.appendChild(edit);
      actions.appendChild(del);
      el.appendChild(actions);
      list.appendChild(el);
    });

    group.appendChild(list);
    records.appendChild(group);
  });
}

// 工具函数
function formatDuration(duration) {
  return `${escapeHtml(duration || '1')} 小时`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[ch]));
}

// 初始渲染
render();
