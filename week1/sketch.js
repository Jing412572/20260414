function setup() {
	createCanvas(windowWidth, windowHeight);
	background(100);
}

function draw() {
	colorMode(HSB);
	background(100);
	for(var x =0;x<width;x=x+50){
		for(var y=0;y<height;y=y+50){
			var h = (map(x,0,width,0,360) + frameCount) % 360
			fill(h,mouseY/5,mouseX/5)
			ellipse(x, y, 50); //圓，座標(x,y)，寬50，高50
		}
	}	
}
