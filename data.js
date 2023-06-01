"use strict";
function fileDownload(name, type, file)
{
	const a = document.createElement("a");
	a.href = type;

	// if JSON, flatten line breaks
	a.href += (name.endsWith(".json")) ?
	          encodeURIComponent(file).replace(/%09|%0A/g, "") :
	          encodeURIComponent(file);

	a.download = name;
	a.click();
}

async function filePrompt(type, read, useFileName)
{
	// prompt for file
	const input = document.createElement("input");
	input.type = "file";
	input.accept = `${type}`;
	input.click();

	// wait for change
	return new Promise(resolve =>
	{
		input.addEventListener("change", () =>
		{
			const reader = new FileReader();
			reader.addEventListener("load", event => resolve(event.target.result));
			switch (read)
			{
				case "uri":
					reader.readAsDataURL(input.files[0]);
					break;
				default:
					reader.readAsText(input.files[0]);
			}
			if (useFileName)
			{
				app.title(input.files[0].name);
			}
		});
	});
}




function formatError(ver)
{
	alert(`file warning: file version "${ver}" is unsupported or invalid.`);
}

// TILA - Tile Layer Document
function tilaImport(type, data)
{
	if (data === undefined || data === null)
	{
		return;
	}
	let formatData = [];

	switch (type)
	{
		case "text":
			data = data.replaceAll("\n", ""); data = data.replaceAll(" ", "");
			const l = data.length;
			for (let i = 0; i < l; i += tileset.charLength)
			{
				formatData.push(data.slice(i, i + tileset.charLength));
			}
			break;

		case "tila":
			const json = JSON.parse(data);

			if (json.type !== "TILA")
			{
				alert(`file error: JSON "type" is not "TILA".`);
				return;
			}
			if (json.version !== currentVer)
			{
				formatError(json.version);
			}

			changeTiles(json.tileset);
			grid.setDim(json.width, json.height, false);
			makeGrid();

			formatData = json.data;
			break;

		default:
			alert(`import error: import type "${type}" is invalid`);
			return;
	}

	document.body.classList.add("curWaitGlobal");

	if (tileset.type !== "pixel")
	{
		formatData.forEach((currentValue, index) =>
		{
			tileChange(index, undefined, tileset.valueMap.get(currentValue), true);
		});
	}
	else
	{
		formatData.forEach((currentValue, index) =>
		{
			tileChange(index, undefined, currentValue, true);
		});
		pixel.check();
	}

	dataSaved = true;
	changeMenu();
	document.body.classList.remove("curWaitGlobal");
}
function tilaExport(type)
{
	changeMenu();

	let exportData = "";  // multiline
	let exportStrict = "";  // one line
	const exportArr = [];

	// get export formatData
	if (tileset.type !== "pixel")
	{
		tiles.forEach((currentValue, index) =>
		{
			if (index % grid.dim[1] === 0 && index !== 0)
			{
				exportData += "\n";
			}
			exportData += tileset.list[currentValue];
			exportStrict += tileset.list[currentValue];
			exportArr.push(tileset.list[currentValue]);
		});
	}
	else
	{
		tiles.forEach((currentValue, index) =>
		{
			if (index % grid.dim[1] === 0 && index !== 0)
			{
				exportData += "\n";
			}
			exportData += currentValue;
			exportStrict += currentValue;
			exportArr.push(currentValue);
		});
	}

	switch (type)
	{
		case "text":
			exportShow(exportData, exportStrict, grid.dim[0] * tileset.charLength, grid.dim[1]);
			break;
		case "tila":
			return `{
	"type":"TILA",
	"version":"${currentVer}",
	"tileset":"${tileset.group}",
	"width":"${grid.dim[0]}",
	"height":"${grid.dim[1]}",
	"data":["${exportArr.join(`","`)}"]
}`;
			break;

		default:
			alert(`export error: export type "${type}" is invalid`);
			return;
	}
	dataSaved = true;
}



// TPAL - Palette Definitions
async function tpalImport(data, img)
{
	if (data === undefined || data === null)
	{
		return;
	}
	parse_tpal(data);

	// i have to have this or else Chrome will throw an error
	if (img === undefined || img === null || img === "null")
	{
		await visualAlert("Close for image prompt");  // because of error
		imgURI = await filePrompt("image/*", "uri");
		localStorage.setItem("tpal-img", imgURI);
	}
	else
	{ imgURI = img }
	await imgLoad("uri", imgURI, 0);
	// tileset.img[id].src = imgName;
	// tileset.img[id].simple = imgName;
	// tileset.img[id].ini = null;

	tileset.img[0].onload = () =>
	{
		tileset.img[0].ini = true;
		makePalette();
		makeGrid();
	};
}
function parse_tpal(data)
{
	const json = JSON.parse(data);
	if (json.type !== "TPAL")
	{
		alert(`file error: JSON "type" is not "TPAL".`);
		return;
	}
	if (json.version !== currentVer)
	{
		formatError(json.version);
	}

	tileset.group = json.tileset;
	tileset.type = json.img;
	tileset.sheetWidth = json.imgSize;
	tileset.list = [];
	tileset.name = [];
	tileset.fill = [];

	json.data.forEach(currentValue =>
	{
		tileset.list.push(currentValue.id);
		tileset.fill.push(currentValue.color);
		tileset.name.push(currentValue.name);
	});

	tileset.size = tileset.list.length;
	localStorage.setItem("tpal", data);
	changeMenu();
}



// lemocha - lemocha7.github.io