// --- Constants ---
const LOCAL_STORAGE_KEY = 'todo_app_state_v3';
const UNDO_TIMEOUT_MS = 5000;

// --- State Management ---
let state = {
    todos: [],
    filter: 'all',
    searchQuery: '' // Session-only
};

let pendingDeletes = {}; // Map of id -> timeoutId

// --- Cached DOM Elements ---
const DOM = {
    todoContainer: document.getElementById('todo-container'),
    form: document.getElementById('todo-form'),
    input: document.getElementById('todo-input'),
    searchInput: document.getElementById('search-input'),
    list: document.getElementById('todo-list'),
    count: document.getElementById('todo-count'),
    clearBtn: document.getElementById('clear-completed'),
    filtersContainer: document.getElementById('filters'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    emptyState: document.getElementById('empty-state'),
    toastContainer: document.getElementById('toast-container')
};

// --- Initialization ---
function init() {
    loadState();
    setupEventListeners();
    render();
}

// --- Utilities ---
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

// --- Safe Local Storage ---
function loadState() {
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            state.todos = parsed.todos || [];
            state.filter = parsed.filter || 'all';
        }
    } catch (e) {
        console.error('Failed to parse state from localStorage', e);
        showToast('Error loading saved tasks.', 'error');
    }
}

function saveState() {
    try {
        const stateToSave = {
            todos: state.todos,
            filter: state.filter
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
        console.error('Failed to save to localStorage', e);
        showToast('Storage full or unavailable. Could not save tasks.', 'error');
    }
}

// --- Toast Notifications ---
function showToast(message, type = 'info', actionConfig = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    
    const textSpan = document.createElement('span');
    textSpan.className = 'toast-message';
    textSpan.textContent = message;
    toast.appendChild(textSpan);

    if (actionConfig) {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'toast-action';
        actionBtn.textContent = actionConfig.text;
        actionBtn.addEventListener('click', () => {
            actionConfig.callback();
            removeToast(toast);
        });
        toast.appendChild(actionBtn);
    }

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        if (DOM.toastContainer.contains(toast)) {
            removeToast(toast);
        }
    }, UNDO_TIMEOUT_MS);
}

function removeToast(toastElement) {
    toastElement.classList.add('toast-fade-out');
    toastElement.addEventListener('animationend', () => {
        if (toastElement.parentNode) {
            toastElement.remove();
        }
    });
}

// --- Event Listeners ---
function setupEventListeners() {

    // 3. To-Do Form Submit
    DOM.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = DOM.input.value.trim();
        if (!text) {
            showToast('Task cannot be empty or whitespace only.', 'warning');
            return;
        }
        
        if (state.todos.some(t => t.text.toLowerCase() === text.toLowerCase())) {
            showToast('Warning: This task already exists!', 'warning');
        }

        addTodo(text);
        DOM.input.value = '';
    });

    // Search Input
    DOM.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        render();
    });

    // Event delegation on Todo List
    DOM.list.addEventListener('click', handleListInteraction);
    DOM.list.addEventListener('dblclick', handleListDblClick);
    DOM.list.addEventListener('keydown', handleListKeyDown);

    // Editing mode (click outside to save)
    document.addEventListener('mousedown', (e) => {
        const editingItem = document.querySelector('.todo-item.editing');
        if (editingItem && !editingItem.contains(e.target)) {
            const id = editingItem.dataset.id;
            const input = editingItem.querySelector('.edit-input');
            finishEdit(id, input, editingItem);
        }
    });

    // Filtering
    DOM.filtersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            setFilter(e.target.dataset.filter);
        }
    });

    // Clear completed
    DOM.clearBtn.addEventListener('click', () => {
        clearCompleted();
    });
}

// --- Event Handlers ---
function handleListInteraction(e) {
    const item = e.target.closest('.todo-item');
    if (!item) return;
    const id = item.dataset.id;

    if (e.target.closest('.checkbox-container')) {
        toggleTodo(id);
    } else if (e.target.closest('.btn-delete')) {
        initiateDeleteTodo(id);
    } else if (e.target.closest('.btn-edit')) {
        enterEditMode(id, item);
    }
}

function handleListDblClick(e) {
    if (e.target.classList.contains('task-text')) {
        const item = e.target.closest('.todo-item');
        enterEditMode(item.dataset.id, item);
    }
}

function handleListKeyDown(e) {
    const item = e.target.closest('.todo-item');
    if (!item) return;
    const id = item.dataset.id;

    if (e.target.classList.contains('checkbox-container') && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        toggleTodo(id);
    }
}

// --- CRUD Operations ---
function addTodo(text) {
    const newTodo = {
        id: generateUUID(),
        text,
        completed: false
    };
    state.todos.push(newTodo);
    saveState();
    render();
}

// Toggle completion with animation delay
function toggleTodo(id) {
    state.todos = state.todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveState();
    render();
}

function initiateDeleteTodo(id) {
    const todoToDelete = state.todos.find(t => t.id === id);
    if (!todoToDelete) return;

    state.todos = state.todos.filter(todo => todo.id !== id);
    saveState();
    render();

    showToast(`Deleted "${todoToDelete.text}"`, 'info', {
        text: 'Undo',
        callback: () => undoDelete(todoToDelete)
    });
}

function undoDelete(todo) {
    state.todos.push(todo);
    saveState();
    render();
}

function updateTodo(id, newText) {
    state.todos = state.todos.map(todo => 
        todo.id === id ? { ...todo, text: newText } : todo
    );
    saveState();
    render();
}

function clearCompleted() {
    state.todos = state.todos.filter(todo => !todo.completed);
    saveState();
    render();
}

function setFilter(filter) {
    state.filter = filter;
    saveState();
    render();
}

// --- Editing Mode ---
function enterEditMode(id, itemElement) {
    document.querySelectorAll('.todo-item.editing').forEach(el => {
        if (el !== itemElement) {
            const input = el.querySelector('.edit-input');
            finishEdit(el.dataset.id, input, el);
        }
    });

    itemElement.classList.add('editing');
    const input = itemElement.querySelector('.edit-input');
    
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    const handleKeydown = (e) => {
        if (e.key === 'Enter') {
            finishEdit(id, input, itemElement);
        } else if (e.key === 'Escape') {
            cancelEdit(itemElement);
        }
    };

    input.addEventListener('keydown', handleKeydown);
    itemElement._editKeydownHandler = handleKeydown;
}

function finishEdit(id, input, itemElement) {
    if (itemElement._editKeydownHandler) {
        input.removeEventListener('keydown', itemElement._editKeydownHandler);
    }
    
    const newText = input.value.trim();
    if (newText) {
        updateTodo(id, newText);
    } else {
        initiateDeleteTodo(id);
    }
}

function cancelEdit(itemElement) {
    if (itemElement._editKeydownHandler) {
        const input = itemElement.querySelector('.edit-input');
        input.removeEventListener('keydown', itemElement._editKeydownHandler);
    }
    render();
}

// --- Rendering Architecture ---
function render() {
    // Render To-Do list
    const filteredTodos = getFilteredTodos();
    renderList(filteredTodos);
    checkEmptyState(filteredTodos.length);
    updateFooter();
    updateFilters();
}

function getFilteredTodos() {
    return state.todos.filter(todo => {
        if (state.filter === 'active' && todo.completed) return false;
        if (state.filter === 'completed' && !todo.completed) return false;
        if (state.searchQuery && !todo.text.toLowerCase().includes(state.searchQuery)) return false;
        return true;
    });
}

function renderList(todosToRender) {
    const fragment = document.createDocumentFragment();
    
    todosToRender.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;
        li.setAttribute('role', 'listitem');

        const escapedText = escapeHTML(todo.text);

        li.innerHTML = `
            <div class="checkbox-container" role="checkbox" aria-checked="${todo.completed}" tabindex="0" aria-label="${todo.completed ? 'Mark incomplete' : 'Mark complete'}: ${escapedText}">
                <svg class="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div class="task-content">
                <span class="task-text" title="Double-click to edit">${escapedText}</span>
                <input type="text" class="edit-input" value="${escapedText}" aria-label="Edit task">
            </div>
            <button class="action-btn btn-edit" aria-label="Edit task">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="action-btn btn-delete" aria-label="Delete task">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        fragment.appendChild(li);
    });

    DOM.list.innerHTML = '';
    DOM.list.appendChild(fragment);
}

function checkEmptyState(visibleCount) {
    if (visibleCount === 0) {
        DOM.emptyState.classList.remove('hidden');
        DOM.emptyState.setAttribute('aria-hidden', 'false');
    } else {
        DOM.emptyState.classList.add('hidden');
        DOM.emptyState.setAttribute('aria-hidden', 'true');
    }
}

function updateFooter() {
    const activeCount = state.todos.filter(todo => !todo.completed).length;
    const completedCount = state.todos.length - activeCount;

    DOM.count.textContent = `${activeCount} item${activeCount === 1 ? '' : 's'} left`;

    if (completedCount > 0) {
        DOM.clearBtn.classList.remove('hidden');
    } else {
        DOM.clearBtn.classList.add('hidden');
    }
}

function updateFilters() {
    DOM.filterBtns.forEach(btn => {
        const isActive = btn.dataset.filter === state.filter;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive.toString());
    });
}

// Start application
document.addEventListener('DOMContentLoaded', init);
