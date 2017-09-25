angular.module("myApp", ['ui.router'])
  .config([
    '$stateProvider',
    '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
      $stateProvider
        .state('index', {
          url: '/index',
          templateUrl: '/index.html',
          controller: 'myCtrl'
        });
      $stateProvider
        .state('approve', {
          url: '/approve?client_id&client_name&reqid&client_img',
          templateUrl: '/approve.html',
          controller: 'approveCtrl'
        });
      $stateProvider
        .state('error', {
          url: '/error?error_message',
          templateUrl: '/error.html',
          controller: 'errorCtrl'
        });
      $urlRouterProvider.otherwise('index');
  }])

  .controller("myCtrl", function($scope, $window) {
    if(!sessionStorage.getItem("owner_pico_id")){
      document.cookie = "previousUrl = "+  window.location.href;
      $window.location.href = $window.location.origin;//redirect to the login
    }
  })

  .controller("approveCtrl", function($scope,$stateParams, $window) {
    if(!sessionStorage.getItem("owner_pico_id")){
      document.cookie = "previousUrl = "+  window.location.href;
      $window.location.href = $window.location.origin;//redirect to the login
    }
    $scope.client_id = $stateParams.client_id;
    $scope.client_name = $stateParams.client_name;
    $scope.reqid = $stateParams.reqid;
    $scope.owner_id = sessionStorage.getItem("owner_pico_id");
    $scope.client_img = $stateParams.client_img;
  })

  .controller("errorCtrl", function($scope,$stateParams, $window) {
    if(!sessionStorage.getItem("owner_pico_id")){
      document.cookie = "previousUrl = "+  window.location.href;
      $window.location.href = $window.location.origin;//redirect to the login
    }
     $scope.error_message = $stateParams.error_message;
  });
