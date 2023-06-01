"use strict";
const currentVer = "0.1";
const tiles = [];
var dataSaved = true;
const app =
{
	fileName: undefined,
	title: function(file)
	{
		document.title = ((file === undefined) ? "Tile Layer" : file) + " - " + grid.dim[0] + "x" + grid.dim[1];
		this.fileName = file;
	}
};
const tileset =
{
	group: undefined,
	list: [],
	size: 0,
	define: [],
	fill: [],
	img: [],
	type: "",
	valueMap: new Map(),
	charLength : 1,
	sheetWidth : 32,

	find: tile =>
	{
		if (typeof tile === "number")
		{
			tile = tile.toString();
		}
		return tileset.list.indexOf(tile);
	}
};
var selectedTile = 1; var ifMouse = -1; let mouseOrigin = null;
const keys = { alt: false };

const ctx =
{
	grid: gridContainer.getContext("2d"),
	pal: palette.getContext("2d"),
	preview: preview.getContext("2d"),
	palPrev: document.getElementById("palettePreview").getContext("2d")
};
var curImg = 0;
var imgURI = null;
var wheelProgress = 0;

const grid =
{
	dim: [10, 10],
	size: 100,
	dimVisual: [320, 320],
	pos: [0, 0],
	back: 0,

	atPosition: function(x, y)
	{
		if (x === undefined)
		{
			return undefined;
		}

		// if x is an Array, use it as one
		if (x.constructor === Array)
		{
			return tiles[x[0] + (x[1] * this.dim[0])];
		}
		else
		{
			return tiles[x + (y * this.dim[0])];
		}
	},

	posToXY: function(pos)
	{
		return [pos % this.dim[0], Math.floor(pos / this.dim[0])];
	},

	setDim: function(x, y, resize)
	{
		// if no change, return
		if (x === this.dim[0] && y === this.dim[1])
		{
			return false;
		}

		// if x is changing
		if (x !== undefined && x != this.dim[0])
		{
			if (0 >= x) { x = 1; }
			if (typeof x === "string") { x = Number(x); }

			if (resize)
			{
				const diff = x - this.dim[0];
				if (diff !== 0)
				{
					// if grid is getting bigger
					if (diff > 0)
					{
						const l = this.size;

						// add tiles
						for (let i = l; i > 0; i -= this.dim[0])
						{
							tiles.splice(i, 0, this.back);
							for (let i2 = 1; i2 < diff; i2++)
							{
								tiles.splice(i + i2, 0, this.back);
							}
						}
					}
					else
					{
						// remove tiles
						for (let i = this.size - diff * -1; i > 0; i -= this.dim[0])
						{
							tiles.splice(i, diff * -1);
						}
					}
				}
			}

			this.dim[0] = x;
			this.dimVisual[0] = x * 32;
			this.size = this.dim[0] * this.dim[1];
			gridContainer.style.width = this.dimVisual[0] + "px";
			gridContainer.width = x * 32;
		}

		// if y is changing
		if (y !== undefined && y != this.dim[1])
		{
			if (0 >= y) { y = 1; }
			if (typeof y === "string") { y = Number(y); }

			if (resize)
			{
				const diff = y - this.dim[1];
				if (diff > 0)
				{
					// add tiles
					for (let i = 0; i < this.dim[0]; i++)
					{
						tiles.splice(this.size, 0, this.back);

						for (let i2 = 1; i2 < diff; i2++)
						{
							tiles.splice(this.size, 0, this.back);
						}
					}
				}
				else
				{
					tiles.splice(this.size + (this.dim[0] * diff),
					             diff * this.dim[0] * -1);
				}
			}

			this.dim[1] = y;
			this.dimVisual[1] = y * 32;
			this.size = this.dim[0] * this.dim[1];
			gridContainer.style.height = this.dimVisual[1] + "px";
			gridContainer.height = y * 32;
		}

		if (cfgDOM.previewSize.value === "auto")
		{
			if (this.dim[0] < this.dim[1])
			{
				preview.style.width = "auto";
				preview.style.height = "128px";
			}
			else
			{
				preview.style.width = "128px";
				preview.style.height = "auto";
			}
		}

		drawGrid();
		/*if (this.dim[0] > this.dim[1])
		{
			preview.style.padding = `${6 * (this.dim[0] - this.dim[1])}px 0`;
		}
		else
		{
			preview.style.padding = `0 ${2}px`;
		}*/
		gridSizeText.textContent = this.dim[0] + "x" + this.dim[1];
	},

	tilePick: function()
	{
		changeSelTile(this.atPosition(this.pos));
		gridContainer.style.cursor = "var(--cur-crosshair)";
	},

	zoom: function(zoom)
	{
		this.zoomValue += zoom;
		if (this.zoomValue === 0)
		{
			this.zoomValue = 5;
		}
		gridContainer.style.width = this.dimVisual[0] * (this.zoomValue / 100) + "px";
		gridContainer.style.height = this.dimVisual[1] * (this.zoomValue / 100) + "px";
	},
	zoomReset: function()
	{
		this.zoomValue = 100;
		gridContainer.style.width = this.dimVisual[0] + "px";
		gridContainer.style.height = this.dimVisual[1] + "px";
	},
	zoomValue: 1
};
const paletteF =
{
	pos: 0,

	addIfMissing: tile =>
	{
		if (!tileset.list.includes(tile))
		{
			tileset.list.push(tile);
			tileset.size = tileset.list.length;
			makePalette();
		}
	},

	removeIfExist: tile =>
	{
		if (tileset.list.includes(tile))
		{
			tileset.list.splice(tileset.list.indexOf(tile), 1);
			tileset.size = tileset.list.length;
			makePalette();
		}
	}
};

const pixel =
{
	add: tile =>
	{
		if (tile !== undefined && tile.length === tileset.charLength && tiles.includes(tile))
		{
			paletteF.addIfMissing(tile);
			return true;
		}
		return false;
	},
	remove: tile =>
	{
		if (!tiles.includes(tile))
		{
			paletteF.removeIfExist(tile);
			return true;
		}
		return false;
	},
	check: () =>
	{
		if (tileset.type !== "pixel") { return; }

		const alreadyCheck = [];
		tileset.list.forEach((currentValue, index) =>
		{
			if (alreadyCheck.includes(currentValue) || !tiles.includes(currentValue))
			{
				tileset.list.splice(index, 1);
			}
			else
			{
				alreadyCheck.push(currentValue);
			}
		});

		tileset.size = tileset.list.length;
		makePalette();
	},
	toRGB: hex => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)],
	toHex: (r, g, b) =>
	{
		r = Number(r).toString(16);
		g = Number(g).toString(16);
		b = Number(b).toString(16);
		if (r.length === 1) { r = "0" + r; }
		if (g.length === 1) { g = "0" + g; }
		if (b.length === 1) { b = "0" + b; }

		return r + g + b;
	}
};



window.onload = () =>
{
	// grid - mouse
	gridContainer.addEventListener("mousemove", event => gridTouch(event));
	gridContainer.addEventListener("mousedown", event => { ifMouse = 0; mouseOrigin = "grid"; gridTouch(event); });
	gridContainer.addEventListener("mouseup", event => { ifMouse = -1; mouseOrigin = null; gridTouch(event); });
	gridContainer.addEventListener("mouseleave", event => tileDraw(grid.pos));
	// grid - touch
	gridContainer.addEventListener("touchstart", event => { ifMouse = 0; mouseOrigin = "grid"; gridTouch(event, true); }, { passive: true });
	gridContainer.addEventListener("touchmove", event => { mouseOrigin = null; gridTouch(event, true); }, { passive: true });
	gridContainer.addEventListener("touchend", event => { ifMouse = -1; mouseOrigin = null; tileDraw(grid.pos); }, { passive: true });

	// palette
	palette.addEventListener("mousemove", event => palTouch(event));
	palette.addEventListener("mousedown", event => { ifMouse = 0; mouseOrigin = "palette"; palTouch(event); });
	palette.addEventListener("mouseleave", () => tooltip.hide());

	// palette preview - tooltip
	palettePreview.addEventListener("mouseenter", () => tooltip.promptPalette((tileset.type === "pixel") ? pixelColour.value.slice(1) : selectedTile, (tileset.type === "pixel"), true));;
	palettePreview.addEventListener("mouseleave", () => tooltip.hide());


	makeGrid();
	if (cfgDOM.homeStart.checked)
	{
		changeMenu((debug) ? cfgDOM.dbgAutoMenu.value : "Home");
	}
	app.title();
	cfgIni.processMisc();

	loaded = true;
};
window.addEventListener("focus", () =>
{
	ifMouse = -1;
});

document.body.onmousedown = event => ifMouse = event.button;
document.body.onmouseup = () => { ifMouse = -1; mouseOrigin = null; };

// also run when scrolling
palette.addEventListener("touchstart", event => { mouseOrigin = "palette"; palTouch(event, true); }, { passive: true });
palette.addEventListener("touchmove", event => palTouch(event, true), { passive: true });
palette.addEventListener("touchend", event => { mouseOrigin = null; tooltip.hide(); }, { passive: true });

palettePreview.addEventListener("mousedown", () => { if (tileset.type === "pixel") { pixelColour.click(); } });
palettePreview.addEventListener("touchstart", () => { if (tileset.type === "pixel") { pixelColour.click(); } }, {passive: true});


document.addEventListener("keydown", () =>
{
	// global key functions, ran regardless of focus
	switch(event.key)
	{
		case "Escape": changeMenu(); return; break;
		case "s": case "S":
			if (event.ctrlKey)
			{
				switch (cfgDOM.shortSave.value)
				{
					case "ask":
						event.preventDefault();
						changeMenu("Export");
						break;
					case "specific":
						event.preventDefault();
						changeMenu();
						tilaExport(cfgDOM.shortSaveVal.value, tiles);
						break;
				}
			}
			return;
			break;
		case "o": case "O":
			if (event.ctrlKey)
			{
				switch (cfgDOM.shortOpen.value)
				{
					case "ask":
						event.preventDefault();
						changeMenu("Import");
						break;
					case "specific":
						event.preventDefault();
						changeMenu();
						filePrompt("tila").then(val => tilaImport(cfgDOM.shortOpenVal.value, val));
						break;
				}
			}
			return;
			break;
	}


	// stop if something important (e.g. input) is focused
	if (document.activeElement.tagName !== "BODY")
	{
		return;
	}


	// key functions
	switch(event.key)
	{
		case "1": changeSelTile(0, true); break;
		case "2": changeSelTile(1, true); break;
		case "3": changeSelTile(2, true); break;
		case "4": changeSelTile(3, true); break;
		case "5": changeSelTile(4, true); break;
		case "6": changeSelTile(5, true); break;
		case "7": changeSelTile(6, true); break;
		case "8": changeSelTile(7, true); break;
		case "9": changeSelTile(8, true); break;
		case "0": changeSelTile(9, true); break;
		case ",": changeSelTile(selectedTile - 1); break;
		case ".": changeSelTile(selectedTile + 1); break;
		case "-": grid.zoom(-5); break;
		case "=": grid.zoom(5); break;
		case "`": grid.zoomReset(); break;
	}


	if (event.altKey)
	{
		keys.alt = true;

		//eyedropper
		if (cfgDOM.dropperClick.checked && ifMouse !== 0)
		{ return; }

		grid.tilePick();
	}
});

document.body.addEventListener("wheel", event =>
{
	if (cfgDOM.paletteWheel.checked && cfgDOM.paletteWheelGlobal.checked)
	{
		wheelProgress += Math.abs(event.deltaY);

		if (wheelProgress >= Math.abs(cfgDOM.wheelSens.value))
		{
			wheelProgress = 0;
		}
		else
		{
			return;
		}

		if (event.deltaY > 0)
		{
			changeSelTile(-1 * (cfgDOM.wheelInvert.checked ? 1 : -1), false, true);
		}
		else
		{
			changeSelTile(1 * (cfgDOM.wheelInvert.checked ? 1 : -1), false, true);
		}
	}
});

paletteContainer.addEventListener("wheel", event =>
{
	if (cfgDOM.paletteWheel.checked)
	{
		wheelProgress += Math.abs(event.deltaY);

		if (wheelProgress >= Math.abs(cfgDOM.wheelSens.value))
		{
			wheelProgress = 0;
		}
		else
		{
			return;
		}

		if (event.deltaY > 0)
		{
			changeSelTile(-1 * (cfgDOM.wheelInvert.checked ? 1 : -1), false, true);
		}
		else
		{
			changeSelTile(1 * (cfgDOM.wheelInvert.checked ? 1 : -1), false, true);
		}
	}
}, { passive: true });


document.addEventListener("keyup", () =>
{
	if (!event.altKey)
	{
		keys.alt = false;
		gridContainer.style.cursor = "var(--cur-draw)";
	}
});



function gridTouch(event, touch)
{
	if (!touch && ifMouse !== -1)
	{
		if (mouseOrigin !== "grid" && cfgDOM.origin.checked)
		{
			return;
		}
	}

	if (touch)
	{
		if (cfgDOM.touchScroll.checked)
		{
			return;
		}

		grid.pos = [Math.round((event.touches[0].clientX - gridContainer.getBoundingClientRect().x + 8) / (grid.zoomValue / 100) / 32 - 1),
	              Math.round((event.touches[0].clientY + window.scrollY) / (grid.zoomValue / 100) / 32 - 2.5)];
	}
	else
	{
		grid.pos = [Math.round(event.offsetX / (grid.zoomValue / 100) / 32 - .5),
		            Math.round(event.offsetY / (grid.zoomValue / 100) / 32 - .5)];
	}


	if (!keys.alt)
	{
		if (ifMouse === 0 || touch)
		{
			tileChange(grid.pos, undefined, selectedTile);
		}
	}
	else
	{
		//semi-redundant
		if (!cfgDOM.dropperClick.checked && !(ifMouse !== 0 && !touch))
		{
			gridContainer.style.cursor = "var(--cur-crosshair)";
			grid.tilePick();
		}
	}

	if (cfgDOM.gridHover.checked)
	{
		tileDraw(cfg.gridHoverPos, undefined);

		cfg.gridHoverPos = [grid.pos[0], grid.pos[1]];

		const val = cfgDOM.gridHoverBrightness.value;
		if (val > 0)
		{
			ctx.grid.fillStyle = `rgba(255,255,255,${val})`;
		}
		else
		{
			ctx.grid.fillStyle = `rgba(0,0,0,${val * -1})`;
		}

		const doLine = (tileset.type === "pixel") ? cfgDOM.pixelLines.value : 0;
		ctx.grid.fillRect(grid.pos[0] * 32, grid.pos[1] * 32, 32 - doLine, 32 - doLine);
	}
}


function palTouch(event, touch)
{
	if (ifMouse !== -1)
	{
		if (mouseOrigin !== "palette" && cfgDOM.origin.checked)
		{
			return;
		}
	}

	if (touch)
	{
		paletteF.pos = Math.round((event.touches[0].clientX - palette.getBoundingClientRect().x - 16) / 48);
	}
	else
	{
		paletteF.pos = Math.round((event.offsetX - 22) / 48);
	}

	if (paletteF.pos <= -1 || paletteF.pos >= tileset.size)
	{
		return;
	}

	if (ifMouse === 0 || touch)
	{
		changeSelTile(paletteF.pos);
	}
	tooltip.promptPalette(paletteF.pos, (tileset.type === "pixel"));
}

function changeSelTile(tile, runMouse, ifScroll)
{
	if (ifScroll)
	{
		if (tileset.type === "pixel")
		{
			var locate = tileset.find(selectedTile) + tile;
			if (locate === -1)
			{
				return;
			}
		}
		else
		{
			var locate = tileset.find(selectedTile + tile);
			if (locate === -1)
			{
				// convert number to string
				const temp = tileset.find(tileset.list[selectedTile + tile]);
				if (temp !== -1)
				{
					locate = temp;
				}
				else { return; }
			}
		}
		tile = locate;
	}

	if (typeof tile === "number")
	{
		// check if tile ID is invalid
		if (tile <= -1 || selectedTile <= -1)
		{
			tile = 0;
		}
		else if (tile >= tileset.size || selectedTile >= tileset.size)
		{
			tile = tileset.size;
		}
		if (tileset.list[tile] === undefined)
		{
			tile = selectedTile;
		}
	}

	if (tileset.type === "pixel")
	{
		if (typeof tile === "string")
		{
			/*if (tile === "#undefined")
			{
				tileset.list.splice(tileset.list.indexOf("#undefined"), 1);
				selectedTile = tileset.list[0];
				makePalette();
			}
			else
			{*/
				if (tile.length === tileset.charLength)
				{
					selectedTile = tile;
				}
				else
				{
					selectedTile = tileset.list[0];
				}
			// }
		}
		else
		{
			if (tileset.list[tile] !== undefined)
			{
				selectedTile = tileset.list[tile];
			}
			else
			{
				selectedTile = tileset.list[0];
			}
		}

		pixelColour.value = "#" + selectedTile;
	}

	// change grid tile while mouse down
	if (runMouse && ifMouse === 0 && !(cfgDOM.gridMenuPaint.checked && currentMenu !== null))
	{
		tileChange(grid.pos, undefined, tile);
	}

	if (tileset.type !== "pixel")
	{
		selectedTile = tile;
	}
	ctx.palPrev.clearRect(0, 0, 48, 48);
	switch (tileset.type)
	{
		case "pixel":
			ctx.palPrev.fillStyle = "#" + selectedTile;
			ctx.palPrev.fillRect(0, 0, 48, 48);
			break;
		case "sheet":
			ctx.palPrev.drawImage(tileset.img[curImg], tile * tileset.sheetWidth, 0, tileset.sheetWidth, tileset.sheetWidth,
			                      0, 0, 48, 48);
		break;

		default:
			imgLoad("path", tileset.group + tileset.list[tile], tile);
			ctx.palPrev.drawImage(tileset.img[curImg], 0, 0, 48, 48);
	}
}




changeTiles(cfgDOM.tilesetStart.value);
function changeTiles(val)
{
	if (val === tileset.group)
	{
		return;
	}
	if (!dataSaved && cfgDOM.saveNag.checked)
	{
		if (!confirm("Data is unsaved. Clear document anyways?"))
		{
			return;
		}
		else
		{
			dataSaved = true;
		}
	}

	switch (val)
	{
		case "tila":
			tileset.list = ["0", "1", "2", "E", "N", "C"];
			tileset.name = ["Empty Tile", "Wall", "Secret Wall", "Entrance", "NPC", "Chest"];
			tileset.define = ["", "", "", "", "", ""];
			tileset.fill = ["black", "white", "#aaaaaa", "grey", "lime", "yellow"];
			tileset.type = "sheet"; tileset.sheetWidth = 32;
			tileset.charLength = 1;
			break;
		case "pixel":  // pixel is a reserved tileset
			tileset.list = ["000000"];
			tileset.name = []; tileset.define = []; tileset.fill = [];
			tileset.type = "pixel";
			grid.back = "000000";
			selectedTile = "ffffff";
			tileset.charLength = 6;
			break;
		default:
			alert(`Tileset "${val}" is invalid.`);
			if (tileset.group === undefined)
			{
				// if starting tileset value is invalid
				if (cfgDOM.tilesetStart.value === val)
				{
					// reset to default value
					cfgDOM.tilesetStart.value = "tila";
					localStorage.setItem("cfgDOM.tilesetStart", "tila");
					changeTiles("tila");
				}
				else { changeTiles(cfgDOM.tilesetStart.value); }
			}
			return;
	}
	imgURI = null;
	tileset.group = val;
	tileset.size = tileset.list.length;
	if (val !== "pixel")
	{
		selectedTile = 0;
	}

	const tempArr = [];
	tileset.list.forEach((currentValue, index) =>
	{
		tempArr.push([currentValue, index]);
	});
	tileset.valueMap = new Map(tempArr);

	palettePreview.style.cursor = (val === "pixel") ? "var(--cur-pointer)" : "var(--cur-default)";
	makePalette();
	makeGrid();
}


// Grid
function drawGrid()
{
	ctx.grid.clearRect(0, 0, gridContainer.width, gridContainer.height);

	tiles.forEach((currentValue, index) =>
	{
		tileChange(index, undefined, currentValue, true);
	});

	if (tileset.type === "pixel")
	{
		pixel.check();
	}
}

function makeGrid()
{
	if (!dataSaved && cfgDOM.saveNag.checked)
	{
		if (!confirm("Data is unsaved. Clear document anyways?"))
		{
			return;
		}
	}
	gridContainer.width = grid.dim[0] * 32;
	gridContainer.height = grid.dim[1] * 32;
	grid.zoomReset();
	dataSaved = true;

	// validate grid.back
	if (grid.back === undefined)
	{
		grid.back = tileset.list[0];
	}
	else if (tileset.type === "pixel")
	{
		if (grid.back.length !== tileset.charLength)
		{
			grid.back = "000000";
		}
	}
	else if (Number(grid.back) === grid.back)
	{
		const tile = grid.back.toString();
		grid.back = (tileset.list.includes(tile)) ? tileset.list.indexOf(tile) : 0;
	}
	else
	{
		const tile = grid.back;
		grid.back = (tileset.list.includes(tile)) ? tileset.list.indexOf(tile) : 0;
	}

	tiles.splice(0, tiles.size);
	tiles[grid.size - 1] = 0;
	tiles.fill(grid.back);

	drawGrid();
	makePreview();
	app.title(app.fileName);
}


// palette
function makePalette()
{
	palette.width = tileset.size * 48;
	ctx.pal.clearRect(0, 0, palette.width, palette.height);

	if (tileset.type !== "pixel")
	{
		const size = (tileset.type === "sheet") ? 1 : tileset.size;
		if (size > tileset.img.length)
		{
			for (let i = tileset.img.length; i < size; i++)
			{
				tileset.img.push(new Image());
			}
		}
		// remove unused entries in tileset.img
		else if (size > tileset.img.length)
		{
			tileset.img.splice(size, tileset.img.length);
		}
	}

	switch (tileset.type)
	{
		case "sheet":
			imgLoad("path", tileset.group);

			const func = () =>
			{
				tileset.img[0].ini = true;

				for (let i = 0; i < tileset.size; i++)
				{
					ctx.pal.drawImage(tileset.img[0], i * tileset.sheetWidth, 0, tileset.sheetWidth, tileset.sheetWidth,
				                 	   i * 48, 0, 48, 48);
				}
				changeSelTile(selectedTile);
				drawGrid();
			};

			if (tileset.img[0].ini === true)
			{
				func();
			}
			else
			{
				tileset.img[0].onload = () => func();
			}
			break;

		case "pixel":
			for (let i = 0; i < tileset.size; i++)
			{
				ctx.pal.clearRect(i * 48, 0, 48, 48);

				ctx.pal.fillStyle = "#" + tileset.list[i];
				ctx.pal.fillRect(i * 48, 0, 48, 48);
			}
			changeSelTile(selectedTile);
			break;

		default:
			for (let i = 0; i < tileset.size; i++)
			{
				imgLoad("path", tileset.group + tileset.list[i], i);
				const func = indx =>
				{
					tileset.img[indx].ini = true;
					ctx.pal.drawImage(tileset.img[indx], indx * 48, 0, 48, 48);

					if (indx === selectedTile)
					{
						changeSelTile(selectedTile);
					}
					drawGrid();
				}

				if (tileset.img[i].ini === true)
				{
					func(i);
				}
				else
				{
					const x = i;
					tileset.img[i].onload = () => func(x);
				}
			}
	}
}


// Preview
function makePreview()
{
	preview.width  = grid.dim[0] * 16;
	preview.height = grid.dim[1] * 16;
	ctx.preview.clearRect(0, 0, preview.width, preview.height);
	let pos = [0, 0];
	tiles.forEach(currentValue =>
	{
		ctx.preview.fillStyle = tileset.fill[tileset.find(currentValue)];
		ctx.preview.fillRect(pos[0] * 16, pos[1] * 16, 16, 16);
		pos[0]++;
		if (pos[0] === grid.dim[0])
		{
			pos[0] = 0;
			pos[1]++;
		}
	});
}



function imgLoad(type, name, id)
{
	if (id === undefined)
	{
		id = 0;
	}

	let imgName;
	if (type === "path" && imgURI === null)
	{
		imgName = `img/tileset/${name}.png`;
	}
	else if (type === "uri")
	{
		if (imgURI === null)
		{
			return;
		}
		imgName = imgURI;
	}
	else { return; }

	if (tileset.img[curImg].simple === imgName)
	{
		return;
	}

	curImg = id;

	if (tileset.img[id].src === "" || tileset.img[id].simple !== imgName)
	{
		if (tileset.img[id] === undefined)
		{
			tileset.img[id] = new Image();
		}

		tileset.img[id].src = imgName;
		tileset.img[id].simple = imgName;
		tileset.img[id].ini = null;

		return imgName;
	}
}


function tileChange(x, y, tile, absolute)
{
	// if tile is not defined
	if (tile === undefined)
	{
		return false;
	}

	if (x.constructor === Array)
	{
		y = x[1];
		x = x[0];
	}
	if (!absolute)
	{
		if (x >= grid.dim[0] || x < 0 || y >= grid.dim[1] || y < 0)
		{
			return;
		}
	}
	else
	{
		if (x < 0 || x >= grid.size)
		{
			return;
		}
	}

	if (tileset.type === "pixel")
	{
		if (typeof tile === "object" && tile.length !== tileset.charLength)
		{
			return false;
		}
		var prevTile = grid.atPosition(x, y);
	}
	else if (tileset.list[tile] === undefined)
	{
		return false;
	}

	if (absolute)
	{
		// check if data was modified
		if (tiles[x] !== tile && cfgDOM.saveNag.checked)
		{
			dataSaved = false;
		}
		tiles[x] = tile;

		const XY = grid.posToXY(x);
		x = XY[0]; y = XY[1];
	}
	else
	{
		// check if data was modified
		if (grid.atPosition(x, y) !== tile && cfgDOM.saveNag.checked)
		{
			dataSaved = false;
		}
		tiles[x + (y * grid.dim[0])] = tile;
	}
	if (tileset.type === "pixel")
	{
		pixel.add(tile);
		pixel.remove(prevTile);
	}
	tileDraw(x, y, tile);
}
function tileDraw(x, y, tile)
{
	if (y === undefined)
	{
		if (x.constructor === Array)
		{
			y = x[1]; x = x[0];
		}
	}
	if (tile === undefined)
	{
		tile = grid.atPosition(x, y);
	}
	ctx.grid.clearRect(x * 32, y * 32, 32, 32);

	switch (tileset.type)
	{
		case "sheet":
			ctx.grid.drawImage(tileset.img[curImg], tile * tileset.sheetWidth, 0, tileset.sheetWidth, tileset.sheetWidth,
			                   x * 32, y * 32, 32, 32);
			ctx.preview.fillStyle = tileset.fill[tile] ?? "black";
			break;

		case "pixel":
			ctx.grid.fillStyle = "#" + tile;
			ctx.grid.fillRect(x * 32, y * 32, 32 - cfgDOM.pixelLines.value, 32 - cfgDOM.pixelLines.value);
			ctx.preview.fillStyle = "#" + tile;
			break;

		default:
			imgLoad("path", tileset.group + tileset.list[tile], tile);
			ctx.grid.drawImage(tileset.img[curImg], x * 32, y * 32, 32, 32);
			ctx.preview.fillStyle = tileset.fill[tile] ?? "black";
	}
	ctx.preview.fillRect(x * 16, y * 16, 16, 16);
}



// lemocha - lemocha7.github.io