// 全局变量
const mazeContainer = document.getElementById("maze");
const speedInput = document.getElementById("speed");
const startButton = document.getElementById("start");
const sizeInput = document.getElementById("size");
let maze = [];
let playerPos = { x: 0, y: 0 };
let rows = 10; // 默认迷宫行数
let cols = 10; // 默认迷宫列数
let cellSize = 20;
let currentSolution = null; // 存储当前解决方案
let currentInterval = null; // 存储当前定时器

// 更新迷宫大小
function updateMazeSize() {
  const newSize = parseInt(sizeInput.value);
  if (newSize >= 5 && newSize <= 50) {
    rows = cols = newSize;
    maze = generateMaze(rows, cols);
    drawMaze(maze);
    currentSolution = null; // 重置解决方案
  } else {
    alert("迷宫大小必须在5到50之间");
    sizeInput.value = rows; // 恢复原值
  }
}

// 初始化迷宫
function generateMaze(rows, cols) {
  const grid = Array.from({ length: rows }, () =>
    Array(cols).fill(null).map(() => ({
      walls: [true, true, true, true], // 上、右、下、左
      visited: false,
    }))
  );

  const stack = [];
  let current = { x: 0, y: 0 };
  grid[current.y][current.x].visited = true;

  const directions = [
    { x: 0, y: -1, wall: 0 }, // 上
    { x: 1, y: 0, wall: 1 },  // 右
    { x: 0, y: 1, wall: 2 },  // 下
    { x: -1, y: 0, wall: 3 }, // 左
  ];

  while (true) {
    const unvisitedNeighbors = directions
      .map(({ x, y, wall }) => ({
        nx: current.x + x,
        ny: current.y + y,
        wall,
      }))
      .filter(({ nx, ny }) => nx >= 0 && ny >= 0 && nx < cols && ny < rows && !grid[ny][nx].visited);

    if (unvisitedNeighbors.length > 0) {
      const { nx, ny, wall } = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
      const oppositeWall = (wall + 2) % 4;

      grid[current.y][current.x].walls[wall] = false;
      grid[ny][nx].walls[oppositeWall] = false;

      stack.push(current);
      current = { x: nx, y: ny };
      grid[ny][nx].visited = true;
    } else if (stack.length > 0) {
      current = stack.pop();
    } else {
      break;
    }
  }

  return grid;
}


// 绘制迷宫
function drawMaze(maze) {
  mazeContainer.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
  mazeContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
  mazeContainer.innerHTML = "";

  maze.forEach((row, y) => {
    row.forEach((cell, x) => {
      const cellDiv = document.createElement("div");
      cellDiv.className = "cell";
      if (cell.walls[0]) cellDiv.style.borderTop = "2px solid black";    // 上
      if (cell.walls[1]) cellDiv.style.borderRight = "2px solid black"; // 右
      if (cell.walls[2]) cellDiv.style.borderBottom = "2px solid black";// 下
      if (cell.walls[3]) cellDiv.style.borderLeft = "2px solid black";  // 左
      if (y === 0 && x === 0) cellDiv.classList.add("start");
      if (y === rows - 1 && x === cols - 1) cellDiv.classList.add("end");
      mazeContainer.appendChild(cellDiv);
    });
  });
}

// 小人移动
function movePlayer(path) {
  // 清除已有定时器
  if (currentInterval) {
    clearInterval(currentInterval);
    currentInterval = null;
  }
  
  // 重置玩家位置到起点
  document.querySelector(".player")?.classList.remove("player");
  mazeContainer.children[0].classList.add("player");
  
  let i = 0;
  currentInterval = setInterval(() => {
    if (i >= path.length) {
      clearInterval(currentInterval);
      currentInterval = null;
      alert("迷宫完成！");
      return;
    }
    const { x, y } = path[i++];
    document.querySelector(".player")?.classList.remove("player");
    mazeContainer.children[y * cols + x].classList.add("player");
  }, speedInput.value);
}

// 路径查找（简单DFS）
function solveMaze() {
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const path = [];
  const allPaths = [];

  function dfs(x, y) {
    if (x < 0 || y < 0 || x >= cols || y >= rows || visited[y][x]) return false;
    if (x === cols - 1 && y === rows - 1) {
      path.push({ x, y });
      allPaths.push([...path]);
      path.pop();
      return true;
    }

    visited[y][x] = true;
    path.push({ x, y });

    if (!maze[y][x].walls[1] && dfs(x + 1, y)) return true; // 右
    if (!maze[y][x].walls[2] && dfs(x, y + 1)) return true; // 下
    if (!maze[y][x].walls[3] && dfs(x - 1, y)) return true; // 左
    if (!maze[y][x].walls[0] && dfs(x, y - 1)) return true; // 上

    path.pop();
    return false;
  }

  dfs(0, 0);
  return {
    path: allPaths[0], // 最短路径
    allPaths: allPaths // 所有可能路径
  };
}

// 显示解决方案路径
window.showSolution = function() {
  console.log("显示路径按钮被点击");
  try {
    if (!currentSolution) {
      console.log("正在计算解决方案...");
      currentSolution = solveMaze();
      console.log("解决方案计算完成", currentSolution);
    }
    
    const cells = mazeContainer.querySelectorAll('.cell');
    console.log(`找到${cells.length}个单元格`);
    
    cells.forEach(cell => cell.classList.remove('path'));
    
    // 保留玩家位置
    const playerCell = document.querySelector('.player');
    if (!playerCell) {
      cells[0].classList.add('player');
    }
    
    console.log("正在高亮路径...");
    currentSolution.path.forEach(({x, y}) => {
      const index = y * cols + x;
      if (cells[index]) {
        cells[index].classList.add('path');
      } else {
        console.error(`无效的单元格索引：${index}`);
      }
    });
    
    // 确保起点和终点状态
    cells[0].classList.add('start');
    cells[cells.length - 1].classList.add('end');
    
    console.log("路径显示完成");
  } catch (error) {
    console.error("显示路径时出错：", error);
  }
}

// 开始游戏
startButton.addEventListener("click", () => {
  // 清除路径显示
  const cells = mazeContainer.querySelectorAll('.cell');
  cells.forEach(cell => cell.classList.remove('path'));
  
  // 重置玩家位置
  document.querySelector(".player")?.classList.remove("player");
  mazeContainer.children[0].classList.add("player");
  
  // 重新计算解决方案
  currentSolution = solveMaze();
  
  // 开始移动
  movePlayer(currentSolution.path);
});

// 监听迷宫大小变化
sizeInput.addEventListener("change", () => {
  const newSize = parseInt(sizeInput.value);
  if (newSize >= 5 && newSize <= 50) {
    rows = cols = newSize;
    maze = generateMaze(rows, cols);
    drawMaze(maze);
    currentSolution = null; // 重置解决方案
  } else {
    alert("迷宫大小必须在5到50之间");
    sizeInput.value = rows; // 恢复原值
  }
});

// 初始化
maze = generateMaze(rows, cols);
drawMaze(maze);
