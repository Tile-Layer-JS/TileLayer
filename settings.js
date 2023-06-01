"use strict";
let catCur = "General";
let catDOM;

function cfgStart()
{
	if (navigator.cookieEnabled)
	{
		cookieText.textContent = "Stored using Local Storage.";
		cookieBack.style.backgroundColor = "var(--grey)";
	}
	else
	{
		cookieText.textContent = "Settings could not be saved.";
		cookieBack.style.backgroundColor = "var(--light-red)";
	}
}

function catSwitch(menu, tab)
{
	const ele = [window["menu" + menu].getElementsByClassName("categories " + catCur)[0],
	             window["menu" + menu].getElementsByClassName("categories " + tab)[0]];

	const btn = [window["menu" + menu].getElementsByClassName("catDiv")[0].getElementsByClassName(catCur)[0],
	             window["menu" + menu].getElementsByClassName("catDiv")[0].getElementsByClassName(tab)[0]];

	ele[0].style.display = "none";
	ele[1].style.display = "inline-block";
	btn[0].classList.remove("catMenued");
	btn[1].classList.add("catMenued");
	catCur = tab;
}


const cfgIni =
{
	last: null,
	initial: [],
	modified: false,
	textFirst: true,

	create: function(name, id, type, initial, desc, sensitive, values)
	{
		const input = document.createElement((type === "select") ? "select" : "input");
		const txt = document.createElement("t");
		txt.appendChild(document.createTextNode(name));

		if (type !== "select")
		{
			input.type = type;
		}
		input.id = "cfg_" + id;
		this.last = id;

		if (desc !== undefined)
		{
			txt.title = desc;
		}
		if (type !== "checkbox")
		{
			input.value = initial;
		}

		const func = (id, val, sensitive) =>
		{
			localStorage.setItem(id, val);
			if (!cfgIni.modified)
			{
				cfgIni.modified = true;
				setResetButton.disabled = false;
			}
			this.processMisc();

			if (sensitive)
			{
				changeMenu();
				changeMenu("Settings");
			}
		};
		input.onchange = () => func(id, (type === "checkbox") ? input.checked : input.value, sensitive);

		switch (type)
		{
			case "number":
				input.min = 0;
				input.max = 999;
				break;
			case "checkbox":
				input.checked = initial;
				break;
			case "text":
				input.size = 6;
				break;
			case "range":
				input.step = 0.05;
				break;
			case "select":
				if (values.constructor === Array)
				{
					values.forEach((currentValue, index) =>
					{
						if (index % 2 === 0)
						{
							const option = document.createElement("option");
							option.value = values[index + 1];
							option.appendChild(document.createTextNode(currentValue));
							input.appendChild(option);
						}
					});
					input.value = initial;
				}
				break;
		}

		if (navigator.cookieEnabled)
		{
			if (localStorage.getItem(id) !== null)
			{
				switch (type)
				{
					case "checkbox":
						input.checked = (localStorage.getItem(id) === "true");
						break;
					default:
						input.value = localStorage.getItem(id);
				}
			}
		}

		const tr = document.createElement("tr");
		let td = document.createElement("td");
		td.appendChild(txt);
		tr.appendChild(td);

		td = document.createElement("td");
		td.appendChild(input);
		tr.appendChild(td);

		catDOM.appendChild(tr);

		//this.id.push(id);
		cfgDOM[id] = input;
		this.initial.push(initial);
	},

	minMax: function(min, max, step)
	{
		cfgDOM[this.last].min = min;
		cfgDOM[this.last].max = max;
		cfgDOM[this.last].step = step;
	},

	text: function(text)
	{
		const tr = document.createElement("tr");
		const td = document.createElement("td");
		const header = document.createElement("header");
		header.appendChild(document.createTextNode(text));
		if (this.textFirst)
		{
			header.classList.add("first");
		}
		td.appendChild(header);
		tr.appendChild(td);
		catDOM.appendChild(tr);

		this.textFirst = false;
	},

	header: function(name)
	{
		catDOM = document.createElement("table");
		catDOM.classList = `categories ${name}`;
		menu.Settings.appendChild(catDOM);

		const button = document.createElement("button");
		button.classList = name;
		button.appendChild(document.createTextNode(name));
		button.onclick = () => catSwitch("Settings", name);

		menu.Settings.getElementsByClassName("catDiv")[0].appendChild(button);
		this.textFirst = true;
	},

	reset: function()
	{
		let i = 0;
		for (let x in cfgDOM)
		{
			let val = cfgIni.initial[i]; i++;
			switch (cfgDOM[x].type)
			{
				case "checkbox":
					cfgDOM[x].checked = val;
					break;
				default:
					cfgDOM[x].value = val;
			}
		}

		if (navigator.cookieEnabled)
		{
			localStorage.clear();
		}
		this.processMisc();
		cfgIni.modifed = false;
		setResetButton.disabled = true;

		changeMenu();
		changeMenu("Settings");
	},

	processMisc: () =>
	{
		gridContainer.classList[(cfgDOM.touchScroll.checked) ? "add" : "remove"]("noTouch");
		if (!dataSaved && !cfgDOM.saveNag.checked)
		{
			dataSaved = true;
		}

		document.body.classList[(!cfgDOM.animToggle.checked) ? "add" : "remove"]("noAnim");
		document.body.classList[(!cfgDOM.curCustom.checked) ? "add" : "remove"]("noCur");
		document.body.classList[(!cfgDOM.curGrid.checked) ? "add" : "remove"]("noGridCur");
		document.body.classList[(cfgDOM.layoutCenter.checked) ? "add" : "remove"]("center");
		masterMenu.classList[(!cfgDOM.menuNoBack.checked) ? "add" : "remove"]("menuNoBack");

		gridContainer.style.pointerEvents = (cfgDOM.gridMenuPaint.checked && currentMenu !== null) ? "none" : "all";

		if (cfgDOM.previewSize.value === "auto")
		{
			grid.setDim();
		}
		else
		{
			preview.style.width = "128px";
			preview.style.height = "128px";
		}
	}
};


const cfg = { gridHoverPos: [0, 0] };
const cfgDOM = {};


cfgIni.header("General");
	cfgIni.text("General");
	cfgIni.create("Mouse Origin", "origin", "checkbox",
	true, "Clicks started in grid cannot affect palette (or vise versa). Only applies to mouse");

	cfgIni.create("Center screen", "layoutCenter", "checkbox",
	true, "UI is aligned to screen center instead of left edge", true);

	cfgIni.create("Auto-open Home Menu", "homeStart", "checkbox",
	true, "Automatically open home menu when starting Tile Layer");

	cfgIni.create("Close Menu on tab switch", "menuClose", "checkbox",
	true, "Close currently open menu when switching toolbar tabs");

	cfgIni.create("Unsaved data nag", "saveNag", "checkbox",
	false, "Warns on closing tab with unsaved data");

	cfgIni.create("Default tileset", "tilesetStart", "input",
	"tila", "Tileset chosen when starting Tile Layer");


	cfgIni.text("Visuals");
	cfgIni.create("Visual Animations", "animToggle", "checkbox",
	true, "Dispaly visual animations / transitions. Accessibility feature");

	cfgIni.create("Custom Cursors", "curCustom", "checkbox",
	true, "Display custom cursors instead of browser default");

	cfgIni.create("Grid Cursors", "curGrid", "checkbox",
	true, "Grid uses custom pencil cursor instead of default pointer");

	cfgIni.create("Menu Background", "menuNoBack", "checkbox",
	true, "Display logo tile in menu backgrounds instead of solid colour");



cfgIni.header("Grid");
	cfgIni.text("Grid");
	cfgIni.create("Lighten Tile on Hover", "gridHover", "checkbox",
	true, "Grid tiles become brighter or darker when hovered over");
	cfgIni.create("- Lighten Brightness", "gridHoverBrightness", "number",
	0.3, "Transparency / brightness for tile lighten (1 = white, 0 = none, -1 = black). Decimal values recommended.");
		cfgIni.minMax(-1, 1, 0.05);

	cfgIni.create("Menu Blocks Grid", "gridMenuPaint", "checkbox",
	true, "Cannot interact with grid while menu open");

	cfgIni.create("Preview Sizing", "previewSize", "select",
	"auto", "How the preview sizes to unequal grid sizes.", false, ["Keep ratio", "auto", "Stretch", "stretch"]);

	cfgIni.create("Eyedropper requires click", "dropperClick", "checkbox",
	true, "Both alt and click are required for eye dropper. Only applies to mouse.");

	cfgIni.create("Touch Scrolling", "touchScroll", "checkbox",
	false, "Touch screen input scrolls grid instead of painting.");


	cfgIni.text("Pixel (only for Pixel tileset)");
	cfgIni.create("Grid Lines", "pixelLines", "number",
	1, "Visual grid lines inbetween tiles (in pixels).");
		cfgIni.minMax(0, 31, 1);


cfgIni.header("Palette");
	cfgIni.text("Scroll");
	cfgIni.create("Palette Cycling", "paletteWheel", "checkbox", //rewrite
	true, "Scroll wheel cycles through palette while hovered");
	cfgIni.create("- Cycle Anywhere", "paletteWheelGlobal", "checkbox",
	false, "Palette cycling can happen while not hovered over palette");
	cfgIni.create("- Cycle Sensitivity", "wheelSens", "number",
	1, "How many ticks scrolling requires. Bigger numbers take longer");
	cfgIni.create("- Invert Direction", "wheelInvert", "checkbox",
	false, "Invert scroll direction");


	cfgIni.text("Pixel (only for Pixel tileset)");
	cfgIni.create("Tooltips as Hex", "pixelHex", "checkbox",
	false, "Colour tooltips use Hex values (#xxxxxx) instead of RGB (rgb(xxx,xxx,xxx)).");


cfgIni.header("Misc");
	cfgIni.text("Miscellaneous");
/*	cfgIni.create("Browser Save Shortcut", "shortSave", "select",
	"ask", "What the webpage save shortcut (Ctrl+S) will do.", false, ["Specific", "specific", "Ask", "ask"]);
	cfgIni.create("- Specific Value", "shortSaveVal", "text",
	"tila");*/
	cfgDOM.shortSave = {value: "ask"};

/*	cfgIni.create("Browser Open Shortcut", "shortOpen", "select",
	"ask", "What the webpage open shortcut (Ctrl+O) will do.", false, ["Specific", "specific", "Ask", "ask"]);
	cfgIni.create("- Specific Value", "shortOpenVal", "text",
	"tila");*/
	cfgDOM.shortOpen = {value: "ask"};

	cfgIni.create("Debug", "debug", "checkbox",
	false, "Enables debug features. Reload to enable");

if (debug)
{
	cfgIni.header("Debug");
	cfgIni.create("dbgAutoMenu", "dbgAutoMenu", "input", "Home", "Auto-open home menu setting opens this menu ID instead");
}

catSwitch("Settings", "General");



// lemocha - lemocha7.github.io