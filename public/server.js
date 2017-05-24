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
          url: '/approve?client_id&client_name&reqid',
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

  .controller("myCtrl", function($scope) {
  })

  .controller("approveCtrl", function($scope,$stateParams) {
    $scope.client_id = $stateParams.client_id;
    $scope.client_name = $stateParams.client_name;
    $scope.reqid = $stateParams.reqid;
  })

  .controller("errorCtrl", function($scope,$stateParams) {
     $scope.error_message = $stateParams.error_message;
  });
