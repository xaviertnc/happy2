<?php // PJAX-APP Front Controller

function full_url($baseUrl, $href) {
  if (strpos($href, 'http') === 0) { return $href; }
  return  $baseUrl . $href;
}

function array_get(array $array, $key, $default = null) {
  return isset($array[$key]) ? $array[$key] : $default;
}

register_shutdown_function(function() {
  if (error_get_last() !== null) {
    ob_clean();
    http_response_code(500);
    echo '<div class="error server-error"><h3>Oops, something went wrong!</h3>', PHP_EOL;
    if (__DEBUG__) { echo '<hr><pre>', print_r(error_get_last(), true), '</pre>'; }
    echo PHP_EOL, '</div>';
	}
});


ob_start();

session_start();


$app = new stdClass();

// SERVER CONFIG
require '.env-local';

// APP CONFIG
$app->id = 'HappyJsDemo';
$app->siteName = 'HappyJS';
$app->siteSlogan = 'Validation that makes you smile!';
$app->appPath = $app->rootPath . '/app';
$app->webRootPath = $app->rootPath;
$app->configPath = $app->appPath . '/config';
$app->modelsPath = $app->appPath . '/models';
$app->pagesPath = $app->appPath . '/pages';
$app->servicesPath = $app->appPath . '/services';
$app->vendorsPath = $app->appPath . '/vendors';
$app->componentsPath = $app->pagesPath . '/shared/components';
$app->assetsPath = $app->webRootPath . '/assets';
$app->storagePath = $app->webRootPath . '/storage';
$app->cachePath = $app->storagePath . '/cache';
$app->assetsUri = 'assets';
$app->homeUri = 'demo1';

$app->styles = [
  $app->assetsPath . '/css/style.css',
  $app->assetsPath . '/css/form.css'
];

$app->scripts = [
  'vendor' => [
    // $app->vendorsPath . '/onefile/polyfill.js',
    $app->vendorsPath . '/onefile/alerts.js',
    $app->vendorsPath . '/onefile/modal.js',
    $app->vendorsPath . '/onefile/b2top.js',
    $app->vendorsPath . '/onefile/tabs.js',
    $app->vendorsPath . '/onefile/pjax.js',
    $app->vendorsPath . '/onefile/h7.js'
  ],
  'main' => [
    $app->webRootPath . '/assets/js/main.js'
  ]
];


date_default_timezone_set($app->timezone);

// MODULE CONFIGS
// require $app->configPath . '/paypal.php';
// require $app->configPath . '/mail.php';


// APP SERVICES
require $app->servicesPath . '/view.php';


// HTTP REQUEST
$request = new stdClass();
$request->uri = $_SERVER['REQUEST_URI'];
$request->protocol = isset($_SERVER['HTTPS']) ? 'https' : 'http';
$request->host = array_get($_SERVER, 'HTTP_HOST', $app->defaultHost);
$request->urlBase = $request->protocol . '://' . $request->host . $app->uriBase;
$request->method = $_SERVER['REQUEST_METHOD'];
$request->back = array_get($_SERVER, 'HTTP_REFERER');
$request->isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']);
$request->parts = explode('?', $request->uri);
$request->query = isset($request->parts[1]) ? $request->parts[1] : '';
$request->pageref = trim(substr($request->parts[0], strlen($app->uriBase)), '/') ?: $app->homeUri;
$request->parts = explode('/', $request->pageref);
$app->request = $request;


// APP RESPONSE
$response = new stdClass();
$response->code = 200;
$response->redirect = 0;
$app->response = $response;


// GET PAGE CONTROLLER
$app->currentPage = $request->parts[count($request->parts)-1];
$app->controllerPath = $app->appPath . '/pages/' . $request->pageref;
$app->controller = $app->controllerPath . '/' . $app->currentPage . '.php';

if ( ! file_exists($app->controller)) {
  $app->controllerPath = $app->pagesPath . '/shared/errors/404';
  $app->controller = $app->controllerPath . '/404.php';
}


// GET APP STATE
$app->state = array_get($_SESSION, $app->id, []);


// RUN PAGE CONTROLLER
require $app->controller;


// SAVE APP STATE
$_SESSION[$app->id] = $app->state;


// HARD REDIRECT?
if ($response->redirect and ! $request->isAjax)
{
  header('location:' . full_url($request->urlBase, $response->redirect));
  exit;
}


http_response_code($response->code);


// AJAX RESPONSE
if ($request->isAjax)
{
  header('Content-type: application/json');
  header('Cache-Control: no-cache, must-revalidate');
  header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  // SOFT REDIRECT?
  if ($response->redirect) { header('X-REDIRECT-TO:'.$response->redirect); }
  echo json_encode($response);
}


// RENDER
ob_end_flush();
