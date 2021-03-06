<?php
  $page = new stdClass();
  $page->title = 'Demo1';
  $page->id = $app->currentPage;
  $page->dir = $app->controllerPath;
  $page->state = array_get($app->state, $page->id, []);
  $page->errors = array_get($page->state, 'errors', []);
  $page->alerts = array_get($page->state, 'alerts', []);
  $page->basename = substr(__FILE__, 0, strlen(__FILE__) - 4);
  $page->lastCsrfToken = array_get($page->state, 'csrfToken');
  $page->csrfToken = md5(uniqid(rand(), true)); //time();
  $page->modelFilePath = $page->basename . '.model.php';
  $page->viewFilePath = $page->basename . '.html';
  $page->cachePath = $page->dir . '/cache';

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

      if ($request->action == 'refresh' or array_get($_POST, 'refresh')) {
        $alerts[] = ['success', 'Congrats on a nice refresh!', 5000];
        break;
      }

      if ($request->action == 'delete-item' or array_get($_POST, 'delete-item')) {
        $alerts[] = ['danger', 'Aaww! You just deleted little Timmy #' . $request->params .' :-(', 0];
        break;
      }

    } while (0);

    if ($request->isAjax) {

      $response->alerts = $alerts;
      $response->errors = $errors;

    } else {

      $page->state['alerts'] = $alerts;
      $page->state['errors'] = $errors;
      $app->state[$page->id] = $page->state;

      $response->redirect = $request->back ?: $request->uri;

    }
  }


  // ----------------------
  // -------- GET ---------
  // ----------------------
  else {

    // $page->styles[] = $page->dir . '/demo1.css';
    // $page->scripts[] = $page->dir . '/demo1.js';

    include $app->componentsPath . '/head.html';
    include $view->renderTemplate($page->cachePath, $page->viewFilePath);
    include $app->componentsPath . '/foot.html';

    $page->state['alerts'] = [];
    $page->state['errors'] = [];
    $page->state['csrfToken'] = $page->csrfToken;
    $app->state[$page->id] = $page->state;
  }
