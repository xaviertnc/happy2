<?php // Ultra Simple PHP app...

define('__DEBUG__', true);

function array_get(array $array, $key, $default = null) {
  return isset($array[$key]) ? $array[$key] : $default;
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


$request = new stdClass();
$request->uri = $_SERVER['REQUEST_URI'];
$request->host = '//nm.localhost';
$request->uriBase = '/h2/';
$request->urlBase = $request->host . $request->uriBase;
$request->method = $_SERVER['REQUEST_METHOD'];
$request->back = array_get($_SERVER, 'HTTP_REFERER');
$request->isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']);
$request->parts = explode('?', $request->uri);
$request->query = isset($request->parts[1]) ? $request->parts[1] : '';
$request->pageref = trim(substr($request->parts[0], strlen($request->uriBase)), '/');

$response = new stdClass();

$app = new stdClass();
$app->id = 'PJAXDemo';
$app->request = $request;
$app->response = $response;
$app->homepage = 'example1';
$app->siteName = 'PJAX Demo';
$app->currentPage = $request->pageref ?: $app->homepage;
$app->state = array_get($_SESSION, $app->id, []);
$app->rootPath = 'C:/UniServerZ/vhosts/NM/h2';
$app->appPath = $app->rootPath . '/app';
$app->servicesPath = $app->appPath . '/services';
$app->partialsPath = $app->appPath . '/partials';
$app->componentsPath = $app->appPath . '/components';
$app->controllerPath = $app->appPath . '/pages/' . $app->currentPage;

require $app->servicesPath . '/view.php';


require $app->controllerPath . '/' . $app->currentPage . '.php';
// echo '<pre>', print_r($app, true), '</pre>';
// echo '<pre>', print_r($_SERVER, true), '</pre>';
// echo '<pre>', print_r($_SESSION, true), '</pre>';


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
if (isset($response->redirectTo)) {
  // If you want a HARD REDIRECT after an AJAX POST,
  // just set $request->isAjax == false in the controller.
  if ($request->isAjax)
  {
    // SOFT REDIRECT
    http_response_code(202);
    header('Content-type: application/json');
    header('Cache-Control: no-cache, must-revalidate');
		header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
		header('X-REDIRECT-TO:' . $response->redirectTo);
    echo json_encode(['redirect' => $response->redirectTo]);
    exit;
  }
  // HARD REDIRECT
  header('location:' . $response->redirectTo);
  exit;
}

ob_end_flush();
