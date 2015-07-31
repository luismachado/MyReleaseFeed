angular.module('ReleasesService', []).
	factory('Releases', ['$http', function($http) {

	var ReleasesAPI = {};	

	ReleasesAPI.getReleases = function() {

		return $http({
			url: '/MyReleaseFeed/get'
		});
	}

	return ReleasesAPI;

}]);