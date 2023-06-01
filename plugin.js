"use strict";
const tabNames = []; var ifMakePlug = true;

const plug =
{
	info: { count: 0 },

	infoIni : function(name, ver, author, desc, link)
	{
		this.info[name] = {};
		this.info[name].name = name;
		this.info[name].ver = ver;
		this.info[name].author = author;
		this.info[name].desc = desc;
		this.info[name].link = link;
		this.info[name].id = this.info.count;
		this.info.count++;
	},

	addButton: (tab, name, func, title) =>
	{
		if (tab === undefined)
		{
			return;
		}

		const button = document.createElement("button");
		if (ifMakePlug)
		{
			button.className = "btnPlug";
		}

		if (typeof func === "string")
		{
			if (func.startsWith("menu:"))
			{
				button.onclick = () => changeMenu(func.slice(5));
			}
		}
		else if (typeof func === "function")
		{
			button.onclick = () => func();
		}

		if (title !== undefined)
		{
			button.title = title;
		}

		button.appendChild(document.createTextNode(name));

		const ele = window[tab.startsWith("menu") ? tab : "tab" + tab];
		if (ele !== undefined)
		{
			ele.appendChild(button);
		}
		else
		{
			console.warn(`TILA Plugin: Tab "${tab}" does not exist. Create tab before adding buttons.`);
		}
		return button.id;
	},

	addTab: (name, title) =>
	{
		if (!tabNames.includes(name))
		{
			const button = document.createElement("button");
			const div = document.createElement("div");

			button.className = "btnTab";
			button.onclick = () => tabSwitch(name);
			if (ifMakePlug)
			{
				button.classList.add("btnPlug");
			}
			if (title !== undefined)
			{
				button.title = title;
			}

			div.id = "tab" + name;
			div.style.display = "none";
			tabNames.push(name);

			button.appendChild(document.createTextNode(name));
			tabs.appendChild(button);
			topBar.appendChild(div);

			return div.id;
		}
		else
		{
			console.warn(`TILA Plugin: Tab "${name}" already exists.`);
		}
	},

	addMenu: name =>
	{
		if (menu[name] === undefined)
		{
			const div = document.createElement("div");

			div.id = "menu" + name;
			div.style.display = "none";
			masterMenu.appendChild(div);
			menu[name] = div;
			menu[name].plugin = true;

			return div.id;
		}
		else
		{
			console.warn(`TILA Plugin: Menu "${name}" already exists.`);
		}
	}
};



// lemocha - lemocha7.github.io