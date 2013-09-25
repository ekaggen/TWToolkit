// ==UserScript==
// @name           Tribalwars UI Enhancements
// @namespace      http://www.di-tw.com
// @include        http://en7.tribalwars.net/game.php?village=*&screen=overview_villages&mode=combined*
// @include        http://en7.tribalwars.net/game.php?screen=overview_villages&mode=combined&village=*
// @include        http://en7.tribalwars.net/game.php?screen=overview_villages&mode=combined&group=*&village=*
// @include        http://en7.tribalwars.net/game.php?screen=overview_villages&intro
// @include        http://en7.tribalwars.net/game.php?t=*&village=*&screen=overview_villages&mode=combined*
// @include        http://en7.tribalwars.net/game.php?t=*&screen=overview_villages&mode=combined&village=*
// @include        http://en7.tribalwars.net/game.php?t=*&screen=overview_villages&mode=combined&group=*&village=*
// @include        http://en7.tribalwars.net/game.php?t=*&screen=overview_villages&intro
// ==/UserScript==

/* Copyright (c) 2007 Eric Kaggen */

/* Adds various features to the tribalwars UI including
- Sorting of the overview screen by any column
- Adds live timers to track production better
- Village group indication
- Various other informational aids
*/
highlight = 1;

access_username = 'ekaggen';
access_password = '<BLANKED>';

group_url = 'http://www.di-tw.com/twtoolkit/groups/getGroups.php';

init();

function init()
{
	if(document.getElementById('overview').value != 'combined')
	{
		return;
	}
	var cCol = new Array();
	var tCol = new Array();

	cCol['global'] = '&nbsp;';
	tCol['global'] = '&nbsp;';
	
	var sortPositions = new Array();
	
	sortPositions['unitStart'] = 9;
	sortPositions['name'] = 0;
	sortPositions['nobles'] = -3;
	sortPositions['merchants'] = -1;
	sortPositions['group_number'] = 4;
	sortPositions['village_type'] = 5;
	
	farmPos = 8;
	
	removeColumn(-3);
	removeColumn(-3);	
	
	addColumn(4, '#', cCol);
	addColumn(5, 'Type', tCol);
	addColumn(19, 'Distance', tCol);
	//addDistanceButton();
	
	addUnitSort(sortPositions['unitStart']);
	
	addMiscSort(sortPositions);
	enableOkEditing();
	addOkButton();

	highlightFarms();
	
	yDot = new Image(10,10);
	yDot.src = 'file:///C:/Program Files/Tribal Wars/dots/yellow.png';
	//yDot.src = 'http://www.di-tw.com/farmingtool/farmcp/images/yellow.png';
	
	ot = new OverviewTimers();
	
	ot.writeTimes();
	ot.initTimers();
	setInterval( function(){ ot.oTickAll(); }, 1 );
	

	getGroups();
}

function getGroups()
{
	GM_xmlhttpRequest(
	{
		method:'GET',
		url: group_url + '?username=' + access_username + '&password=' + access_password + '&categories=1,2',
		headers: {},
		onload: groupResult,
	});
}

function groupResult(details)
{
	var response = details.responseText.split(';');
	
	var villageGroups = new Array();
	for(var i = 0; i < response.length; i++)
	{
		var groups = new Array();

		var responseGroups = response[i].split('*')[1].split('&');

		for(var g = 0; g < responseGroups.length; g++)
		{
			var groupData = responseGroups[g].split(':');
			groups[groupData[0]] = groupData[1];
		}

		var villageId = response[i].split('*')[0];
		villageGroups[villageId] = groups;
	}
	
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);

	var rows = tables[tid].getElementsByTagName('tr');
	
	var key;
	for(var rid = 1; rid < rows.length; rid++)
	{
		var cells = rows[rid].getElementsByTagName('td');
		var villageId = delimString('village=', '&', cells[0].getElementsByTagName('a')[0].href);


		cells[4].firstChild.nodeValue = '';
		cells[5].firstChild.nodeValue = '';
		for(key in villageGroups[villageId])
		{
			switch(key)
			{
				case '1':
					cells[4].firstChild.nodeValue = villageGroups[villageId]['1'];
					break;
				case '2':
					cells[5].firstChild.nodeValue = villageGroups[villageId]['2'];
					break;
				default:
					break;
			}
		}
	}
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

function findTable(tables)
{
	for(var tid = 0; tid < tables.length; tid++)
	{
		if(tables[tid].className == 'vis')
		{
			headers = tables[tid].getElementsByTagName('th');
			
			// The name of the first header
			if(headers.length > 0)
			{
				if(headers[0].innerHTML == 'Village')
				{
					return tid;
				}
			}
		}
		else if(tables[tid].className == 'main')
		{
			tables[tid].style.width = '1000px';
		}
	}
}

function getPositions(tables,tid)
{
	var positions = new Array();
	var headerNames = new Array();
	
	headerNames[0] = 'Village Headquarters';
	headerNames[1] = 'Barracks';
	headerNames[2] = 'Stable';
	//headerNames[3] = 'Workshop';
	
	var headers = tables[tid].getElementsByTagName('th');
	for(c = 0; c < headerNames.length; c++)
	{
		for(t = 0; t < headers.length; t++)
		{
			if(headers[t].innerHTML.indexOf(headerNames[c]) != -1)
			{
				positions.push(t);
				break;
			}
		}
	}
	return positions;
}

function isOk(village, col)
{
	for(var o = 0; o < okays.length; o++)
	{
		if(village == okays[o][0] && col == okays[o][1])
		{
			return true;
		}
	}
	return false;
}

function delimString(delim1, delim2, str)
{
	var position1 = str.indexOf(delim1) + delim1.length;
	var length = str.substr(position1).indexOf(delim2);
	
	return str.substr( position1, length );
}
function highlightFarms()
{
	// 1.1721
	
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);
	var rows = tables[tid].getElementsByTagName('tr');

	for(rowId = 1; rowId < rows.length; rowId++)
	{
		var cells = rows[rowId].getElementsByTagName('td');
		
		var farmSlots = cells[farmPos].getElementsByTagName('a')[0];

		// Formula for farm slots
		//Math.pow(1.17211, level - 1) * 240
		if(farmSlots.innerHTML.substr( 0, farmSlots.innerHTML.indexOf(' (') ) < 500 && 
		delimString('(', ')', farmSlots.innerHTML) == 30)
		{
			farmSlots.setAttribute('style', 'color: #335500');
		}
		else if(farmSlots.innerHTML.substr( 0, farmSlots.innerHTML.indexOf(' (') ) < 750 && 
		delimString('(', ')', farmSlots.innerHTML) > 15)
		{
			farmSlots.setAttribute('style', 'color: #CC0000');
		}
	}
}

function distance(x1, y1, x2, y2)
{
	return Math.sqrt( ( ($x2 - $x1) * ($x2 - $x1) ) + ( ($y2 - $y1) * ($y2 - $y1) ) ) ;
}
	
function writeTimes()
{
	var tables = document.getElementsByTagName('table');
	var tid = this.findTable(tables);
	var positions = this.getPositions(tables, tid);
	
	var rows = tables[tid].getElementsByTagName('tr');
	var ok = false;
	// Go through each row and write times
	for(p = 0; p < positions.length; p++)
	{
		for(rowId = 0; rowId < rows.length; rowId++)
		{
			var cells = rows[rowId].getElementsByTagName('td');
	
			// Fast forward to the cell
			if(cells.length >= positions[p])
			{
				if(p == 0 && highlight)
				{
					rows[rowId].addEventListener('mouseover',
					function()
					{
						if(!document.getElementById('okenabled'))
						{
							//this.style.color = '#cc0000';
							var innercells = this.getElementsByTagName('td');
							for(var i = 0; i < innercells.length; i++)
							{
								innercells[i].style.background = '#DED3B9';
							}
						}
					},false);
					rows[rowId].addEventListener('mouseout',
					function()
					{
						if(!document.getElementById('okenabled'))
						{
							if(this.getAttribute('clicked') != 'true')
							{
								//this.style.color = '';
								var innercells = this.getElementsByTagName('td');
								for(var i = 0; i < innercells.length; i++)
								{
									innercells[i].style.background = '';
								}
							}
						}
					},false);
					rows[rowId].addEventListener('click',
					function()
					{
						if(!document.getElementById('okenabled'))
						{
							//this.style.color = '';
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
						}
					},false);
				}
				title = cells[positions[p]].getElementsByTagName('img')[0].title;
	
				substr = title.indexOf(' at ');
				ok = false;

				if( title == 'production not possible' )
				{
					ok = true;
				}
				if(p > 0 && delimString('(', ')', cells[farmPos].getElementsByTagName('a')[0].innerHTML) < 10)
				{
					ok = true;
				}
				
				if(isOkGM(delimString('village=', '&', cells[0].getElementsByTagName('a')[0].href), positions[p]))
				{
					ok = true;
				}
				if(substr == -1 && !ok)
				{
					continue;
				}
	
				// Three cases, today, tomorow, or a date
				if( ok && title == 'No recruitment' )
				{
					contents = '<span style="color: green; weight: bold;">OK</span>';
					cells[positions[p]].getElementsByTagName('img')[0].src = yDot.src;
				}
				else if( title == 'production not possible' )
				{
					contents = '<span style="color: green; weight: bold;">N\A</span>';
					cells[positions[p]].getElementsByTagName('img')[0].src = yDot.src;
				}
				else if( title.indexOf(' on ') != -1 )
				{
					var dateStr = title.substring( (title.indexOf(' on ') + 4) , substr);
					contents = '<span>' + convertDate(dateStr) + '</span>';
				}
				else if( title.indexOf('tomorrow') != -1 )
				{
					serverTime = parseTimeMinutes(document.getElementById('serverTime'));
					hours = title.substr(substr + 4).split(':')[0];
					minutes = title.substr(substr + 4).split(':')[1];
					
					if(hours.substr(0, 1) == '0')
					{
						hours = hours.substr(1);
					}
					if(minutes.substr(0, 1) == '0')
					{
						minutes = minutes.substr(1);
					}
					hours = parseInt(hours);
					minutes = parseInt(minutes);

					time = (hours * 60) + minutes + (24*60);
					
					//alert(hours + ":" + minutes + "\nIn minutes: " + time + "\nServer Time: " + serverTime + "\nTime Til: " + ( (time - serverTime) /60 ));
					if(ok)
					{
						contents = '<span title="OK" class="o_timer">' + formatTime(0, (time-serverTime) * 60, false) + '</span>';
					}
					else
					{
						contents = '<span class="o_timer">' + formatTime(0, (time-serverTime) * 60, false) + '</span>';
					}
				}
				else if(title.indexOf('today') != -1)
				{
					serverTime = parseTimeMinutes(document.getElementById('serverTime'));
					hours = title.substr(substr + 4).split(':')[0] ;
					minutes = title.substr(substr + 4).split(':')[1] ;
					if(hours.substr(0, 1) == '0')
					{
						hours = hours.substr(1);
					}
					if(minutes.substr(0, 1) == '0')
					{
						minutes = minutes.substr(1);
					}
					hours = parseInt(hours);
					minutes = parseInt(minutes);

					time = (hours * 60) + minutes;
					if(ok)
					{
						contents = '<span title="OK" class="o_timer">' + formatTime(0, (time-serverTime) * 60, false) + '</span>';
					}
					else
					{
						contents = '<span class="o_timer">' + formatTime(0, (time-serverTime) * 60, false) + '</span>';
					}
					//alert(hours + ":" + minutes + "\nIn minutes: " + time + "\nServer Time: " + serverTime + "\nTime Til: " + ( (time - serverTime) /60 ));
				}
				else if(ok)
				{
					contents = '<span style="color: green; weight: bold;">OK</span>';
					cells[positions[p]].getElementsByTagName('img')[0].src = yDot.src;
				}
				else
				{
					contents = '<span>No Time</span>';
				}
				document.getElementsByTagName('table')[tid].getElementsByTagName('tr')[rowId].getElementsByTagName('td')[positions[p]].innerHTML += contents;
				//alert(title);
				
				//innercell = cells[positions[p]].innerHTML;
				//time = innercell.substr(innercell.indexOf("at ") + 3);
				//contents = innercell.substr(0, innercell.indexOf("at ") + 3) + time;
				//document.getElementsByTagName("table")[tid].getElementsByTagName("tr")[rowId].getElementsByTagName("td")[positions[p]].innerHTML = contents;
				//alert(time);
				//alert("Time: " + time + "\nLong Time: " + parseTimeStr(time) + "\nServer Time: " + serverTime);
			}
		}
	}
}

function OverviewTimers()
{
	// Methods
	this.findTable = findTable;
	this.getPositions = getPositions;
	this.writeTimes = writeTimes;
	
	this.initTimers = initTimers;
	this.oTick = oTick;
	this.oTickAll = oTickAll;
	
	this.parseTime = parseTime;
	this.parseTimeMinutes = parseTimeMinutes;
	
	this.oAddTimer = oAddTimer;
	
	this.formatTime = formatTime;
	
	this.getLocalTime = getLocalTime;
	
	//this.timers = 'ffs mate';
	this.localDiff = null;

}


//////////////////////
// Main entry
//////////////////////
/*var checkCells = document.getElementsByTagName('td');
for(var x = 0; x < checkCells.length; x++)
{
	if(checkCells[x].innerHTML.indexOf('Combined') != -1 && checkCells[x].className == 'selected')
	{
		ot = new OverviewTimers();

		ot.writeTimes();
		ot.initTimers();
		setInterval(function(){ ot.oTickAll(); }, 1);
		break;
	}
}
*/
function oTickAll()
{
	for(var timer in this.timers)
	{
		remove = !oTick(this.timers[timer]);
		if(remove)
		{
			this.timers.splice(timer, 1);
		}
	}
}

function initTimers()
{
	this.timers = new Array();

	serverTime = parseTime(document.getElementById("serverTime"));
	localDiff = serverTime - getLocalTime();
	//alert(serverTime + "\n" + getLocalTime() + "\n" + localDiff + "\n" + (getLocalTime() + localDiff));
	oStart = serverTime;
	var oSpans = document.getElementsByTagName("span");
	
	for(s = 0; s < oSpans.length; s++)
	{
		span = oSpans[s];
		if(span.className == "o_timer")
		{
			startTime = parseTime(span);
			if(startTime != -1)
			{
				this.oAddTimer(span, serverTime+startTime);
			}
		}
	}
}



function oTick(timer)
{
	timeLeft = timer["endTime"] - (getLocalTime() + localDiff);
	if(timeLeft <= 0)
	{
		parent = timer["element"].parentNode;
		//parent.nextSibling.style.display = "inline";
		parent.removeChild(timer["element"]);
		return false;
	}
	formatTime(timer["element"], timeLeft, true);
	return true;
}

function parseTime(element)
{
	if(element.firstChild.nodeValue == null)
	{
		return -1;
	}
	part = element.firstChild.nodeValue.split(":");

	for(j=1; j<3; j++)
	{
		if(part[j].charAt(0) == "0")
		{
			part[j] = part[j].substring(1, part[j].length);
		}
	}
    
	hours = parseInt(part[0]);
	minutes = parseInt(part[1]);
	seconds = parseInt(part[2]);
	time = hours*60*60+minutes*60+seconds;
	return time;
}
function parseTimeMinutes(element)
{
	if(element.firstChild.nodeValue == null)
	{
		return -1;
	}
	part = element.firstChild.nodeValue.split(":");

	for(j=1; j<2; j++)
	{
		if(part[j].charAt(0) == "0")
		{
			part[j] = part[j].substring(1, part[j].length);
		}
	}
    
	hours = parseInt(part[0]);
	minutes = parseInt(part[1]);
	time = hours*60+minutes;
	return time;
}
function oAddTimer(element, endTime)
{
	var timer = new Object();
	timer["element"] = element;
	timer["endTime"] = endTime;
	this.timers.push(timer);
}

function formatTime(element, time, formatText)
{
	hours = Math.floor(time/3600);

	minutes = Math.floor(time/60) % 60;
	seconds = time % 60;

	timeString = hours + ":";
	if(minutes < 10)
	{
		timeString += "0";
	}
	timeString += minutes + ":";
	if(seconds < 10)
	{
		timeString += "0";
	}
	timeString += seconds;
	//alert(timeString);
	if(formatText && element.title != "OK")
	{
		
		if(time < 2700)
		{
			element.setAttribute('style', 'font-weight: bold;');
			element.style.color= '#FF0000';
		}
		
		else if(time < 2*3600)
		{
			element.style.color= '#FF0000';
		}
		else if(time < 8*3600)
		{
			element.style.color= '#FF6600';
		}
		else if(time < 12*3600)
		{
			element.style.color= '#CCAA00';
		}
		/*
		if(time < 5*3600)
		{
			element.setAttribute('style', 'font-weight: bold;');
			element.style.color= '#FF0000';
		}*/
		//alert(element.style);
		//timeString = '<b>' + timeString + '</b>';
	}
	if(element != 0)
	{
		//element.innerHTML = timeString;
		element.firstChild.nodeValue = timeString;
	}
	else
	{
		return timeString;
	}
}
function convertDate(oldDate)
{
	var months = new Array();
	months['01'] =  'Jan';
	months['02'] =  'Feb';
	months['03'] =  'Mar';
	months['04'] =  'Apr';
	months['05'] =  'May';
	months['06'] =  'Jun';
	months['07'] =  'Jul';
	months['08'] =  'Aug';
	months['09'] =  'Sep';
	months['10'] =  'Oct';
	months['11'] =  'Nov';
	months['12'] =  'Dec';
	
	var month = oldDate.substr(oldDate.indexOf('.') + 1, 2);
	var day = oldDate.substr(0,2);
	
	if(day.substr(0, 1) == '0')
	{
		day = day.substr(1);
	}
	return months[month] + ' ' + day;
}

function getLocalTime()
{
	var now = new Date();
	return Math.floor(now.getTime()/1000)
}

// Didn't like some quirks with default javascript sort
function mergesort(m,compare,order)
{
	var left = new Array();
	var right = new Array();
	var result = new Array();
	
	if(m.length <= 1)
	{
		return m;
	}
	else
	{
		var middle = m.length / 2;
		for(var x = 0; x < m.length; x++)
		{
			if(x < middle)
			{
				left.push(m[x]);
			}
			else
			{
				right.push(m[x]);
			}
		}
		left = mergesort(left,compare,order);
		right = mergesort(right,compare,order);
		result = merge(left, right,compare,order);
		return result;
	}		
}

function merge(left, right, compare, order)
{
	var result = new Array();
	
	while(left.length > 0 && right.length > 0)
	{
		//if(left[0] <= right[0])
		if(compare(left[0],right[0]) < 0)
		{
			var comparison = true;
		}
		else
		{
			var comparison = false;
		}
		
		if(order == 'DESC')
		{
			comparison = !comparison;
		}
		
		if(comparison)
		{
			result.push(left.shift());
		}
		else
		{
			result.push(right.shift());
		}
	}
	if(left.length > 0)
	{
		result = result.concat(left);
	}
	if(right.length > 0)
	{
		result = result.concat(right);
	}
	return result;
}

// Function to add some new cols, one would be village type, one would be village cluster
function resort(callback, order)
{
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);

	var rows = tables[tid].getElementsByTagName('tr');
	
	var rowlist = new Array();
	
	// Remove all rows
	var x = 0;
	while(rows.length > 1)
	{
		var row = rows[1];
		rowlist.push(row);
		
		row.parentNode.removeChild(row)
		x++;
	}
	
	// Sort it
	rowlist = mergesort(rowlist, callback, order);
	
	// Put the rows back
	var rowHighlight = true;
	for(var rid = 0; rid < rowlist.length; rid++)
	{
		rowlist[rid].className = rowHighlight ? 'nowrap row_a' : 'nowrap row_b';

		rows[0].parentNode.appendChild(rowlist[rid]);
		rowHighlight = !rowHighlight;
	}
}

//////////////////////////////////
// Makes a generic sort function
//////////////////////////////////
function makeColSort(callback)
{
	return function()
	{
		if(this.getAttribute('sortOrder') == 'DESC')
		{
			resort(callback, 'ASC');
			this.setAttribute('sortOrder', 'ASC');
			//this.className = 'ASC';
		}
		else
		{
			resort(callback, 'DESC');
			this.setAttribute('sortOrder', 'DESC');
			//this.className = 'DESC';
		}
		var oldSorted = document.getElementById('sorted');
		this.id = 'sorted';
		this.style.background = '#AABB99';
		
		if(oldSorted && oldSorted != this)
		{
			oldSorted.setAttribute('sortOrder', '');
			oldSorted.id = '';
			oldSorted.style.background = '';
		}
	};
}

/////////////////////////////////////////
// Adds sort functions to unit columns
/////////////////////////////////////////
function addUnitSort(start)
{
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);

	var headers = tables[tid].getElementsByTagName('tr')[0].getElementsByTagName('th');
	
	for(var h = start; h < headers.length - 3; h++)
	{
		headers[h].addEventListener('click', makeColSort( makeIntCompare(h, false) ), false);
	}
}

/*
/////////////////////////////////////
// Makes a unit comparison function
/////////////////////////////////////
function makeUnitCompare(unitId)
{
	return function(a,b)
	{
		var aComp = parseInt(a.getElementsByTagName('td')[unitId].firstChild.nodeValue);
		var bComp = parseInt(b.getElementsByTagName('td')[unitId].firstChild.nodeValue);
	
		if (aComp == bComp)
		{
			return 0;
		}
	
		return (aComp < bComp) ? -1 : 1;
	}
}
*/
/////////////////////////////////////////
// Adds sort functions to other columns
/////////////////////////////////////////
function addMiscSort(positions)
{
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);

	var headers = tables[tid].getElementsByTagName('tr')[0].getElementsByTagName('th');
	
	for(name in positions)
	{
		if(positions[name] < 0)
		{
			positions[name] += headers.length;
		}
	}
	
	// Name 0, noble -2, mercahnts -1
	headers[positions['name']].addEventListener('click',  makeColSort(makeNameCompare(positions['name'])) ,false);
	headers[positions['group_number']].addEventListener('click',  makeColSort(makeIntCompare(positions['group_number'], true)) ,false);
	headers[positions['village_type']].addEventListener('click',  makeColSort(makeTypeCompare(positions['village_type'])) ,false);
	headers[positions['nobles']].addEventListener('click',  makeColSort(makeNobleCompare(positions['nobles'])) ,false);
	headers[positions['merchants']].addEventListener('click',  makeColSort(makeMerchantCompare(positions['merchants'])) ,false);
}

/////////////////////////
// Misc Sort Functions
/////////////////////////
function makeIntCompare(position, reverse)
{
	return function(a,b)
	{
		var pos = position;

		if(pos < 0)
		{
			pos += a.getElementsByTagName('td').length;
		}
		
		var aComp = parseInt(a.getElementsByTagName('td')[pos].firstChild.nodeValue);
		var bComp = parseInt(b.getElementsByTagName('td')[pos].firstChild.nodeValue);
	
		if (aComp == bComp)
		{
			return 0;
		}
		
		if(reverse)
		{
			return (aComp < bComp) ? 1 : -1;
		}
		else
		{
			return (aComp < bComp) ? -1 : 1;
		}
	}
}
function makeNameCompare(position)
{
	return function (a, b)
	{
		var pos = position;
		
		if(pos < 0)
		{
			pos += a.getElementsByTagName('td').length;
		}
		var aComp = a.getElementsByTagName('td')[pos].getElementsByTagName('a')[0].innerHTML;
		var bComp = b.getElementsByTagName('td')[pos].getElementsByTagName('a')[0].innerHTML;
	
		if (aComp == bComp)
		{
			return 0;
		}
	
		return (aComp < bComp) ? 1 : -1;
	}
}

function makeTypeCompare(position)
{
	return function(a,b)
	{
		var pos = position;

		if(pos < 0)
		{
			pos += a.getElementsByTagName('td').length;
		}
		
		var aComp = a.getElementsByTagName('td')[pos].firstChild.nodeValue;
		var bComp = b.getElementsByTagName('td')[pos].firstChild.nodeValue;
		
		if (aComp == bComp)
		{
			return 0;
		}
		
		return (aComp < bComp) ? -1 : 1;
	}
}

function makeNobleCompare(position)
{
	return function (a, b)
	{
		var pos = position;
		
		a = a.getElementsByTagName('td');
		b = b.getElementsByTagName('td');
		
		if(pos < 0)
		{
			pos += a.length;
		}
		
		var aComp = a[pos].getElementsByTagName('a');
		var bComp = b[pos].getElementsByTagName('a');
	
		if(aComp.length < 1)
		{
			aComp = -1;
		}
		else
		{
			aComp = parseInt(aComp[0].innerHTML);
		}
		if(bComp.length < 1)
		{
			bComp = -1;
		}
		else
		{
			bComp = parseInt(bComp[0].innerHTML);
		}
	
		if (aComp == bComp)
		{
			return 0;
		}
	
		return (aComp < bComp) ? -1 : 1;
	}
}

function makeMerchantCompare(position)
{
	return function (a, b)
	{
		var pos = position;
		
		a = a.getElementsByTagName('td');
		b = b.getElementsByTagName('td');
		
		if(pos < 0)
		{
			pos += a.length;
		}
		
		var aComp = a[pos].getElementsByTagName('a')[0].innerHTML.split('/');
		var bComp = b[pos].getElementsByTagName('a')[0].innerHTML.split('/');
		
		aComp[0] = parseInt(aComp[0]);
		aComp[1] = parseInt(aComp[1]);
		bComp[0] = parseInt(bComp[0]);
		bComp[1] = parseInt(bComp[1]);
		
		if (aComp[0] == bComp[0])
		{
			if (aComp[1] == bComp[1])
			{
				return 0;
			}
		
			return (aComp[1] < bComp[1]) ? -1 : 1;
		}
	
		return (aComp[0] < bComp[0]) ? -1 : 1;
	}
}

function enableOkEditing()
{
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);
	
	var rows = tables[tid].getElementsByTagName('tr');
	//alert(rows.length);
	for(var rid = 1; rid < rows.length; rid++)
	{
		var cells = rows[rid].getElementsByTagName('td');
		var villageId = delimString('village=', '&', cells[0].getElementsByTagName('a')[0].href);
		
		cells[1].addEventListener('click', makeOkToggle(villageId, '1', !isOkGM(villageId, '1') ), false);
		cells[2].addEventListener('click', makeOkToggle(villageId, '2', !isOkGM(villageId, '2') ), false);
		cells[3].addEventListener('click', makeOkToggle(villageId, '3', !isOkGM(villageId, '3') ), false);
	}
}

function makeOkToggle(villageId, position, toggle)
{
	return function()
	{
		if(document.getElementById('okenabled'))
		{
			toggleOK(villageId, position, toggle);
			if(toggle)
			{
				this.style.background = '#FAF693';
				this.setAttribute('ok', 'true');
			}
			else
			{
				this.setAttribute('ok', 'false');
				if(this.parentNode.getAttribute('clicked') == 'true')
				{
					this.style.background = '#DED3B9';
				}
				else
				{
					this.style.background = '';
				}
			}
			this.removeEventListener('click',arguments.callee,false);
			this.addEventListener('click',  makeOkToggle(villageId, position, !toggle) ,false);
		}
		
	};
}

function toggleOK(villageId, position, toggle)
{
	var settings = GM_getValue('overview_timer_settings');

	if(settings)
	{
		settings = settings.split(';');
	}
	else
	{
		settings = new Array();
	}
	
	var finalSettings = new Array();
	
	for(var settingId = 0; settingId < settings.length; settingId++)
	{
		var setting = settings[settingId].split('*');
		
		if( setting[0] == villageId && setting[1] == position )
		{
			var set = true;
			if(toggle)
			{
				finalSettings[finalSettings.length] = settings[settingId];
			}
		}
		else
		{
			finalSettings[finalSettings.length] = settings[settingId];
		}
	}
	if(!set && toggle)
	{
		finalSettings[finalSettings.length] = villageId + '*' +  position;
	}
	finalSettings = finalSettings.join(';');

	GM_setValue('overview_timer_settings', finalSettings);
}
function isOkGM(villageId, position)
{
	var settings = GM_getValue('overview_timer_settings');
	
	if(settings)
	{
		settings = settings.split(';');
		for(var settingId = 0; settingId < settings.length; settingId++)
		{
			var setting = settings[settingId].split('*');
			if( setting[0] == villageId && setting[1] == position )
			{
				return true;
			}
		}
	}
	return false;
}

function addOkButton()
{
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);

	var headers = tables[tid].getElementsByTagName('tr')[0].getElementsByTagName('th');
	
	var toggleOkMode = function()
	{
		var okenabled = document.getElementById('okenabled');
		if(okenabled)
		{
			var settings = GM_getValue('overview_timer_settings', '');
			var newSettings = prompt('If you wish to back up your settings save the line of text below somewhere.  If you wish to restore your settings change or replace the line of text.  Otherwise press Cancel to exit OK editing mode.', settings);
			
			if(settings != newSettings && newSettings != null)
			{
				alert('Changed');
				GM_setValue('overview_timer_settings', newSettings);
			}
			headers[1].style.background = '';
			headers[2].style.background = '';
			headers[3].style.background = '';
			
			okenabled.id = '';
			removeHighlights();
		}
		else
		{
			headers[1].style.background = '#FAF693';
			headers[2].style.background = '#FAF693';
			headers[3].style.background = '#FAF693';
			
			this.id = 'okenabled';
			highlightOks();
		}
	};
	
	headers[1].addEventListener('dblclick',toggleOkMode,false);
	headers[2].addEventListener('dblclick',toggleOkMode,false);
	headers[3].addEventListener('dblclick',toggleOkMode,false);

}

function highlightOks()
{
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);
	
	var rows = tables[tid].getElementsByTagName('tr');
	for(var rid = 1; rid < rows.length; rid++)
	{
		var cells = rows[rid].getElementsByTagName('td');
		var villageId = delimString('village=', '&', cells[0].getElementsByTagName('a')[0].href);
		
		for(var x = 1; x < 4; x++)
		{
			if(isOkGM(villageId, x))
			{
				cells[x].style.background = '#FAF693';
				cells[x].setAttribute('ok', 'true');
			}
		}
	}
}
function removeHighlights()
{
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);
	
	var rows = tables[tid].getElementsByTagName('tr');
	for(var rid = 1; rid < rows.length; rid++)
	{
		var cells = rows[rid].getElementsByTagName('td');
		for(var x = 0; x < cells.length; x++)
		{			
			if(cells[x].parentNode.getAttribute('clicked') == 'true')
			{
				cells[x].style.background = '#DED3B9';
			}
			else
			{
				cells[x].style.background = '';
			}
			
			if(cells[x].getAttribute('ok') == 'true')
			{
				cells[x].setAttribute('ok', 'false');
			}
		}
	}
}

function addColumn(position, headerHTML, colData)
{
	// Position is the place we put the column BEFORE, add after position - 1
	
	// Cycle through cols and pull from coldata
	
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);

	var rows = tables[tid].getElementsByTagName('tr');
	
	// Add the header in
	
	var header = rows[0].getElementsByTagName('th');
	if( position > header.length || position == 0 ) // For now we won't allow putting at position 0
	{
		return;
	}
	
	var newheader = document.createElement('TH');
	newheader.innerHTML = headerHTML;
	rows[0].insertBefore(newheader, header[position]);
	

	
	// Add the data columns in
	for( var rid = 1; rid < rows.length; rid++)
	{
		var cells = rows[rid].getElementsByTagName('td');
		
		var villageId = delimString('village=', '&', cells[0].getElementsByTagName('a')[0].href);
		
		var newcell = document.createElement('TD');
		if(colData[villageId])
		{
			newcell.innerHTML = colData[villageId];
		}
		else
		{
			//newcell.innerHTML = '';
			newcell.innerHTML = colData['global'];
		}
		rows[rid].insertBefore(newcell, cells[position]);

	}
}

function removeColumn(position)
{
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);

	var rows = tables[tid].getElementsByTagName('tr');
	
	var header = rows[0].getElementsByTagName('th');
	
	if(position < 0)
	{
		position += header.length;
	}
	
	if( header.length <= position )
	{
		return;
	}
	
	rows[0].removeChild(header[position]);
	
	for( var rid = 1; rid < rows.length; rid++)
	{
		rows[rid].removeChild(rows[rid].getElementsByTagName('td')[position]);
	}
}

function addDistanceButton()
{
	var tables = document.getElementsByTagName('table');
	var tid = findTable(tables);

	var headers = tables[tid].getElementsByTagName('tr')[0].getElementsByTagName('th');
	
	var distanceMenu = function()
	{
		var x = 20;
		var y = 70;
		function setVisible(obj)
		{
			obj = document.getElementById(obj);
			obj.style.visibility = (obj.style.visibility == 'visible') ? 'hidden' : 'visible';
		}
		function placeIt(obj)
		{
			obj = document.getElementById(obj);
			if (document.documentElement)
			{
				theLeft = document.documentElement.scrollLeft;
				theTop = document.documentElement.scrollTop;
			}
			else if (document.body)
			{
				theLeft = document.body.scrollLeft;
				theTop = document.body.scrollTop;
			}
			theLeft += x;
			theTop += y;
			obj.style.left = theLeft + 'px' ;
			obj.style.top = theTop + 'px' ;
			setTimeout("placeIt('layer1')",500);
		}
		window.onscroll = setTimeout("placeIt('layer1')",500);
		/*var okenabled = document.getElementById('okenabled');
		if(okenabled)
		{
			var settings = GM_getValue('overview_timer_settings', '');
			var newSettings = prompt('If you wish to back up your settings save the line of text below somewhere.  If you wish to restore your settings change or replace the line of text.  Otherwise press Cancel to exit OK editing mode.', settings);
			
			if(settings != newSettings && newSettings != null)
			{
				alert('Changed');
				GM_setValue('overview_timer_settings', newSettings);
			}
			headers[1].style.background = '';
			headers[2].style.background = '';
			headers[3].style.background = '';
			
			hit.id = '';
			removeHighlights();
		}
		else
		{
			headers[1].style.background = '#FAF693';
			headers[2].style.background = '#FAF693';
			headers[3].style.background = '#FAF693';
			
			this.id = 'hit';
			highlightOks();
		}*/
	};
	
	headers[19].addEventListener('click',distanceMenu,false);
}