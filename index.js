const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsHorizontal = 10;
const cellsVertical = 10;
const width = window.innerWidth-4;
const height = window.innerHeight-4;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;


const engine = Engine.create();
engine.world.gravity.y = 0; //Disabling the gravity
const { world } = engine;

const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width: width,
        height: height
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);


// Walls
const walls = [
    Bodies.rectangle(width / 2, 0, width, 20, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 20, height, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 20, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 20, height, { isStatic: true })
];
World.add(world, walls);

// Maze Generation
const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
}


const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1).fill(null).map(() => Array(cellsHorizontal).fill(false));

// Function for picking a cell at random

let startRow = Math.floor(Math.random() * cellsVertical);
let startColumn = Math.floor(Math.random() * cellsHorizontal);

const gridIterator = (row, column) => {
    // if we have already visited that particulat cell at [row][column] then we return
    if (grid[row][column]) {
        return;
    }

    // Mark this cells as visited
    grid[row][column] = true;

    // Assembling the list of neighbours
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);

    // For each neighbor...
    for (let neighbor of neighbors) {
        const [nextRow, nextCol, direction] = neighbor;

        // See if that neighbor is out of bounds
        if (nextRow < 0 || nextRow >= cellsVertical || nextCol < 0 || nextCol >= cellsHorizontal) {
            continue;
        }

        // If we have visited the neighbor,continue to next neighbor
        if (grid[nextRow][nextCol]) {
            continue;
        }

        // Remove a wall either form horizontals or verticals
        if (direction === 'left') {
            verticals[row][nextCol] = true;
        }
        if (direction === 'right') {
            verticals[row][nextCol - 1] = true;
        }
        if (direction === 'up') {
            horizontals[nextRow][column] = true;
        }
        if (direction === 'down') {
            horizontals[nextRow - 1][column] = true;
        }

        // Visit the next cell
        gridIterator(nextRow, nextCol);

    }
}
gridIterator(startRow, startColumn);

// Iterating over horizontal wall array
horizontals.forEach((row, rowIndex) => {
    row.forEach((open, colIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            colIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            10,
            { isStatic: true, label: 'wall' ,render:{
                fillStyle:'red'
            }}
        );

        World.add(world, wall);
    });
})

// Iterating over vertical wall array
verticals.forEach((row, rowIndex) => {
    row.forEach((open, colIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            colIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY / 2,
            10,
            unitLengthY,
            { isStatic: true, label: 'wall',render:{
                fillStyle:'red'
            } }
        );

        World.add(world, wall);
    });
})

// Goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .7,
    unitLengthY * .7,
    { isStatic: true, label: 'goal' ,render:{
        fillStyle:'green'
    }}
);

World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius, {
    label: 'ball',render:{
        fillStyle:'blue'
    }
}
);
World.add(world, ball);

document.body.addEventListener('keydown', event => {

    const { x, y } = ball.velocity;

    if (event.keyCode === 87) {
        Body.setVelocity(ball, { x, y: y - 5 });
    }

    if (event.keyCode === 68) {
        Body.setVelocity(ball, { x: x + 5, y });
    }

    if (event.keyCode === 83) {
        Body.setVelocity(ball, { x, y: y + 5 });
    }

    if (event.keyCode === 65) {
        Body.setVelocity(ball, { x: x - 5, y });
    }
})


// Win Condition 
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision) => {
        const labels = ['ball', 'goal'];
        if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                    
                }
            });
        }
    });
})