let currentRoom;
let rooms = [];
let playerPos;
let didWin = undefined;

let roomMissionVar = {
	1: {"leverFlicked": false},
	2: {}
}


function setup() {
	createCanvas(windowWidth, windowHeight);

	newGame();
}

function newGame() {	
	currentRoom = {"n": 1}
	didWin = undefined;
	updateRoom();
}

function draw() { 
	if(frameCount !== 1) {
		
		if(didWin == undefined && currentRoom) { //spil aktivt
			background(240); //console.log(currentRoom["n"])
			drawRoom(currentRoom); //tegn først det aktive rum
			updatePlayer(currentRoom); //opdater spiller
			handleRoomMission(currentRoom);
		} else if(didWin !== undefined) drawEndScreen(); 

	}
	//console.log(rooms)
}

function handleRoomMission(room) {
	if(room["plateActive"] === false) room["map"][2][room["map"][0].length-1] = 1;
	else if(room["plateActive"] === true) room["map"][2][room["map"][0].length-1] = 0;

	if(room["n"] === 1) {
		//flick lever
		//if player overlaps lever		
		if(gridData(room, 0, playerOverlaps(room, playerPos["x"], playerPos["y"])).includes(3)) {
			if(mouseIsPressed) {
				roomMissionVar[room["n"]]["leverFlicked"] = true;
				room["map"][4][1] = 0;
			}
		}

		
		if(roomMissionVar[room["n"]]["leverFlicked"] === true) {
			if(gridData(room, 0, playerOverlaps(room, playerPos["x"], playerPos["y"])).includes(2)) {
				room["plateActive"] = true;
			}
		}
	}
}

function drawEndScreen() {
		background(240);
		drawRoom(rooms[currentRoom["n"]-2]);

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
		} else {fill(255);}
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

function updateRoom() {
	if(rooms[currentRoom["n"]-1]) {
		currentRoom = rooms[currentRoom["n"]-1]
		playerPos = gridToPixel(currentRoom, currentRoom["startX"], currentRoom["startY"]);
	} else {
	loadRoom(currentRoom["n"], room => { 
		rooms.push({"n": currentRoom["n"],
			//"n": currentRoom["n"],
			"map": room, 
			"startX": 1, //starting from 0
			"startY": 2, //starting from 0
			"gridDimensions": calcGridDimensions(room),
			"plateActive": false //pressure plate
		}
	)
		currentRoom = rooms[currentRoom["n"]-1]

		playerPos = gridToPixel(currentRoom, currentRoom["startX"], currentRoom["startY"]);
	});
}
/**/ /*let room = [[1,1,0,1,0],[0,1,0,0,1],[0,0,0,0,0],[1,0,0,1,0],[0,1,0,1,1]];
		currentRoom = {"map": room, "startX": 1, "startY": 2, "gridDimensions": calcGridDimensions(room)} 
	*/
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
	{currentRoom = {"n": currentRoom["n"]-1}; playerPos["x"]+=50; updateRoom();/*currentRoom["n"]--; playerPos["x"]+=50; updateRoom();*/ }
	//update room right
	if(playerPos["x"]+1 >= width/2+(room["map"][0].length/2*room["gridDimensions"])-size) 
	{currentRoom = {"n": currentRoom["n"]+1}; playerPos["x"]-=50; updateRoom();/*currentRoom["n"]++; playerPos["x"]-=50; updateRoom(); */}

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

	let g1 = pixelToGrid(room, proposedX + offset, playerPos["y"] + offset); //corner TL
	let g2 = pixelToGrid(room, proposedX + offset, playerPos["y"] + size - offset); //corner BL
	let g3 = pixelToGrid(room, proposedX + size - offset, playerPos["y"] + offset); //corner TR
	let g4 = pixelToGrid(room, proposedX + size - offset, playerPos["y"] + size - offset); //corner BR

	if (gridData(room, g1) === 1 || gridData(room, g2) === 1 ||
		gridData(room, g3) === 1 || gridData(room, g4) === 1) {
		canMoveX = false;
	}

	//try vertical movement
	let canMoveY = true;

	let gy1 = pixelToGrid(room, playerPos["x"] + offset, proposedY + offset);
	let gy2 = pixelToGrid(room, playerPos["x"] + size - offset, proposedY + offset);
	let gy3 = pixelToGrid(room, playerPos["x"] + offset, proposedY + size - offset);
	let gy4 = pixelToGrid(room, playerPos["x"] + size - offset, proposedY + size - offset);

	//console.log(g1,g2,g3,g4,gy1,gy2,gy3,gy4)

	if (gridData(room, gy1) === 1 || gridData(room, gy2) === 1 ||
		gridData(room, gy3) === 1 || gridData(room, gy4) === 1) {
		canMoveY = false;
	}

	//move player
	if (canMoveX) playerPos["x"] = proposedX;
	if (canMoveY) playerPos["y"] = proposedY;
}

function playerOverlaps(room, x, y) {
	let g1 = pixelToGrid(room, x, y)
	let g2 = pixelToGrid(room, x, y+size)
	let g3 = pixelToGrid(room, x+size, y)
	let g4 = pixelToGrid(room, x+size, y+size)

	return [g1,g2,g3,g4]
}
/*
function arrayContainsCoordinates(array, coordinate) {
	for(let i = 0; i < array.length; i++) {
		if(array[i]["x"] === coordinate["x"] && array[i]["y"] === coordinate["y"]) return true;
	}
	return false;
}*/

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

function pixelToGrid(room,x,y) { //omdanner pixel koordinater til grid koordinater
	let dx = room["map"][0].length, dy = room["map"].length;
	let originX = width/2 - dx/2 * room["gridDimensions"];
	let originY = height/2 - dy/2 * room["gridDimensions"];

	let gx = floor((x - originX) / room["gridDimensions"]);
	let gy = floor((y - originY) / room["gridDimensions"]);

	return {"x": gx, "y": gy}
}

function gridData(room, gridPos, array) { //henter tal fra specifikt gridpunkt, eller array af punkter
	if(array) {
		let data = [];
		for(let i = 0; i < array.length; i++) {
			data.push(room["map"][array[i]["y"]][array[i]["x"]]);
		}
		return data;
	} else {
		let dx = room["map"][0].length, dy = room["map"].length;
		let gx = gridPos["x"], gy = gridPos["y"]; //grid x and y

		if (gx < 0 || gy < 0 || gx >= dx || gy >= dy) return 1;
		else return room["map"][gy][gx];
	}

}