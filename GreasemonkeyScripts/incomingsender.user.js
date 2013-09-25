// ==UserScript==
// @name           Incoming Sender
// @description    Sends incoming attacks to the backend for analysis
// @namespace      http://www.di-rs.com
// @include        http://en7.tribalwars.net/game.php?*&screen=info_command&id=*&type=other
// ==/UserScript==

/* Copyright (c) 2007 Eric Kaggen */

/*
Used for analyzing incoming attacks to determine best
strategy for mitigation
*/
version = 1002;

var access_user = GM_getValue('access_user');
var access_key = GM_getValue('access_key');

while(!access_user || !access_key)
{
	access_user = prompt("No access username found\nPlease enter your access username", '');
	access_key = prompt("No access key found\nPlease enter your access key", '');
	GM_setValue('access_user', access_user);
	GM_setValue('access_key', access_key);
}
incoming_url = 'http://www.di-tw.com/other/incomingreciever.php';
access_username = access_user;
access_password = access_key;

var tables = document.getElementsByTagName('table');

for(var x = 0; x < tables.length; x++)
{
	if(tables[x].className == 'vis')
	{
		var table = tables[x];
		break;
	}
}

var cells = table.getElementsByTagName('td');

// 2, 4, 7, 9, 11, 13, 14

var originPlayer = cells[2].getElementsByTagName('a')[0];

var data = new Array();

var originPlayer = cells[2].getElementsByTagName('a')[0];
data[data.length] = 'origin_player_id=' + originPlayer.href.substring(originPlayer.href.indexOf('id=') + 3);
data[data.length] = 'origin_player_name=' + originPlayer.innerHTML;

var attVillage = cells[4].getElementsByTagName('a')[0];

var coordStr = attVillage.innerHTML;
var position = 0;

while(true)
{
	position = coordStr.indexOf('(');
	
	if(position == -1)
	{
		break;
	}
	coordStr = coordStr.substring(position + 1);
	var name = attVillage.innerHTML.substring(0, position - 1 );
}

data[data.length] = 'origin_village_id=' + attVillage.href.substring(attVillage.href.indexOf('id=') + 3);

data[data.length] = 'origin_village_x=' + coordStr.substr(0, 3);
data[data.length] = 'origin_village_y=' + coordStr.substr(4, 3);

data[data.length] = 'origin_village_name=' + name;


var destinationPlayer = cells[7].getElementsByTagName('a')[0];
data[data.length] = 'destination_player_id=' + destinationPlayer.href.substring(destinationPlayer.href.indexOf('id=') + 3);
data[data.length] = 'destination_player_name=' + destinationPlayer.innerHTML;

var destinationVillage = cells[9].getElementsByTagName('a')[0];

coordStr = destinationVillage.innerHTML;
position = 0;

while(true)
{
	position = coordStr.indexOf('(');
	
	if(position == -1)
	{
		break;
	}
	coordStr = coordStr.substring(position + 1);
	var name = destinationVillage.innerHTML.substring(0, position - 1 );
}

data[data.length] = 'destination_village_id=' + destinationVillage.href.substring(destinationVillage.href.indexOf('id=') + 3);

data[data.length] = 'destination_village_x=' + coordStr.substr(0, 3);
data[data.length] = 'destination_village_y=' + coordStr.substr(4, 3);

data[data.length] = 'destination_village_name=' + name;
data[data.length] = 'server_time=' + document.getElementById('serverTime').firstChild.nodeValue;

if(destinationPlayer.innerHTML != originPlayer.innerHTML)
{
	data[data.length] = 'command_id=' + delimString('id=', '&', cells[14].getElementsByTagName('a')[0].href);
	data[data.length] = 'arrival=' + cells[11].firstChild.nodeValue.replace('<span class="small hidden">', '').replace('</span>', '');
	data[data.length] = 'time_left=' + cells[13].getElementsByTagName('span')[0].firstChild.nodeValue;
}
else
{
	data[data.length] = 'duration=' + cells[11].firstChild.nodeValue;
	data[data.length] = 'command_id=' + delimString('id=', '&', document.location.href);
	data[data.length] = 'arrival=' + cells[13].firstChild.nodeValue.replace('<span class="small hidden">', '').replace('</span>', '');
	data[data.length] = 'time_left=' + cells[15].getElementsByTagName('span')[0].firstChild.nodeValue;
}



//document.getElementById('quickbar').innerHTML = data.join('*');
if(document.getElementsByTagName('h2')[0].innerHTML.indexOf('Attack') != -1)
{
	data[data.length] = 'type=1';
}
else if (document.getElementsByTagName('h2')[0].innerHTML.indexOf('Support') != -1)
{
	data[data.length] = 'type=2';
}

var finalData = data.join('\\*\\');
finalData = finalData.replace('&gt;', '>');
finalData = finalData.replace('&lt;', '<');

if(finalData.indexOf('&') != -1)
{
	alert('An error has occured, output string contains &');
}

GM_xmlhttpRequest(
{
	method:'POST',
	url: incoming_url + '?username=' + access_username + '&password=' + access_password + '&version=' + version,
	headers: {'Content-type': 'application/x-www-form-urlencoded'},
	data: 'data=' + finalData,
	onload: ajaxgo
});

function ajaxgo(details)
{
	if(details.responseText.indexOf('[OK]') != -1)
	{
		/*document.getElementsByTagName('body')[0]*/cells[cells.length - 1].innerHTML += '<center>' + details.responseText + '</center>';
	}
	else if(details.responseText.indexOf('[ERROR]') != -1)
	{
		/*document.getElementsByTagName('body')[0]*/cells[cells.length - 1].innerHTML += '<center>' + details.responseText + '</center>';
		if(details.responseText.indexOf('{801}') != -1)
		{
			GM_setValue('access_user', '');
			GM_setValue('access_key', '');
		}
	}
}

function delimString(delim1, delim2, str)
{
	var position1 = str.indexOf(delim1) + delim1.length;
	var length = str.substr(position1).indexOf(delim2);
	
	return str.substr( position1, length );
}