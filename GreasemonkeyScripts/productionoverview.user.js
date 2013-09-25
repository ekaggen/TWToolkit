// ==UserScript==
// @name           Production Overview
// @namespace      http://www.di-rs.com
// @description    Modifies the production overview page to summarize resources & plan redistribution
// @include        http://en7.tribalwars.net/game.php?village=*&screen=overview_villages&mode=prod*
// ==/UserScript==

/* Copyright (c) 2007 Eric Kaggen */

/*
Augments UI to summarize resources and plan redistribution of them
to ensure that they are evenly distributed
*/

evenout = false;

access_username = 'ekaggen';
access_password = '<BLANKED>';

dist1_url = 'http://www.di-tw.com/twtoolkit/distribution/storeResources.php';

noFarmerGroup = 871;

var cells = document.getElementById('menu_row2').getElementsByTagName('td');
if(delimString('group_id=', '&', cells[cells.length-1].getElementsByTagName('a')[0].href) == noFarmerGroup)
{
	globalResources = new Array();
	distribution = true;
}
else
{
	distribution = false;
}

init();

function findTable(tables)
{
	for(var tid = 0; tid < tables.length; tid++)
	{
		if(tables[tid].className == 'vis')
		{
			var headers = tables[tid].getElementsByTagName('th');
			
			// The name of the first header
			if(headers.length > 0)
			{
				if(headers[0].innerHTML == 'Village')
				{
					return tid;
				}
			}
		}
	}
}

function getTable()
{
	var tables = document.getElementsByTagName('table');
	return tables[findTable(tables)];
}

function findPosition(header, table)
{
	var headers = table.getElementsByTagName('th');
	
	for(var hid = 0; hid < headers.length; hid++)
	{
		if(headers[hid].innerHTML == header)
		{
			return hid;
		}
	}
}

function getColumn(position, table)
{
	var column = new Array();
	
	var rows = table.getElementsByTagName('tr');
	for(var r = 0; r < rows.length; r++)
	{
		var cells = rows[r].getElementsByTagName('td');
		
		if(cells.length > position)
		{
			column.push(cells[position]);
		}
	}
	return column;
}

function parseResources(resourcesString)
{
	var final = resourcesString.replace(/<span class="grey">\.<\/span>/g, '');
	//GM_log("1" + final);
	final = final.replace(/<span class="warn">(.*?\d)<\/span>/g, "$1");
	//GM_log("2" + final);
	final = final.replace(/<img.*?>/g, '');
	//final = final.replace(/ /g, '');
	return final;
}

function numberAddDot(number, style)
{
	number = number.toString();

	for(var position = number.length - 3; position > 0; position -= 3)
	{
		number = number.substring(0, position) + '<span class="grey">.</span>' + number.substr(position);
	}
	if(style)
	{
		number = '<span style="' + style  + '">' + number + '</span>';
	}
	return number;
}

function formatResources(resources, greater)
{
	var greatest = 0;
	var least = 0;
	
	resources[0] = parseInt(resources[0]);
	resources[1] = parseInt(resources[1]);
	resources[2] = parseInt(resources[2]);
	
	for(var r = 1; r < resources.length; r++)
	{
		if(resources[r] > resources[greatest])
		{
			greatest = r;
		}
		if(resources[r] < resources[least])
		{
			least = r;
		}
	}
	
	var format = new Array('', '', '');
	
	if(greater)
	{
		format[greatest] += 'font-weight: bold;';
		//var bold = greatest;
	}
	else
	{
		format[least] += 'font-weight: bold;';
		
		for(var i = 0; i < format.length; i++)
		{
			if(resources[i] < 2400 * 12)
			{
				format[i] += 'color: #FF6600;';
			}
		}
		
		// Super mode
		if(evenout)
		{
			var leastSave = resources[least];
			for(var r = 0; r < resources.length; r++)
			{
				resources[r] -= leastSave;
				format[r] = 'font-weight: bold;color: #FF6600;';
			}
			format[least] = 'color: #00FF00';
		}
		//var bold = least;
	}
	
	var resString = '<img src="' + woodURL + '" title="Wood" alt="" />';
	//resString += numberAddDot(resources[0], bold == 0 ? true : false) + ' ';
	resString += numberAddDot(resources[0], format[0]) + ' ';
	
	resString += '<img src="' + clayURL + '" title="Clay" alt="" />';
	//resString += numberAddDot(resources[1], bold == 1 ? true : false) + ' ';
	resString += numberAddDot(resources[1], format[1]) + ' ';

	resString += '<img src="' + ironURL + '" title="Iron" alt="" />';
	//resString += numberAddDot(resources[2], bold == 2 ? true : false) + ' ';
	resString += numberAddDot(resources[2], format[2]) + ' ';
	
	return resString;
}

function init()
{
	if(document.getElementById('overview').value != 'prod')
	{
		return;
	}

	var table = getTable();
	
	
	position = findPosition('Resources', table);
	colRes = getColumn( position , table);
	
	var urlImages = colRes[1].getElementsByTagName('img');
	woodURL = urlImages[0].src;
	clayURL = urlImages[1].src;
	ironURL = urlImages[2].src;
	
	colResOld = new Array();
	colResLeft = new Array();
	
	colWarehouse = getColumn( findPosition('Warehouse', table) , table);
	
	if(distribution)
	{
		colVillage = getColumn( findPosition('Village', table) , table);
	}
	
	var total = new Array();
	total['total'] = new Array(0, 0, 0);
	total['totalLeft'] = new Array(0, 0, 0);
	for(var c = 0; c < colRes.length; c++)
	{
		var resources = parseResources(colRes[c].innerHTML).split(' ');
		colResOld.push(formatResources(new Array(resources[0],resources[1],resources[2]), true ));
		
		//colRes[c].innerHTML = colResOld[c];
		
		total['total'][0] += parseInt(resources[0]);
		total['total'][1] += parseInt(resources[1]);
		total['total'][2] += parseInt(resources[2]);
		
		resources[0] = parseInt(colWarehouse[c].innerHTML) - parseInt(resources[0]);
		resources[1] = parseInt(colWarehouse[c].innerHTML) - parseInt(resources[1]);
		resources[2] = parseInt(colWarehouse[c].innerHTML) - parseInt(resources[2]);
		
		total['totalLeft'][0] += parseInt(resources[0]);
		total['totalLeft'][1] += parseInt(resources[1]);
		total['totalLeft'][2] += parseInt(resources[2]);
		
		colResLeft.push(formatResources(new Array(resources[0],resources[1],resources[2]), false));
		
		if(distribution)
		{
			var villageId = delimString('village=', '&', colVillage[c].getElementsByTagName('a')[0].href);
			globalResources[globalResources.length] = villageId + '*' + resources[0] + '*' + resources[1] + '*' + resources[2] + '*' + colWarehouse[c].innerHTML;
			initDistReq(globalResources.join(';'));
		}
	}

	table.getElementsByTagName('th')[position].addEventListener('click',
	function()
	{
		if(this.getAttribute('clicked') == 'true')
		{
			for(var c = 0; c < colRes.length; c++)
			{
				colRes[c].innerHTML = colResOld[c];
			}
			table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 1].innerHTML = '<td colspan="2" style="background: #D5C5A0; font-weight: bold;">Total Resources</td><td colspan="2" style="background: #D5C5A0;">' + formatResources(total['total'], true) + '</td><td colspan="4" style="background: #D5C5A0;">&nbsp;</td>';
			this.setAttribute('clicked', 'false');
			this.style.background = '';
		}
		else
		{
			for(var c = 0; c < colRes.length; c++)
			{
				colRes[c].innerHTML = colResLeft[c];
			}
			table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 1].innerHTML = '<td colspan="2" style="background: #D5C5A0; font-weight: bold;">Total Resources</td><td colspan="2" style="background: #D5C5A0;">' + formatResources(total['totalLeft'], true) + '</td><td colspan="4" style="background: #D5C5A0;">&nbsp;</td>';
			this.setAttribute('clicked', 'true');
			this.style.background = '#AABB99';
		}
	},false);
	
	//alert("[Your resources]\nWood: " + totalResources[0] + "\nClay: " + totalResources[1] + "\nIron: " + totalResources[2]);
	var rows = table.getElementsByTagName('tr');
	
	for(var rowId = 0; rowId < rows.length; rowId++)
	{
		rows[rowId].addEventListener('mouseover',
		function()
		{
			var innercells = this.getElementsByTagName('td');
			for(var i = 0; i < innercells.length; i++)
			{
				innercells[i].style.background = '#DED3B9';
			}
		},false);
		rows[rowId].addEventListener('mouseout',
		function()
		{
			if(this.getAttribute('clicked') != 'true')
			{
				var innercells = this.getElementsByTagName('td');
				for(var i = 0; i < innercells.length; i++)
				{
					innercells[i].style.background = '';
				}
			}
		},false);
		rows[rowId].addEventListener('click',
		function()
		{
			if(this.getAttribute('clicked') != 'true')
			{
				var color = '#DED3B9';
				this.setAttribute('clicked', 'true');
			}
			else
			{
				var color = '';
				this.setAttribute('clicked', 'false');
			}
			var innercells = this.getElementsByTagName('td');
			for(var i = 0; i < innercells.length; i++)
			{
				innercells[i].style.background = color;
			}
		},false);
	}
	
	var totalRezRow = document.createElement('TR');
	totalRezRow.setAttribute('style', 'white-space:nowrap');
	
	table.appendChild(totalRezRow);
	table.getElementsByTagName('tr')[table.getElementsByTagName('tr').length - 1].innerHTML = '<td colspan="2" style="background: #D5C5A0; font-weight: bold;">Total Resources</td><td colspan="2" style="background: #D5C5A0;">' + formatResources(total['total'], true) + '</td><td colspan="4" style="background: #D5C5A0;">&nbsp;</td>';
}

function delimString(delim1, delim2, str)
{
	var position1 = str.indexOf(delim1) + delim1.length;
	var length = str.substr(position1).indexOf(delim2);
	
	return str.substr( position1, length );
}

function print_r(arr,level)
{
	if(!level)
	{
		var level = 0;
	}
	var padding = '';
	for(var i = 0; i < level; i++)
	{
		padding += "\t";
	}
	if(arr[key].constructor == Array || arr[key].constructor == Object)
	{
		if(arr[key].constructor == Array)
		{
			var final = "Array\n";
		}
		else
		{
			var final = "Object\n";
		}
		final += padding + "(\n";
	}
	else
	{
		return arr;
	}
	for(var key in arr)
	{
		if(arr[key].constructor == Array || arr[key].constructor == Object)
		{
			final += padding + "\t[" + key + '] => ' + print_r(arr[key], level+1) + "\n";
		}
		else
		{
			final += padding + "\t[" + key + '] => ' + arr[key] + "\n";
		}
	}
	final += padding + ")";
	return final;
}

function initDistReq(data)
{
	GM_xmlhttpRequest(
	{
		method:'POST',
		url: dist1_url + '?username=' + access_username + '&password=' + access_password,
		headers: {'Content-type': 'application/x-www-form-urlencoded'},
		data: 'data=' + data,
		onload: distResult,
	});
}

function distResult(details)
{
	//GM_log(details.responseText);
}