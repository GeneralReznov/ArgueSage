// Tournament Management System
class TournamentManager {
    constructor() {
        this.currentTournament = null;
        this.updateInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTournamentData();
        this.startLiveUpdates();
    }

    setupEventListeners() {
        // Create Tournament Form
        const createForm = document.getElementById('createTournamentForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateTournament(e));
        }

        // Join Tournament Modal
        const joinBtn = document.getElementById('confirmJoinTournament');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.handleJoinTournament());
        }

        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => this.handleTabSwitch(e.target.getAttribute('data-bs-target')));
        });

        // Bracket tournament selection
        const bracketSelect = document.getElementById('bracketTournamentSelect');
        if (bracketSelect) {
            bracketSelect.addEventListener('change', (e) => this.loadTournamentBracket(e.target.value));
        }

        // Leaderboard controls
        document.querySelectorAll('[data-sort]').forEach(btn => {
            btn.addEventListener('click', (e) => this.sortLeaderboard(e.target.getAttribute('data-sort')));
        });

        // Leaderboard tournament filter
        const leaderboardSelect = document.getElementById('leaderboardTournament');
        if (leaderboardSelect) {
            leaderboardSelect.addEventListener('change', (e) => this.filterLeaderboard(e.target.value));
        }
    }

    async handleCreateTournament(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const tournamentData = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch('/tournament/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tournamentData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Tournament created successfully!', 'success');
                e.target.reset();
                this.loadTournamentData();
                // Switch to active tournaments tab
                const activeTab = document.getElementById('active-tab');
                if (activeTab) activeTab.click();
            } else {
                this.showAlert(result.error || 'Failed to create tournament', 'error');
            }
        } catch (error) {
            console.error('Error creating tournament:', error);
            this.showAlert('Error creating tournament', 'error');
        }
    }

    async loadTournamentData() {
        try {
            const response = await fetch('/tournament/data');
            const data = await response.json();
            
            if (data.success) {
                this.updateTournamentStats(data.stats);
                this.loadActiveTournaments(data.active_tournaments);
                this.updateBracketSelects(data.tournaments);
                this.updateLeaderboard(data.leaderboard);
                this.loadRecentJudgments(data.recent_judgments);
            }
        } catch (error) {
            console.error('Error loading tournament data:', error);
        }
    }

    updateTournamentStats(stats) {
        const elements = {
            '.stat-number': ['active_tournaments', 'total_participants', 'completed_matches', 'total_prizes']
        };
        
        Object.entries(elements).forEach(([selector, keys]) => {
            const statElements = document.querySelectorAll(selector);
            keys.forEach((key, index) => {
                if (statElements[index] && stats[key] !== undefined) {
                    statElements[index].textContent = stats[key];
                }
            });
        });
    }

    loadActiveTournaments(tournaments) {
        const container = document.getElementById('activeTournamentsList');
        if (!container) return;

        if (!tournaments || tournaments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i data-feather="calendar" style="width: 48px; height: 48px; color: var(--debate-blue);"></i>
                    <h5 class="mt-3">No Active Tournaments</h5>
                    <p class="text-muted">Create a new tournament to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tournaments.map(tournament => `
            <div class="tournament-card">
                <div class="tournament-header">
                    <h5>${tournament.name}</h5>
                    <span class="tournament-status ${tournament.status}">${tournament.status}</span>
                </div>
                <div class="tournament-details">
                    <p><i data-feather="users" style="width: 16px; height: 16px;"></i> ${tournament.participants_count}/${tournament.max_participants} participants</p>
                    <p><i data-feather="clock" style="width: 16px; height: 16px;"></i> ${tournament.format}</p>
                    <p><i data-feather="award" style="width: 16px; height: 16px;"></i> ${tournament.prize_pool} points prize pool</p>
                </div>
                <div class="tournament-actions">
                    ${tournament.can_join ? `
                        <button class="btn btn-primary btn-sm" onclick="tournamentManager.showJoinModal('${tournament.id}')">
                            <i data-feather="plus" style="width: 16px; height: 16px;"></i> Join
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-primary btn-sm" onclick="tournamentManager.viewTournament('${tournament.id}')">
                        <i data-feather="eye" style="width: 16px; height: 16px;"></i> View
                    </button>
                </div>
            </div>
        `).join('');

        // Re-initialize feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    async loadTournamentBracket(tournamentId) {
        if (!tournamentId) {
            document.getElementById('tournamentBracket').innerHTML = `
                <div class="text-center py-5">
                    <p class="text-muted">Select a tournament to view its bracket</p>
                </div>
            `;
            return;
        }

        try {
            const response = await fetch(`/tournament/${tournamentId}/bracket`);
            const data = await response.json();
            
            if (data.success) {
                this.renderBracket(data.bracket);
            } else {
                this.showAlert(data.error || 'Failed to load bracket', 'error');
            }
        } catch (error) {
            console.error('Error loading bracket:', error);
            this.showAlert('Error loading tournament bracket', 'error');
        }
    }

    renderBracket(bracket) {
        const container = document.getElementById('tournamentBracket');
        if (!container || !bracket.rounds) return;

        const bracketHTML = `
            <div class="bracket">
                ${bracket.rounds.map((round, roundIndex) => `
                    <div class="bracket-round">
                        <h6 class="text-center mb-4 round-title">${round.name}</h6>
                        <div class="matches-container">
                            ${round.matches.map((match, matchIndex) => `
                                <div class="bracket-match ${match.status}" data-match-id="${match.id}">
                                    <div class="match-header">
                                        <small class="match-number">Match ${matchIndex + 1}</small>
                                    </div>
                                    <div class="match-participants">
                                        <div class="match-participant ${match.winner === match.participant1 ? 'winner' : ''} ${match.participant1 === 'BYE' ? 'bye' : ''}">
                                            <span class="participant-name">${match.participant1 || 'TBD'}</span>
                                            ${match.winner === match.participant1 ? '<i class="winner-icon">🏆</i>' : ''}
                                        </div>
                                        <div class="vs-divider">
                                            <span class="vs-text">VS</span>
                                        </div>
                                        <div class="match-participant ${match.winner === match.participant2 ? 'winner' : ''} ${match.participant2 === 'BYE' ? 'bye' : ''}">
                                            <span class="participant-name">${match.participant2 || 'TBD'}</span>
                                            ${match.winner === match.participant2 ? '<i class="winner-icon">🏆</i>' : ''}
                                        </div>
                                    </div>
                                    <div class="match-footer">
                                        ${match.status === 'completed' ? `
                                            <div class="match-result">
                                                <strong>Winner: ${match.winner}</strong>
                                                ${match.scores ? `<div class="match-scores">Score: ${match.scores[match.winner]}/100</div>` : ''}
                                                ${match.motion ? `<div class="match-motion" title="${match.motion}">Motion: ${match.motion.length > 50 ? match.motion.substring(0, 50) + '...' : match.motion}</div>` : ''}
                                            </div>
                                        ` : `
                                            <div class="match-status status-${match.status}">
                                                ${match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                                                ${match.status === 'pending' ? ' - Championship Final!' : ''}
                                            </div>
                                        `}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = bracketHTML;
    }

    updateBracketSelects(tournaments) {
        const selects = ['bracketTournamentSelect', 'leaderboardTournament'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

            const currentValue = select.value;
            const options = tournaments.map(t => 
                `<option value="${t.id}" ${t.id === currentValue ? 'selected' : ''}>${t.name}</option>`
            ).join('');
            
            select.innerHTML = `<option value="">Select Tournament</option>${options}`;
        });
    }

    updateLeaderboard(leaderboard, sortBy = 'points') {
        if (!leaderboard || leaderboard.length === 0) {
            this.renderEmptyLeaderboard();
            return;
        }

        this.updateChampionshipPodium(leaderboard.slice(0, 3), sortBy);
        this.renderLeaderboardList(leaderboard, sortBy);
    }

    updateChampionshipPodium(topThree, sortBy = 'points') {
        const podium = document.getElementById('championshipPodium');
        if (!podium || topThree.length === 0) return;

        // Arrange top 3 in podium order: 2nd, 1st, 3rd
        const podiumOrder = [
            topThree[1], // 2nd place (left)
            topThree[0], // 1st place (center)
            topThree[2]  // 3rd place (right)
        ].filter(Boolean);

        const podiumHTML = `
            <div class="championship-podium-container">
                <div class="podium-display">
                    ${podiumOrder.map((participant, displayIndex) => {
                        const actualRank = topThree.indexOf(participant) + 1;
                        const podiumClasses = ['second', 'first', 'third'];
                        const positionClass = podiumClasses[displayIndex];
                        
                        let displayValue;
                        switch(sortBy) {
                            case 'wins':
                                displayValue = `${participant.matches_won || 0} wins`;
                                break;
                            case 'win_rate':
                                displayValue = `${participant.win_rate || 0}% win rate`;
                                break;
                            default:
                                displayValue = `${participant.total_points || participant.points || 0} pts`;
                                break;
                        }
                        
                        return `
                            <div class="podium-place ${positionClass}">
                                <div class="podium-step">
                                    <div class="podium-crown">${actualRank === 1 ? '👑' : actualRank === 2 ? '🥈' : '🥉'}</div>
                                    <div class="podium-position">${actualRank}</div>
                                    <div class="podium-avatar">
                                        <i data-feather="user"></i>
                                    </div>
                                    <div class="podium-name">${participant.name}</div>
                                    <div class="podium-stats">
                                        <div class="podium-score">${displayValue}</div>
                                        <div class="podium-matches">${participant.matches_won || 0} matches</div>
                                        <div class="podium-winrate">${participant.skill_level}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        podium.innerHTML = podiumHTML;
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    renderLeaderboardList(participants, sortBy = 'points') {
        const container = document.getElementById('tournamentRankings');
        if (!container) return;

        const listHTML = participants.map((participant, index) => {
            let primaryStat, secondaryStat;
            
            switch(sortBy) {
                case 'wins':
                    primaryStat = `${participant.matches_won || 0} wins`;
                    secondaryStat = `${participant.win_rate || 0}% win rate`;
                    break;
                case 'win_rate':
                    primaryStat = `${participant.win_rate || 0}% win rate`;
                    secondaryStat = `${participant.matches_won || 0} matches won`;
                    break;
                default:
                    primaryStat = `${participant.total_points || participant.points || 0} pts`;
                    secondaryStat = `${participant.win_rate || 0}% win rate`;
                    break;
            }
            
            const isTop3 = index < 3;
            
            return `
                <div class="rank-item ${participant.is_current_user ? 'your-rank' : ''} ${isTop3 ? 'top-3' : ''}">
                    <div class="rank-badge">
                        <div class="rank-position ${isTop3 ? 'top-3' : ''}">${index + 1}</div>
                    </div>
                    <div class="rank-avatar">
                        <i data-feather="user"></i>
                    </div>
                    <div class="rank-info">
                        <div class="rank-header">
                            <h6 class="rank-name">${participant.name}${participant.is_current_user ? ' (You)' : ''}</h6>
                            <div class="rank-level">${participant.skill_level}</div>
                        </div>
                        <div class="rank-stats">
                            <div class="rank-stat">
                                <i data-feather="target"></i>
                                <span>${participant.matches_won || 0} matches won</span>
                            </div>
                            <div class="rank-stat">
                                <i data-feather="trending-up"></i>
                                <span>${secondaryStat}</span>
                            </div>
                        </div>
                        <div class="rank-progress">
                            <div class="rank-progress-fill" style="width: ${Math.min((participant.win_rate || 0), 100)}%"></div>
                        </div>
                    </div>
                    <div class="rank-score-section">
                        <div class="rank-points">${primaryStat}</div>
                        <div class="rank-trend ${participant.trend || 'stable'}">
                            ${participant.trend === 'up' ? '↗' : participant.trend === 'down' ? '↘' : '→'}
                            ${participant.trend === 'up' ? '+' : participant.trend === 'down' ? '-' : ''}${Math.abs(participant.trend_value || 0)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = listHTML;
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    renderEmptyLeaderboard() {
        const containers = ['championshipPodium', 'tournamentRankings'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <i data-feather="users" style="width: 48px; height: 48px; color: var(--debate-blue);"></i>
                        <h5 class="mt-3">No Tournament Data</h5>
                        <p class="text-muted">Complete some tournaments to see rankings!</p>
                    </div>
                `;
            }
        });
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    loadRecentJudgments(judgments) {
        const container = document.getElementById('recentJudgments');
        if (!container) return;

        if (!judgments || judgments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-3">
                    <p class="text-muted">No recent judgments available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = judgments.map(judgment => `
            <div class="judgment-item">
                <div class="judgment-header">
                    <strong>${judgment.judge_name}</strong>
                    <span class="judgment-time">${judgment.time_ago}</span>
                </div>
                <div class="judgment-details">
                    <p>Tournament: ${judgment.tournament_name}</p>
                    <p>Match: ${judgment.participant1} vs ${judgment.participant2}</p>
                    <p>Winner: <strong>${judgment.winner}</strong> (Score: ${judgment.score})</p>
                </div>
            </div>
        `).join('');
    }

    showJoinModal(tournamentId) {
        document.getElementById('tournamentIdToJoin').value = tournamentId;
        
        // Auto-fill participant name if available
        const participantNameField = document.getElementById('participantName');
        if (participantNameField && !participantNameField.value) {
            // Try to get name from profile or generate a default
            const defaultName = window.userProfile?.tournament_name || `Player_${Math.random().toString(36).substr(2, 5)}`;
            participantNameField.value = defaultName;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('joinTournamentModal'));
        modal.show();
    }

    async handleJoinTournament() {
        const tournamentId = document.getElementById('tournamentIdToJoin').value;
        const participantName = document.getElementById('participantName').value;
        const skillLevel = document.getElementById('skillDeclaration').value;

        if (!participantName.trim()) {
            this.showAlert('Please enter your name', 'error');
            return;
        }

        try {
            const response = await fetch('/tournament/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tournament_id: tournamentId,
                    participant_name: participantName,
                    skill_level: skillLevel
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Successfully joined tournament!', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('joinTournamentModal'));
                modal.hide();
                this.loadTournamentData();
            } else {
                this.showAlert(result.error || 'Failed to join tournament', 'error');
            }
        } catch (error) {
            console.error('Error joining tournament:', error);
            this.showAlert('Error joining tournament', 'error');
        }
    }

    async viewTournament(tournamentId) {
        // Switch to brackets tab and load the tournament
        const bracketsTab = document.getElementById('brackets-tab');
        if (bracketsTab) {
            bracketsTab.click();
            setTimeout(() => {
                const select = document.getElementById('bracketTournamentSelect');
                if (select) {
                    select.value = tournamentId;
                    this.loadTournamentBracket(tournamentId);
                }
            }, 100);
        }
    }

    handleTabSwitch(target) {
        switch(target) {
            case '#active':
                this.loadTournamentData();
                break;
            case '#brackets':
                this.loadTournamentData();
                break;
            case '#leaderboard':
                this.loadTournamentData();
                break;
            case '#judges':
                this.loadRecentJudgments();
                break;
        }
    }

    sortLeaderboard(sortBy) {
        // Update active button
        document.querySelectorAll('[data-sort]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-sort="${sortBy}"]`).classList.add('active');

        // Sort and reload leaderboard
        fetch(`/tournament/leaderboard?sort=${sortBy}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateLeaderboard(data.leaderboard, sortBy);
                }
            })
            .catch(error => console.error('Error sorting leaderboard:', error));
    }

    filterLeaderboard(tournamentId) {
        const url = tournamentId ? 
            `/tournament/leaderboard?tournament_id=${tournamentId}` : 
            '/tournament/leaderboard';
            
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateLeaderboard(data.leaderboard);
                }
            })
            .catch(error => console.error('Error filtering leaderboard:', error));
    }

    startLiveUpdates() {
        // Update tournament data every 30 seconds
        this.updateInterval = setInterval(() => {
            const activeTab = document.querySelector('.nav-link.active');
            if (activeTab && activeTab.getAttribute('data-bs-target') !== '#create') {
                this.loadTournamentData();
            }
        }, 30000);
    }

    showAlert(message, type) {
        // Create and show bootstrap alert
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Insert at top of the active tab content
        const activeTabPane = document.querySelector('.tab-pane.active');
        if (activeTabPane) {
            activeTabPane.insertAdjacentHTML('afterbegin', alertHtml);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                const alert = activeTabPane.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize tournament manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.tournamentManager = new TournamentManager();
    
    // Set default registration deadline to tomorrow
    const deadlineInput = document.getElementById('registrationDeadline');
    if (deadlineInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59);
        deadlineInput.value = tomorrow.toISOString().slice(0, 16);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.tournamentManager) {
        window.tournamentManager.destroy();
    }
});