import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x85d6ff);
scene.fog = new THREE.Fog(0x85d6ff, 30, 120);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 190);
camera.position.set(0, 3, 12);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();

const inventoryList = document.getElementById('inventoryList');
const craftingList = document.getElementById('craftingList');
const interactionPrompt = document.getElementById('interactionPrompt');
const overlayMessage = document.getElementById('overlayMessage');
const equippedBox = document.getElementById('equippedBox');
const timeBox = document.getElementById('timeBox');

const hud = {
  healthBar: document.getElementById('healthBar'),
  hungerBar: document.getElementById('hungerBar'),
  thirstBar: document.getElementById('thirstBar'),
  staminaBar: document.getElementById('staminaBar'),
  healthText: document.getElementById('healthText'),
  hungerText: document.getElementById('hungerText'),
  thirstText: document.getElementById('thirstText'),
  staminaText: document.getElementById('staminaText')
};

const world = {
  terrainSize: 200,
  obstacles: [],
  animals: [],
  trees: [],
  rocks: [],
  plants: [],
  waterSources: [],
  buildings: [],
  resources: [],
  fireSources: [],
  campfires: [],
  shelters: [],
  activeNodes: [],
  worldTime: 6.5,
  dayDuration: 180,
  lastSave: 0,
  tick: 0
};

const player = {
  group: null,
  body: null,
  head: null,
  leftArm: null,
  rightArm: null,
  leftLeg: null,
  rightLeg: null,
  feet: null,
  handAnchorLeft: null,
  handAnchorRight: null,
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  position: new THREE.Vector3(0, 2.2, 20),
  yaw: 0,
  pitch: 0.55,
  radius: 0.7,
  moveSpeed: 5.2,
  sprintSpeed: 8.4,
  stamina: 100,
  maxStamina: 100,
  hunger: 100,
  thirst: 100,
  health: 100,
  temp: 24,
  isSprinting: false,
  isBlocking: false,
  isJumping: false,
  jumpVelocity: 0,
  grounded: false,
  interactionRange: 3.2,
  currentTool: null,
  currentWeapon: null,
  attackTimer: 0,
  knockback: new THREE.Vector3(),
  activeAction: null,
  inventory: {
    branch: 0,
    fiber: 0,
    stone: 0,
    wood: 0,
    leaves: 0,
    rope: 0,
    rawMeat: 0,
    cookedMeat: 0,
    dirtyWater: 0,
    cleanWater: 0,
    scrap: 0,
    bark: 0,
    fireStarter: 0,
    campfire: 0,
    primitiveAxe: 0,
    primitivePickaxe: 0,
    primitiveKnife: 0,
    primitiveSpear: 0,
    basicContainer: 0,
    stoneAxe: 0,
    stonePickaxe: 0,
    stoneKnife: 0,
    metalAxe: 0,
    metalPickaxe: 0,
    advancedAxe: 0,
    basicShelter: 0,
    improvedShelter: 0,
    woodenCabin: 0,
    advancedBase: 0
  },
  recipes: []
};

const mobile = {
  active: false,
  joystick: { x: 0, y: 0 },
  attackHeld: false,
  interactHeld: false,
  blockHeld: false,
  jumpHeld: false,
  pointerActive: false,
  pointerStart: { x: 0, y: 0 },
  pointerCurrent: { x: 0, y: 0 }
};

const input = {
  keys: {},
  mouseDown: false,
  pointerX: 0,
  pointerY: 0,
  terrainDrag: false,
  lastPointerX: 0,
  lastPointerY: 0,
  interactQueued: false,
  jumpQueued: false,
  attackQueued: false,
  blockHeld: false,
  draggingCamera: false
};

const recipes = [
  {
    id: 'rope',
    name: 'Rope',
    cost: { fiber: 3 },
    craftTime: 0.3,
    category: 'Materials'
  },
  {
    id: 'primitiveAxe',
    name: 'Primitive Axe',
    cost: { branch: 2, stone: 1 },
    craftTime: 0.3,
    category: 'Tools'
  },
  {
    id: 'primitivePickaxe',
    name: 'Primitive Pickaxe',
    cost: { branch: 2, stone: 1, fiber: 1 },
    craftTime: 0.3,
    category: 'Tools'
  },
  {
    id: 'primitiveKnife',
    name: 'Primitive Knife',
    cost: { branch: 1, stone: 1 },
    craftTime: 0.3,
    category: 'Weapons'
  },
  {
    id: 'primitiveSpear',
    name: 'Primitive Spear',
    cost: { branch: 2, stone: 1, fiber: 1 },
    craftTime: 0.3,
    category: 'Weapons'
  },
  {
    id: 'basicContainer',
    name: 'Basic Container',
    cost: { fiber: 2, rope: 1 },
    craftTime: 0.3,
    category: 'Water'
  },
  {
    id: 'fireStarter',
    name: 'Fire Starter',
    cost: { fiber: 2, branch: 1, stone: 1 },
    craftTime: 0.3,
    category: 'Survival'
  },
  {
    id: 'campfire',
    name: 'Campfire',
    cost: { wood: 3, stone: 2, fiber: 2 },
    craftTime: 0.8,
    category: 'Shelter'
  },
  {
    id: 'basicShelter',
    name: 'Basic Shelter',
    cost: { wood: 6, fiber: 4, stone: 3 },
    craftTime: 1,
    category: 'Shelter'
  },
  {
    id: 'stoneAxe',
    name: 'Stone Axe',
    cost: { wood: 2, stone: 3, fiber: 2 },
    craftTime: 0.4,
    category: 'Tools'
  },
  {
    id: 'stonePickaxe',
    name: 'Stone Pickaxe',
    cost: { wood: 2, stone: 3, rope: 1 },
    craftTime: 0.4,
    category: 'Tools'
  },
  {
    id: 'stoneKnife',
    name: 'Stone Knife',
    cost: { wood: 1, stone: 2, fiber: 1 },
    craftTime: 0.4,
    category: 'Weapons'
  },
  {
    id: 'metalAxe',
    name: 'Metal Axe',
    cost: { stoneAxe: 1, scrap: 2, wood: 2 },
    craftTime: 0.5,
    category: 'Tools'
  },
  {
    id: 'metalPickaxe',
    name: 'Metal Pickaxe',
    cost: { stonePickaxe: 1, scrap: 2, rope: 1 },
    craftTime: 0.5,
    category: 'Tools'
  },
  {
    id: 'advancedAxe',
    name: 'Advanced Axe',
    cost: { metalAxe: 1, scrap: 4, fiber: 3 },
    craftTime: 0.7,
    category: 'Tools'
  },
  {
    id: 'improvedShelter',
    name: 'Improved Shelter',
    cost: { wood: 10, stone: 5, rope: 3 },
    craftTime: 1.1,
    category: 'Shelter'
  },
  {
    id: 'woodenCabin',
    name: 'Wooden Cabin',
    cost: { wood: 16, stone: 8, rope: 6, metalAxe: 1 },
    craftTime: 1.3,
    category: 'Shelter'
  },
  {
    id: 'advancedBase',
    name: 'Advanced Base',
    cost: { wood: 24, stone: 12, rope: 10, metalPickaxe: 1 },
    craftTime: 1.5,
    category: 'Shelter'
  }
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function showMessage(text) {
  overlayMessage.textContent = text;
  overlayMessage.style.opacity = '1';
  clearTimeout(showMessage.timeout);
  showMessage.timeout = setTimeout(() => {
    overlayMessage.style.opacity = '0';
  }, 1200);
}

function addInventoryItem(item, amount = 1) {
  if (player.inventory[item] === undefined) {
    player.inventory[item] = 0;
  }
  player.inventory[item] += amount;
}

function removeInventoryItem(item, amount = 1) {
  if (player.inventory[item] === undefined) return false;
  if (player.inventory[item] < amount) return false;
  player.inventory[item] -= amount;
  return true;
}

function hasIngredients(cost) {
  for (const [key, amount] of Object.entries(cost)) {
    if ((player.inventory[key] || 0) < amount) return false;
  }
  return true;
}

function spendIngredients(cost) {
  for (const [key, amount] of Object.entries(cost)) {
    if (!removeInventoryItem(key, amount)) return false;
  }
  return true;
}

function craftRecipe(recipeId) {
  const recipe = recipes.find((r) => r.id === recipeId);
  if (!recipe) return;
  if (!hasIngredients(recipe.cost)) {
    showMessage('Missing ingredients');
    return;
  }
  if (!spendIngredients(recipe.cost)) {
    showMessage('Crafting failed');
    return;
  }
  addInventoryItem(recipeId, 1);
  showMessage(`${recipe.name} crafted`);
  refreshInventory();
  refreshCrafting();
  saveGame();
}

function refreshInventory() {
  const entries = Object.entries(player.inventory).filter(([, amount]) => amount > 0);
  inventoryList.innerHTML = entries
    .map(([item, amount]) => `<div class="inventory-item"><strong>${item.replace(/([A-Z])/g, ' $1')}</strong><span>x${amount}</span></div>`)
    .join('') || '<div class="inventory-item"><strong>Empty</strong><span>0</span></div>';
}

function refreshCrafting() {
  craftingList.innerHTML = recipes
    .map((recipe) => {
      const locked = !hasIngredients(recipe.cost);
      return `
        <div class="recipe-item">
          <strong>${recipe.name}</strong>
          <button ${locked ? 'disabled' : ''} data-craft="${recipe.id}">${locked ? 'Need: ' + Object.entries(recipe.cost).map(([k, v]) => `${v} ${k}`).join(', ') : 'Craft'}</button>
        </div>
      `;
    }).join('');

  craftingList.querySelectorAll('button[data-craft]').forEach((button) => {
    button.addEventListener('click', () => craftRecipe(button.dataset.craft));
  });
}

function updateEquipmentLabel() {
  const selected = player.currentWeapon || player.currentTool || 'Empty Hands';
  equippedBox.textContent = selected.replace(/([A-Z])/g, ' $1').trim();
}

function attachItemToHand(slot, itemType) {
  const anchor = slot === 'left' ? player.handAnchorLeft : player.handAnchorRight;
  if (!anchor) return;
  while (anchor.children.length) anchor.remove(anchor.children[0]);

  if (!itemType) return;
  const mesh = buildToolMesh(itemType);
  if (mesh) anchor.add(mesh);
}

function buildToolMesh(type) {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x8d6f47, roughness: 0.8 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x5a493a, roughness: 0.9 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x9ea4ad, metalness: 0.4, roughness: 0.4 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7a4d2d, roughness: 0.9 });

  if (type.includes('Axe')) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), woodMat);
    handle.rotation.z = Math.PI / 2.5;
    group.add(handle);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.32), metalMat);
    blade.position.set(0.22, 0.03, 0);
    group.add(blade);
  } else if (type.includes('Pickaxe')) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 8), woodMat);
    handle.rotation.z = Math.PI / 2.5;
    group.add(handle);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.12), metalMat);
    head.position.set(0.2, 0.06, 0);
    group.add(head);
  } else if (type.includes('Knife')) {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), woodMat);
    handle.rotation.z = Math.PI / 2.5;
    group.add(handle);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.08), metalMat);
    blade.position.set(0.18, 0.04, 0);
    group.add(blade);
  } else if (type.includes('Spear')) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), woodMat);
    shaft.rotation.z = Math.PI / 2.5;
    group.add(shaft);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.19, 6), metalMat);
    tip.position.set(0.33, 0.05, 0);
    tip.rotation.z = -Math.PI / 2;
    group.add(tip);
  } else if (type === 'basicContainer' || type === 'dirtyWater' || type === 'cleanWater') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 14), new THREE.MeshStandardMaterial({ color: 0x8db1c9, roughness: 0.7 }));
    body.rotation.z = Math.PI / 2;
    group.add(body);

    const top = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.015, 6, 12), darkMat);
    top.rotation.y = Math.PI / 2;
    top.position.set(0.02, 0.05, 0);
    group.add(top);
  } else {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 8), woodMat);
    handle.rotation.z = Math.PI / 2.3;
    group.add(handle);
  }

  group.scale.set(1.1, 1.1, 1.1);
  return group;
}

function showCraftingWarning() {
  showMessage('Inventory full or item already crafted');
}

function createPlayerModel() {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0d6b8, roughness: 0.9 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1a17, roughness: 0.9 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 4, 10), bodyMat);
  body.position.y = 1.35;
  root.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 18), skinMat);
  head.position.y = 2.4;
  root.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), hairMat);
  hair.scale.set(1.1, 0.65, 1.2);
  hair.position.set(0, 2.6, -0.02);
  root.add(hair);

  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();

  const armGeom = new THREE.CapsuleGeometry(0.14, 0.72, 4, 8);
  const legGeom = new THREE.CapsuleGeometry(0.15, 0.82, 4, 8);

  leftArm.add(new THREE.Mesh(armGeom, skinMat));
  rightArm.add(new THREE.Mesh(armGeom, skinMat));
  leftLeg.add(new THREE.Mesh(legGeom, bodyMat));
  rightLeg.add(new THREE.Mesh(legGeom, bodyMat));

  leftArm.position.set(-0.55, 1.8, 0.0);
  rightArm.position.set(0.55, 1.8, 0.0);
  leftLeg.position.set(-0.2, 0.55, 0.0);
  rightLeg.position.set(0.2, 0.55, 0.0);

  root.add(leftArm);
  root.add(rightArm);
  root.add(leftLeg);
  root.add(rightLeg);

  const leftAnchor = new THREE.Group();
  leftAnchor.position.set(-0.72, 1.45, 0.18);
  leftArm.add(leftAnchor);

  const rightAnchor = new THREE.Group();
  rightAnchor.position.set(0.72, 1.45, 0.18);
  rightArm.add(rightAnchor);

  const feet = new THREE.Group();
  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.5), bodyMat);
  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.5), bodyMat);
  leftFoot.position.set(-0.2, 0.05, 0.08);
  rightFoot.position.set(0.2, 0.05, 0.08);
  feet.add(leftFoot, rightFoot);
  root.add(feet);

  root.position.copy(player.position);
  scene.add(root);

  player.group = root;
  player.body = body;
  player.head = head;
  player.leftArm = leftArm;
  player.rightArm = rightArm;
  player.leftLeg = leftLeg;
  player.rightLeg = rightLeg;
  player.feet = feet;
  player.handAnchorLeft = leftAnchor;
  player.handAnchorRight = rightAnchor;

  // Ensure no starting item is attached.
  attachItemToHand('left', null);
  attachItemToHand('right', null);
  updateEquipmentLabel();
}

function createTerrain() {
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x578d4b, roughness: 1, metalness: 0 });
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 160, 160), groundMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  terrain.position.y = 0;
  scene.add(terrain);

  const terrainGeo = terrain.geometry;
  const pos = terrainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    const h = Math.sin(x * 0.12) * 0.8 + Math.cos(z * 0.15) * 0.8;
    pos.setZ(i, h);
  }
  terrainGeo.computeVertexNormals();

  const shore = new THREE.Mesh(new THREE.CircleGeometry(36, 48), new THREE.MeshStandardMaterial({ color: 0x79a6e8, roughness: 0.7 }));
  shore.rotation.x = -Math.PI / 2;
  shore.position.set(-40, 0.05, 18);
  scene.add(shore);

  const lake = new THREE.Mesh(new THREE.CircleGeometry(20, 44), new THREE.MeshStandardMaterial({ color: 0x4e8ad8, roughness: 0.5, transparent: true, opacity: 0.95 }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(-40, 0.08, 18);
  scene.add(lake);

  const otherLake = new THREE.Mesh(new THREE.CircleGeometry(12, 32), new THREE.MeshStandardMaterial({ color: 0x5ca0d5, roughness: 0.4 }));
  otherLake.rotation.x = -Math.PI / 2;
  otherLake.position.set(44, 0.1, -38);
  scene.add(otherLake);

  const beach = new THREE.Mesh(new THREE.CircleGeometry(24, 32), new THREE.MeshStandardMaterial({ color: 0xe8d7a3, roughness: 1 }));
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(-40, 0.12, 18);
  scene.add(beach);

  world.groundHeight = function (x, z) {
    return Math.sin(x * 0.12) * 0.8 + Math.cos(z * 0.15) * 0.8 + 0.1;
  };
}

function newVector(x, y, z) {
  return new THREE.Vector3(x, y, z);
}

function terrainHeightAt(x, z) {
  return world.groundHeight ? world.groundHeight(x, z) : 0;
}

function addResourceNode(type, x, z, scale = 1) {
  let object;
  let radius = 1.6;
  const resource = {
    id: `${type}-${Math.random().toString(16).slice(2,8)}`,
    type,
    position: new THREE.Vector3(x, 0, z),
    group: null,
    health: 100,
    maxHealth: 100,
    respawnTime: 45000,
    active: true,
    radius,
    work: 0,
    color: 0x000000,
    hideAt: 0,
    loot: []
  };

  if (type === 'tree') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.4, 8), new THREE.MeshStandardMaterial({ color: 0x6a4221, roughness: 0.9 }));
    trunk.position.y = 1.7;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.25 + scale * 0.35, 7, 7), new THREE.MeshStandardMaterial({ color: 0x3d8f43, roughness: 0.9 }));
    crown.position.y = 3.5;
    const root = new THREE.Group();
    root.add(trunk, crown);
    root.position.set(x, terrainHeightAt(x, z), z);
    root.scale.setScalar(scale);
    root.castShadow = true;
    root.receiveShadow = true;
    scene.add(root);
    resource.group = root;
    resource.radius = 1.8 * scale;
    resource.loot = ['branch', 'wood', 'bark'];
  } else if (type === 'rock') {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9 + scale * 0.7, 0), new THREE.MeshStandardMaterial({ color: 0x7a7f85, roughness: 1 }));
    rock.position.set(x, terrainHeightAt(x, z) + 0.75, z);
    rock.scale.setScalar(scale);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
    resource.group = rock;
    resource.radius = 1.4 * scale;
    resource.loot = ['stone', 'scrap'];
  } else if (type === 'plant') {
    const plant = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0x4ea860, roughness: 0.8 }));
      stem.position.set(Math.sin(i) * 0.2, 0.35, Math.cos(i) * 0.2);
      plant.add(stem);
    }
    plant.position.set(x, terrainHeightAt(x, z) + 0.1, z);
    plant.scale.setScalar(scale);
    scene.add(plant);
    resource.group = plant;
    resource.radius = 1.2 * scale;
    resource.loot = ['fiber', 'leaves'];
  } else if (type === 'water') {
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.65, 24), new THREE.MeshStandardMaterial({ color: 0x4a7bdd, roughness: 0.3, transparent: true, opacity: 0.9 }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, terrainHeightAt(x, z) + 0.08, z);
    scene.add(water);
    resource.group = water;
    resource.radius = 1.8;
    resource.loot = ['dirtyWater'];
  }

  world.resources.push(resource);
  world.activeNodes.push(resource);
  world.obstacles.push({ type, radius: resource.radius, position: resource.position, group: resource.group });
  return resource;
}

function populateWorld() {
  createTerrain();
  const treePositions = [
    [-12, -24], [8, 30], [18, -8], [26, 12], [35, 28], [-28, -10], [-15, 18], [0, -20], [15, -26], [12, 14], [-9, 30], [32, -24]
  ];
  treePositions.forEach(([x, z], index) => addResourceNode('tree', x, z, 0.9 + (index % 3) * 0.12));

  const rockPositions = [
    [-18, -8], [10, 22], [22, -22], [34, 8], [-9, -30], [45, -5], [14, 34], [28, 30], [-30, 24], [0, 18]
  ];
  rockPositions.forEach(([x, z], index) => addResourceNode('rock', x, z, 0.8 + (index % 2) * 0.35));

  const plantPositions = [
    [16, 6], [4, -14], [-8, 10], [20, 26], [30, -30], [-22, 18], [26, 20], [-34, -20], [14, -3], [6, 11]
  ];
  plantPositions.forEach(([x, z], index) => addResourceNode('plant', x, z, 0.7 + (index % 4) * 0.18));

  const waterAreas = [
    [-40, 18], [44, -38]
  ];
  waterAreas.forEach(([x, z]) => addResourceNode('water', x, z, 1));

  createAnimal('deer', -14, 10, 'passive');
  createAnimal('deer', 22, -8, 'passive');
  createAnimal('boar', 8, 18, 'defensive');
  createAnimal('boar', -25, -20, 'defensive');
  createAnimal('wolf', 36, 18, 'aggressive');
  createAnimal('wolf', -42, 32, 'aggressive');

  createStaticSunAndMoon();
  createLights();
  createPlayerModel();
}

function createStaticSunAndMoon() {
  const sunGeo = new THREE.SphereGeometry(3.4, 16, 16);
  const sun = new THREE.Mesh(sunGeo, new THREE.MeshStandardMaterial({ emissive: 0xffd166, emissiveIntensity: 0.8, color: 0xffd166 }));
  sun.position.set(0, 55, -55);
  scene.add(sun);

  const moon = new THREE.Mesh(sunGeo, new THREE.MeshStandardMaterial({ emissive: 0xc7d6ff, emissiveIntensity: 0.7, color: 0xc7d6ff }));
  moon.position.set(0, 50, 60);
  moon.scale.setScalar(0.75);
  scene.add(moon);

  world.sun = sun;
  world.moon = moon;
} 

function createLights() {
  const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x315f4a, 1.4);
  scene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xfff5c1, 1.2);
  sunLight.position.set(18, 36, 12);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 90;
  sunLight.shadow.camera.left = -30;
  sunLight.shadow.camera.right = 30;
  sunLight.shadow.camera.top = 30;
  sunLight.shadow.camera.bottom = -30;
  scene.add(sunLight);
  world.sunLight = sunLight;

  const ambientNight = new THREE.AmbientLight(0x3d4d7d, 0.5);
  ambientNight.visible = false;
  scene.add(ambientNight);
  world.ambientNight = ambientNight;
}

function updateLighting() {
  const time = world.worldTime;
  const normalized = (time % 24) / 24;
  const daylight = Math.max(0, Math.sin((normalized - 0.25) * Math.PI * 2));
  const darkness = 1 - daylight;

  world.sunLight.intensity = 0.4 + daylight * 1.4;
  world.ambientNight.intensity = darkness * 0.9;
  world.sunLight.color.setHSL(0.1, 0.6, 0.5 + daylight * 0.3);
  scene.background = new THREE.Color().setHSL(0.59, 0.7, 0.4 + daylight * 0.4);
  scene.fog.color = new THREE.Color().setHSL(0.59, 0.75, 0.46 + daylight * 0.3);

  if (world.sun) {
    world.sun.position.x = 42 * Math.sin(normalized * Math.PI * 2);
    world.sun.position.z = -42 * Math.cos(normalized * Math.PI * 2);
    world.sun.position.y = 25 + daylight * 24;
  }

  if (world.moon) {
    world.moon.position.x = -42 * Math.sin(normalized * Math.PI * 2);
    world.moon.position.z = 42 * Math.cos(normalized * Math.PI * 2);
    world.moon.position.y = 15 + darkness * 20;
  }
}

function createAnimal(type, x, z, behavior) {
  const palette = {
    deer: { body: 0xc4b088, accent: 0x8e6f48 },
    boar: { body: 0x8d724d, accent: 0x54442e },
    wolf: { body: 0x7a849d, accent: 0x4d5f7d }
  };

  const base = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 1.5), new THREE.MeshStandardMaterial({ color: palette[type].body, roughness: 0.9 }));
  body.position.y = 0.68;
  base.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.6), new THREE.MeshStandardMaterial({ color: palette[type].accent, roughness: 0.9 }));
  head.position.set(0.8, 0.95, 0);
  base.add(head);

  const legs = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.2), new THREE.MeshStandardMaterial({ color: 0x3a2f2a, roughness: 1 }));
    const sx = i < 2 ? -0.35 : 0.35;
    const sz = i % 2 === 0 ? -0.55 : 0.55;
    leg.position.set(sx, 0.35, sz);
    legs.add(leg);
  }
  base.add(legs);

  base.position.set(x, terrainHeightAt(x, z), z);
  base.rotation.y = Math.random() * Math.PI * 2;
  scene.add(base);

  const animal = {
    id: `animal-${Math.random().toString(16).slice(2, 8)}`,
    type,
    group: base,
    position: new THREE.Vector3(x, terrainHeightAt(x, z), z),
    velocity: new THREE.Vector3(),
    state: 'idle',
    home: new THREE.Vector3(x, 0, z),
    wanderTarget: new THREE.Vector3(x + (Math.random() - 0.5) * 8, 0, z + (Math.random() - 0.5) * 8),
    detectionRange: type === 'wolf' ? 13 : type === 'boar' ? 9 : 7,
    hearingRange: 11,
    speed: type === 'wolf' ? 4.4 : type === 'boar' ? 2.9 : 3.2,
    damage: type === 'wolf' ? 12 : type === 'boar' ? 14 : 8,
    health: type === 'wolf' ? 40 : type === 'boar' ? 48 : 32,
    maxHealth: type === 'wolf' ? 40 : type === 'boar' ? 48 : 32,
    alertTimer: 0,
    cooldown: 0,
    fleeBias: type === 'deer' ? 1 : 0,
    aggression: type === 'wolf' ? 1 : type === 'boar' ? 0.8 : 0.2,
    attackRange: 2.3,
    radius: 0.9
  };

  world.animals.push(animal);
}

function getNearestInteractable() {
  let nearest = null;
  let nearestDist = Infinity;

  const p = player.position;

  for (const node of world.resources) {
    if (!node.active) continue;
    const dist = p.distanceTo(node.position);
    if (dist < nearestDist && dist < player.interactionRange + node.radius) {
      nearest = { node, type: node.type, distance: dist };
      nearestDist = dist;
    }
  }

  for (const building of world.buildings) {
    const dist = p.distanceTo(building.position);
    if (dist < nearestDist && dist < 4) {
      nearest = { node: building, type: building.type, distance: dist };
      nearestDist = dist;
    }
  }

  if (player.currentTool || player.currentWeapon) {
    // Add nearby campfire / shelter / water container interactions.
  }

  return nearest;
}

function updateInteractionPrompt() {
  const nearest = getNearestInteractable();
  if (!nearest) {
    interactionPrompt.style.display = 'none';
    return;
  }

  const label = getInteractionText(nearest);
  interactionPrompt.textContent = label;
  interactionPrompt.style.display = 'block';
}

function getInteractionText(nearest) {
  const { type, node } = nearest;

  if (type === 'tree') return 'Chop Tree';
  if (type === 'rock') return 'Mine Stone';
  if (type === 'plant') return 'Gather Fiber';
  if (type === 'water') return 'Collect Water';
  if (type === 'campfire') return 'Light Fire';
  if (type === 'basicShelter') return 'Build Shelter';
  if (type === 'fireStarter') return 'Craft Fire';
  if (type === 'animalCorpse') return 'Harvest Meat';
  return 'Interact';
}

function handleInteraction() {
  const nearest = getNearestInteractable();
  if (!nearest) {
    showMessage('Nothing nearby to interact with');
    return;
  }

  const { node, type } = nearest;
  if (type === 'tree') gatherTree(node);
  else if (type === 'rock') gatherRock(node);
  else if (type === 'plant') gatherPlant(node);
  else if (type === 'water') gatherWater(node);
  else if (type === 'campfire') useCampfire(node);
  else if (type === 'basicShelter') buildShelter(node);
  else if (type === 'animalCorpse') harvestMeat(node);
}

function gatherTree(node) {
  const tool = player.currentTool || 'primitiveAxe';
  if (!tool || !tool.includes('Axe')) {
    if (!player.currentWeapon) {
      showMessage('You need an axe to gather wood');
      return;
    }
  }

  if (node.health <= 0) return;
  node.health -= 22 + (player.currentTool && player.currentTool.includes('Axe') ? 16 : 0);
  player.stamina = Math.max(0, player.stamina - 8);

  if (node.health <= 0) {
    addInventoryItem('branch', 1 + (player.currentTool && player.currentTool.includes('Axe') ? 1 : 0));
    addInventoryItem('wood', 1 + (player.currentTool && player.currentTool.includes('Axe') ? 1 : 0));
    addInventoryItem('bark', 1);
    const tree = node.group;
    if (tree) {
      tree.visible = false;
      node.active = false;
      node.hideAt = Date.now() + 25000;
    }
    showMessage('Tree harvested');
  } else {
    showMessage('Chopping tree');
  }
  refreshInventory();
  saveGame();
}

function gatherRock(node) {
  const tool = player.currentTool || 'primitivePickaxe';
  if (!tool || !tool.includes('Pickaxe')) {
    showMessage('You need a pickaxe to mine stone');
    return;
  }

  node.health -= 25 + (player.currentTool && player.currentTool.includes('Pickaxe') ? 14 : 0);
  player.stamina = Math.max(0, player.stamina - 7);

  if (node.health <= 0) {
    addInventoryItem('stone', 2 + (player.currentTool && player.currentTool.includes('Pickaxe') ? 1 : 0));
    addInventoryItem('scrap', 1);
    node.group.visible = false;
    node.active = false;
    node.hideAt = Date.now() + 35000;
    showMessage('Rock mined');
  }
  refreshInventory();
  saveGame();
}

function gatherPlant(node) {
  node.health -= 20;
  if (node.health <= 0) {
    addInventoryItem('fiber', 2 + (Math.random() > 0.5 ? 1 : 0));
    addInventoryItem('leaves', 1);
    node.group.visible = false;
    node.active = false;
    node.hideAt = Date.now() + 18000;
    showMessage('Plant gathered');
  }
  refreshInventory();
  saveGame();
}

function gatherWater(node) {
  const containerCount = player.inventory.basicContainer || 0;
  if (containerCount <= 0) {
    showMessage('Need a basic container');
    return;
  }

  if (player.inventory.cleanWater > 0 || player.inventory.dirtyWater > 0) {
    showMessage('Your container already has water');
    return;
  }

  if (player.inventory.basicContainer > 0) {
    removeInventoryItem('basicContainer', 1);
    addInventoryItem('dirtyWater', 1);
    showMessage('Filled container with water');
    refreshInventory();
    saveGame();
  }
}

function craftContainerIfNeeded() {
  if (player.inventory.basicContainer <= 0 && hasIngredients({ fiber: 2, rope: 1 })) {
    craftRecipe('basicContainer');
  }
}

function useCampfire(node) {
  const hasFireStarter = player.inventory.fireStarter > 0;
  if (!hasFireStarter) {
    showMessage('Need a fire starter');
    return;
  }
  if (!node.active) {
    showMessage('Campfire is already lit');
    return;
  }

  node.active = false;
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xffaa00, emissiveIntensity: 2 }));
  flame.position.set(node.position.x, node.position.y + 0.5, node.position.z);
  scene.add(flame);
  node.flame = flame;
  world.campfires.push(node);
  showMessage('Fire lit');
  saveGame();
}

function buildShelter(node) {
  if (!node) return;
  const recipe = recipes.find((r) => r.id === 'basicShelter');
  if (!recipe) return;
  if (!hasIngredients(recipe.cost)) {
    showMessage('Need shelter materials');
    return;
  }
  if (!spendIngredients(recipe.cost)) {
    showMessage('Cannot place shelter');
    return;
  }
  const shelter = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.8, 3.6), new THREE.MeshStandardMaterial({ color: 0x8d6a3d, roughness: 0.95 }));
  base.position.y = 0.4;
  shelter.add(base);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.6, 4), new THREE.MeshStandardMaterial({ color: 0x433129, roughness: 0.9 }));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.4;
  shelter.add(roof);

  const x = player.position.x + 4;
  const z = player.position.z + 2;
  shelter.position.set(x, terrainHeightAt(x, z), z);
  scene.add(shelter);

  world.buildings.push({
    type: 'basicShelter',
    group: shelter,
    position: new THREE.Vector3(x, terrainHeightAt(x, z), z),
    radius: 3,
    hp: 100
  });
  showMessage('Basic shelter built');
  refreshInventory();
  saveGame();
}

function createCampfire(x, z) {
  const group = new THREE.Group();
  const stoneRing = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.3, 12), new THREE.MeshStandardMaterial({ color: 0x8e8e8e, roughness: 0.9 }));
  stoneRing.position.y = 0.2;
  group.add(stoneRing);

  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), new THREE.MeshStandardMaterial({ color: 0xff964b, emissive: 0xff8c00, emissiveIntensity: 2.2 }));
  flame.position.y = 0.7;
  group.add(flame);

  group.position.set(x, terrainHeightAt(x, z), z);
  scene.add(group);
  world.campfires.push({ type: 'campfire', group, position: group.position, radius: 1.8, flame, lit: true, fuel: 80 });
  world.buildings.push({ type: 'campfire', position: group.position, radius: 1.6, group });
}

function setEquip(itemId) {
  if (!itemId) {
    player.currentTool = null;
    player.currentWeapon = null;
    attachItemToHand('left', null);
    attachItemToHand('right', null);
    updateEquipmentLabel();
    return;
  }

  if (itemId.includes('Axe') || itemId.includes('Pickaxe') || itemId.includes('Knife') || itemId.includes('Spear')) {
    if (itemId.includes('Axe') || itemId.includes('Pickaxe')) {
      player.currentTool = itemId;
      player.currentWeapon = null;
      attachItemToHand('right', itemId);
      attachItemToHand('left', null);
    } else {
      player.currentWeapon = itemId;
      player.currentTool = null;
      attachItemToHand('right', null);
      attachItemToHand('left', itemId);
    }
  } else if (itemId === 'basicContainer') {
    player.currentTool = 'basicContainer';
    attachItemToHand('right', 'basicContainer');
  }

  updateEquipmentLabel();
}

function handleInventorySelection(index) {
  const entries = Object.entries(player.inventory).filter(([, amount]) => amount > 0);
  if (!entries[index]) return;
  const [item] = entries[index];
  if (item.includes('Axe') || item.includes('Pickaxe') || item.includes('Knife') || item.includes('Spear') || item === 'basicContainer') {
    setEquip(item);
  }
}

function createSaveData() {
  return {
    player: {
      position: player.position.toArray(),
      yaw: player.yaw,
      hunger: player.hunger,
      thirst: player.thirst,
      health: player.health,
      stamina: player.stamina,
      inventory: player.inventory
    },
    world: {
      time: world.worldTime,
      resources: world.resources.map((r) => ({
        id: r.id,
        type: r.type,
        health: r.health,
        maxHealth: r.maxHealth,
        active: r.active,
        position: r.position.toArray(),
        hideAt: r.hideAt || 0
      })),
      buildings: world.buildings.map((b) => ({
        type: b.type,
        position: b.position.toArray(),
        hp: b.hp || 100
      }))
    }
  };
}

function saveGame() {
  localStorage.setItem('wildfallSave', JSON.stringify(createSaveData()));
}

function loadGame() {
  const data = localStorage.getItem('wildfallSave');
  if (!data) return;

  try {
    const save = JSON.parse(data);
    if (!save || !save.player) return;
    const pos = save.player.position;
    player.position.set(pos[0], pos[1], pos[2]);
    player.yaw = save.player.yaw || 0;
    player.hunger = save.player.hunger || 100;
    player.thirst = save.player.thirst || 100;
    player.health = save.player.health || 100;
    player.stamina = save.player.stamina || 100;
    player.inventory = { ...player.inventory, ...save.player.inventory };
    world.worldTime = save.world?.time || 6.5;

    if (save.world?.resources) {
      world.resources.forEach((res) => {
        const saved = save.world.resources.find((r) => r.id === res.id);
        if (saved) {
          res.health = saved.health;
          res.active = saved.active;
          res.position.set(...saved.position);
          res.group.visible = saved.active;
          if (!saved.active) res.group.visible = false;
          res.hideAt = saved.hideAt || 0;
        }
      });
    }

    if (save.world?.buildings) {
      save.world.buildings.forEach((building) => {
        const buildingObj = new THREE.Mesh(new THREE.BoxGeometry(4, 2.6, 4), new THREE.MeshStandardMaterial({ color: 0x8d6a3d, roughness: 0.9 }));
        buildingObj.position.set(building.position[0], terrainHeightAt(building.position[0], building.position[2]) + 1.3, building.position[2]);
        scene.add(buildingObj);
        world.buildings.push({ type: building.type, position: new THREE.Vector3(building.position[0], terrainHeightAt(building.position[0], building.position[2]), building.position[2]), group: buildingObj, radius: 3.5, hp: building.hp || 100 });
      });
    }
  } catch (e) {
    console.warn('Save load failed', e);
  }
}

function handleAttack() {
  if (player.attackTimer > 0) return;
  const attackRange = 3.1;
  let bestTarget = null;
  let bestDist = Infinity;

  for (const animal of world.animals) {
    const dist = animal.position.distanceTo(player.position);
    if (dist < attackRange && dist < bestDist) {
      const dirToAnimal = animal.position.clone().sub(player.position).normalize();
      const facing = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw)).normalize();
      const angle = dirToAnimal.dot(facing);
      if (angle > 0.15) {
        bestTarget = animal;
        bestDist = dist;
      }
    }
  }

  if (bestTarget) {
    const weapon = player.currentWeapon || 'primitiveKnife';
    const damage = weapon.includes('Spear') ? 18 : weapon.includes('Knife') ? 14 : 11;
    bestTarget.health -= damage;
    player.attackTimer = 0.5;
    player.stamina = Math.max(0, player.stamina - 10);
    showMessage(`${bestTarget.type} hit`);

    if (bestTarget.health <= 0) {
      showMessage(`${bestTarget.type} defeated`);
      bestTarget.group.visible = false;
      addInventoryItem('rawMeat', 1);
      refreshInventory();
      world.animals = world.animals.filter((a) => a !== bestTarget);
    }
  } else {
    showMessage('Attack missed');
  }
}

function updatePlayerMovement(delta) {
  const moveInputX = (input.keys['KeyD'] || input.keys['ArrowRight'] ? 1 : 0) - (input.keys['KeyA'] || input.keys['ArrowLeft'] ? 1 : 0) + mobile.joystick.x;
  const moveInputZ = (input.keys['KeyW'] || input.keys['ArrowUp'] ? 1 : 0) - (input.keys['KeyS'] || input.keys['ArrowDown'] ? 1 : 0) + mobile.joystick.y;

  const move = new THREE.Vector3(moveInputX, 0, moveInputZ);
  if (move.lengthSq() > 0) {
    move.normalize();
  }

  const yawCos = Math.cos(player.yaw);
  const yawSin = Math.sin(player.yaw);
  const forward = new THREE.Vector3(-yawSin, 0, -yawCos);
  const right = new THREE.Vector3(yawCos, 0, -yawSin);
  const desired = new THREE.Vector3();
  desired.addScaledVector(forward, move.z);
  desired.addScaledVector(right, move.x);

  if (desired.lengthSq() > 0) desired.normalize();

  const sprint = (input.keys['ShiftLeft'] || input.keys['ShiftRight'] || mobile.active && input.keys['KeyX']) && !player.isBlocking;
  const speed = sprint ? player.sprintSpeed : player.moveSpeed;
  const desiredVelocity = desired.multiplyScalar(speed);
  player.velocity.x = THREE.MathUtils.lerp(player.velocity.x, desiredVelocity.x, 0.18);
  player.velocity.z = THREE.MathUtils.lerp(player.velocity.z, desiredVelocity.z, 0.18);

  if (sprint) {
    player.stamina = Math.max(0, player.stamina - 18 * delta);
  } else {
    player.stamina = Math.min(player.maxStamina, player.stamina + 14 * delta);
  }

  if (player.stamina <= 0) {
    player.velocity.multiplyScalar(0.4);
  }

  const nextX = player.position.x + player.velocity.x * delta;
  const nextZ = player.position.z + player.velocity.z * delta;
  const height = terrainHeightAt(nextX, nextZ) + 1.3;

  const colliders = world.obstacles.filter((o) => o.type !== 'water');
  let correctedX = nextX;
  let correctedZ = nextZ;

  for (const obstacle of colliders) {
    const dx = correctedX - obstacle.position.x;
    const dz = correctedZ - obstacle.position.z;
    const dist = Math.hypot(dx, dz);
    const minDist = obstacle.radius + player.radius + 0.18;
    if (dist < minDist) {
      const angle = Math.atan2(dz, dx);
      const push = minDist - dist;
      correctedX += Math.cos(angle) * push;
      correctedZ += Math.sin(angle) * push;
    }
  }

  player.position.x = correctedX;
  player.position.z = correctedZ;
  player.position.y = height;

  if (Math.abs(player.velocity.x) + Math.abs(player.velocity.z) > 0.01) {
    player.group.rotation.y = Math.atan2(player.velocity.x, player.velocity.z) + Math.PI;
  }

  if (player.isJumping) {
    player.jumpVelocity -= 18 * delta;
    player.position.y += player.jumpVelocity * delta;
    if (player.position.y <= terrainHeightAt(player.position.x, player.position.z) + 1.15) {
      player.position.y = terrainHeightAt(player.position.x, player.position.z) + 1.15;
      player.isJumping = false;
      player.jumpVelocity = 0;
    }
  }

  if (input.jumpQueued) {
    if (player.position.y <= terrainHeightAt(player.position.x, player.position.z) + 1.3) {
      player.isJumping = true;
      player.jumpVelocity = 7.5;
    }
    input.jumpQueued = false;
  }
}

function updateResources(delta) {
  const now = Date.now();
  for (const node of world.resources) {
    if (!node.active && now >= node.hideAt) {
      node.active = true;
      node.health = node.maxHealth;
      if (node.group) node.group.visible = true;
    }
  }
}

function updateAnimals(delta) {
  const playerPos = player.position.clone();
  for (const animal of world.animals) {
    const dist = animal.position.distanceTo(playerPos);

    if (world.worldTime > 18 || world.worldTime < 5) {
      if (animal.type === 'deer' && Math.random() < 0.001) animal.state = 'sleep';
    }

    if (animal.state === 'sleep') {
      animal.group.rotation.y += delta * 0.3;
      if (Math.random() < 0.003) animal.state = 'idle';
      continue;
    }

    if (dist < animal.detectionRange) {
      const dir = playerPos.clone().sub(animal.position).normalize();
      if (animal.type === 'deer' || animal.type === 'boar') {
        animal.state = dist < animal.attackRange ? 'defend' : 'alert';
      } else {
        animal.state = 'hunt';
      }
      if (animal.type !== 'wolf' && dist < 4) {
        animal.state = 'flee';
      }
    } else {
      animal.state = animal.state === 'alert' ? 'idle' : 'idle';
    }

    if (animal.state === 'idle' || animal.state === 'wander') {
      const target = animal.wanderTarget;
      const dir = target.clone().sub(animal.position);
      if (dir.length() < 1.2) {
        animal.wanderTarget = new THREE.Vector3(
          animal.home.x + (Math.random() - 0.5) * 12,
          0,
          animal.home.z + (Math.random() - 0.5) * 12
        );
      } else {
        dir.normalize();
        animal.position.addScaledVector(dir, animal.speed * delta);
        animal.group.position.x = animal.position.x;
        animal.group.position.z = animal.position.z;
        animal.group.position.y = terrainHeightAt(animal.position.x, animal.position.z) + 0.08;
      }
    }

    if (animal.state === 'alert' || animal.state === 'hunt') {
      const dir = playerPos.clone().sub(animal.position).normalize();
      animal.position.addScaledVector(dir, animal.speed * delta * (animal.type === 'wolf' ? 1.2 : 0.7));
      animal.group.lookAt(playerPos.x, animal.group.position.y, playerPos.z);
      animal.group.position.x = animal.position.x;
      animal.group.position.z = animal.position.z;
      animal.group.position.y = terrainHeightAt(animal.position.x, animal.position.z) + 0.08;
    }

    if (animal.state === 'flee') {
      const dir = animal.position.clone().sub(playerPos).normalize();
      animal.position.addScaledVector(dir, animal.speed * delta * 1.6);
      animal.group.position.x = animal.position.x;
      animal.group.position.z = animal.position.z;
      animal.group.position.y = terrainHeightAt(animal.position.x, animal.position.z) + 0.08;
    }

    if (animal.state === 'defend') {
      const dir = playerPos.clone().sub(animal.position).normalize();
      if (dist <= animal.attackRange + 0.4) {
        if (animal.cooldown <= 0) {
          player.health = Math.max(0, player.health - animal.damage);
          showMessage(`${animal.type} attacked`);
          animal.cooldown = 1.2;
        }
      }
      animal.position.addScaledVector(dir, animal.speed * delta * 0.5);
      animal.group.position.x = animal.position.x;
      animal.group.position.z = animal.position.z;
      animal.group.position.y = terrainHeightAt(animal.position.x, animal.position.z) + 0.08;
    }

    animal.cooldown = Math.max(0, animal.cooldown - delta);
  }
}

function updateSurvival(delta) {
  player.hunger = Math.max(0, player.hunger - 0.3 * delta);
  player.thirst = Math.max(0, player.thirst - 0.45 * delta);

  if (player.hunger <= 15 || player.thirst <= 10) {
    player.health = Math.max(0, player.health - 2.5 * delta);
  }

  if (world.worldTime > 18 || world.worldTime < 6) {
    const cold = world.worldTime < 6 || world.worldTime > 19 ? 1 : 0;
    player.temp = clamp(player.temp - cold * 0.8 * delta, 0, 40);
    if (cold) player.health = Math.max(0, player.health - 0.8 * delta);
  }

  if (player.health <= 0) {
    player.health = 100;
    player.position.set(0, 2.2, 12);
    showMessage('You were overwhelmed. Returned to camp.');
  }

  const lightFactor = (Math.sin((world.worldTime / 24) * Math.PI * 2 - 0.8) + 1) * 0.5;
  if (lightFactor < 0.25) {
    player.stamina = Math.max(0, player.stamina - 4 * delta);
  }
}

function updateUI() {
  hud.healthBar.style.width = `${player.health}%`;
  hud.hungerBar.style.width = `${player.hunger}%`;
  hud.thirstBar.style.width = `${player.thirst}%`;
  hud.staminaBar.style.width = `${player.stamina}%`;
  hud.healthText.textContent = Math.ceil(player.health).toString();
  hud.hungerText.textContent = Math.ceil(player.hunger).toString();
  hud.thirstText.textContent = Math.ceil(player.thirst).toString();
  hud.staminaText.textContent = Math.ceil(player.stamina).toString();

  const hours = Math.floor(world.worldTime) % 24;
  const minutes = Math.floor((world.worldTime % 1) * 60);
  timeBox.textContent = `Day ${Math.floor(world.worldTime / 24) + 1} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  if (player.currentTool || player.currentWeapon) {
    updateEquipmentLabel();
  }
}

function updateCamera(delta) {
  const targetPos = player.position.clone();
  const camDistance = 6.5;
  const maxPitch = Math.PI / 2.2;
  const minPitch = -0.3;

  player.pitch = clamp(player.pitch, minPitch, maxPitch);
  const camY = targetPos.y + 2.2 + Math.sin(player.pitch) * camDistance;
  const camX = targetPos.x + Math.cos(player.pitch) * Math.cos(player.yaw) * camDistance;
  const camZ = targetPos.z + Math.cos(player.pitch) * Math.sin(player.yaw) * camDistance;

  const desiredPos = new THREE.Vector3(camX, camY, camZ);
  const dir = desiredPos.clone().sub(targetPos).normalize();
  const rayStart = targetPos.clone();

  let hit = false;
  const ray = new THREE.Raycaster(rayStart.clone(), dir, 0.2, 7);
  const intersects = ray.intersectObjects(scene.children, true);
  for (const hitObj of intersects) {
    if (hitObj.object !== player.group && hitObj.object !== camera) {
      if (hitObj.distance < 5.2) {
        hit = true;
        const adjusted = targetPos.clone().add(dir.clone().multiplyScalar(hitObj.distance - 0.5));
        desiredPos.copy(adjusted);
        break;
      }
    }
  }

  camera.position.lerp(desiredPos, 0.08);
  camera.lookAt(targetPos.x, targetPos.y + 1.6, targetPos.z);
}

function updateBuildGhost() {
  if (!world.buildGhost) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x7ceaa0, emissive: 0x1a7f3e, transparent: true, opacity: 0.5 });
    const ghost = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.2, 3.6), mat);
    ghost.position.set(player.position.x + 3, terrainHeightAt(player.position.x + 3, player.position.z + 2) + 1.1, player.position.z + 2);
    ghost.visible = false;
    scene.add(ghost);
    world.buildGhost = ghost;
  }

  const ghost = world.buildGhost;
  const x = player.position.x + 3;
  const z = player.position.z + 2;
  ghost.position.set(x, terrainHeightAt(x, z) + 1.1, z);
  ghost.visible = true;

  let valid = true;
  for (const obstacle of world.obstacles) {
    const dx = x - obstacle.position.x;
    const dz = z - obstacle.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < obstacle.radius + 2.5) valid = false;
  }
  ghost.material.color.set(valid ? 0x7ceaa0 : 0xf05d5d);
  ghost.material.opacity = valid ? 0.5 : 0.4;
}

function handleKeydown(event) {
  input.keys[event.code] = true;
  if (event.code === 'KeyE') {
    handleInteraction();
  }
  if (event.code === 'Space') {
    input.jumpQueued = true;
  }
  if (event.code === 'KeyQ') {
    player.isBlocking = !player.isBlocking;
  }
  if (event.code === 'KeyF') {
    handleAttack();
  }
  if (event.code === 'KeyV') {
    const entries = Object.entries(player.inventory).filter(([, amount]) => amount > 0);
    if (entries.length) handleInventorySelection(0);
  }
}

function handleKeyup(event) {
  input.keys[event.code] = false;
}

function setupInput() {
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('keyup', handleKeyup);

  canvas.addEventListener('pointerdown', (event) => {
    input.mouseDown = true;
    input.draggingCamera = true;
    input.lastPointerX = event.clientX;
    input.lastPointerY = event.clientY;
  });

  window.addEventListener('pointermove', (event) => {
    if (!input.draggingCamera) return;
    const dx = event.clientX - input.lastPointerX;
    const dy = event.clientY - input.lastPointerY;
    input.lastPointerX = event.clientX;
    input.lastPointerY = event.clientY;
    player.yaw -= dx * 0.004;
    player.pitch = clamp(player.pitch - dy * 0.0035, -0.3, 1.3);
  });

  window.addEventListener('pointerup', () => {
    input.draggingCamera = false;
    input.mouseDown = false;
  });

  document.getElementById('attackButton').addEventListener('click', handleAttack);
  document.getElementById('interactButton').addEventListener('click', handleInteraction);
  document.getElementById('jumpButton').addEventListener('click', () => { input.jumpQueued = true; });
  document.getElementById('blockButton').addEventListener('mousedown', () => { player.isBlocking = true; });
  document.getElementById('blockButton').addEventListener('mouseup', () => { player.isBlocking = false; });
  document.getElementById('blockButton').addEventListener('mouseleave', () => { player.isBlocking = false; });

  const joyBase = document.getElementById('joystickBase');
  const joyStick = document.getElementById('joystickStick');
  let joyPointerId = null;

  joyBase.addEventListener('pointerdown', (event) => {
    joyPointerId = event.pointerId;
    mobile.active = true;
    joyBase.setPointerCapture(event.pointerId);
    updateJoy(event);
  });

  joyBase.addEventListener('pointermove', (event) => {
    if (joyPointerId !== null && event.pointerId === joyPointerId) updateJoy(event);
  });

  joyBase.addEventListener('pointerup', () => {
    joyPointerId = null;
    mobile.active = false;
    mobile.joystick.x = 0;
    mobile.joystick.y = 0;
    joyStick.style.transform = 'translate(0px,0px)';
  });

  function updateJoy(event) {
    const rect = joyBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const max = 28;
    const dist = Math.hypot(dx, dy);
    if (dist > max) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * max;
      dy = Math.sin(angle) * max;
    }
    mobile.joystick.x = dx / max;
    mobile.joystick.y = -dy / max;
    joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  if (window.innerWidth <= 700) {
    document.getElementById('mobileControls').style.display = 'block';
  }
}

function updateWorldTime(delta) {
  world.worldTime += delta / world.dayDuration;
  if (world.worldTime > 24) world.worldTime -= 24;
  updateLighting();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onResize);

function applyInitialProgression() {
  // Start with empty hands, no item; crafting steps must be earned through gameplay.
  player.inventory.branch = 0;
  player.inventory.fiber = 0;
  player.inventory.stone = 0;
  player.inventory.wood = 0;
  player.inventory.rope = 0;
  player.inventory.basicContainer = 0;
  player.inventory.fireStarter = 0;
  player.currentTool = null;
  player.currentWeapon = null;
  attachItemToHand('left', null);
  attachItemToHand('right', null);
  updateEquipmentLabel();
  refreshInventory();
  refreshCrafting();
}

function initialize() {
  populateWorld();
  applyInitialProgression();
  setupInput();
  loadGame();
  refreshInventory();
  refreshCrafting();
  updateUI();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.033);

  updateWorldTime(delta * 0.2);
  updatePlayerMovement(delta);
  updateAnimals(delta);
  updateSurvival(delta);
  updateResources(delta);
  updateInteractionPrompt();
  updateBuildGhost();
  updateUI();

  if (player.attackTimer > 0) {
    player.attackTimer -= delta;
  }

  const newDay = (world.worldTime + delta * 0.22) % 24;
  world.worldTime = newDay;

  const root = player.group;
  root.position.copy(player.position);
  root.position.y = player.position.y - 1.2;

  // Animate empty hand behavior naturally.
  const armSwing = Math.sin(performance.now() * 0.005 + player.position.x) * 0.3;
  player.leftArm.rotation.x = armSwing;
  player.rightArm.rotation.x = -armSwing;
  player.leftLeg.rotation.x = -armSwing * 0.5;
  player.rightLeg.rotation.x = armSwing * 0.5;

  updateCamera(delta);
  renderer.render(scene, camera);

  if (performance.now() - world.lastSave > 6000) {
    saveGame();
    world.lastSave = performance.now();
  }
}

initialize();
animate();

window.addEventListener('contextmenu', (event) => event.preventDefault());

window.addEventListener('beforeunload', () => saveGame());
