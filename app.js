// HouseBusiness - Vanilla JS App
// All data stored in localStorage

let tasks = [];
let expenses = [];
let currentFilter = 'all';
let currentMonth = new Date();
let currentEditingTaskId = null;
let currentEditingExpenseId = null;

// ==================== UTILS ====================
function saveToStorage() {
    localStorage.setItem('hb_tasks', JSON.stringify(tasks));
    localStorage.setItem('hb_expenses', JSON.stringify(expenses));
}

function loadFromStorage() {
    const savedTasks = localStorage.getItem('hb_tasks');
    const savedExpenses = localStorage.getItem('hb_expenses');
    
    if (savedTasks) tasks = JSON.parse(savedTasks);
    if (savedExpenses) expenses = JSON.parse(savedExpenses);
    
    // Seed demo data if empty
    if (tasks.length === 0 && expenses.length === 0) {
        seedDemoData();
    }
}

function seedDemoData() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    tasks = [
        {
            id: Date.now(),
            title: "Nettoyer la cuisine",
            dueDate: today.toISOString().split('T')[0],
            priority: "high",
            recurring: true,
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 1,
            title: "Aspirer le salon",
            dueDate: tomorrow.toISOString().split('T')[0],
            priority: "medium",
            recurring: false,
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            title: "Changer filtre à eau",
            dueDate: nextWeek.toISOString().split('T')[0],
            priority: "low",
            recurring: true,
            completed: true,
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            title: "Payer facture électricité",
            dueDate: today.toISOString().split('T')[0],
            priority: "high",
            recurring: true,
            completed: false,
            createdAt: new Date().toISOString()
        }
    ];
    
    expenses = [
        {
            id: Date.now() + 10,
            description: "Courses Carrefour",
            amount: 68.45,
            category: "Courses",
            date: today.toISOString().split('T')[0]
        },
        {
            id: Date.now() + 11,
            description: "Facture Internet",
            amount: 32.90,
            category: "Logement",
            date: today.toISOString().split('T')[0]
        },
        {
            id: Date.now() + 12,
            description: "Ampoules LED",
            amount: 18.75,
            category: "Entretien",
            date: tomorrow.toISOString().split('T')[0]
        },
        {
            id: Date.now() + 13,
            description: "Restaurant",
            amount: 42.00,
            category: "Loisirs",
            date: nextWeek.toISOString().split('T')[0]
        }
    ];
    
    saveToStorage();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
    });
}

function getPriorityColor(priority) {
    if (priority === 'high') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (priority === 'medium') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
}

function getPriorityLabel(priority) {
    if (priority === 'high') return 'Haute';
    if (priority === 'medium') return 'Moyenne';
    return 'Basse';
}

// ==================== NAVIGATION ====================
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    
    // Show target
    document.getElementById(section).classList.add('active');
    
    // Update nav buttons
    document.querySelectorAll('[id^="nav-"]').forEach(el => {
        el.classList.remove('nav-active');
        if (el.id === `nav-${section}`) {
            el.classList.add('nav-active');
        }
    });
    
    // Refresh content
    if (section === 'dashboard') {
        renderDashboard();
    } else if (section === 'tasks') {
        renderTasks();
    } else if (section === 'expenses') {
        renderExpenses();
    } else if (section === 'calendar') {
        renderCalendar();
    }
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    // Stats
    const dueTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    
    document.getElementById('dash-tasks-due').innerHTML = dueTasks.length;
    document.getElementById('dash-tasks-progress').innerHTML = `${progress}%`;
    
    // Expenses this month
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr));
    const totalMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    document.getElementById('dash-expenses-month').innerHTML = totalMonth.toFixed(0) + ' €';
    document.getElementById('dash-recurring').innerHTML = tasks.filter(t => t.recurring).length;
    
    const upcoming = tasks.filter(t => {
        if (!t.dueDate || t.completed) return false;
        const due = new Date(t.dueDate);
        const diffDays = Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    }).length;
    
    document.getElementById('dash-upcoming').innerHTML = upcoming;
    
    // Upcoming tasks list
    renderDashboardUpcoming();
}

function renderDashboardUpcoming() {
    const container = document.getElementById('dashboard-upcoming-list');
    container.innerHTML = '';
    
    const upcoming = [...tasks]
        .filter(t => !t.completed && t.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 4);
    
    if (upcoming.length === 0) {
        container.innerHTML = `<div class="text-sm text-slate-400 px-4 py-2">Aucune tâche à venir</div>`;
        return;
    }
    
    upcoming.forEach(task => {
        const div = document.createElement('div');
        div.className = `flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer text-sm`;
        div.innerHTML = `
            <div class="flex items-center gap-x-3">
                <div class="w-2.5 h-2.5 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}"></div>
                <div>
                    <div class="font-medium">${task.title}</div>
                    <div class="text-xs text-slate-500">${formatDate(task.dueDate)}</div>
                </div>
            </div>
            <div onclick="event.stopImmediatePropagation(); toggleTaskComplete(${task.id}, event)" class="text-emerald-600 hover:text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7 7 7" />
                </svg>
            </div>
        `;
        div.onclick = () => showSection('tasks');
        container.appendChild(div);
    });
}

// ==================== TASKS ====================
function renderTasks(filter = currentFilter) {
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';
    
    let filtered = tasks;
    
    if (filter === 'due') {
        filtered = tasks.filter(t => !t.completed);
    } else if (filter === 'done') {
        filtered = tasks.filter(t => t.completed);
    }
    
    // Sort by due date + priority
    filtered.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = `px-8 py-10 text-center`;
        empty.innerHTML = `
            <div class="text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 5H7a2 2 0 01-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 01-2-2h-2M9 5a2 2 0 002 2" />
                </svg>
                <p class="text-sm">Aucune tâche trouvée.</p>
            </div>
        `;
        container.appendChild(empty);
        return;
    }
    
    filtered.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card px-6 py-4 flex items-center justify-between group ${task.completed ? 'task-done' : ''}`;
        
        const priorityClass = getPriorityColor(task.priority);
        
        taskEl.innerHTML = `
            <div class="flex items-center gap-x-4 flex-1 min-w-0">
                <div onclick="event.stopImmediatePropagation(); toggleTaskComplete(${task.id}, event)" 
                     class="flex-shrink-0 w-6 h-6 border-2 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'} rounded-xl flex items-center justify-center cursor-pointer transition-all">
                    ${task.completed ? 
                        `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 10l7-7 7 7" />
                        </svg>` : ''}
                </div>
                
                <div class="min-w-0 flex-1">
                    <div class="font-medium truncate">${task.title}</div>
                    <div class="flex items-center gap-x-2 mt-1 text-xs">
                        ${task.dueDate ? 
                            `<span class="text-slate-500">${formatDate(task.dueDate)}</span>` : ''}
                        <span class="pill ${priorityClass}">${getPriorityLabel(task.priority)}</span>
                        ${task.recurring ? 
                            `<span class="text-violet-500 dark:text-violet-400 text-[10px] flex items-center gap-x-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.058 11H1M12 3v2m0 16v2m9-9H15m-6 0a8.002 8.002 0 01-7.464 4.5" /></svg>
                            </span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopImmediatePropagation(); editTask(${task.id})" 
                        class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
                <button onclick="event.stopImmediatePropagation(); deleteTask(${task.id})" 
                        class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-2xl text-slate-400 hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.595-1.858L5 7m5 4v6m4-6v6m1-10V9a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M5 7h14" />
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(taskEl);
    });
}

function filterTasks(filter) {
    currentFilter = filter;
    
    // Update buttons
    document.getElementById('filter-all').classList.remove('active-filter', 'bg-sky-600', 'text-white');
    document.getElementById('filter-due').classList.remove('active-filter', 'bg-sky-600', 'text-white');
    document.getElementById('filter-done').classList.remove('active-filter', 'bg-sky-600', 'text-white');
    
    let btnId = 'filter-all';
    if (filter === 'due') btnId = 'filter-due';
    else if (filter === 'done') btnId = 'filter-done';
    
    const activeBtn = document.getElementById(btnId);
    activeBtn.classList.add('active-filter', 'bg-sky-600', 'text-white');
    
    renderTasks(filter);
}

function toggleTaskComplete(id, event) {
    if (event) event.stopImmediatePropagation();
    
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    task.completed = !task.completed;
    
    saveToStorage();
    renderTasks(currentFilter);
    renderDashboard();
    
    // If on dashboard, refresh it too
    if (document.getElementById('dashboard').classList.contains('active')) {
        renderDashboard();
    }
}

function showAddTaskModal() {
    currentEditingTaskId = null;
    document.getElementById('task-modal-title').innerText = 'Nouvelle tâche';
    
    // Reset form
    document.getElementById('task-title').value = '';
    document.getElementById('task-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('task-priority').value = 'medium';
    document.getElementById('task-recurring').checked = false;
    
    document.getElementById('task-modal').classList.remove('hidden');
    document.getElementById('task-modal').classList.add('flex');
    
    setTimeout(() => {
        document.getElementById('task-title').focus();
    }, 200);
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    currentEditingTaskId = id;
    document.getElementById('task-modal-title').innerText = 'Modifier la tâche';
    
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-date').value = task.dueDate || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-recurring').checked = task.recurring || false;
    
    document.getElementById('task-modal').classList.remove('hidden');
    document.getElementById('task-modal').classList.add('flex');
}

function hideTaskModal() {
    document.getElementById('task-modal').classList.remove('flex');
    document.getElementById('task-modal').classList.add('hidden');
    currentEditingTaskId = null;
}

function saveTask() {
    const title = document.getElementById('task-title').value.trim();
    if (!title) {
        alert('Veuillez saisir un titre');
        return;
    }
    
    const dueDate = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;
    const recurring = document.getElementById('task-recurring').checked;
    
    if (currentEditingTaskId) {
        // Edit
        const task = tasks.find(t => t.id === currentEditingTaskId);
        if (task) {
            task.title = title;
            task.dueDate = dueDate;
            task.priority = priority;
            task.recurring = recurring;
        }
    } else {
        // Create
        tasks.unshift({
            id: Date.now(),
            title,
            dueDate,
            priority,
            recurring,
            completed: false,
            createdAt: new Date().toISOString()
        });
    }
    
    saveToStorage();
    hideTaskModal();
    
    // Refresh current view
    if (document.getElementById('tasks').classList.contains('active')) {
        renderTasks(currentFilter);
    } else {
        renderDashboard();
    }
}

function deleteTask(id) {
    if (!confirm('Supprimer cette tâche ?')) return;
    
    tasks = tasks.filter(t => t.id !== id);
    saveToStorage();
    
    if (document.getElementById('tasks').classList.contains('active')) {
        renderTasks(currentFilter);
    } else {
        renderDashboard();
    }
}

// ==================== EXPENSES ====================
function renderExpenses() {
    const tbody = document.getElementById('expenses-list');
    tbody.innerHTML = '';
    
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedExpenses.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" class="px-6 py-10 text-center text-slate-400">Aucune dépense enregistrée.</td>`;
        tbody.appendChild(row);
        return;
    }
    
    sortedExpenses.forEach(exp => {
        const row = document.createElement('tr');
        row.className = `data-table`;
        
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-slate-500">${formatDate(exp.date)}</td>
            <td class="px-6 py-4 font-medium">${exp.description}</td>
            <td class="px-6 py-4">
                <span class="px-3 py-px text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">${exp.category}</span>
            </td>
            <td class="px-6 py-4 font-semibold text-right">${exp.amount.toFixed(2)} €</td>
            <td class="px-4 py-4">
                <div class="flex justify-end gap-x-1">
                    <button onclick="editExpense(${exp.id}); event.stopImmediatePropagation()" class="text-slate-400 hover:text-sky-600 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onclick="deleteExpense(${exp.id}); event.stopImmediatePropagation()" class="text-slate-400 hover:text-red-600 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.595-1.858L5 7m5 4v6m4-6v6m1-10V9a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M5 7h14" /></svg>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update summary
    updateExpensesSummary();
}

function updateExpensesSummary() {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonthStr));
    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    document.getElementById('expenses-total-month').innerHTML = total.toFixed(0) + ' €';
    document.getElementById('expenses-count').innerHTML = monthExpenses.length;
    document.getElementById('expenses-per-person').innerHTML = (total / 2).toFixed(0) + ' €';
    
    // Breakdown by category
    const breakdownContainer = document.getElementById('expenses-breakdown');
    breakdownContainer.innerHTML = '';
    
    const categories = {};
    monthExpenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    
    Object.keys(categories).forEach(cat => {
        const percent = total > 0 ? Math.round((categories[cat] / total) * 100) : 0;
        const div = document.createElement('div');
        div.className = 'flex justify-between text-xs items-center';
        div.innerHTML = `
            <span class="text-slate-600 dark:text-slate-400">${cat}</span>
            <div class="flex items-center gap-x-2">
                <span class="font-medium">${categories[cat].toFixed(0)} €</span>
                <span class="text-[10px] px-1.5 py-px bg-slate-100 dark:bg-slate-700 rounded">${percent}%</span>
            </div>
        `;
        breakdownContainer.appendChild(div);
    });
}

function showAddExpenseModal() {
    currentEditingExpenseId = null;
    
    document.getElementById('expense-desc').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-category').value = 'Courses';
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('expense-modal').classList.remove('hidden');
    document.getElementById('expense-modal').classList.add('flex');
    
    setTimeout(() => {
        document.getElementById('expense-desc').focus();
    }, 200);
}

function editExpense(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;
    
    currentEditingExpenseId = id;
    
    document.getElementById('expense-desc').value = exp.description;
    document.getElementById('expense-amount').value = exp.amount;
    document.getElementById('expense-category').value = exp.category;
    document.getElementById('expense-date').value = exp.date;
    
    document.getElementById('expense-modal').classList.remove('hidden');
    document.getElementById('expense-modal').classList.add('flex');
}

function hideExpenseModal() {
    document.getElementById('expense-modal').classList.remove('flex');
    document.getElementById('expense-modal').classList.add('hidden');
    currentEditingExpenseId = null;
}

function saveExpense() {
    const desc = document.getElementById('expense-desc').value.trim();
    const amountStr = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    
    if (!desc || !amountStr || !date) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    const amount = parseFloat(amountStr);
    
    if (currentEditingExpenseId) {
        const exp = expenses.find(e => e.id === currentEditingExpenseId);
        if (exp) {
            exp.description = desc;
            exp.amount = amount;
            exp.category = category;
            exp.date = date;
        }
    } else {
        expenses.unshift({
            id: Date.now(),
            description: desc,
            amount,
            category,
            date
        });
    }
    
    saveToStorage();
    hideExpenseModal();
    
    if (document.getElementById('expenses').classList.contains('active')) {
        renderExpenses();
    } else {
        renderDashboard();
    }
}

function deleteExpense(id) {
    if (!confirm('Supprimer cette dépense ?')) return;
    
    expenses = expenses.filter(e => e.id !== id);
    saveToStorage();
    
    if (document.getElementById('expenses').classList.contains('active')) {
        renderExpenses();
    } else {
        renderDashboard();
    }
}

// ==================== CALENDAR ====================
let calendarDate = new Date();

function renderCalendar() {
    const monthEl = document.getElementById('calendar-month');
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    monthEl.innerHTML = calendarDate.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    // Weekday headers
    const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    weekdays.forEach(day => {
        const header = document.createElement('div');
        header.className = `text-center text-xs py-2 font-medium text-slate-400`;
        header.innerHTML = day;
        grid.appendChild(header);
    });
    
    // First day of month
    const firstDay = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Monday first
    
    // Previous month days
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const dayEl = createCalendarDay(dayNum, true);
        grid.appendChild(dayEl);
    }
    
    // Current month days
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        
        const dayEl = createCalendarDay(day, false, isToday, dateStr);
        grid.appendChild(dayEl);
    }
    
    // Fill remaining days
    const totalCells = 42;
    const currentCells = adjustedFirstDay + daysInMonth;
    const remaining = totalCells - currentCells;
    
    for (let i = 1; i <= remaining; i++) {
        const dayEl = createCalendarDay(i, true);
        grid.appendChild(dayEl);
    }
    
    // Upcoming list
    renderCalendarUpcoming();
}

function createCalendarDay(dayNum, isOtherMonth, isToday = false, dateStr = null) {
    const div = document.createElement('div');
    div.className = `aspect-square flex items-center justify-center text-sm rounded-2xl cursor-pointer transition-colors relative
        ${isOtherMonth ? 'text-slate-300 dark:text-slate-700' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
        ${isToday ? 'bg-sky-600 text-white font-semibold' : ''}`;
    
    div.innerHTML = `<span>${dayNum}</span>`;
    
    if (!isOtherMonth && dateStr) {
        // Count tasks on this day
        const dayTasks = tasks.filter(t => t.dueDate === dateStr && !t.completed);
        if (dayTasks.length > 0) {
            const badge = document.createElement('div');
            badge.className = `absolute bottom-1 right-1 text-[9px] px-1.5 leading-none py-px font-medium rounded bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300`;
            badge.innerText = dayTasks.length;
            div.appendChild(badge);
        }
        
        div.onclick = () => {
            // Show tasks for this date
            showSection('tasks');
            currentFilter = 'all';
            // Could filter further but for simplicity we just navigate
        };
    }
    
    return div;
}

function renderCalendarUpcoming() {
    const container = document.getElementById('calendar-upcoming-list');
    container.innerHTML = '';
    
    const upcoming = [...tasks]
        .filter(t => !t.completed && t.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = `<div class="px-3 py-3 text-xs text-slate-400">Aucune échéance à venir.</div>`;
        return;
    }
    
    upcoming.forEach(task => {
        const item = document.createElement('div');
        item.className = `flex items-center px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl gap-x-4 cursor-pointer`;
        item.innerHTML = `
            <div class="flex-1 flex items-center gap-x-3">
                <div class="font-medium">${task.title}</div>
                <div class="text-xs px-2 py-px bg-slate-100 dark:bg-slate-700 rounded text-slate-500">${formatDate(task.dueDate)}</div>
            </div>
            <div class="pill ${getPriorityColor(task.priority)} text-xs">${getPriorityLabel(task.priority)}</div>
        `;
        item.onclick = () => {
            showSection('tasks');
        };
        container.appendChild(item);
    });
}

function prevMonth() {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    calendarDate = new Date();
    renderCalendar();
}

// ==================== QUICK ACTIONS ====================
function quickAddTask() {
    showAddTaskModal();
}

function quickAddExpense() {
    showAddExpenseModal();
}

// ==================== DARK MODE ====================
function toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    
    const isDark = html.classList.contains('dark');
    localStorage.setItem('hb_dark_mode', isDark ? 'true' : 'false');
    
    // Update icons visibility
    updateDarkModeIcons();
}

function updateDarkModeIcons() {
    const sun = document.getElementById('sun-icon');
    const moon = document.getElementById('moon-icon');
    
    if (!sun || !moon) return;
    
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
        sun.classList.remove('hidden');
        sun.classList.add('block');
        moon.classList.add('hidden');
        moon.classList.remove('block');
    } else {
        sun.classList.add('hidden');
        sun.classList.remove('block');
        moon.classList.remove('hidden');
        moon.classList.add('block');
    }
}

function initDarkMode() {
    const saved = localStorage.getItem('hb_dark_mode');
    if (saved === 'true') {
        document.documentElement.classList.add('dark');
    } else if (saved === null) {
        // Default: follow system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        }
    }
    
    updateDarkModeIcons();
}

// ==================== KEYBOARD SHORTCUTS ====================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.metaKey && e.key === 'k') {
            e.preventDefault();
            if (document.getElementById('tasks').classList.contains('active')) {
                showAddTaskModal();
            } else {
                showSection('tasks');
                setTimeout(showAddTaskModal, 200);
            }
        }
        
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.fixed.inset-0');
            modals.forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            });
        }
    });
    
    // Show keyboard hint on dashboard
    console.log('%c[HouseBusiness] Keyboard shortcut: ⌘K = New task', 'color:#64748b');
}

// ==================== PWA SUPPORT ====================
function registerPWA() {
    // Create manifest if not present
    if (!document.querySelector('link[rel="manifest"]')) {
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = 'manifest.json';
        document.head.appendChild(link);
    }
    
    // Register service worker (simple offline support)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // Service worker optional
        });
    }
}

// ==================== INIT ====================
function initApp() {
    loadFromStorage();
    initDarkMode();
    initKeyboardShortcuts();
    registerPWA();
    
    // Render initial dashboard
    renderDashboard();
    
    // Set initial nav active
    const navDashboard = document.getElementById('nav-dashboard');
    if (navDashboard) navDashboard.classList.add('nav-active');
    
    // Show dashboard by default
    document.getElementById('dashboard').classList.add('active');
    
    // Bonus: Seed message on first load
    if (localStorage.getItem('hb_first_load') === null) {
        localStorage.setItem('hb_first_load', 'true');
        setTimeout(() => {
            console.log('%c[HouseBusiness] Données de démonstration chargées.', 'color:#64748b');
        }, 1200);
    }
    
    // Easter egg: click logo to refresh
    const logo = document.querySelector('.font-display');
    if (logo) {
        logo.onclick = () => {
            window.location.reload();
        };
        logo.style.cursor = 'pointer';
    }
    
    // Make sure everything is ready
    console.log('%c[HouseBusiness] Application initialisée avec succès ✅', 'color:#0ea5e9');
}

// Boot the app
window.onload = initApp;