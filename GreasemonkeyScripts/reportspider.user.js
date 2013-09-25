// ==UserScript==
// @name           Report Spider
// @namespace      http://www.di-rs.com
// @description    Sends report data to a central server
// @include        http://en7.tribalwars.net/game.php?*screen=report*view=*
// ==/UserScript==

/* Copyright (c) 2007 Eric Kaggen */

/*
Spider for automatically going through attack result reports
and sending them to the backend for analytics.
Auto-guided using client-side navigation
*/

// Get the report table
enabled = 1;
display = 0;
farmerGroup = '351';
access_username = 'ekaggen';
access_password = '<BLANKED>';

report_url = 'http://www.di-tw.com/twtoolkit/reports/report_reciever.php';

if(!enabled)
{
	display = 0;
}
if(display)
{
	document.getElementById('quickbar').innerHTML = '<tr><td>';
	out('<u>START</u><br>');
}

function getTable()
{
	tables = document.getElementsByTagName('table');
	for(var tid = 0; tid < tables.length; tid++)
	{
		if(tables[tid].className == 'vis')
		{
			headers = tables[tid].getElementsByTagName('th');
			
			// The name of the first header
			if(headers.length > 0)
			{
				if(headers[0].innerHTML == 'Subject')
				{
					return tables[tid];
				}
			}
		}
	}
}

function getTime(table)
{
	rows = table.getElementsByTagName('tr');
	for(var rid = 0; rid < rows.length; rid++)
	{
		cells = rows[rid].getElementsByTagName('td');
		if(cells.length > 0 && cells[0].innerHTML == 'Sent')
		{
			return cells[1].innerHTML;
		}
	}
	return false;
}
// Error here?
function getType(table)
{
	var rows = table.getElementsByTagName('tr');
	for(var rid = 0; rid < rows.length; rid++)
	{
		cells = rows[rid].getElementsByTagName('td');
		if(cells.length > 0 && cells[0].innerHTML == 'forwarded by:')
		{
			return 0;
		}
		var headers = rows[rid].getElementsByTagName('th');
		for(var hid = 0; hid < headers.length; hid++)
		{
			if(headers[hid].innerHTML == 'Supported player:')
			{
				return 0;
			}
			if(headers[hid].innerHTML == 'Subject')
			{
				var images = headers[1].getElementsByTagName('img');
				if(images.length > 1)
				{
					if(images[0].src.indexOf('green.png') != -1)
					{
						return 1;
					}
					else if(images[0].src.indexOf('yellow.png') != -1)
					{
						return 2;
					}
					else if(images[0].src.indexOf('red.png') != -1)
					{
						return 3;						
					}
					else if(images[0].src.indexOf('blue.png') != -1)
					{
						return 4;						
					}
					else
					{
						return 0;
					}
				}
			}
		}
	}
	return 0;
}


data = new Array();
table = getTable();

data['type'] = getType(table);
if(!enabled)
{
	data['type'] = 0; // Disabled
}
if(data['type'] != 0)
{
	data['time'] = getTime(table);
	
	var innerTables = table.getElementsByTagName('table');
	attTable = null;
	defTable = null;
	miscTable = null;
	scoutTable = null;
	
	buildingList = new Array();
	buildingList['Village Headquarters'] = 0;
	buildingList['Barracks'] = 1;
	buildingList['Stable'] = 2;
	buildingList['Workshop'] = 3;
	buildingList['Academy'] = 4;
	buildingList['Smithy'] = 5;
	buildingList['Rally point'] = 6;
	buildingList['Statue'] = 7;
	buildingList['Market'] = 8;
	buildingList['Timber camp'] = 9;
	buildingList['Clay pit'] = 10;
	buildingList['Iron mine'] = 11;
	buildingList['Farm'] = 12;
	buildingList['Warehouse'] = 13;
	buildingList['Hiding place'] = 14;
	buildingList['Wall'] = 15;
	
	var href = document.getElementsByTagName('a');
	
	for(var h = 0; h < href.length; h++)
	{
		if(href[h].innerHTML == 'forward')
		{
			data['reportId'] = href[h].href.substring(href[h].href.indexOf('id=') + 3);
			break;
		}
	}
	
	if(table.getElementsByTagName('h3')[0].innerHTML == 'The attacker has won')
	{
		data['result'] = 1;
	}
	else if(table.getElementsByTagName('h3')[0].innerHTML == 'The defender has won')
	{
		data['result'] = 2;
	}
	else
	{
		data['result'] = 0;
	}
	
	for(var tid = 0; tid < innerTables.length; tid++)
	{
		var rows = innerTables[tid].getElementsByTagName('tr');
		for(var rid = 0; rid < rows.length; rid++)
		{
			var cells = rows[rid].getElementsByTagName('td');
			for(var cid = 0; cid < cells.length; cid++)
			{
				if(!data['luck'])
				{
					var images = cells[cid].getElementsByTagName('img');
					if(images.length == 1 && (images[0].alt == 'Misfortune' || images[0].alt == 'luck') )
					{
						var offset = images[0].alt == 'Misfortune' ? -1 : 1;
						//alert('Cell ID: ' + cid + "\nOffset: " + offset);
						if(cells.length > cid + offset && cid + offset >= 0)
						{
							if(cells[cid + offset].getElementsByTagName('b').length == 1)
							{
								data['luck'] = cells[cid + offset].getElementsByTagName('b')[0].innerHTML.replace('%', '');
							}
						}
					}
				}
				if(!data['morale'])
				{
					if(cells[cid].innerHTML.indexOf('Morale: ') != -1)
					{
						data['morale'] = cells[cid].getElementsByTagName('h4')[0].innerHTML.replace('Morale: ', '').replace('%', '');
					}
				}
			}
		}
		if(attTable == null || defTable == null || miscTable == null)
		{
			var headers = innerTables[tid].getElementsByTagName('th');
			for(var hid = 0; hid < headers.length; hid++)
			{
				if(headers[hid].innerHTML == 'Attacker:' && attTable == null)
				{
					var attTable = innerTables[tid];
					var alinks = headers[hid + 1].getElementsByTagName('a');
					if(alinks.length == 0)
					{
						data['attPlayerId'] = 0;
					}
					else
					{
						data['attPlayerId'] = alinks[0].href.substring(alinks[0].href.indexOf('id=') + 3);
					}
				}
				else if(headers[hid].innerHTML == 'Defender:' && defTable == null)
				{
					var defTable = innerTables[tid];
					var alinks = headers[hid + 1].getElementsByTagName('a');
					if(alinks.length == 0)
					{
						data['defPlayerId'] = 0;
					}
					else
					{
						data['defPlayerId'] = alinks[0].href.substring(alinks[0].href.indexOf('id=') + 3);
					}
				}
				else if( ( headers[hid].innerHTML == 'Haul:' || 
					headers[hid].innerHTML == 'Damage by rams:' ||
					headers[hid].innerHTML == 'Damage by catapult bombardment:' || 
					headers[hid].innerHTML == 'Change of Loyalty') && miscTable == null)
				{
					miscTable = innerTables[tid];
				}
				else if( headers[hid].innerHTML == 'Resources scouted:')
				{
					scoutTable = innerTables[tid];
				}
			}
		}
	}
	if( (!data['attVillageId'] || !data['attVillageX'] || !data['attVillageY']) && attTable != null)
	{
		var rows = attTable.getElementsByTagName('tr');
		for(var rid = 0; rid < rows.length; rid++)
		{
			var cells = rows[rid].getElementsByTagName('td');
			for(var cid = 0; cid < cells.length; cid++)
			{
				if(cells[cid].innerHTML == 'Village:')
				{
					var link = cells[cid + 1].getElementsByTagName('a')[0];
					
					var coordStr = link.innerHTML;
					var position = 0;

					while(true)
					{
						position = coordStr.indexOf('(');
						
						if(position == -1)
						{
							break;
						}
						coordStr = coordStr.substring(position + 1);
					}

					data['attVillageX'] = coordStr.substr(0, 3);
					data['attVillageY'] = coordStr.substr(4, 3);
					data['attVillageId'] = link.href.substring(link.href.indexOf('id=') + 3);
				}
			}
		}
	}
	if( (!data['attTroops'] || !data['attTroopLosses']) && attTable != null)
	{
		var innerAtt = attTable.getElementsByTagName('table')[0];
		if(innerAtt.className == 'vis')
		{
			data['attTroops'] = new Array();
			data['attTroopLosses'] = new Array();
			var rows = innerAtt.getElementsByTagName('tr');
			for(var rid = 0; rid < rows.length; rid++)
			{
				var cells = rows[rid].getElementsByTagName('td');
				if(cells[0].innerHTML == 'Quantity:')
				{
					for(var cid = 1; cid < cells.length; cid++)
					{
						data['attTroops'][data['attTroops'].length] = cells[cid].innerHTML;
					}
				}
				else if(cells[0].innerHTML == 'Losses:')
				{
					for(var cid = 1; cid < cells.length; cid++)
					{
						data['attTroopLosses'][data['attTroopLosses'].length] = cells[cid].innerHTML;
					}
				}
			}
		}
	}
	if( (!data['defVillageId'] || !data['defVillageX'] || !data['defVillageY']) && defTable != null)
	{
		var rows = defTable.getElementsByTagName('tr');
		for(var rid = 0; rid < rows.length; rid++)
		{
			var cells = rows[rid].getElementsByTagName('td');
			for(var cid = 0; cid < cells.length; cid++)
			{
				if(cells[cid].innerHTML == 'Village:')
				{
					var link = cells[cid + 1].getElementsByTagName('a')[0];
					
					var coordStr = link.innerHTML;
					var position = 0;

					while(true)
					{
						position = coordStr.indexOf('(');
						
						if(position == -1)
						{
							break;
						}
						coordStr = coordStr.substring(position + 1);
					}
					data['defVillageX'] = coordStr.substr(0, 3);
					data['defVillageY'] = coordStr.substr(4, 3);
					data['defVillageId'] = link.href.substring(link.href.indexOf('id=') + 3);
				}
			}
		}
	}
	if( (!data['defTroops'] || !data['defTroopLosses']) && defTable != null)
	{
		var innerDef = defTable.getElementsByTagName('table');
		if(innerDef.length == 1 && innerDef[0].className == 'vis')
		{
			data['defTroops'] = new Array();
			data['defTroopLosses'] = new Array();
			var rows = innerDef[0].getElementsByTagName('tr');
			for(var rid = 0; rid < rows.length; rid++)
			{
				var cells = rows[rid].getElementsByTagName('td');
				if(cells[0].innerHTML == 'Quantity:')
				{
					for(var cid = 1; cid < cells.length; cid++)
					{
						data['defTroops'][data['defTroops'].length] = cells[cid].innerHTML;
					}
				}
				else if(cells[0].innerHTML == 'Losses:')
				{
					for(var cid = 1; cid < cells.length; cid++)
					{
						data['defTroopLosses'][data['defTroopLosses'].length] = cells[cid].innerHTML;
					}
				}
			}
		}
	}
	if(miscTable != null)
	{
		var rows = miscTable.getElementsByTagName('tr');
		for(var rid = 0; rid < rows.length; rid++)
		{
			var headers = rows[rid].getElementsByTagName('th');
			for(var hid = 0; hid < headers.length; hid++)
			{
				var cells = rows[rid].getElementsByTagName('td');
				if(headers[hid].innerHTML == 'Haul:' && !data['wood'] && !data['clay'] && !data['iron'])
				{
					var haul = cells[0].innerHTML;
					haul = haul.replace(/<span class=\"grey\">.<\/span>/g, '');
					haul = haul.split('<img');
					
					var iterator = 1;
					if(cells[0].innerHTML.indexOf('holz.png') != -1)
					{
						data['wood'] = haul[iterator].substr(haul[iterator].indexOf('>') + 1).replace(' ', '');
						iterator++;
					}
					if(cells[0].innerHTML.indexOf('lehm.png') != -1)
					{
						data['clay'] = haul[iterator].substr(haul[iterator].indexOf('>') + 1).replace(' ', '');
						iterator++;
					}
					if(cells[0].innerHTML.indexOf('eisen.png') != -1)
					{
						data['iron'] = haul[iterator].substr(haul[iterator].indexOf('>') + 1).replace(' ', '');
					}
					data['haulStats'] = cells[1].innerHTML.replace('/', ';');
					
				}
				if(headers[hid].innerHTML == 'Damage by rams:' && !data['wallDamage'])
				{
					data['wallDamage'] = cells[0].getElementsByTagName('b')[0].innerHTML + ';' + cells[0].getElementsByTagName('b')[1].innerHTML;
				}
				if(headers[hid].innerHTML == 'Change of Loyalty' && !data['loyaltyLoss'])
				{
					data['loyaltyLoss'] = cells[0].getElementsByTagName('b')[0].innerHTML + ';' + cells[0].getElementsByTagName('b')[1].innerHTML;
				}
				if(headers[hid].innerHTML == 'Damage by catapult bombardment:' && !data['catapultDamage'])
				{
					var building = cells[0].innerHTML.substring(cells[0].innerHTML.indexOf('The ') + 4, cells[0].innerHTML.indexOf(' has'));
					data['catapultDamage'] = buildingList[building] + ';' + cells[0].getElementsByTagName('b')[0].innerHTML + ';' + cells[0].getElementsByTagName('b')[1].innerHTML;
				}
			}
		}
	}
	if(scoutTable != null)
	{
		var rows = scoutTable.getElementsByTagName('tr');
		for(var rid = 0; rid < rows.length; rid++)
		{
			var headers = rows[rid].getElementsByTagName('th');
			for(var hid = 0; hid < headers.length; hid++)
			{
				var cells = rows[rid].getElementsByTagName('td');
				if(headers[hid].innerHTML == 'Resources scouted:' && !data['scoutResources'] )
				{
					var resources = cells[0].innerHTML;
					resources = resources.replace(/<span class=\"grey\">.<\/span>/g, '');
					resources = resources.split('<img');
					
					var iterator = 1;
					if(cells[0].innerHTML.indexOf('holz.png') != -1)
					{
						data['scoutResources'] = resources[iterator].substr(resources[iterator].indexOf('>') + 1).replace(' ', '') + ';';
						iterator++;
					}
					else
					{
						data['scoutResources'] = '0;';
					}
					if(cells[0].innerHTML.indexOf('lehm.png') != -1)
					{
						data['scoutResources'] += resources[iterator].substr(resources[iterator].indexOf('>') + 1).replace(' ', '') + ';';
						iterator++;
					}
					else
					{
						data['scoutResources'] += '0;';
					}
					if(cells[0].innerHTML.indexOf('eisen.png') != -1)
					{
						data['scoutResources'] += resources[iterator].substr(resources[iterator].indexOf('>') + 1).replace(' ', '');
					}
					else
					{
						data['scoutResources'] += '0';
					}
				}
				if(headers[hid].innerHTML == 'Buildings:'  && !data['scoutBuildings'])
				{
					data['scoutBuildings'] = new Array();
					var buildings = cells[0].innerHTML.split('br>');
					for(var bid = 0; bid < buildings.length - 1; bid++)
					{
						var level = cells[0].getElementsByTagName('b')[bid].innerHTML;
						data['scoutBuildings'][bid] = buildingList[buildings[bid].substring(0, buildings[bid].indexOf(' <b>')).replace(/[\t\n\r]/g, '')] + '-';
						data['scoutBuildings'][bid] += level.substring(level.indexOf('(Level ') + 7,  level.indexOf(')'));
						//var level = buildings[bid].substr(buildings[bid].getElementsByTagName('b')[0].indexOf('(Level '));
					}
				}
				if(headers[hid].innerHTML == 'Units outside of village:' && !data['scoutTransit'])
				{
					data['scoutTransit'] = new Array();
					var troopTable = rows[rid + 1].getElementsByTagName('td')[0].getElementsByTagName('table');
					if(troopTable.length == 1)
					{
						var innerCells = troopTable[0].getElementsByTagName('tr')[1].getElementsByTagName('td');
						for(var cid = 0; cid < innerCells.length; cid++)
						{
							data['scoutTransit'][data['scoutTransit'].length] = innerCells[cid].innerHTML;
						}
					}
				}
			}
		}
		//out(scoutTable.innerHTML);
	}
	data['attTroops'] = data['attTroops'].join(';');
	data['attTroopLosses'] = data['attTroopLosses'].join(';');
	
	if(data['defTroops'])
	{
		data['defTroops'] = data['defTroops'].join(';');
	}
	else
	{
		data['defTroops'] = 'null';
	}
	if(data['defTroopLosses'])
	{
		data['defTroopLosses'] = data['defTroopLosses'].join(';');
	}
	else
	{
		data['defTroopLosses'] = 'null';
	}
	
	if(data['scoutBuildings'])
	{
		data['scoutBuildings'] = data['scoutBuildings'].join(';');
	}
	else
	{
		data['scoutBuildings'] = 'null';
	}
	
	if(data['scoutTransit'])
	{
		data['scoutTransit'] = data['scoutTransit'].join(';');
	}
	else
	{
		data['scoutTransit'] = 'null';
	}
	if(!data['scoutResources'])
	{
		data['scoutResources'] = 'null';
	}
	if(!data['wood'])
	{
		data['wood'] = 'null';
	}
	if(!data['clay'])
	{
		data['clay'] = 'null';
	}
	if(!data['iron'])
	{
		data['iron'] = 'null';
	}
	if(!data['haulStats'])
	{
		data['haulStats'] = 'null';
	}
	if(!data['wallDamage'])
	{
		data['wallDamage'] = 'null';
	}
	if(!data['catapultDamage'])
	{
		data['catapultDamage'] = 'null';
	}
	if(!data['loyaltyLoss'])
	{
		data['loyaltyLoss'] = 'null';
	}
	
	if(display)
	{
		out('<b>==================</b>');
		out('<i>Stats</i>');
		out('<b>Time:</b> ' + data['time']);
		out('<b>Type:</b> ' + data['type']);
		out('<b>Result:</b> ' + data['result']);
		out('<b>Luck:</b> ' + data['luck']);
		out('<b>Morale:</b> ' + data['morale']);
		out('<b>Attacker Player Id:</b> ' + data['attPlayerId']);
		out('<b>Attacking Village Coords:</b> ' + data['attVillageX'] + '|' + data['attVillageY']);
		out('<b>Attacking Village Id:</b> ' + data['attVillageId']);
		out('<b>Attacker Troops:</b>' + data['attTroops']);
		out('<b>Attacker Troop Losses:</b>' + data['attTroopLosses']);
		out('<b>Defender Player Id:</b> ' + data['defPlayerId']);
		out('<b>Defending Village Coords:</b> ' + data['defVillageX'] + '|' + data['defVillageY']);
		out('<b>Defending Village Id:</b> ' + data['defVillageId']);
		out('<b>Defender Troops:</b>' + data['defTroops']);
		out('<b>Defender Troop Losses:</b>' + data['defTroopLosses']);
		out('<b>Wood:</b>' + data['wood']);
		out('<b>Clay:</b>' + data['clay']);
		out('<b>Iron:</b>' + data['iron']);
		out('<b>Haul Stats:</b>' + data['haulStats']);
		out('<b>Ram Damage:</b>' + data['wallDamage']);
		out('<b>Catapult Damage:</b>'  + data['catapultDamage']);
		out('<b>Loyalty Losses:</b>' + data['loyaltyLoss']);
		out('<b>Scouted Resources:</b>' + data['scoutResources']);
		out('<b>Scouted Buildings:</b>' + data['scoutBuildings']);
		out('<b>Scouted Troops In Transit:</b>' + data['scoutTransit']);
		out('<br><i>' + parseData(data) + '</i>');
		
		out('<u>END</u>');
		out('</td></tr>');
	}
	
	GM_xmlhttpRequest(
	{
		method:'POST',
		url: report_url + '?username=' + access_username + '&password=' + access_password,
		headers: {'Content-type': 'application/x-www-form-urlencoded'},
		data: 'data=' + parseData(data),
		onload: ajaxResult,
	});
}

function parseData(data)
{
	var finalData = new Array();
	
	finalData[finalData.length] = 'report_id=' + data['reportId'];
	finalData[finalData.length] = 'result=' + data['result'];
	finalData[finalData.length] = 'type=' + data['type'];
	finalData[finalData.length] = 'time=' + data['time'];
	finalData[finalData.length] = 'att_player_id=' + data['attPlayerId'];
	finalData[finalData.length] = 'att_village_id=' + data['attVillageId'];
	finalData[finalData.length] = 'att_village_x=' + data['attVillageX'];
	finalData[finalData.length] = 'att_village_y=' + data['attVillageY'];
	finalData[finalData.length] = 'def_player_id=' + data['defPlayerId'];
	finalData[finalData.length] = 'def_village_id=' + data['defVillageId'];
	finalData[finalData.length] = 'def_village_x=' + data['defVillageX'];
	finalData[finalData.length] = 'def_village_y=' + data['defVillageY'];
	finalData[finalData.length] = 'haul_stats=' + data['haulStats'];
	finalData[finalData.length] = 'haul_timber=' + data['wood'];
	finalData[finalData.length] = 'haul_clay=' + data['clay'];
	finalData[finalData.length] = 'haul_iron=' + data['iron'];
	finalData[finalData.length] = 'luck=' + data['luck'];
	finalData[finalData.length] = 'morale=' + data['morale'];
	finalData[finalData.length] = 'att_troops=' + data['attTroops'];
	finalData[finalData.length] = 'att_losses=' + data['attTroopLosses'];
	finalData[finalData.length] = 'def_troops=' + data['defTroops'];
	finalData[finalData.length] = 'def_losses=' + data['defTroopLosses'];
	finalData[finalData.length] = 'wall_damage=' + data['wallDamage'];
	finalData[finalData.length] = 'building_damage=' + data['catapultDamage'];
	finalData[finalData.length] = 'loyalty_loss=' + data['loyaltyLoss'];
	finalData[finalData.length] = 'scout_resources=' + data['scoutResources'];
	finalData[finalData.length] = 'scout_transit=' + data['scoutTransit'];
	finalData[finalData.length] = 'scout_buildings=' + data['scoutBuildings'];
	return finalData.join('*');
}

function out(message)
{
	document.getElementById('quickbar').innerHTML += message + '<br>';
}

function ajaxResult(details)
{
	if(details.responseText == 'OK')
	{
		if(window.location.href.indexOf('mode=attack') != -1)
		{
			var cells = document.getElementById('menu_row2').getElementsByTagName('td');
			if(delimString('group_id=', '&', cells[cells.length-1].getElementsByTagName('a')[0].href) == farmerGroup)
			{
				var previous = getPreviousReport();
				
				if(previous)
				{
					window.location.href = previous;
				}
			}
		}
	}
}

function getPreviousReport()
{
	var hrefs = document.getElementsByTagName('a');
	
	for(var hid = 0; hid < hrefs.length; hid++)
	{
		if(hrefs[hid].innerHTML == '&lt;&lt;')
		{
			return hrefs[hid].href;
		}
	}
	return false;
}
function getNextReport()
{
	var hrefs = document.getElementsByTagName('a');
	
	for(var hid = 0; hid < hrefs.length; hid++)
	{
		if(hrefs[hid].innerHTML == '&gt;&gt;')
		{
			return hrefs[hid].href;
		}
	}
	return false;
}
/////////////////////
// Library
/////////////////////
function delimString(delim1, delim2, str)
{
	var position1 = str.indexOf(delim1) + delim1.length;
	var length = str.substr(position1).indexOf(delim2);
	
	return str.substr( position1, length );
}