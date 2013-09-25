// ==UserScript==
// @name           TW Resource Gathering Aid
// @description    Works with the backend to optimize the resource gathering force sent out
// @namespace      http://www.di-rs.com
// @include        http://en7.tribalwars.net/game.php?village=*&screen=place
// @include        http://en7.tribalwars.net/game.php?village=*&screen=place&try=confirm
// @include        http://en7.tribalwars.net/game.php?village=*&screen=place&action=command&h=*
// ==/UserScript==

/* Copyright (c) 2007 Eric Kaggen */

/*
Works with the backend to optimize resource gathering task force. This is
in part based on past results of resource gathering from this location to
the destination.
*/

///////////////////////
// User Configuration
///////////////////////
baseURL = 'http://en7.tribalwars.net/game.php';
farmerGroup = '351';
access_username = 'ekaggen';
access_password = '<BLANKED>';

entry_url = 'http://www.di-tw.com/twtoolkit/rally_point/rally_entry.php';
confirm_url = 'http://www.di-tw.com/twtoolkit/rally_point/rally_confirm.php';

///////////////////////
// End Configuration
///////////////////////

///////////////////////
// Tool Start
///////////////////////
init();

function init()
{
	/////////////////////////////////////////
	// Handle page cannot be loaded errors
	/////////////////////////////////////////
	if(document.getElementById('errorTryAgain'))
	{
		// There was a problem loading the page
		GM_log('Problem loading page');
		var nextVillage = new RegExp(baseURL + "\\?village=(\\d*?)&screen=place").exec(document.location.href)[1];

		setTimeout(function(){window.location.href = baseURL + '?village=' + nextVillage + '&screen=place';}, 20000);
		return;
	}
	
	// This might not be necessary
	if(document.location.href.indexOf('action=command') != -1)
	{
		// We don't need to include this page anymore
		GM_log('Exited from middle state');
		return;
	}
	
	////////////////////////////
	// Captcha Protection
	////////////////////////////
	var testInputs = document.getElementsByTagName('input');
	for(var ti = 0; ti < testInputs.length; ti++)
	{
		if(testInputs[ti].type == 'image')
		{
			var captcha = true;
			break;
		}
	}
	
	if(document.body.innerHTML.indexOf('captcha.php') != -1 || captcha)
	{
		captcha();
		return;
		//enabled = 0;
	}
	
	///////////////////////////////
	// Check for farming group
	///////////////////////////////
	// Just to make sure the farming group is enabled
	var cells = document.getElementById('menu_row2').getElementsByTagName('td');
	if(delimString('group_id=', '&', cells[cells.length-1].getElementsByTagName('a')[0].href) != farmerGroup)
	{
		return;
		//enabled = 0;
	}
	
	/////////////////////////////////////////////////
	// Check if we're doing rally entry or confirm
	/////////////////////////////////////////////////
	startTime = new Date().getTime();
	if(document.location.href.indexOf('try=confirm') == -1)
	{
		doEntry();
	}
	else
	{
		doConfirm();
	}
}

///////////////////////
// Starting Functions
///////////////////////
function doEntry()
{
	// Get the current village ID
	var form = document.getElementsByTagName('form')[0];
	if(form.name == 'units')
	{
		var action = form.action.substr(form.action.indexOf('?') + 1).split('&');
		for(var aid = 0; aid < action.length; aid++)
		{
			if(action[aid].split('=')[0] == 'village')
			{
				farmerId = action[aid].split('=')[1];
				break;
			}
		}
	}
	gmEntry(farmerId);
}

function gmEntry(farmerId)
{
	timeout = setTimeout(function(){gmEntry(farmerId)}, 10000);
	GM_xmlhttpRequest(
	{
		method:'GET',
		url: entry_url + '?username=' + access_username + '&password=' + access_password + '&farmer_id=' +  farmerId,
		headers: {},
		onload: entryResult,
	});
}
function doConfirm()
{
	// Make sure it's actually the confirmation page
	if(document.getElementsByName('attack')[0].value != 'true')
	{
		return;
	}

	var arguments = getLinkArguments();
	for(var aid = 0; aid < arguments.length; aid++)
	{
		var arg = arguments[aid].split('=');

		if(arg[0] == 'village')
		{
			farmerId = arg[1];
		}
		else if(arg[0] == 'id')
		{
			var farmId = arg[1];
		}
	}
	
	var inputs = document.getElementsByTagName('input');
	
	var units = new Array();
	for(var iid = 0; iid < inputs.length; iid++)
	{
		if(inputs[iid].type =='hidden')
		{
			if(inputs[iid].name != 'x' && inputs[iid].name != 'y' && inputs[iid].name != 'attack')
			{
				units[units.length] = inputs[iid].value;
			}
		}
	}
	var data = 'farmer_id=' + farmerId + '*farm_id=' + farmId + '*units=' + units.join(';');
	document.getElementsByName('submit')[0].focus();

	gmConfirm(data);
}

function gmConfirm(data)
{
	timeout = setTimeout(function(){gmConfirm(data)}, 10000);
	GM_xmlhttpRequest(
	{
		method:'POST',
		url: confirm_url + '?username=' + access_username + '&password=' + access_password,
		headers: {'Content-type': 'application/x-www-form-urlencoded'},
		data: 'data=' + data,
		onload: confirmResult,
	});
}

///////////////////////////
// AJAX Result Functions
///////////////////////////
function entryResult(details)
{
	clearTimeout(timeout);

	//GM_log(details.responseText);
	if(details.responseText != 'disabled')
	{
		var response = details.responseText.split('*');
		
		// We need to skip, hack fix
		if(response[4] == 'next')
		{
			goNextVillage(response[5]);
			return;
		}
		
		lcElement = document.getElementsByName('light')[0];
		maElement = document.getElementsByName('marcher')[0];
		
		// If automating sleep between 3 seconds and 8 seconds
		var sleep = response[2] - ( (new Date().getTime() - startTime) );
		
		var x = response[0];
		var y = response[1];
		
		mode = response[3];
		
		if(mode >= 2)
		{
			var lcsSend = 0;
			var masSend = 0;
			
			var lcs = lcElement.parentNode.getElementsByTagName('a')[1].innerHTML.replace('(', '').replace(')', '');
			var mas = maElement.parentNode.getElementsByTagName('a')[1].innerHTML.replace('(', '').replace(')', '');
			
			var cap = response[4];

			var lcsNeeded = Math.ceil(cap / 80);
			
			if(lcsNeeded <= lcs)
			{
				lcsSend = lcsNeeded;
			}
			else
			{
				/*
				var masNeeded = Math.ceil(cap / 50);
				if(lcs > 0)
				{
					
					capLeft = cap - (lcs * 80);
			
					if(Math.ceil(capLeft / 50) <= mas)
					{
						lcsSend = lcs;
						masSend = Math.ceil(capLeft / 50);
					}
					else
					{
						return;
					}
				}
				else if(masNeeded <= mas)
				{
					masSend = masNeeded;
				}*/
				var capLeft = cap - (lcs * 80);
				
				if(Math.ceil(capLeft / 50) <= mas)
				{
					lcsSend = lcs;
					masSend = Math.ceil(capLeft / 50);
				}
				else
				{
					// No troops left
					if(mode >= 5)
					{
						goNextVillage(response[5]);
					}
					return;
				}
			}
			
			// Incase the amount needed to send is less then the villager req; Should be reworked
			// For some reason the villager requirement disappeared when attacking abandons
			var villagerReq = 1;
			if(lcsSend * 4 + masSend * 5 < villagerReq)
			{
				lcsSend = 0;
				masSend = 0;
				
				// Can we do it with pure MAs?
				if(mas * 5 >= villagerReq && mas * 50 >= cap)
				{
					// Try using the minimum MAs possible to meet villager req
					masSend = Math.ceil(villagerReq / 5);
					
					// Did we send enough to meet the capacity?
					if(masSend * 50 < cap)
					{
						masSend = Math.ceil(cap / 50);
					}
				}
				else if(lcs * 4 + mas * 5 >= villagerReq)
				{
					/*
					Issue 1: Tries to send negative LCs and extra MAs to make up for it
					- If it's sending extra MAs then the first condition using
					pure MAs to meet the villager	requirement would have been met
					
					Issue 2: Tries to send negative MAs
					The only way this could happen is if lcsSend * 80 > cap
					The only way lcsSend * 80 > cap
					The only way if cap / 80 < lcsSend
					-- 
					OOPS it means we have enough LCs to meet the cap
					
					Which means there aren't enough LCs to purely fill the cap
					Which means we need MAs to help
					Which means we'll either have enough MAs to do it by itself (C1 Met)
					OR we don't have enough troops (Condition 2 (C2) won't be met; return)
					
					But what if we have 3 lcs and 18 MAs: Doesn't meet C1, meets C2
					
					500 lcs, 18 mas, cap is 200
					LC: -20
					MA: 36
					*/
					// Issue where this reduces the needed carrying cap below itself
					// Usually caused by LCs and Mas switch

					// LC between 0 and 25 for 1000 to 2000 cap
					// MA Between 0 and 20 for 2000 to 1000 cap
					
					// Cap < 1000 -> MA goes above needed limit and since
					// There isn't enough MA to meet it it triggers
					// The secondary method
					
					// We can make LCs negative if we have an ultralow cap
					lcsSend = Math.ceil( (cap - (10 * villagerReq) ) / 40);
					masSend = Math.ceil( (cap - (lcsSend * 80) ) / 50 );

					var debug = "We hit the issue\nLCs To Send: " + lcsSend + "\nMAs To Send: " + masSend;
					// Lets say I only have 19 and 2
					if(masSend > mas)
					{
						debug += "\n\nLack of MAs issue correcting...";
						masSend = mas;
						if( (cap - (mas * 50) ) / 80 >=  ( villagerReq - (mas * 5) ) / 4 )
						{
							debug += "\nSolution 1 being used; We need LCs to make up for capacity";
							lcsSend = Math.ceil( (cap - (mas * 50) ) / 80 );
						}
						else
						{
							debug += "\nSolution 2 being used; We need LCs to make up for villagers";
							lcsSend = Math.ceil( ( villagerReq - (mas * 5) ) / 4 );
						}
					}
					debug += "\n\n[Issue Corrected]\nCapacity Needed: " + cap + "\nVillagers Needed: " + villagerReq + "\nLCs Send: " + lcsSend + "\nMAs Send: " + masSend + "\nTotal Capacity: " + (lcsSend * 80 + masSend * 50).toString() + "\nTotal Villagers: " + (lcsSend * 4 + masSend * 5).toString();
					
					//GM_log(debug);
					
					if(lcsSend > lcs)
					{
						alert("FATAL ERROR\nCode: 01");
						return;
					}
					if(masSend > mas)
					{
						alert("FATAL ERROR\nCode: 02");
						return;
					}
					if(lcsSend < 0)
					{
						alert("FATAL ERROR\nCode: 03");
						return;
					}
					if(masSend < 0)
					{
						alert("FATAL ERROR\nCode: 04");
						return;
					}
				}
				else
				{
					return;
				}
			}
		}
		
		var finish = function()
		{
			if(mode >= 1)
			{
				enterCoords(x,y);
			}
			if(mode >= 2)
			{
				enterTroops(lcsSend, masSend);
			}
			if(mode >= 3)
			{
				send();
			}
		}
		lcElement.focus();
		if(sleep > 0)
		{
			setTimeout(finish, sleep);
				
		}
		else
		{
			finish();
		}
	}
}

function confirmResult(details)
{
	clearTimeout(timeout);
	if(isPlayer())
	{
		setTimeout(function(){window.location.href = baseURL + '?village=' + farmerId + '&screen=place';}, 3000);
		return;
	}
	if(details.responseText > 0)
	{
		setTimeout(function(){document.getElementsByName('submit')[0].click();}, parseInt(details.responseText) + 400);
	}	
}

//////////////////////
// Input Functions
//////////////////////
function enterCoords(x, y)
{
	var form = document.getElementsByTagName('form')[0];
	if(form.name == 'units')
	{
		var inputs = form.getElementsByTagName('input');
		
		for(var iid = 0; iid < inputs.length; iid++)
		{
			if(inputs[iid].name == 'x' && inputs[iid].value == '' && inputs[iid].type == 'text')
			{
				inputs[iid].value = x;
			}
			else if(inputs[iid].name == 'y' && inputs[iid].value == '' && inputs[iid].type == 'text')
			{
				inputs[iid].value = y;
			}
		}
	}			
}
function enterTroops(lcs, mas)
{
	// Make sure they're not changing element types to hidden on us!
	// Add more later such as element visibility
	if(lcElement.type != 'text' || maElement.type != 'text')
	{
		return false;
	}
	if(lcs > 0)
	{
		lcElement.value = lcs;
		lcElement.select();
	}
	if(mas > 0)
	{
		maElement.value = mas;
	}
	return true;
}
function send()
{
	setTimeout(function(){document.getElementsByName('attack')[0].click();}, 350);
}

///////////////////////////
// Confirm Page Functions
///////////////////////////
function getTable()
{
	var tables = document.getElementsByTagName('table');
	
	for(var tid = 0; tid < tables.length; tid++)
	{
		if(tables[tid].className == 'vis')
		{
			headers = tables[tid].getElementsByTagName('th');
			
			// The name of the first header
			if(headers.length > 0)
			{
				if(headers[0].innerHTML == 'Command')
				{
					return tables[tid];
				}
			}
		}
	}
}
function getLinkArguments()
{
	var rows = getTable().getElementsByTagName('tr');
	for(var rid = 0; rid < rows.length; rid++)
	{
		var cells = rows[rid].getElementsByTagName('td');
		if(cells.length > 1 && cells[0].innerHTML == 'Destination:')
		{
			var linkhref = cells[1].getElementsByTagName('a')[0].href;
			break;
		}
	}
	return linkhref.substr(linkhref.indexOf('?') + 1).split('&');
}
function isPlayer()
{
	var rows = getTable().getElementsByTagName('tr');
	for(var rid = 0; rid < rows.length; rid++)
	{
		var cells = rows[rid].getElementsByTagName('td');
		if(cells.length > 1 && cells[0].innerHTML == 'Player:')
		{
			if(cells[1].getElementsByTagName('a')[0].innerHTML == '')
			{
				return false;
			}
			else
			{
				return true;
			}
			break;
		}
	}
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

function goNextVillage(firstVillage)
{
	var menu = document.getElementById('menu_row2').getElementsByTagName('td');
	for(var menuId = 0; menuId < menu.length; menuId++)
	{
		if(menu[menuId].className == 'no_hover')
		{
			var villageChangeButtons = menu[menuId].getElementsByTagName('img');
			if(villageChangeButtons[1].parentNode.tagName.toLowerCase() == 'a')
			{
				// Next Village
				var nextVillage = new RegExp(baseURL + "\\?screen=place&village=(\\d*?)$").exec(villageChangeButtons[1].parentNode.href)[1];

				if(nextVillage)
				{
					changeFarmer(nextVillage, true);
				}
					
			}
			else if(villageChangeButtons[0].parentNode.tagName.toLowerCase() == 'a')
			{
				if(new RegExp(baseURL + "\\?screen=place&village=(\\d*?)$").test(villageChangeButtons[0].parentNode.href))
				{
					// Ok, go back to the first village
					changeFarmer(firstVillage, false);
				}
			}
			break;
		}
	}
}

function changeFarmer(villageId, changeMode)
{
	if(changeMode)
	{
		var newMode = 5;
	}
	else
	{
		var newMode = 0;
	}

	var changeFarmerResult = function(details)
	{
		if(details.responseText == 'OK')
		{
			setTimeout(function(){window.location.href = baseURL + '?village=' + villageId + '&screen=place';}, 3000);
		}
	}	
	GM_xmlhttpRequest(
	{
		method:'GET',
		url: 'http://www.di-tw.com/farmingtool/rally_point/change_farmer.php?username=' + access_username + '&password=' + access_password + '&old_village=' + farmerId + '&new_village=' +  villageId + '&new_mode=' + newMode,
		headers: {},
		onload: changeFarmerResult,
	});
}