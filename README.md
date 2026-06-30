# Modern Vanilla JS To-Do List

A production-ready, feature-rich To-Do List application built meticulously with native web technologies. Refactored for extreme performance, accessibility, and user experience.

LIVE LINK : https://todo-app-xi-gray-45.vercel.app/

## ✨ Feature List

- **Robust State Management**: Predictable state-driven UI with a single source of truth.
- **Advanced CRUD + Undo**: Add, Edit (via button or double-click), and Delete tasks with a 5-second **Undo** safety net.
- **Search & Filter**: Real-time task searching combined with category filters (All, Active, Completed).
- **Persistent Storage**: Safely wrapped `localStorage` synchronization (with error handling for private browsing or quota limits).
- **Empty States**: Beautiful visual feedback when no tasks are present.
- **Micro-Animations**: Smooth CSS transitions for adding/deleting tasks and toast notifications.

## ♿ Accessibility (A11y) & Keyboard Navigation

Fully keyboard navigable and screen-reader optimized:
- **`Tab`**: Move focus through all interactive elements.
- **`Enter` or `Space`**: Toggle task completion (when focus is on the checkbox).
- **`Enter`**: Save edits while in edit mode.
- **`Escape`**: Cancel edits and revert changes.
- Focus outlines are clearly defined for all buttons, inputs, and custom checkboxes.
- `aria-live` and `role="alert"` attributes inform screen readers of dynamic UI changes (e.g., Toast notifications, task counts).

## 🏗 Project Architecture

This project strictly adheres to a **framework-free (Vanilla)** philosophy. 

- **DOM Caching**: Elements are queried once on load and cached in a global `DOM` object to prevent redundant reflows.
- **DocumentFragment Rendering**: `renderList()` uses `DocumentFragment` to batch DOM mutations, ensuring smooth performance even with hundreds of tasks.
- **Event Delegation**: Instead of binding listeners to individual tasks, a single listener sits on the parent `#todo-list`, significantly reducing memory footprint.
- **Safe UUIDs**: Task IDs use modern `crypto.randomUUID()` with a reliable fallback mechanism.
- **Modularized Logic**: The rendering pipeline is broken down into semantic functions: `renderList()`, `checkEmptyState()`, `updateFooter()`, and `updateFilters()`.

## 📂 Folder Structure

```text
/
├── index.html   # Semantic markup and accessibility hooks
├── style.css    # UI styling, CSS variables, dark-mode gradient, animations
├── script.js    # Core logic, state management, event delegation
└── README.md    # Project documentation
```

## 🚀 Installation & Usage

No build tools or `npm` commands are required! 
1. Clone the repository.
2. Open `index.html` in your favorite modern browser.

### Browser Support
Works in all modern browsers supporting ES6+ (Chrome, Firefox, Safari, Edge).

