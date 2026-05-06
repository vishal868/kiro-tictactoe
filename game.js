// Tic Tac Toe - with special rules from the whiteboard
// Rules:
// - Players X and O take turns
// - 3 in a row/column/diagonal wins
// - No overwriting cells
// - When board is full, expand to 4x4
// - If 4x4 board is also full with no winner, it's a draw
// - Limited time per turn
// - When a player is called "Olli", they always win

class TicTacToe {
    constructor() {
        this.setupScreen = document.getElementById('setup-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.boardEl = document.getElementById('board');
        this.messageEl = document.getElementById('message');
        this.currentPlayerEl = document.getElementById('current-player');
        this.timerEl = document.getElementById('timer');
        this.xCountEl = document.getElementById('x-count');
        this.oCountEl = document.getElementById('o-count');
        this.boardSizeInfoEl = document.getElementById('board-size-info');
        this.restartBtn = document.getElementById('restart-btn');
        this.startBtn = document.getElementById('start-btn');

        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.resetGame());

        // Toggle player 2 name input based on type selection
        const p2TypeSelect = document.getElementById('player2-type');
        const p2NameInput = document.getElementById('player2-name');
        p2TypeSelect.addEventListener('change', () => {
            p2NameInput.style.display = p2TypeSelect.value === 'computer' ? 'none' : 'block';
        });

        this.boardSize = 3;
        this.board = [];
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.players = { X: '', O: '' };
        this.isComputerPlayer = false;
        this.turnTime = 15;
        this.timer = null;
        this.timeLeft = 0;
        this.moveHistory = { X: [], O: [] }; // Track order of moves for piece removal
        this.hasExpanded = false;
    }

    startGame() {
        const p1Name = document.getElementById('player1-name').value.trim() || 'Player 1';
        const p2Type = document.getElementById('player2-type').value;
        const p2Name = p2Type === 'computer' ? 'Computer' : (document.getElementById('player2-name').value.trim() || 'Player 2');
        this.turnTime = parseInt(document.getElementById('turn-time').value) || 15;

        this.players = { X: p1Name, O: p2Name };
        this.isComputerPlayer = p2Type === 'computer';

        // Olli rule check - instant win
        if (this.checkOlliRule()) return;

        this.setupScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');

        this.resetBoard();
    }

    checkOlliRule() {
        const olliPlayer = Object.entries(this.players).find(
            ([, name]) => name.toLowerCase() === 'olli'
        );

        if (olliPlayer) {
            this.setupScreen.classList.add('hidden');
            this.gameScreen.classList.remove('hidden');
            this.resetBoard();
            this.gameOver = true;

            // Show Olli winning immediately
            setTimeout(() => {
                this.messageEl.textContent = `🎉 ${olliPlayer[1]} (${olliPlayer[0]}) wins! Olli always wins!`;
                this.messageEl.className = 'message olli';
                this.restartBtn.classList.remove('hidden');
                this.clearTimer();
            }, 500);
            return true;
        }
        return false;
    }

    resetBoard() {
        this.boardSize = 3;
        this.hasExpanded = false;
        this.initBoard();
    }

    initBoard() {
        this.board = Array(this.boardSize * this.boardSize).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.moveHistory = { X: [], O: [] };
        this.messageEl.textContent = '';
        this.messageEl.className = 'message';
        this.restartBtn.classList.add('hidden');
        this.renderBoard();
        this.updateInfo();
        this.startTimer();
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        this.boardEl.className = `board size-${this.boardSize}`;

        for (let i = 0; i < this.board.length; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (this.board[i]) {
                cell.textContent = this.board[i];
                cell.classList.add(this.board[i].toLowerCase());
            }

            cell.addEventListener('click', () => this.makeMove(i));
            this.boardEl.appendChild(cell);
        }
    }

    makeMove(index) {
        if (this.gameOver) return;
        if (this.board[index] !== null) return; // No overwriting!

        const player = this.currentPlayer;

        // Place the piece
        this.board[index] = player;
        this.moveHistory[player].push(index);

        // Check for win
        const winCombo = this.checkWin(player);
        if (winCombo) {
            this.gameOver = true;
            this.renderBoard();
            this.highlightWin(winCombo);
            this.messageEl.textContent = `🎉 ${this.players[player]} (${player}) wins!`;
            this.messageEl.className = 'message win';
            this.restartBtn.classList.remove('hidden');
            this.clearTimer();
            return;
        }

        // Check for full board
        if (this.isBoardFull()) {
            if (!this.hasExpanded) {
                // Expand to 4x4
                this.expandBoard();
                return;
            } else {
                // Already expanded, it's a draw
                this.gameOver = true;
                this.renderBoard();
                this.messageEl.textContent = "It's a draw! Board is full.";
                this.messageEl.className = 'message draw';
                this.restartBtn.classList.remove('hidden');
                this.clearTimer();
                return;
            }
        }

        // Switch player
        this.currentPlayer = player === 'X' ? 'O' : 'X';
        this.renderBoard();
        this.updateInfo();
        this.startTimer();

        // If it's the computer's turn, make a move
        if (this.isComputerPlayer && this.currentPlayer === 'O' && !this.gameOver) {
            this.makeComputerMove();
        }
    }

    makeComputerMove() {
        this.clearTimer();
        setTimeout(() => {
            if (this.gameOver) return;

            const move = this.getBestMove();
            if (move !== null) {
                this.makeMove(move);
            }
        }, 600); // Small delay so it feels natural
    }

    getBestMove() {
        const size = this.boardSize;
        const emptyCells = this.board
            .map((cell, idx) => cell === null ? idx : null)
            .filter(idx => idx !== null);

        if (emptyCells.length === 0) return null;

        // 1. Try to win
        for (const idx of emptyCells) {
            this.board[idx] = 'O';
            if (this.checkWin('O')) {
                this.board[idx] = null;
                return idx;
            }
            this.board[idx] = null;
        }

        // 2. Block opponent from winning
        for (const idx of emptyCells) {
            this.board[idx] = 'X';
            if (this.checkWin('X')) {
                this.board[idx] = null;
                return idx;
            }
            this.board[idx] = null;
        }

        // 3. Take center if available
        const center = Math.floor(size * size / 2);
        if (this.board[center] === null) return center;

        // 4. Take a corner
        const corners = size === 3
            ? [0, 2, 6, 8]
            : [0, 3, 12, 15];
        const availableCorners = corners.filter(idx => this.board[idx] === null);
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }

        // 5. Take any available cell
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    expandBoard() {
        // Expand from 3x3 to 4x4
        this.hasExpanded = true;
        const oldBoard = this.board;
        const oldSize = this.boardSize;
        this.boardSize = 4;
        this.board = Array(16).fill(null);

        // Copy old board into top-left of new board
        for (let row = 0; row < oldSize; row++) {
            for (let col = 0; col < oldSize; col++) {
                this.board[row * 4 + col] = oldBoard[row * oldSize + col];
            }
        }

        // Remap move history indices from 3x3 to 4x4
        for (const player of ['X', 'O']) {
            this.moveHistory[player] = this.moveHistory[player].map(idx => {
                const row = Math.floor(idx / oldSize);
                const col = idx % oldSize;
                return row * 4 + col;
            });
        }

        // Switch player and continue
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.boardSizeInfoEl.textContent = '⚡ Board expanded to 4x4!';
        this.renderBoard();
        this.updateInfo();
        this.startTimer();
    }

    isBoardFull() {
        return this.board.every(cell => cell !== null);
    }

    checkWin(player) {
        const size = this.boardSize;
        const lines = this.getWinLines(size);

        for (const line of lines) {
            if (line.every(idx => this.board[idx] === player)) {
                return line;
            }
        }
        return null;
    }

    getWinLines(size) {
        const lines = [];

        // Rows
        for (let r = 0; r < size; r++) {
            // For 4x4, check all possible 3-in-a-row within the row
            for (let c = 0; c <= size - 3; c++) {
                lines.push([r * size + c, r * size + c + 1, r * size + c + 2]);
            }
        }

        // Columns
        for (let c = 0; c < size; c++) {
            for (let r = 0; r <= size - 3; r++) {
                lines.push([r * size + c, (r + 1) * size + c, (r + 2) * size + c]);
            }
        }

        // Diagonals (top-left to bottom-right)
        for (let r = 0; r <= size - 3; r++) {
            for (let c = 0; c <= size - 3; c++) {
                lines.push([
                    r * size + c,
                    (r + 1) * size + (c + 1),
                    (r + 2) * size + (c + 2)
                ]);
            }
        }

        // Diagonals (top-right to bottom-left)
        for (let r = 0; r <= size - 3; r++) {
            for (let c = 2; c < size; c++) {
                lines.push([
                    r * size + c,
                    (r + 1) * size + (c - 1),
                    (r + 2) * size + (c - 2)
                ]);
            }
        }

        return lines;
    }

    highlightWin(combo) {
        const cells = this.boardEl.querySelectorAll('.cell');
        combo.forEach(idx => cells[idx].classList.add('winning'));
    }

    updateInfo() {
        this.currentPlayerEl.textContent = `${this.players[this.currentPlayer]}'s turn (${this.currentPlayer})`;
        this.xCountEl.textContent = `X pieces: ${this.moveHistory.X.length}`;
        this.oCountEl.textContent = `O pieces: ${this.moveHistory.O.length}`;
    }

    startTimer() {
        this.clearTimer();
        this.timeLeft = this.turnTime;
        this.timerEl.textContent = `⏱ ${this.timeLeft}s`;
        this.timerEl.classList.remove('warning');

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timerEl.textContent = `⏱ ${this.timeLeft}s`;

            if (this.timeLeft <= 5) {
                this.timerEl.classList.add('warning');
            }

            if (this.timeLeft <= 0) {
                this.clearTimer();
                this.handleTimeout();
            }
        }, 1000);
    }

    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    handleTimeout() {
        // Player loses their turn, switch to other player
        const timedOutPlayer = this.currentPlayer;
        this.currentPlayer = timedOutPlayer === 'X' ? 'O' : 'X';
        this.messageEl.textContent = `⏱ ${this.players[timedOutPlayer]} ran out of time! Turn skipped.`;
        this.messageEl.className = 'message';
        this.renderBoard();
        this.updateInfo();
        this.startTimer();

        // Clear the timeout message after 2 seconds
        setTimeout(() => {
            if (!this.gameOver) {
                this.messageEl.textContent = '';
            }
        }, 2000);
    }

    resetGame() {
        this.clearTimer();
        this.boardSizeInfoEl.textContent = '';

        // Check Olli rule again
        if (this.checkOlliRule()) return;

        this.resetBoard();
    }
}

// Start the game
const game = new TicTacToe();
