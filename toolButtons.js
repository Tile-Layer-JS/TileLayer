"use strict";
var currentMenu = null;
var prevMenu = null;


// Tab
function tabSwitch(tabName)
{
	const l = tabNames.length;
	for (let i = 0; i < l; i++)
	{
		window["tab" + tabNames[i]].style.display = "none";
	}

	if (loaded && cfgDOM.menuClose.checked)
	{
		changeMenu();
	}

	if (tabName !== null)
	{ window["tab" + tabName].style.display = "block"; }
}


// Menu
function changeMenu(type)
{
	// close previous menu
	if (currentMenu !== type && currentMenu !== null)
	{
		menuClose(currentMenu);
		menu[currentMenu].classList.remove("show");
	}
	masterMenu.classList.remove("show");

	if (type === undefined || type === "")
	{
		currentMenu = null;
		return;
	}

	if (type === "prev")
	{
		type = (prevMenu === currentMenu) ? "Home" : prevMenu;
	}
	else
	{
		prevMenu = currentMenu;
	}

	if (menu[type] === undefined)
	{
		return;
	}
	// toggle view on chosen display
	if (menu[type].classList[0] === "show")
	{
		menu[type].classList.remove("show");
		currentMenu = null;
		menuClose();
		return;
	}
	else
	{
		// show menu
		if (type === "Home")
		{
			if (menu[type].classList.contains("show"))
			{
				menu[type].classList.remove("show");
				currentMenu = null;
				menuClose();
				return;
			}
		}
		currentMenu = type;

		masterMenu.offsetHeight;  // force DOM reflow
		masterMenu.classList.add("show");
		menu[type].classList.add("show");

		masterMenu.classList[(menu[type].plugin) ? "add" : "remove"]("menuPlug");
		masterMenu.style.left = (cfgDOM.layoutCenter.checked) ?
			`calc(50% - ${masterMenu.getBoundingClientRect().width / 2}px)` :
			0;
	}


	switch (type)
	{
		case "New":
			newWidth.value = grid.dim[0];
			newHeight.value = grid.dim[1];
			newBack.value = (tileset.type === "pixel") ? grid.back : tileset.list[grid.back];
			newTileset.value = tileset.group;
			newWidth.focus();
			break;
		case "Settings":
			cfgStart();
			break;
		case "ExportFormat":
			exportFormat.start();
			break;
		case "Resize":
			resizeWidth.value = grid.dim[0];
			resizeHeight.value = grid.dim[1];
			break;
	}

	if (cfgDOM.gridMenuPaint.checked)
	{
		gridContainer.style.pointerEvents = "none";
	}
}
function menuClose(type)
{
	switch (type)
	{
		case "Settings":
			//cfgIni.finish();
			break;
		case "ExportFormat":
			exportFormat.set();
			break;
	}
	if (cfgDOM.gridMenuPaint.checked)
	{
		gridContainer.style.pointerEvents = "all";
	}
}



// Make default tabs / buttons through plugin API.
ifMakePlug = false;


plug.addTab("Data", "Manage document data");
plug.addButton("Data", "New", "menu:New", "Create new Tile Layer document");
plug.addButton("Data", "Open", "menu:Import", "Import document data");
plug.addButton("Data", "Export", "menu:Export", "Export document data");
plug.addButton("Data", "Home", "menu:Home");

plug.addTab("Grid", "Grid tools");
plug.addButton("Grid", "Resize", "menu:Resize", "Change width and height of grid");
plug.addButton("Grid", "Change Tileset", "menu:Tileset", "Change document tileset");

plug.addTab("Settings", "Configure Tile Layer. Also includes misc options.");
plug.addButton("Settings", "Settings", "menu:Settings", "Configure Tile Layer");
plug.addButton("Settings", "Keys", "menu:Keys", "View keys");
plug.addButton("Settings", "About", "menu:About", "About Tile Layer");

ifMakePlug = true; tabSwitch("Data");



// lemocha - lemocha7.github.io