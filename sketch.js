let currentRoom;
let rooms;
let playerPos;
let didWin;
let debug = false;
let boxes;

let roomMissionVar = {
	1: {"leverFlicked": false},
	2: {"allPlatesActive": false}
}

/*
 - - Kendte bugs/ting der kan fikses - - 

  - Fiks mission level 2. Lige nu kan den løses hvis alle kasser er på samme plade.

  - Kasser kan gå ind i hinanden

  - Hvis kasse er op af væggen kan man gå igennem den.

*/

function setup() {
	createCanvas(windowWidth, windowHeight);
	
	newGame();
}

function newGame() {
	currentRoom = {"n": 1};
	rooms = [];
	if(currentRoom["n"]!==1) {for(let i = 0; i < currentRoom["n"]-1; i++) {rooms.push({})}} 
	didWin = undefined;
	boxes = [];
	updateRoom();
}

function draw() {
	if(frameCount !== 1) {	
		if(didWin == undefined && currentRoom) { //spil aktivt
			background(240);
			drawRoom(currentRoom); //tegn først det aktive rum
			updatePlayer(currentRoom); //opdater spiller
			handleRoomMission(currentRoom);
		} else if(didWin !== undefined) drawEndScreen(); 
	}
}

function handleRoomMission(room) {
	if(room["plateActive"] === false) room["map"][2][room["map"][0].length-1] = 1;
	else if(room["plateActive"] === true) room["map"][2][room["map"][0].length-1] = 0;

	if(debug) { room["plateActive"] = true }

	if(room["n"] === 1) {
		//flick lever
		//if player overlaps lever		
		if(gridData(room, rectOverlaps(room, playerPos["x"], playerPos["y"])).includes(3)) {
			if(mouseIsPressed) {
				roomMissionVar[room["n"]]["leverFlicked"] = true;
				room["map"][4][1] = 0;
			}
		}

		if(roomMissionVar[room["n"]]["leverFlicked"] === true) {
			if(gridData(room, rectOverlaps(room, playerPos["x"], playerPos["y"])).includes(2)) {
				room["plateActive"] = true;
			}
		}
	} else if(room["n"] === 2) {
		if(room["map"]) {
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
		}
	} else if(room["n"] === 3) {
		if(room["map"]) {
			if(gridData(room, rectOverlaps(room, playerPos["x"], playerPos["y"])).includes(2)) {
				room["plateActive"] = true;
			}
			guard1.show();

			if(guard1.distance() < guard1.size/7) {
				didWin = false;
			}

			if(guard1.distance() < 20) {
				guard1.move();
			}

			if(room["plateActive"]) guard1.speed = 2.1;
		}
	}

//else if(room["n"] === 2) {}
}

class box {
	constructor(room,x,y) {
		this.room = room;
		this.coordinate = gridToPixel(room, x, y);
		this.x = this.coordinate["x"];
		this.y = this.coordinate["y"];

		this.size = this.room["gridDimensions"]*0.8
	}

	show() {
		fill(130,60,0)
		rect(this.x, this.y, this.size, this.size)
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

		this.size = this.room["gridDimensions"]*0.8
		this.speed = 1.1;
	}

	show() {
		fill(120,0,150)
		rect(this.x, this.y, this.size, this.size)
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
		
		if (gridData(this.room, gridOverlap).includes(1)) {
			canMoveX = false;
		}

		//try vertical movement
		let canMoveY = true;
		let guardCornersY = getRectCorners(this.x, proposedY, this.size, 0.1)
		let gridOverlapY = pixelToGrid(this.room, guardCornersY);

		if (gridData(this.room, gridOverlapY).includes(1)) {
			canMoveY = false;
		}



		if (canMoveX) this.x = proposedX;
		if (canMoveY) this.y = proposedY;
	}
}

function drawEndScreen() {
		background(240);
		
		if(didWin) drawRoom(rooms[currentRoom["n"]-2]); 
		else drawRoom(rooms[currentRoom["n"]-1]); 

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
		text("New Game", width/2, height*0.58)
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

function updateRoom(side) {
	if(rooms[currentRoom["n"]-1]) {
		currentRoom = rooms[currentRoom["n"]-1]
		if(side==="left") playerPos = gridToPixel(currentRoom, currentRoom["map"][0].length-2, 2);
		else if(side==="right") playerPos = gridToPixel(currentRoom, 1, 2);
	} else {
	loadRoom(currentRoom["n"], room => { 
		rooms.push({
			"n": currentRoom["n"],
			"map": room, 
			"gridDimensions": calcGridDimensions(room),
			"plateActive": false //pressure plate
		}
	)
		currentRoom = rooms[currentRoom["n"]-1]

		if(currentRoom["n"]===1) playerPos = gridToPixel(currentRoom, 2, 2);
		else playerPos = gridToPixel(currentRoom, 1, 2);

		initNewRoom(currentRoom);
	});
}
/**/ /*let room = [[1,1,0,1,0],[0,1,0,0,1],[0,0,0,0,0],[1,0,0,1,0],[0,1,0,1,1]];
		currentRoom = {"map": room, "startX": 1, "startY": 2, "gridDimensions": calcGridDimensions(room)} 
	*/
}

let guard1;

function initNewRoom(room) {
	if(room["n"] === 2) {
		let box1 = new box(room, 2, 2);
		let box2 = new box(room, 5, 4);
		let box3 = new box(room, 3, 5);
		boxes.push(box1, box2, box3)
	} else if(room["n"] === 3) {
		guard1 = new guard(room, 10, 10)
	}
}

let size;
function updatePlayer(room) {
	//initialize player
	size = room["gridDimensions"]*0.8;
	let speed = room["gridDimensions"]/20;

	if(!didWin) {
		movePlayer(room, speed);

		//draw player
		fill("blue");
		rect(playerPos["x"],playerPos["y"], size, size);
	}

	//update room left
	if(playerPos["x"]-1 <= width/2-(room["map"][0].length/2*room["gridDimensions"])) 
	{currentRoom = {"n": currentRoom["n"]-1}; playerPos["x"]+=50; updateRoom("left");/*currentRoom["n"]--; playerPos["x"]+=50; updateRoom();*/ }
	//update room right
	if(playerPos["x"]+1 >= width/2+(room["map"][0].length/2*room["gridDimensions"])-size) 
	{currentRoom = {"n": currentRoom["n"]+1}; playerPos["x"]-=50; updateRoom("right");/*currentRoom["n"]++; playerPos["x"]-=50; updateRoom(); */}

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

function drawRoom(room) {
	for(let x = 0; x < room["map"][0].length; x++) {
		for(let y = 0; y < room["map"].length; y++) {
			//color the map
			if(room["map"][y][x] === 0) noFill();
			else if(room["map"][y][x] === 1) fill(0);
			else if(room["map"][y][x] === 2) fill("red");
			else if(room["map"][y][x] === 3) fill("blue");

			//draw grid
			reeleKoordinater = gridToPixel(room,x,y);
			rect(reeleKoordinater["x"], reeleKoordinater["y"], room["gridDimensions"], room["gridDimensions"])
		}
	}
}

function loadRoom(n, callback) { //laver et array der beskriver room[n], returnerer room

	let room = [];

	loadImage(`assets/rooms/room${n}.png`, 
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

		callback(room);
	}, 
	() => {
		//Room does not exist
		if(didWin !== undefined) return;
		didWin = true;
	});
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