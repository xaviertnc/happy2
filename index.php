<?php // Ultra Simple PHP app...


function array_get(array $array, $key, $default = null) {
  return isset($array[$key]) ? $array[$key] : $default;
}

function full_url($baseUrl, $href) {
  if (strpos($href, 'http') === 0) { return $href; }
  return  $baseUrl . $href;
}


ob_start();

session_start();


register_shutdown_function(function() {
  if (error_get_last() !== null) {
    ob_clean();
    http_response_code(500); // Could do a 202 error (if ajax request) and redirect to the relevant error page!
    echo '<div class="error server-error"><h3>Oops, something went wrong!</h3>', PHP_EOL;
    if (__DEBUG__) { echo '<hr><pre>', print_r(error_get_last(), true), '</pre>'; }
    echo PHP_EOL, '</div>';
	}
});


$app = new stdClass();
$app->id = 'HappyJsDemo';
$app->siteName = 'HappyJS Demo';
$app->homeUri = 'example1';


// GET SERVER CONFIG
require 'env-local.php';


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


// APP STRUCTURE
$app->pagesUri = 'app/pages';
$app->appPath = $app->rootPath . '/app';
$app->configPath = $app->appPath . '/config';
$app->modelsPath = $app->appPath . '/models';
$app->vendorsPath = $app->appPath . '/vendors';
$app->storagePath = $app->appPath . '/storage';
$app->servicesPath = $app->appPath . '/services';
$app->partialsPath = $app->appPath . '/partials';
$app->componentsPath = $app->appPath . '/components';
$app->currentPage = $request->parts[count($request->parts)-1];
$app->controllerPath = $app->appPath . '/pages/' . $request->pageref;
$app->controller = $app->controllerPath . '/' . $app->currentPage . '.php';
if ( ! file_exists($app->controller)) {
  $app->controllerPath = $app->appPath . '/errors/404';
  $app->controller = $app->controllerPath . '/404.php';
}


// APP RESPONSE
$response = new stdClass();
$app->response = $response;


// APP CONFIG
// require $app->configPath . '/paypal.php';
// require $app->configPath . '/mail.php';


// SET TIMEZONE FOR CORRECT MYSQL TIMES
date_default_timezone_set($app->timezone);


// APP SERVICES
require $app->servicesPath . '/view.php';


// Get saved APP-STATE
$app->state = array_get($_SESSION, $app->id, []);


// RUN APP!
require $app->controller;


// Save the APP-STATE before we exit.
$_SESSION[$app->id] = $app->state;


// We might want to REDIRECT after a GET or POST request...
//  After GET: Usually because the client requested a restricted page without authorisation.
//  After POST: To redirect BACK to the form-view or goto a completely different page after login.
//    - After login or when we intend to completely change the application layout, we should
//      favour a HARD REDIRECT that reloads the entire page and NOT just the PJAX viewports.
//
// SOFT/PJAX vs. HARD REDIRECT:
//   SOFT: We delay redirect and ask the client to handle "loading" the page we want to redirect to.
//   HARD: We redirect immediately. If we HARD REDIRECT, the entire page reloads, which results in
//         a loss of the FAST and SMOOTH action provided by PJAX. We also don't allow the client-side
//         app to perform it's normal pre and post page logic which could result the application
//         behaving inconsistantly. e.g. Features like the "loading indicator" might not
//         work as expected.
//
// NOTE: AJAX requests where the client requests a HARD REDIRECT is NOT A THING. Only the server-side
//       code should determine if a request should result in a HARD or SOFT redirect response.
//       If the cleint wants a HARD REDIRECT, just make a normal NON-AJAX request!
//
if (isset($response->redirectTo))
{
  // If you want a HARD REDIRECT after an AJAX POST, just
  // set $request->isAjax == false in the controller.
  if ($request->isAjax)
  {
    // SOFT REDIRECT
    http_response_code(202);
    header('Content-type: application/json');
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
    if (empty($response->redirectExternal))
    {
      header('X-REDIRECT-TO:' . $response->redirectTo);
      $jsonData = ['redirect' => $response->redirectTo];
    }
    else
    {
      $jsonData = ['redirect' => $response->redirectTo, 'external' => 1];
    }
    echo json_encode($jsonData);
    exit;
  }
  // HARD REDIRECT
  header('location:' . full_url($request->urlBase,  $response->redirectTo));
  exit;
}

ob_end_flush();
