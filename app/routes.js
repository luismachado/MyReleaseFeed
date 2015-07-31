var request = require('request');
var cheerio = require('cheerio');
var winston = require('winston');
var fs 		= require('fs');
var configs = require('../config/db');
var currentSectionsContent = null;

function finishSections (sectionsContent, timestamp) {
	console.log(timestamp);
	return {
			    'Apps'   : sectionsContent[0],
			    'eBooks' : sectionsContent[1],
			    'Games'  : sectionsContent[2],
			    'Movies' : sectionsContent[3],
			    'Music'  : sectionsContent[4],
			    'TVShows': sectionsContent[5],
			    'timestamp' : timestamp
			};
}

function saveSections (sectionsContent) {

	if(currentSectionsContent == null || currentSectionsContent.timestamp < sectionsContent.timestamp)
		currentSectionsContent = sectionsContent;

}

function dateDiffInDays(currentDate, postDate) {
    var date1 = postDate;
    var date2 = currentDate;
    var diffDays = -1;
    try {
    	var utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate(), date1.getHours(), date1.getMinutes());
    	var utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate(), date2.getHours(), date2.getMinutes());
    	diffDays = (utc2 - utc1) / (1000 * 60 * 60 * 24); 
	} catch (err) {
		winston.warn('Error parsing date.')
		winston.warn(err);
	}

    return diffDays; 
}

function getDateFromText(text) {
	var date;
	var truncatePostion = text.indexOf(" in ");
	if(truncatePostion != -1) {
		text = text.substring(0,truncatePostion).replace("Posted on ", "").replace(", ","|").replace(" at ","|").
					replace(/ /g, "|").replace(":","|").replace(new RegExp('(\?:st|nd|rd|th)'),"");;
		var textBits = text.split("|");
		
		return new Date(textBits[1] + " " + textBits[0] + " " + textBits[2] + " " +
					textBits[3] + ":" + textBits[4] + ":00 " + textBits[5]);
	}	
}

function generateTorrentURL(releaseTitle) {
	return "http://www.kickass.to/usearch/" + releaseTitle.replace(/ /g, ".") + "/";

}

function updateReleases(pageNum, sectionsContent, sectionsList, timestamp) {
	
	request(configs.url+pageNum+"/", function (error, response, html){        
		if(!error){
		    var $ = cheerio.load(html);

		    $('.entry').each(function(){
		    	var release = { title : "", url : "", url_download : "", filterOut : false, highlight : false};
		    	var entry = $(this);

		    	release.title = entry.find('.title a').text().replace("\r\n","");
		    	release.url =   entry.find('.postReadMore').attr('href');
		    	release.url_download = generateTorrentURL(release.title);

		    	// Insert into right category
		    	entry.find('.postSubTitle a').each(function() {
		    		var tagDOM = $(this);
		    		if(tagDOM.attr('rel') == 'category tag') {
		    			var tag = {'name' : '', 'url' : ''}
		    			tag.name = tagDOM.text();
		    			tag.url  = tagDOM.attr('href');

		    			var sectionIdx = sectionsList.indexOf(tag.url);
		    			if(sectionIdx != -1)
		    				sectionsContent[sectionIdx].push(release);
		    		}
	    		});	
				    	        
		    });

			var tempo = $('.entry').last().find('.postSubTitle').text();
			//if still less that 1 day
			var dateDiff =	dateDiffInDays(new Date(), getDateFromText(tempo));			
			if(dateDiff != -1 && dateDiff < 1) {
				//call next page
				updateReleases(++pageNum,sectionsContent, sectionsList, timestamp)
			} else if(dateDiff == -1) {			
				winston.info("Finished with errors");
			} else {
				//finish section and send JSON				
				winston.info("Finished");
				saveSections(finishSections(sectionsContent, timestamp));
			}
		}
	});
}

function startUpdate() {
	
	winston.info("Scheduled Release Refresh.");
	updateReleases(1,[[],[],[],[],[],[]],configs.sectionsLista, Date.now());
}

module.exports = function(app) {

    startUpdate();
    setInterval(startUpdate, 600000);

	/*app.get('/MyReleaseFeed/download', function(req, res){
		exports.startUpdate();
	});*/

	app.get('/MyReleaseFeed/get', function(req, res){
		winston.info("MyReleaseFeed - Request from " + req.ip);
		res.json(currentSectionsContent);
	});

	app.get('/MyReleaseFeed', function(req, res) {
            res.sendfile('./public/index.html');
    });



};