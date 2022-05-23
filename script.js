Array.prototype.last = function(){return this.length == 0 ? null : this[this.length - 1]}

class Tile{
	constructor(value, x, y, container){
		this.el = document.createElement("div");
		this.el.classList.add("tile");

		container.appendChild(this.el);
		
		this.x = x;
		this.y = y;
		this.value = value;
	}

	get value(){return this._value}
	set value(value){this.el.dataset.value = this._value = value}

	get x(){return this._x}
	set x(x){this.el.style.setProperty("--x", this._x = x)}
	get y(){return this._y}
	set y(y){this.el.style.setProperty("--y", this._y = y)}

	set pos(pos){
		this.el.classList.add("cancel-transition");
		this.el.offsetHeight;
		this.x = pos[0]; this.y = pos[1];
		this.el.classList.remove("cancel-transition");
	}

	merge(other){
	}

	delete(){
		this.el.dataset.deleted = true;
		setTimeout(_=>{
			this.el.parentElement.removeChild(this.el);
		}, 500);
	}
}

class Grid{
	/** @param {HTMLElement} container @param {number} size */
	constructor(container, size = 4){
		this.size = size;
		/** @type {Tile[][]} */
		this.grid = new Array(size).fill(null).map(i => new Array(size).fill(null));

		this.container = container;
		this.container.classList.add("tiles-container");

		this.container.style.setProperty("--size", size)
	}

	addRandom(){
		if(this.full) throw new Error("Error: Cannot add new tile to grid");
		
		//Can only add a tile in an empty space
		let canidates = [].concat(...this.grid
			.map(
				(s,i) => s
					.map((t, j) => [t, i, j])
					.filter(j => j[0] == null)
					.map(j => [j[1], j[2]])
			)
		);

		let pos = canidates[~~(Math.random() * canidates.length)];
		let value = 1 + (Math.random() * 1.5) << 1;
		
		this.grid[pos[0]][pos[1]] = new Tile(value, ...pos, this.container);	
	}

	get full(){return this.grid.every(i => i.every(j => j !== null))}

	_transform(grid, size, direction){
		switch(direction){
			case "UP":
				return grid;
			case "DOWN":
				return grid.map(i => [...i].reverse());
			case "LEFT":
				return new Array(size).fill(null).map((_, i) => grid.map(j => j[i]));
			case "RIGHT":
				return new Array(size).fill(null).map((_, i) => grid.map(j => j[i]).reverse()).reverse();
		}
	}
	
	swipe(direction){
		let changed = false;
		this.grid = this._transform(
			this._transform(this.grid, this.size, direction)
				.map(i => this.step(i, this.reducible_2048, this.reducer_2048))
				.map(i => [...i, ...new Array(this.size - i.length).fill(null)])
			, this.size, direction
		)
		this.grid.forEach((s,i) => s.forEach((t,j) => {
			if(t === null) return;
			
			changed ||= !(i == t._x && j == t._y) || t.merged;

			t.pos = [i, j];
			if(t.merged){
				t.merged.pos = [i, j];
				t.merged = null;
			}
		}))

		return changed;
	}

	move(direction){
		if(this.swipe(direction)){
			this.addRandom();
		}
	}

	reset(){
		this.grid.forEach(s=>s.forEach(t => t !== null ? t.delete() : void 0))
		this.grid = this.grid.map(i => i.map(j => null));
		this.addRandom();
	}
	
	/**
	 * @param {Tile[]} l
	 * @param {(b1:Tile, b2:Tile) => boolean} reducible
	 * @param {(b1:Tile, b2:Tile) => Tile[]} reducer
	 * @returns {Tile[]}
	 */
	step(l,reducible,reducer){
		return l
			.filter(i => i !== null)
			.reduce((l,a) => (
					a !== null && l.last() !== null && reducible(a,l.last())
						? [...l.slice(0,l.length - 1),...reducer(a,l.last()),null]
						: [...l,a]
			), [null]).filter(i => i !== null)
	}
	
	/** @param {Tile} b1 @param {Tile} b2 */
	reducible_2048(b1, b2){
		return b1.value == b2.value;
	}
	
	/** @param {Tile} b1 @param {Tile} b2 */
	reducer_2048(b1, b2){
		b2.value *= 2;
		b2.merged = b1;
		b1.delete();
		return [b2, null];
	}
}

let grid = new Grid(document.body, +window.location.hash.substring(1) || 4);

grid.addRandom();

window.onkeydown = ({key}) => {
	switch(key){
		case "ArrowLeft":
			grid.move("LEFT");
			break;
		case "ArrowRight":
			grid.move("RIGHT");
			break;
		case "ArrowUp":
			grid.move("UP");
			break;
		case "ArrowDown":
			grid.move("DOWN");
			break;
		case "r":
		case "R":
			grid.reset();
			break;
		default:
			console.log(key);
	}
}

{
	document.addEventListener('mousedown', handleTouchStart, false);        
	document.addEventListener('mousemove', handleTouchMove, false);
	document.addEventListener('touchstart', e=>handleTouchStart(e.touches[0]), false);        
	document.addEventListener('touchmove', e=>handleTouchMove(e.touches[0]), false);
	
	var xDown = null;                                                        
	var yDown = null;
	
	function getTouches(evt) {
	  return evt.touches;
	}                                                     
	                                                                         
	function handleTouchStart(evt) {
	    const firstTouch = evt;                                      
	    xDown = firstTouch.clientX;                                      
	    yDown = firstTouch.clientY;                                      
	};                                                
	                                                                         
	function handleTouchMove(evt) {
	    if ( ! xDown || ! yDown ) {
	        return;
	    }
	
	    var xUp = evt.clientX;                                    
	    var yUp = evt.clientY;
	
	    var xDiff = xUp - xDown;
	    var yDiff = yUp - yDown;

	    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
	        if ( xDiff > 0 ) {
	            grid.move("RIGHT");
	        } else {
				grid.move("LEFT");
	        }                       
	    } else {
	        if ( yDiff > 0 ) {
	            grid.move("DOWN");
	        } else { 
	            grid.move("UP");
	        }                                                                 
	    }
		
	    /* reset values */
	    xDown = null;
	    yDown = null;                                             
	};
}

function randMove(){
	grid.move(["UP","DOWN","LEFT","RIGHT"][~~(Math.random() * 4)]);
}