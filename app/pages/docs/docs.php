<?php // docs.php

  $page = new stdClass();
  $page->title = 'Documentation';
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

    } while (0);

    $page->state['alerts'] = $alerts;
    $page->state['errors'] = $errors;
    $app->state[$page->id] = $page->state;
    $response->redirectTo = $request->back ?: $request->uri;
  }


  // ----------------------
  // -------- GET ---------
  // ----------------------
  else {

    include $app->componentsPath . '/head.html';
    include $view->renderTemplate($page->cachePath, $page->viewFilePath);
    include $app->componentsPath . '/foot.html';

    $page->state['alerts'] = [];
    $page->state['errors'] = [];
    $page->state['csrfToken'] = $page->csrfToken;
    $app->state[$page->id] = $page->state;
  }
