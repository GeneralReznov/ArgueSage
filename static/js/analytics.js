/**
 * Analytics and Progress Visualization
 * Handles charts, performance tracking, and user insights
 */

class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.loadPerformanceData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Refresh analytics when requested
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refreshAnalytics') {
                this.loadPerformanceData();
            }
        });
    }

    async loadPerformanceData() {
        try {
            const response = await fetch('/api/analytics/performance');
            const data = await response.json();
            this.renderAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }

    renderAnalytics(data) {
        this.createScoreChart(data.recent_scores || []);
        this.createProgressChart(data.level_progress || {});
        this.updateTrendIndicator(data.improvement_trend || 'stable');
        this.renderStrengthsWeaknesses(data.strengths_weaknesses || {});
        this.createFormatPerformanceChart(data.format_performance || {});
    }

    createScoreChart(scores) {
        const ctx = document.getElementById('scoreChart');
        if (!ctx || !scores.length) return;

        if (this.charts.scoreChart) {
            this.charts.scoreChart.destroy();
        }

        this.charts.scoreChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: scores.map((_, i) => `Debate ${i + 1}`),
                datasets: [{
                    label: 'Debate Score',
                    data: scores,
                    borderColor: 'rgb(13, 110, 253)',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Recent Performance Trend',
                        color: '#fff'
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createProgressChart(progressData) {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        if (this.charts.progressChart) {
            this.charts.progressChart.destroy();
        }

        const progress = progressData.progress_percentage || 0;
        const remaining = 100 - progress;

        this.charts.progressChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [progress, remaining],
                    backgroundColor: [
                        'rgb(25, 135, 84)',
                        'rgba(255, 255, 255, 0.1)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Level Progress (${progress.toFixed(1)}%)`,
                        color: '#fff'
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                }
            }
        });
    }

    createFormatPerformanceChart(formatData) {
        const ctx = document.getElementById('formatChart');
        if (!ctx || !Object.keys(formatData).length) return;

        if (this.charts.formatChart) {
            this.charts.formatChart.destroy();
        }

        const formats = Object.keys(formatData);
        const averages = formats.map(format => {
            const scores = formatData[format];
            return scores.reduce((a, b) => a + b, 0) / scores.length;
        });

        this.charts.formatChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: formats,
                datasets: [{
                    label: 'Average Score',
                    data: averages,
                    borderColor: 'rgb(255, 193, 7)',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(255, 193, 7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Performance by Format',
                        color: '#fff'
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#fff'
                        }
                    }
                }
            }
        });
    }

    updateTrendIndicator(trend) {
        const indicator = document.getElementById('trendIndicator');
        if (!indicator) return;

        indicator.className = `score-trend ${trend}`;
        
        const messages = {
            improving: {
                icon: '📈',
                text: 'Your performance is improving!',
                color: 'success'
            },
            declining: {
                icon: '📉', 
                text: 'Keep practicing to improve your scores.',
                color: 'warning'
            },
            stable: {
                icon: '📊',
                text: 'Your performance is consistent.',
                color: 'info'
            },
            insufficient_data: {
                icon: '📋',
                text: 'Complete more debates to see your trend.',
                color: 'secondary'
            }
        };

        const message = messages[trend] || messages.stable;
        indicator.innerHTML = `
            <span class="trend-icon">${message.icon}</span>
            <span class="trend-text">${message.text}</span>
        `;
    }

    renderStrengthsWeaknesses(data) {
        const strengthsContainer = document.getElementById('strengthsList');
        const weaknessesContainer = document.getElementById('weaknessesList');

        if (strengthsContainer) {
            if (data.strengths && data.strengths.length) {
                strengthsContainer.innerHTML = data.strengths
                    .map(strength => `<span class="strength-item">${strength}</span>`)
                    .join('');
            } else {
                strengthsContainer.innerHTML = '<span class="text-muted">Complete more debates to identify strengths</span>';
            }
        }

        if (weaknessesContainer) {
            if (data.weaknesses && data.weaknesses.length) {
                weaknessesContainer.innerHTML = data.weaknesses
                    .map(weakness => `<span class="weakness-item">${weakness}</span>`)
                    .join('');
            } else {
                weaknessesContainer.innerHTML = '<span class="text-muted">No significant weaknesses identified</span>';
            }
        }
    }

    exportAnalytics() {
        // Create a comprehensive analytics report
        const reportData = {
            timestamp: new Date().toISOString(),
            charts: Object.keys(this.charts),
            summary: this.generateSummary()
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debate_analytics_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    generateSummary() {
        return {
            totalCharts: Object.keys(this.charts).length,
            lastUpdated: new Date().toISOString(),
            dataPoints: this.countDataPoints()
        };
    }

    countDataPoints() {
        let total = 0;
        Object.values(this.charts).forEach(chart => {
            if (chart.data && chart.data.datasets) {
                chart.data.datasets.forEach(dataset => {
                    if (dataset.data) {
                        total += dataset.data.length;
                    }
                });
            }
        });
        return total;
    }
}

// Achievement animation system
class AchievementAnimator {
    constructor() {
        this.queue = [];
        this.isPlaying = false;
    }

    showAchievement(achievement) {
        this.queue.push(achievement);
        if (!this.isPlaying) {
            this.playNext();
        }
    }

    playNext() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const achievement = this.queue.shift();
        
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-text">
                    <h6>Achievement Unlocked!</h6>
                    <p>${achievement.name}</p>
                    <small>${achievement.description}</small>
                </div>
                <div class="achievement-points">+${achievement.points} pts</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
                this.playNext();
            }, 300);
        }, 3000);
    }
}

// Initialize when page loads
let analyticsManager;
let achievementAnimator;

document.addEventListener('DOMContentLoaded', function() {
    analyticsManager = new AnalyticsManager();
    achievementAnimator = new AchievementAnimator();
});

// Export functions for global use
window.showAchievement = function(achievement) {
    if (achievementAnimator) {
        achievementAnimator.showAchievement(achievement);
    }
};

window.refreshAnalytics = function() {
    if (analyticsManager) {
        analyticsManager.loadPerformanceData();
    }
};

window.exportAnalytics = function() {
    if (analyticsManager) {
        analyticsManager.exportAnalytics();
    }
};