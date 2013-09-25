# Tribalwars Toolkit

This is here mostly for memories sake. This serves as a reminder of how my coding style has changed from before my formal CS education. It was the last major project I did before starting Computer Science.

I developed this in 2007 as add-on for the game Tribalwars. One notable thing here is that plain vanilla Javascript is used. I thought that it was pretty fun to be directly in touch with the DOM. Back in 2007 jQuery and the other cool JS frameworks weren't very popular yet.

This really helped lots of people who used this because many spent hours keeping track of data to optimize their gameplay, myself included.

- The "frontend", Greasemonkey scripts to inject Javascript into the page to 
	- Scrape data off the pages and send to the backend for analysis
	- Augment the UI with several data driven enhancements
	- Utilize data from the backend to assist the user in strategy
- A set of PHP scripts to recieve and store data from the "frontend"
- A backend to analyze the data, make decisions about the data, and send these decisions back to the "frontend"

Much of the serverside codebase for this is now unavailable. For now I've uploaded the "frontend". Portions of the serverside PHP code will be added as I look through old backups.