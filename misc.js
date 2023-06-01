"use strict";
homeVerId.textContent = currentVer;
aboutVerId.textContent = currentVer;

if (navigator.cookieEnabled)
{
	if (localStorage.getItem("lastVer") !== null && localStorage.getItem("lastVer") !== currentVer)
	{
		homeVerId.textContent += " (NEW)";
	}
	localStorage.setItem("lastVer", currentVer);
}
async function visualAlert(text)
{
	await new Promise(resolve =>
	{
		alertText.innerText = text;
		alertButton.onclick = () => { changeMenu(); resolve(); };
		changeMenu("Alert");
	});
}

function exportClose()
{
	exportDiv.style.height = "0";
	exportBox.style.display = "none";
	exportString.style.display = "none";
	exportDiv.style.display = "none";
}
function exportShow(box, string, col, row)
{
	if (box !== undefined)
	{
		exportBox.value = box;
		exportBox.style.display = "block";
		exportBox.cols = col ?? 50;
		exportBox.rows = row ?? 30;
	}
	if (string !== undefined)
	{
		exportString.value = string;
		exportString.style.display = "block";
	}

	exportDiv.style.display = "block";
	exportDiv.style.height = "100%";
	buttonExportClose.style.display = "block";

}


function finishNewfile()
{
	if (tileset.group !== newTileset.value)
	{
		changeTiles(newTileset.value);
	}
	grid.setDim(newWidth.value, newHeight.value, false);

	if (tileset.type === "pixel")
	{
		if (newBack.value.startsWith("rgb(") || newBack.value.startsWith("rgba("))
		{
			const val = newBack.value.replaceAll(/[rgba() ]/g, "").split(",");
			newBack.value = pixel.toHex(val[0], val[1], val[2]);
		}
		else
		{
			newBack.value = newBack.value.replaceAll(/#/g, "");
		}
	}
	grid.back = (newBack.value === "") ? tileset.list[0] : newBack.value;

	app.fileName = undefined;
	makeGrid();
	changeMenu();
}

function finishResize()
{
	grid.setDim(resizeWidth.value, resizeHeight.value, true);
	makePreview();
	changeMenu();
}



const exportFormat =
{
	document: [`tileMAP = \n[`, `"];`],
	tile: [`"`, `",`],
	line: [` `, `\\n`],
	newline: "\\n",
	start: function()
	{
		expD1.value = this.document[0].replace(/\n/g, "\\n");
		expD2.value = this.document[1];
		expT1.value = this.tile[0];
		expT2.value = this.tile[1];
		expL1.value = this.line[0];
		expL2.value = this.line[1];
		expNew.value = this.newline;
		this.preview();
	},
	preview: function()
	{
		this.set();
		expBox.value = this.render([1,2,3,4,5,6,7,8,9], 3, 3);
	},
	formatImport: async function(val)
	{
		let json;
		if (val === undefined)
		{
			await filePrompt(".tlex", "text").then(val => json = JSON.parse(val));
		}
		else
		{
			json = JSON.parse(val);
		}

		if (json.type !== "TLEX")
		{
			alert(`file error: JSON "type" is not "TLEX".`);
			return;
		}

		this.document = [json.document.start, json.document.end];
		this.tile = [json.tile.start, json.tile.end];
		this.line = [json.line.start, json.line.end];
		this.newline = json.newline;
		this.start();
	},
	formatExport: function()
	{
		this.set();
		fileDownload("format.tlex", "data:application/json;charset=utf-8,",
		`{
		"type":"TLEX",
		"version":"${currentVer}",
		"newline":"${this.newline}",
		"tile":{
			"start":"${this.tile[0]}",
			"end":"${this.tile[1]}"},
		"line":{
			"start":"${this.line[0]}",
			"end":"${this.line[1]}"},
		"document":{
			"start":"${this.document[0]}",
			"end":"${this.document[1]}"}`);
	},
	export: function()
	{
		const temp = this.render(tiles, grid.dim[0], grid.dim[1]);
		exportShow(temp, temp);
	},
	set: function()
	{
		this.document[0] = expD1.value;
		this.document[1] = expD2.value;
		this.tile[0] = expT1.value;
		this.tile[1] = expT2.value;
		this.line[0] = expL1.value;
		this.line[1] = expL2.value;
		this.newline = expNew.value;
	},
	render: function(tiles, x, y)
	{
		// use input values instead of exp values
		let exportData = "";
		exportData += this.document[0];

		for (let iY = 0; iY < y; iY++)
		{
			if (iY !== 0)
			{
				exportData += this.line[0];
			}

			for (let i = 0; i < x; i++)
			{
				exportData += this.tile[0];
				exportData += tiles[i + iY * x];

				if (iY < y - 1 || i < x - 1)
				{
					exportData += this.tile[1];
				}
			}

			if (iY < y - 1)
			{
				exportData += this.line[1];
			}
		}
		exportData += this.document[1];
		return exportData.replaceAll(this.newline, "\n");
	}
};



// lemocha - lemocha7.github.io