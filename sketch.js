let currentRoom;
let rooms = [];
let playerPos;
let didWin;
let debug = false;
let boxes = [];
let size;
let roomMissionVar;
let walkingAnimation = [[],[],[],[]];

let textures = {}

function preload() {
	//load rooms
	for(let i = 0; i < 3; i++) {

		let room = loadRoom(i);

		rooms.push({
			"n": i,
			"map": room, 
			"gridDimensions": 0,
			"plateActive": undefined //pressure plate
		})		
	}

	//load images
	characterIMG = loadImage(`assets/textures/Characters/Character.png`)
	//walking animations
	for(let i = 0; i < 4; i++) {
		img = loadImage(`assets/textures/Characters/Walk/Left/${i+1}.png`) 
		walkingAnimation[0].push(img)
		img = loadImage(`assets/textures/Characters/Walk/Up/${i+1}.png`)
		walkingAnimation[1].push(img)
		img = loadImage(`assets/textures/Characters/Walk/Right/${i+1}.png`) 
		walkingAnimation[2].push(img)
		img = loadImage(`assets/textures/Characters/Walk/Down/${i+1}.png`) 
		walkingAnimation[3].push(img)
	} 


	textures.lever = {}
	textures.lever.off = loadImage(`assets/textures/Interactive/Lever/lever_off.png`)
	textures.lever.on = loadImage(`assets/textures/Interactive/Lever/lever_on.png`)

    textures.pressurePlate = {}
    textures.pressurePlate.off = loadImage(`assets/textures/Interactive/Pressure plate/pressure_plate_off.png`)
	textures.pressurePlate.on = loadImage(`assets/textures/Interactive/Pressure plate/pressure_plate_on.png`)

    textures.box = loadImage(`assets/textures/box.png`)
}

function loadRoom(n) { //laver et array der beskriver room[n], returnerer room

	let room = [];
	
	loadImage(`assets/rooms/room${n+1}.png`, 
		img => {
		//Room exists
		img.loadPixels(); 
			
		for(let y = 0; y < img.height; y++) {
			room.push([]);
			for(let x = 0; x < img.width; x++) {
				pixelR = img.pixels[y*img.width*4+x*4];
				pixelG = img.pixels[y*img.width*4+x*4+1];
				pixelB = img.pixels[y*img.width*4+x*4+2];
				//pixelA = img.pixels[y*img.width*4+x*4+3];

				//white pixels / floor == 0
				if(pixelR === 255 && pixelG === 255 && pixelB === 255) room[y].push(0);
				//black pixels / wall == 1
				else if(pixelR === 0 && pixelG === 0 && pixelB === 0) room[y].push(1);
				//red pixel / pressure plate
				else if(pixelR === 255 && pixelG === 0 && pixelB === 0) room[y].push(2);
				//blue pixel / lever
				else if(pixelR === 0 && pixelG === 0 && pixelB === 255) room[y].push(3);
			}
		}
	});

	return room;
}

function setup() { 
	createCanvas(windowWidth, windowHeight);
	noSmooth();

	newGame();
}

function newGame() {
	roomMissionVar = {
	0: {"leverFlicked": false},
	1: {"allPlatesActive": false}
	}

	boxes=[];

	//calculate grid dimensions and initialize rooms
	for(let i = 0; i < 3; i++) {
		if(debug) rooms[i]["plateActive"] = true;
		else rooms[i]["plateActive"] = false;

		rooms[i]["gridDimensions"] = calcGridDimensions(rooms[i]["map"])
		initNewRoom(i);
	}

	currentRoom = 0;
	didWin = undefined;
	
	playerPos = gridToPixel(rooms[currentRoom], 2, 2);
}

function draw() {
	if(didWin == undefined) {
		if(currentRoom < rooms.length) { //spil aktivt
			background(240); 
			drawRoom(currentRoom); //tegn først det aktive rum
			updatePlayer(rooms[currentRoom]); //opdater spiller
			if(currentRoom === rooms.length) {didWin = true; return; }
			handleRoomMission(rooms[currentRoom]);
		} 	
	} else drawEndScreen();
}

let onClick = false;
let clickLocked = false;  
function handleRoomMission(room) {
	if(room["plateActive"] === false) {room["map"][2][room["map"][0].length-1] = 1;}
	else if(room["plateActive"] === true) {room["map"][2][room["map"][0].length-1] = 0;}

	if(debug) { room["plateActive"] = true }

	if(room["n"] === 0) {
		//flick lever
		//if player overlaps lever		
		if(gridData(room, rectOverlaps(room, playerPos["x"], playerPos["y"])).includes(3)) {
            if (mouseIsPressed) {
                if (!clickLocked) { onClick = true; clickLocked = true;} 
                else { onClick = false; }
            } else { clickLocked = false; onClick = false; }

            if(onClick) {
                if(roomMissionVar[room["n"]]["leverFlicked"]) roomMissionVar[room["n"]]["leverFlicked"] = false;
				else roomMissionVar[room["n"]]["leverFlicked"] = true;
            }
			
		}
		if(roomMissionVar[room["n"]]["leverFlicked"] === true) room["map"][4][1] = 0;
		else room["map"][4][1] = 1;

		if(roomMissionVar[room["n"]]["leverFlicked"] === true) {
			if(gridData(room, rectOverlaps(room, playerPos["x"], playerPos["y"])).includes(2)) {
				room["plateActive"] = true;
			}
		}
	} else if(room["n"] === 1) {
			let playerEdges = getRectEdges(playerPos["x"], playerPos["y"]);
			
			let platesActive = 0;

			for(i in boxes) {
				boxes[i].show();
				boxes[i].move(playerEdges);

				//win criteria
				if(gridData(room, rectOverlaps(room, boxes[i].x, boxes[i].y)).includes(2)) {
					platesActive++;
				}
			}

			if(platesActive===3 && gridData(room, rectOverlaps(room, playerPos["x"], playerPos["y"])).includes(2)) {
				room["plateActive"] = true;
			}

	} else if(room["n"] === 2) {
			if(gridData(room, rectOverlaps(room, playerPos["x"], playerPos["y"])).includes(2)) {
				room["plateActive"] = true;
			}
			guard1.show();

			if(guard1.distance() < guard1.size/7) {
				didWin = false;
			}
			
			if(guard1.distance() < room["gridDimensions"]/3) {
				guard1.move();
			}

			if(room["plateActive"]) {guard1.speed = room["gridDimensions"]/30;}
	}

//else if(room["n"] === 2) {}
}

class box {
	constructor(room,x,y) {
		this.room = room;
		this.coordinate = gridToPixel(room, x, y);
		this.x = this.coordinate["x"];
		this.y = this.coordinate["y"];

		this.size = room["gridDimensions"]*0.8
	}

	show() {
		fill(130,60,0)
        image(textures.box, this.x, this.y, this.size, this.size)
		//rect(this.x, this.y, this.size, this.size)
	}

	move(playerEdges) {
		if((playerEdges["right"] >= boxes[i].x && playerEdges["left"] <= boxes[i].x+boxes[i].size) && (playerEdges["bottom"] >= boxes[i].y && playerEdges["top"] <= boxes[i].y+boxes[i].size)) {
					
			let overlapLeft = playerEdges["right"] - boxes[i].x;
			let overlapRight = (boxes[i].x + boxes[i].size) - playerEdges["left"];
			let overlapTop = playerEdges["bottom"] - boxes[i].y;
			let overlapBottom = (boxes[i].y + boxes[i].size) - playerEdges["top"];

			let minOverlap = min(overlapLeft, overlapRight, overlapTop, overlapBottom);
			
			let proposedX = boxes[i].x
			let proposedY = boxes[i].y

			if(minOverlap === overlapLeft) proposedX = playerEdges["right"];
			if(minOverlap === overlapRight) proposedX = playerEdges["left"]-boxes[i].size;
			if(minOverlap === overlapTop) proposedY = playerEdges["bottom"];
			if(minOverlap === overlapBottom) proposedY = playerEdges["top"]-boxes[i].size; 

			let canMoveX = true;
			let boxCorners = getRectCorners(proposedX, boxes[i].y, boxes[i].size, 0.1);
			let gridOverlap = pixelToGrid(this.room, boxCorners);
			
			if (gridData(this.room, gridOverlap).includes(1)) {
				canMoveX = false;
			}

			//try vertical movement
			let canMoveY = true;
			let boxCornersY = getRectCorners(boxes[i].x, proposedY, boxes[i].size, 0.1)
			let gridOverlapY = pixelToGrid(this.room, boxCornersY);

			if (gridData(this.room, gridOverlapY).includes(1)) {
				canMoveY = false;
			}

			if (canMoveX) boxes[i].x = proposedX;
			if (canMoveY) boxes[i].y = proposedY;
		}
	}
}

class guard {
	constructor(room,x,y) {
		this.room = room;
		this.coordinate = gridToPixel(room, x, y);
		this.x = this.coordinate["x"];
		this.y = this.coordinate["y"];

		this.size =  room["gridDimensions"]*0.8
		this.speed = room["gridDimensions"]/35;
	}

	show() {
		fill(120,0,150);
        image(characterIMG,this.x, this.y, this.size, this.size)
	}

	distance() {
		let dx = abs(playerPos["x"]-this.x);
		let dy = abs(playerPos["y"]-this.y);
		return Math.sqrt((dx^2)+(dy^2))
	}

	move() {
		let proposedX = this.x
		let proposedY = this.y
		
		if(playerPos["x"] < this.x) proposedX-=this.speed;
		if(playerPos["x"] > this.x) proposedX+=this.speed;
		if(playerPos["y"] < this.y) proposedY-=this.speed;
		if(playerPos["y"] > this.y) proposedY+=this.speed;

		let canMoveX = true;
		let guardCorners = getRectCorners(proposedX, this.y, this.size, 0.1);
		let gridOverlap = pixelToGrid(this.room, guardCorners);
		

		let canMoveY = true;
		let guardCornersY = getRectCorners(this.x, proposedY, this.size, 0.1)
		let gridOverlapY = pixelToGrid(this.room, guardCornersY);



		if (gridData(this.room, gridOverlap).includes(1)) {
			canMoveX = false;
		}
		if (gridData(this.room, gridOverlapY).includes(1)) {
			canMoveY = false;
		}

		if (canMoveX) this.x = proposedX;
		if (canMoveY) this.y = proposedY;
	}
}

function drawEndScreen() {
	background(240);

	if(didWin) drawRoom(currentRoom-1);
	else drawRoom(currentRoom); 

	background(40,40,40,250);

	fill(255); textAlign(CENTER, CENTER); textSize(max(width, height)*0.04);

	if(didWin) text("You Won!", width/2, height/2);
	else text("You Lost!", width/2, height/2);


	//hover restartbutton
	if(mouseX > width/2-max(width, height)*0.06 && mouseX <width/2-max(width, height)*0.06+max(width, height)*0.12) {
		if(mouseY > height*0.55 && mouseY < height*0.55+height*0.06) {
			fill(200);
			if(mouseIsPressed) newGame();
		}
	} else fill(255);

	rect(width/2-max(width, height)*0.06, height*0.55, max(width, height)*0.12, height*0.06);
	fill(0); textSize(max(width, height)*0.02);
	text("Try Again", width/2, height*0.58);
}

function calcGridDimensions(room) {
	let dx = room[0].length, dy = room.length;
	let w = width, h = height;

	let gridDimension;

	if(dx >= dy) {
		if(h >= w) gridDimension = w/dx
		else if(h <= w) gridDimension = h/dx
	} else if(dx <= dy) {
		if(w >= h) gridDimension = h/dy
		else if(h >= w) gridDimension = w/dy
	}
	
	return gridDimension;
}

let guard1;
function initNewRoom(n) {
	if(n === 1) {
		let box1 = new box(rooms[n], 2, 2);
		let box2 = new box(rooms[n], 5, 4);
		let box3 = new box(rooms[n], 3, 5);
		boxes.push(box1, box2, box3)
	} else if(n === 2) {
		guard1 = new guard(rooms[n], 10, 10)
	}
}

function updatePlayer(room) {
	//initialize player
	size = room["gridDimensions"]*0.8;
	let speed = room["gridDimensions"]/20;

	if(!didWin) {
		movePlayer(room, speed);

		//draw player
		//fill("blue");
		//rect(playerPos["x"],playerPos["y"], size, size);
		//image(imageTEST,playerPos["x"],playerPos["y"], size, size)
	}


	//update room right
	if(playerPos["x"]+5 >= width/2+(room["map"][0].length/2*room["gridDimensions"])-size) 
	{currentRoom++; if(currentRoom < rooms.length){playerPos=gridToPixel(rooms[currentRoom], 0, 2); playerPos["x"]+=20;}}
	//update room left
	if(playerPos["x"]-5 <= width/2-(room["map"][0].length/2*room["gridDimensions"])) 
	{currentRoom--; playerPos=gridToPixel(rooms[currentRoom], rooms[currentRoom]["map"][0].length-1, 2);}
}

function movePlayer(room, speed) {
	let offset = 0.1;  //lille offset som gør player hitbox lidt mindre så player kan komme helt op af væggen

	let moveLeft = (keyIsDown(65) || keyIsDown(37));
	let moveRight = (keyIsDown(68) || keyIsDown(39));
	let moveUp = (keyIsDown(87) || keyIsDown(38));
	let moveDown = (keyIsDown(83) || keyIsDown(40));

	let proposedX = playerPos["x"];
	let proposedY = playerPos["y"];

	if(moveLeft) proposedX -= speed;
	if(moveRight) proposedX += speed;
	if(moveUp) proposedY -= speed;
	if(moveDown) proposedY += speed;

	//try horizontal movement
	let canMoveX = true;
	let playerCorners = getRectCorners(proposedX, playerPos["y"], size, offset);
	let gridOverlap = pixelToGrid(room, playerCorners);

	if (gridData(room, gridOverlap).includes(1)) {
		canMoveX = false;
	}

	//try vertical movement
	let canMoveY = true;
	let playerCornersY = getRectCorners(playerPos["x"], proposedY, size, offset)
	let gridOverlapY = pixelToGrid(room, playerCornersY);

	if (gridData(room, gridOverlapY).includes(1)) {
		canMoveY = false;
	}

	//move player
	if (canMoveX) playerPos["x"] = proposedX;
	if (canMoveY) playerPos["y"] = proposedY;
	
	drawPlayer(moveLeft,moveUp,moveRight,moveDown)
}

let animationFrame = 0;

function drawPlayer(moveLeft,moveUp,moveRight,moveDown) {
	let x = playerPos["x"], y = playerPos["y"], s = size;
	let img = characterIMG;

	if(moveLeft) img = updatePlayerSprite(animationFrame, 0)
	else if(moveUp) img = updatePlayerSprite(animationFrame, 1)
	else if(moveRight) img = updatePlayerSprite(animationFrame, 2)
	else if(moveDown) img = updatePlayerSprite(animationFrame, 3)

	if(frameCount%5 === 0 && animationFrame<4) animationFrame++;
	else if(animationFrame === 4) animationFrame = 0;
	image(img, x, y, s, s)
}

function updatePlayerSprite(frame, direction) {
	if(frame===0) img = walkingAnimation[direction][1]
	if(frame===1) img = walkingAnimation[direction][2]
	if(frame===2) img = walkingAnimation[direction][3]
	if(frame===3) img = walkingAnimation[direction][0]

	return img;
}

function getRectEdges(x,y) {
	return {"left": x, "right": x+size, "top": y, "bottom": y+size}
}

function getRectCorners(x,y,size,offset) {
	let TL = {"x": x + offset, "y": y + offset}
	let BL = {"x": x + offset, "y": y + size - offset}
	let TR = {"x": x + size - offset, "y": y + offset}
	let BR = {"x": x + size - offset, "y": y + size - offset}

	return [TL, BL, TR, BR]
}

function rectOverlaps(room, x, y) {
	return pixelToGrid(room, [{"x": x, "y": y},{"x": x, "y": y+size},{"x": x+size, "y": y},{"x": x+size, "y": y+size}])
}

function drawRoom(n) {
	let room = rooms[n]

	for(let x = 0; x < room["map"][0].length; x++) {
		for(let y = 0; y < room["map"].length; y++) {
			reeleKoordinater = gridToPixel(room,x,y);

			//color the map
			if(room["map"][y][x] === 0) noFill();
			else if(room["map"][y][x] === 1) fill(0,0,0,100);
			else if(room["map"][y][x] === 2) { //pressure plate
                fill(0,0,0,0);
                if(!room["plateActive"]) drawTexture(textures.pressurePlate.off, reeleKoordinater["x"], reeleKoordinater["y"], room["gridDimensions"])
				if(room["plateActive"]) drawTexture(textures.pressurePlate.on, reeleKoordinater["x"], reeleKoordinater["y"], room["gridDimensions"])
                }   
			else if(room["map"][y][x] === 3) { //lever
				fill(0,0,0,0);
				if(!roomMissionVar[room["n"]]["leverFlicked"]) drawTexture(textures.lever.off, reeleKoordinater["x"], reeleKoordinater["y"], room["gridDimensions"])
				if(roomMissionVar[room["n"]]["leverFlicked"]) drawTexture(textures.lever.on, reeleKoordinater["x"], reeleKoordinater["y"], room["gridDimensions"])
			}
			//draw grid
			rect(reeleKoordinater["x"], reeleKoordinater["y"], room["gridDimensions"], room["gridDimensions"])
		}
	}
}

function drawTexture(texture, x, y, s)  {//x,y, size
	image(texture, x, y, s, s)
}

function gridToPixel(room,x,y) { //tager imod koordinatpunkt på grid, og omdanner til faktiske pixel koordinater
	let dx = room["map"][0].length, dy = room["map"].length;
	
	let rx = width/2-dx/2*room["gridDimensions"]+x*room["gridDimensions"]; //reel x
	let ry = height/2-dy/2*room["gridDimensions"]+y*room["gridDimensions"]; //reel y

	return {"x": rx, "y": ry}
}

function pixelToGrid(room, array) { //omdanner pixel koordinat(er) til grid koordinater
	let dx = room["map"][0].length, dy = room["map"].length;
	let originX = width/2 - dx/2 * room["gridDimensions"];
	let originY = height/2 - dy/2 * room["gridDimensions"];

	//if(array) {
		let data = [];
		for(let i = 0; i < array.length; i++) { // [{"x": x, "y": y},{"x": x, "y": y}...]
			let gx = floor((array[i]["x"] - originX) / room["gridDimensions"]);
			let gy = floor((array[i]["y"] - originY) / room["gridDimensions"]);

			data.push( {"x": gx, "y": gy} );
		}
		return data;
	/*} else {


		

		return {"x": gx, "y": gy}
	}*/
}

function gridData(room, array) { //henter tal fra specifikt gridpunkt, eller array af punkter
	let dx = room["map"][0].length, dy = room["map"].length;
	//if(array) {
		let data = [];
		for(let i = 0; i < array.length; i++) {
			let gx = array[i]["x"], gy = array[i]["y"];

			if (gx < 0 || gy < 0 || gx >= dx || gy >= dy) data.push(1);
			else data.push(room["map"][gy][gx]);
		}
		return data;
	/*} else {
		let dx = room["map"][0].length, dy = room["map"].length;
		let gx = gridPos["x"], gy = gridPos["y"]; //grid x and y

		
		else return room["map"][gy][gx];
	}
		
		let gx = gridPos["x"], gy = gridPos["y"];
		let data = [];
		for(let i = 0; i < array.length; i++) {
			data.push(room["map"][array[i]["y"]][array[i]["x"]]);
		}
		return data;*/
}