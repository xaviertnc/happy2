<?php
  $page = new stdClass();
  $page->title = 'Example 3';
  $page->id = $app->currentPage;
  $page->dir = $app->controllerPath;
  $page->state = array_get($app->state, $page->id, []);
  $page->errors = array_get($page->state, 'errors', []);
  $page->alerts = array_get($page->state, 'alerts', []);
  $page->lastCsrfToken = array_get($page->state, 'csrfToken');
  $page->basename = substr(__FILE__, 0, strlen(__FILE__)-4);
  $page->modelFilePath = $page->basename . '.model.php';
  $page->viewFilePath = $page->basename . '.html';
  $page->csrfToken = md5(uniqid(rand(), true)); //time();

  $app->page = $page;


  // ----------------------
  // -------- POST --------
  // ----------------------
  if ($request->method == 'POST')
  {
    do {

      $errors = [];
      $alerts = [];

      $request->action = array_get($_POST, '__ACTION__');
      $request->params = array_get($_POST, '__PARAMS__');

      $alerts[] = ['info', 'Hey, you posted some data.', 3000];

    } while (0);

    $page->state['errors'] = $errors;
    $page->state['alerts'] = $alerts;
    $app->state[$page->id] = $page->state;
    $response->redirectTo = $request->back ?: $request->uri;
  }


  // ----------------------
  // -------- GET ---------
  // ----------------------
  else {

    include $app->partialsPath . '/head.html';
    include $view->partialFile($app->page->dir, $app->page->viewFilePath, 'html', 3, null, '        ');
    include $app->partialsPath . '/foot.html';

    $page->state['errors'] = [];
    $page->state['alerts'] = [];
    $page->state = [ 'csrfToken' => $page->csrfToken ];
    $app->state[$page->id] = $page->state;

  }
