/**
 * welcomebg.js - Fundo animado para página inicial
 */

var App = {};

App.getThemeColor = function() {
    var theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
};

App.getPrimaryHue = function() {
    var rootStyles = getComputedStyle(document.documentElement);
    var hue = rootStyles.getPropertyValue('--primary-hue').trim();
    return hue ? parseInt(hue) : 35;
};

App.setup = function() {
    var container = document.getElementById('welcome-canvas-container');
    if (!container) {
        console.log('welcome-canvas-container não encontrado');
        return;
    }
    if (container.style.display === 'none') return;

    var existingCanvas = container.querySelector('canvas');
    if (existingCanvas) existingCanvas.remove();

    var canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.canvas = canvas;

    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';

    container.style.position = 'relative';
    container.style.minHeight = '400px';
    container.style.overflow = 'hidden';
    container.insertBefore(canvas, container.firstChild);

    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.dataToImageRatio = 1;
    this.xC = this.width / 2;
    this.yC = this.height / 2;

    this.stepCount = 0;
    this.particles = [];
    this.lifespan = 1000;
    this.popPerBirth = 1;
    this.maxPop = 200;
    this.birthFreq = 2;

    this.gridSize = 8;
    this.gridSteps = Math.floor(1000 / this.gridSize);
    this.grid = [];
    var i = 0;
    for (var xx = -500; xx < 500; xx += this.gridSize) {
        for (var yy = -500; yy < 500; yy += this.gridSize) {
            var r = Math.sqrt(xx*xx+yy*yy), r0 = 100, field;
            if (r < r0) field = 255 / r0 * r;
            else if (r > r0) field = 255 - Math.min(255, (r - r0)/2);
            else field = 255;
            this.grid.push({
                x: xx, y: yy, busyAge: 0, spotIndex: i,
                isEdge: (xx == -500 ? 'left' : (xx == (-500 + this.gridSize * (this.gridSteps-1)) ? 'right' : (yy == -500 ? 'top' : (yy == (-500 + this.gridSize *(this.gridSteps-1)) ? 'bottom' : false)))),
                field: field
            });
            i++;
        }
    }
    this.gridMaxIndex = i;
    this.drawnInLastFrame = 0;
    this.deathCount = 0;
    this.initDraw();
};

App.initDraw = function() {
    var theme = document.documentElement.getAttribute('data-theme');
    this.ctx.fillStyle = theme === 'light' ? '#f5f5f0' : '#121212';
    this.ctx.fillRect(0, 0, this.width, this.height);
};

App.evolve = function() {
    if (!this.canvas || !this.canvas.parentNode) return;
    this.stepCount++;
    this.grid.forEach(e => { if (e.busyAge > 0) e.busyAge++; });
    if (this.stepCount % this.birthFreq == 0 && (this.particles.length + this.popPerBirth) < this.maxPop) {
        this.birth();
    }
    this.move();
    this.draw();
};

App.birth = function() {
    var gridSpotIndex = Math.floor(Math.random() * this.gridMaxIndex);
    var gridSpot = this.grid[gridSpotIndex];
    var primaryHue = this.getPrimaryHue();
    this.particles.push({
        hue: primaryHue + (Math.random() - 0.5) * 40,
        sat: 70 + Math.floor(30 * Math.random()),
        lum: 45 + Math.floor(35 * Math.random()),
        x: gridSpot.x, y: gridSpot.y,
        xLast: gridSpot.x, yLast: gridSpot.y,
        xSpeed: 0, ySpeed: 0,
        age: 0, ageSinceStuck: 0,
        attractor: { oldIndex: gridSpotIndex, gridSpotIndex: gridSpotIndex },
        name: 'seed-' + Math.ceil(10000000 * Math.random())
    });
};

App.kill = function(particleName) {
    for (var i = 0; i < this.particles.length; i++) {
        if (this.particles[i].name == particleName) {
            this.particles.splice(i, 1);
            this.deathCount++;
            break;
        }
    }
};

App.move = function() {
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        p.xLast = p.x; p.yLast = p.y;
        var index = p.attractor.gridSpotIndex;
        var gridSpot = this.grid[index];
        if (Math.random() < 0.5) {
            if (!gridSpot.isEdge) {
                var topIndex = index - 1, bottomIndex = index + 1, leftIndex = index - this.gridSteps, rightIndex = index + this.gridSteps;
                var candidates = [this.grid[topIndex], this.grid[bottomIndex], this.grid[leftIndex], this.grid[rightIndex]].filter(s => s);
                if (candidates.length) {
                    var chaos = 15;
                    var maxFieldSpot = candidates[0];
                    for (var j = 1; j < candidates.length; j++) {
                        if (candidates[j].field + chaos * Math.random() > maxFieldSpot.field + chaos * Math.random()) {
                            maxFieldSpot = candidates[j];
                        }
                    }
                    if (maxFieldSpot && (maxFieldSpot.busyAge == 0 || maxFieldSpot.busyAge > 15)) {
                        p.ageSinceStuck = 0;
                        p.attractor.oldIndex = index;
                        p.attractor.gridSpotIndex = maxFieldSpot.spotIndex;
                        gridSpot = maxFieldSpot;
                        gridSpot.busyAge = 1;
                    } else p.ageSinceStuck++;
                } else p.ageSinceStuck++;
            } else p.ageSinceStuck++;
            if (p.ageSinceStuck == 10) this.kill(p.name);
        }
        var k = 8, visc = 0.4;
        var dx = p.x - gridSpot.x, dy = p.y - gridSpot.y;
        var xAcc = -k * dx, yAcc = -k * dy;
        p.xSpeed += xAcc; p.ySpeed += yAcc;
        p.xSpeed *= visc; p.ySpeed *= visc;
        p.speed = Math.sqrt(p.xSpeed * p.xSpeed + p.ySpeed * p.ySpeed);
        p.dist = Math.sqrt(dx*dx + dy*dy);
        p.x += 0.1 * p.xSpeed; p.y += 0.1 * p.ySpeed;
        p.age++;
        if (p.age > this.lifespan) this.kill(p.name);
    }
};

App.draw = function() {
    if (!this.canvas || !this.canvas.parentNode || !this.particles || this.particles.length === 0) return false;
    this.ctx.fillStyle = this.getThemeColor();
    this.ctx.fillRect(0, 0, this.width, this.height);
    for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        var last = this.dataXYtoCanvasXY(p.xLast, p.yLast);
        var now = this.dataXYtoCanvasXY(p.x, p.y);
        var attracSpot = this.grid[p.attractor.gridSpotIndex];
        var attracXY = this.dataXYtoCanvasXY(attracSpot.x, attracSpot.y);
        var oldAttracSpot = this.grid[p.attractor.oldIndex];
        var oldAttracXY = this.dataXYtoCanvasXY(oldAttracSpot.x, oldAttracSpot.y);
        this.ctx.beginPath();
        this.ctx.strokeStyle = `hsla(${p.hue}, ${p.sat}%, ${p.lum}%, 1)`;
        this.ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.lum}%, 1)`;
        this.ctx.moveTo(last.x, last.y);
        this.ctx.lineTo(now.x, now.y);
        this.ctx.lineWidth = 1.5 * this.dataToImageRatio;
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.beginPath();
        this.ctx.lineWidth = 1.5 * this.dataToImageRatio;
        this.ctx.moveTo(oldAttracXY.x, oldAttracXY.y);
        this.ctx.lineTo(attracXY.x, attracXY.y);
        this.ctx.arc(attracXY.x, attracXY.y, 1.5 * this.dataToImageRatio, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.closePath();
        this.drawnInLastFrame++;
    }
};

App.dataXYtoCanvasXY = function(x, y) {
    var zoom = 1.4;
    return { x: this.xC + x * zoom, y: this.yC + y * zoom - 150 };
};

App.resize = function() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.xC = this.width / 2;
    this.yC = this.height / 2;
    this.initDraw();
};

// Inicialização única
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('welcome-canvas-container')) {
            App.setup();
            window.addEventListener('resize', () => App.resize());
            function frame() {
                if (document.getElementById('welcome-canvas-container')) {
                    App.evolve();
                    requestAnimationFrame(frame);
                }
            }
            requestAnimationFrame(frame);
        }
    });
} else {
    if (document.getElementById('welcome-canvas-container')) {
        App.setup();
        window.addEventListener('resize', () => App.resize());
        function frame() {
            if (document.getElementById('welcome-canvas-container')) {
                App.evolve();
                requestAnimationFrame(frame);
            }
        }
        requestAnimationFrame(frame);
    }
}