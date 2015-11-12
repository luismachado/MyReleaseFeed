angular.module('ReleasesCtrl', ['ngTagsInput']).controller('ReleasesController', function($scope, $interval, $timeout, Releases) {
	
	$scope.filter = true;
	$scope.loading = true;
	$scope.error = false;
	$scope.releases;
	$scope.visibleHeaders = false;
	$scope.timeDiff = "";
	$scope.filterConfig;
	$scope.latestRelease = {on : true, movies : "", tvshows : "", music : "", games : "", apps : "", ebooks : ""};

	Releases.getReleases().success(function (response) {

		if(response != null) {

			$scope.cleanFilters();

			// Read from localStorage
			if(localStorage.getItem("myrlsfeed_latest"))
				$scope.latestRelease = JSON.parse(localStorage.getItem("myrlsfeed_latest"));
			if(localStorage.getItem("myrlsfeed_config"))
				$scope.filterConfig = JSON.parse(localStorage.getItem("myrlsfeed_config"));
			// Fix this. Copy of releases only to simplify call of highlightItems
			$scope.releases = response;
			highlightItems(response, $scope.filterConfig, $scope.latestRelease)

			// Update and save latest releases to localStorage
			$scope.latestRelease.movies = getLatestRelease($scope.movieList);
			$scope.latestRelease.tvshows = getLatestRelease($scope.showsList);
			$scope.latestRelease.music = getLatestRelease($scope.musicList);
			$scope.latestRelease.games = getLatestRelease($scope.gameList);
			$scope.latestRelease.apps = getLatestRelease($scope.appList);
			$scope.latestRelease.ebooks = getLatestRelease($scope.ebookList);

			// Save to localStorage
			localStorage.setItem("myrlsfeed_latest", JSON.stringify($scope.latestRelease));

			// Init timer
			counter(response.timestamp);
		} else {
			// Show error message
			$scope.error = true;
		}
		$scope.loading = false;
	})

	$scope.showHeaders = function() {
		$scope.visibleHeaders = true;
	}
	$scope.hideHeaders = function() {
		$scope.visibleHeaders = false;
	}

	// Return 1st position of the list of '' if empty
	var getLatestRelease = function(list) {
		if (list.length > 0)
			return list[0].title;
		return "";
	}

	// save stuff to localStorage
	$scope.saveConfig = function() {
		localStorage.setItem("myrlsfeed_config", JSON.stringify($scope.filterConfig));
		localStorage.setItem("myrlsfeed_latest", JSON.stringify($scope.latestRelease));
		highlightItems($scope.releases, $scope.filterConfig, $scope.latestRelease);
	}

	$scope.cleanFilters = function() {
		$scope.filterConfig = {on : true, all : [], movies : [], tvshows : [], music : [], games : [], apps : [], ebooks : []};	
	}

	var highlightItems = function(releases, filterConfig, latestRelease) {

		var highlightReturn = highlightItemsPerType(releases.Movies, filterConfig.on, filterConfig.movies, filterConfig.all, latestRelease.on, latestRelease.movies);
		$scope.movieList = highlightReturn.list;
		$scope.movieHighlightCount = highlightReturn.counter;
		highlightReturn = highlightItemsPerType(releases.TVShows, filterConfig.on, filterConfig.tvshows, filterConfig.all, latestRelease.on, latestRelease.tvshows);
		$scope.showsList = highlightReturn.list;
		$scope.showsHighlightCount = highlightReturn.counter;
		highlightReturn = highlightItemsPerType(releases.Music, filterConfig.on, filterConfig.music, filterConfig.all, latestRelease.on, latestRelease.music);
		$scope.musicList = highlightReturn.list;
		$scope.musicHighlightCount = highlightReturn.counter;
		highlightReturn = highlightItemsPerType(releases.Games, filterConfig.on, filterConfig.games, filterConfig.all, latestRelease.on, latestRelease.games);
		$scope.gameList  = highlightReturn.list;
		$scope.gameHighlightCount = highlightReturn.counter;
		highlightReturn = highlightItemsPerType(releases.Apps, filterConfig.on, filterConfig.apps, filterConfig.all, latestRelease.on, latestRelease.apps);
		$scope.appList   = highlightReturn.list;
		$scope.appHighlightCount = highlightReturn.counter;
		highlightReturn = highlightItemsPerType(releases.eBooks, filterConfig.on, filterConfig.ebooks, filterConfig.all, latestRelease.on, latestRelease.ebooks);	
		$scope.ebookList = highlightReturn.list;
		$scope.ebookHighlightCount = highlightReturn.counter;
	}

	var highlightItemsPerType = function(list, toFilter, specificFilters, generalFilters, highlightLatestRelease, latestRelease) {
		var stillNew = true;
		var highlightCounter = 0;
		for(var listIdx = 0; listIdx < list.length; listIdx++) {
			list[listIdx].highlight = false;
			for(var filtersIdx = 0; filtersIdx < specificFilters.length && toFilter; filtersIdx++) {
				if(list[listIdx].title.indexOf(specificFilters[filtersIdx].text) != -1) {
					list[listIdx].highlight = true;
					highlightCounter++;
				}
			}
			for(var filtersIdx = 0; filtersIdx < generalFilters.length && toFilter; filtersIdx++) {
				if(list[listIdx].title.indexOf(generalFilters[filtersIdx].text) != -1) {
					list[listIdx].highlight = true;
					highlightCounter++;
				}
			}
			if(stillNew && highlightLatestRelease && latestRelease && list[listIdx].title != latestRelease)
				list[listIdx].newItem = true;
			else
				stillNew = false;
		}
		return {list : list, counter : highlightCounter };
	}


	var counter = function(timestamp) {
		this.hours = 0, this.minutes = 0, this.seconds = 0;
		refresh(timestamp);
	}

	var calcDiff = function(initialTimestamp) {
		var currentTimestamp = new Date().getTime();
		var elapsedTime = currentTimestamp - initialTimestamp;

		var timeAux = Math.trunc(elapsedTime / 1000);
		this.seconds = timeAux % 60;
		timeAux = Math.trunc(timeAux / 60);
		this.minutes = timeAux % 60;
		timeAux = Math.trunc(timeAux / 60);;
		this.hours = timeAux % 24;	
	}

	var addZeros = function(value) {
		return value < 10 ? ("0"+value) : value;
	}

	var formatTime = function() {
		this.seconds = addZeros(this.seconds);
		this.minutes = addZeros(this.minutes);
	};

	// Counter timer
	var refresh = function(initialTimestamp) {
		calcDiff(initialTimestamp);
		formatTime();
		$scope.timeDiff = "Most recent fetch: " +
			(this.hours >= 1 ? " More than one hour" : (this.minutes + ":" + this.seconds));
		
		if(this.hours < 1) $timeout( function(){ refresh(initialTimestamp); }, 500);
	}
})
//Tag Plugin configuration -> don't override blank spaces
.config(function(tagsInputConfigProvider) {
  tagsInputConfigProvider.setDefaults('tagsInput', {
    replaceSpacesWithDashes: false
  })
});