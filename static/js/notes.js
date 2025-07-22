/**
 * Note-taking Assistant for Debate Platform
 * Provides real-time note-taking during debates and case preparation
 */

class NoteTakingAssistant {
    constructor() {
        this.notes = [];
        this.currentMotion = '';
        this.autoSaveTimeout = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.init();
    }

    init() {
        this.loadNotes();
        this.setupEventListeners();
        this.createNoteInterface();
        // Restore position after interface is created
        setTimeout(() => this.restoreNotePosition(), 100);
    }

    setupEventListeners() {
        // Auto-save notes every 3 seconds
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('note-content')) {
                this.scheduleAutoSave();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'n':
                        e.preventDefault();
                        this.createNewNote();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveCurrentNotes();
                        break;
                    case 'f':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.focusSearchBox();
                        }
                        break;
                }
            }
        });

        // Drag functionality
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
    }

    createNoteInterface() {
        // Create floating note panel (minimized by default)
        const notePanel = document.createElement('div');
        notePanel.id = 'notePanel';
        notePanel.className = 'note-panel minimized';
        notePanel.innerHTML = `
            <div class="note-panel-header" id="notePanelHeader">
                <div class="drag-handle" title="Drag to move panel">
                    <i data-feather="move"></i>
                </div>
                <h6><i data-feather="edit-3"></i> Notes</h6>
                <div class="note-controls">
                    <button class="btn btn-sm btn-outline-light" onclick="noteAssistant.createNewNote()" title="New Note (Ctrl+N)">
                        <i data-feather="plus"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-light" onclick="noteAssistant.togglePanel()" title="Toggle Panel">
                        <i data-feather="maximize-2"></i>
                    </button>
                </div>
            </div>
            <div class="note-panel-body">
                <div class="note-search mb-2">
                    <input type="text" class="form-control form-control-sm" placeholder="Search notes..." 
                           onkeyup="noteAssistant.searchNotes(this.value)">
                </div>
                <div class="note-type-selector mb-2">
                    <select class="form-select form-select-sm" id="noteTypeSelector">
                        <option value="general">General</option>
                        <option value="argument">Argument</option>
                        <option value="rebuttal">Rebuttal</option>
                        <option value="evidence">Evidence</option>
                        <option value="strategy">Strategy</option>
                    </select>
                </div>
                <div id="notesList" class="notes-list"></div>
                <div class="quick-note mt-2">
                    <textarea class="form-control" id="quickNoteText" rows="3" 
                              placeholder="Quick note..."></textarea>
                    <button class="btn btn-sm btn-primary mt-1" onclick="noteAssistant.saveQuickNote()">
                        Save Note
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notePanel);
        
        // Initialize feather icons for the new panel
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        // Setup drag functionality
        this.setupDragFunctionality();
    }

    setupDragFunctionality() {
        const notePanel = document.getElementById('notePanel');
        const dragHandle = notePanel.querySelector('.drag-handle');
        const header = notePanel.querySelector('.note-panel-header');
        
        // Make the entire header draggable
        header.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        dragHandle.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        
        // Prevent text selection during drag
        header.addEventListener('selectstart', (e) => e.preventDefault());
        dragHandle.addEventListener('selectstart', (e) => e.preventDefault());
    }

    handleMouseDown(e) {
        // Only start dragging if clicking on header or drag handle
        if (e.target.closest('.note-controls')) return;
        
        const notePanel = document.getElementById('notePanel');
        const rect = notePanel.getBoundingClientRect();
        
        this.isDragging = true;
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        notePanel.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const notePanel = document.getElementById('notePanel');
        const newX = e.clientX - this.dragOffset.x;
        const newY = e.clientY - this.dragOffset.y;
        
        // Ensure panel stays within viewport
        const maxX = window.innerWidth - notePanel.offsetWidth;
        const maxY = window.innerHeight - notePanel.offsetHeight;
        
        const clampedX = Math.max(0, Math.min(newX, maxX));
        const clampedY = Math.max(0, Math.min(newY, maxY));
        
        notePanel.style.left = clampedX + 'px';
        notePanel.style.top = clampedY + 'px';
        notePanel.style.right = 'auto';
        notePanel.style.bottom = 'auto';
    }

    handleMouseUp() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        const notePanel = document.getElementById('notePanel');
        
        notePanel.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        
        // Save position to localStorage
        this.saveNotePosition(notePanel);
    }

    saveNotePosition(notePanel) {
        const position = {
            left: notePanel.style.left,
            top: notePanel.style.top
        };
        localStorage.setItem('notesPanelPosition', JSON.stringify(position));
    }

    restoreNotePosition() {
        const savedPosition = localStorage.getItem('notesPanelPosition');
        if (savedPosition) {
            const position = JSON.parse(savedPosition);
            const notePanel = document.getElementById('notePanel');
            if (notePanel && position.left && position.top) {
                notePanel.style.left = position.left;
                notePanel.style.top = position.top;
                notePanel.style.right = 'auto';
                notePanel.style.bottom = 'auto';
            }
        }
    }

    async loadNotes() {
        try {
            const response = await fetch('/api/notes');
            const data = await response.json();
            this.notes = data.notes || [];
            this.renderNotes();
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }

    async saveNote(noteData) {
        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: noteData.content,
                    type: noteData.type || 'general',
                    motion: this.currentMotion,
                    tags: noteData.tags || []
                })
            });
            
            const result = await response.json();
            if (result.success) {
                this.notes.push(result.note);
                this.renderNotes();
                this.showNotification('Note saved!', 'success');
            }
        } catch (error) {
            console.error('Failed to save note:', error);
            this.showNotification('Failed to save note', 'error');
        }
    }

    async deleteNote(noteId) {
        try {
            const response = await fetch(`/api/notes/${noteId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.notes = this.notes.filter(note => note.id !== noteId);
                this.renderNotes();
                this.showNotification('Note deleted', 'info');
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    }

    async searchNotes(query) {
        if (!query.trim()) {
            this.renderNotes();
            return;
        }

        try {
            const response = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.renderNotes(data.notes);
        } catch (error) {
            console.error('Failed to search notes:', error);
        }
    }

    renderNotes(notesToRender = this.notes) {
        const notesList = document.getElementById('notesList');
        if (!notesList) return;

        if (notesToRender.length === 0) {
            notesList.innerHTML = '<div class="text-muted small">No notes yet</div>';
            return;
        }

        notesList.innerHTML = notesToRender.map(note => `
            <div class="note-item" data-note-id="${note.id}">
                <div class="note-header">
                    <span class="note-type badge bg-secondary">${note.type}</span>
                    <span class="note-time text-muted small">${this.formatTime(note.timestamp)}</span>
                    <button class="btn btn-sm btn-outline-danger delete-note" 
                            onclick="noteAssistant.deleteNote('${note.id}')">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
                ${note.motion ? `<div class="note-motion text-muted small">Motion: ${this.escapeHtml(note.motion)}</div>` : ''}
            </div>
        `).join('');

        // Re-initialize feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    createNewNote() {
        const content = prompt('Enter note content:');
        if (content) {
            const type = document.getElementById('noteTypeSelector')?.value || 'general';
            this.saveNote({ content, type });
        }
    }

    async saveQuickNote() {
        const textArea = document.getElementById('quickNoteText');
        const content = textArea.value.trim();
        
        if (content) {
            const type = document.getElementById('noteTypeSelector')?.value || 'general';
            await this.saveNote({ content, type });
            textArea.value = '';
            this.exportNotes('text');
        }
    }

    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNotes();
        }, 3000);
    }

    saveCurrentNotes() {
        // Auto-save any modified notes
        const noteItems = document.querySelectorAll('.note-item');
        noteItems.forEach(item => {
            const noteContent = item.querySelector('.note-content');
            if (noteContent && noteContent.getAttribute('contenteditable') === 'true') {
                const noteId = item.getAttribute('data-note-id');
                const content = noteContent.textContent;
                // Update existing note
                const note = this.notes.find(n => n.id === noteId);
                if (note) {
                    note.content = content;
                    this.saveNote({
                        id: noteId,
                        content: content,
                        type: note.type,
                        motion: note.motion
                    });
                }
            }
        });
    }

    togglePanel() {
        const panel = document.getElementById('notePanel');
        
        if (panel) {
            panel.classList.toggle('minimized');
            
            // Update button icon based on state
            const toggleBtn = panel.querySelector('.note-controls button:last-child i');
            if (toggleBtn) {
                if (panel.classList.contains('minimized')) {
                    toggleBtn.setAttribute('data-feather', 'maximize-2');
                } else {
                    toggleBtn.setAttribute('data-feather', 'minimize-2');
                }
                
                // Re-initialize feather icons
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }
        }
    }

    setCurrentMotion(motion) {
        this.currentMotion = motion;
    }

    focusSearchBox() {
        const searchBox = document.querySelector('.note-search input');
        if (searchBox) {
            searchBox.focus();
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }

    // Template-based note creation for specific debate elements
    createArgumentNote(argumentText, position) {
        const template = `Argument (${position}): ${argumentText}\n\nCounters to consider:\n- \n- \n\nEvidence needed:\n- `;
        this.saveNote({ content: template, type: 'argument' });
    }

    createRebuttalNote(targetArgument, rebuttalPoints) {
        const template = `Rebuttal to: "${targetArgument}"\n\nKey points:\n${rebuttalPoints.map(point => `- ${point}`).join('\n')}\n\nFollow-up needed:\n- `;
        this.saveNote({ content: template, type: 'rebuttal' });
    }

    createEvidenceNote(source, claim, details) {
        const template = `Source: ${source}\nClaim: ${claim}\nDetails: ${details}\n\nApplication:\n- \n\nCredibility: /10`;
        this.saveNote({ content: template, type: 'evidence' });
    }

    // Export notes functionality
    exportNotes(format = 'text') {
        if (format === 'text') {
            if (this.notes.length === 0) {
                this.showNotification('No notes to download', 'info');
                return;
            }
            const notesText = this.notes.map(note => 
                `[${note.type.toUpperCase()}] ${note.content}\nTime: ${note.timestamp}\nMotion: ${note.motion || 'None'}\n---\n`
            ).join('\n');
            
            const blob = new Blob([notesText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `debate_notes_${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('Notes downloaded successfully!', 'success');
        }
    }
}

// Initialize note-taking assistant when page loads
let noteAssistant;
document.addEventListener('DOMContentLoaded', function() {
    noteAssistant = new NoteTakingAssistant();
});

// Helper function to be called from debate pages
function initializeNotesForDebate(motion) {
    if (noteAssistant) {
        noteAssistant.setCurrentMotion(motion);
    }
}