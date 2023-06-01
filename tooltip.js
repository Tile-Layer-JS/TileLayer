"use strict";
const tooltip =
{
	DOM: document.getElementById("idTooltip"),
	active: false,

	promptPalette: function(id, ifPixel, ifPrev)
	{
		const ele = (ifPrev) ? "palettePreview" : "paletteContainer";
		const off = (ifPrev) ?
			[0, -66] :
			[id * 48 + 24 - (paletteContainer.scrollLeft / 2) + palette.getBoundingClientRect().x, -50];

		if (ifPixel)
		{
			if (ifPrev)
			{
				this.prompt(ele, !(cfgDOM.pixelHex.checked) ?
										`rgb(${pixel.toRGB(id)})` : "#" + id,
										"down", off);
			}
			else
			{
				this.prompt(ele, !(cfgDOM.pixelHex.checked) ?
										`rgb(${pixel.toRGB(tileset.list[id])})` : "#" + tileset.list[id],
										"down", off);
			}
		}
		else
		{
			this.prompt(ele,
									`${tileset.name[id]} (${tileset.list[id]})\n${tileset.define[id]}`,
									"down", off);
		}
	},
	hide: function()
	{
		this.active = false;
		this.DOM.classList.add("tooltipHide");
		this.DOM.classList.remove("tooltipShow");
	},
	prompt: function(pos, text, dir, offset)
	{
		this.active = true;
		this.DOM.classList.remove("tooltipHide");
		this.DOM.classList.add("tooltipShow");

		if (typeof pos !== "object")
		{
			const rect = window[pos].getBoundingClientRect();
			pos = [];
			pos[0] = rect.left// + rect.width / 8;
			pos[1] = rect.top - rect.height;
		}

		switch (dir)
		{
			case "down":
				pos[1] -= 2;
				break;
		}

		if (offset !== undefined)
		{
			pos[0] += offset[0];
			pos[1] += offset[1];
		}
		tooltipT.textContent = text;
		pos[0] -= this.DOM.getBoundingClientRect().width / 2;
		pos[1] -= this.DOM.getBoundingClientRect().height / 2;
		if (pos[0] < 4)
		{
			pos[0] = 4;
		}

		this.DOM.style.left = pos[0] + "px";
		this.DOM.style.top = pos[1] + 100 + "px";  //change to bottom?
	}
};



// lemocha - lemocha7.github.io